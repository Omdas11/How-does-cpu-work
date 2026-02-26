/* ==========================================================
   CPU Explorer — 3D layered CPU model with zoom levels
   ========================================================== */

(function () {
  'use strict';

  /* ---- State ---- */
  const LAYERS = ['package', 'die', 'cores', 'transistors'];
  const LAYER_LABELS = { package: 'Chip Package', die: 'CPU Die', cores: 'Cores & Cache', transistors: 'Transistors' };
  let currentLayerIndex = 0;
  let scene, camera, renderer, controls;
  let groups = {};          // { package, die, cores, transistors }
  let animationId;
  let targetZoom = 30;
  let currentZoom = 30;

  const ZOOM_THRESHOLDS = [
    { max: 25, layer: 0 },  // package
    { max: 15, layer: 1 },  // die
    { max: 8,  layer: 2 },  // cores
    { max: 3,  layer: 3 },  // transistors
  ];

  /* ---- Init ---- */
  window.initCPUExplorer = function () {
    const canvas = document.getElementById('cpu-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa);

    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(20, 18, 20);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 40;
    controls.target.set(0, 0, 0);

    addLights();
    buildPackage();
    buildDie();
    buildCores();
    buildTransistors();

    // initially show only package
    updateLayerVisibility(0);
    animate();

    window.addEventListener('resize', onResize);
    controls.addEventListener('change', onZoomChange);

    // Initial UI
    onZoomChange();
  };

  /* ---- Lights ---- */
  function addLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(15, 25, 15);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-10, 10, -10);
    scene.add(dir2);
  }

  /* ---- Package (green PCB + IHS lid) ---- */
  function buildPackage() {
    const g = new THREE.Group();

    // PCB substrate
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 })
    );
    pcb.position.y = -0.4;
    g.add(pcb);

    // Contact pads (bottom)
    for (let x = -6; x <= 6; x += 1.2) {
      for (let z = -6; z <= 6; z += 1.2) {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.9, roughness: 0.3 })
        );
        pad.position.set(x, -0.85, z);
        g.add(pad);
      }
    }

    // IHS (Integrated Heat Spreader) — top cover
    const ihs = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.0, 12),
      new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.85, roughness: 0.2 })
    );
    ihs.position.y = 0.9;
    g.add(ihs);

    // Label on IHS
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#263238';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CPU Explorer', 256, 200);
    ctx.font = '36px sans-serif';
    ctx.fillText('64-Core Processor', 256, 270);
    ctx.font = '28px sans-serif';
    ctx.fillText('5 nm • 2026', 256, 330);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.y = 1.41;
    g.add(label);

    groups.package = g;
    scene.add(g);
  }

  /* ---- Die ---- */
  function buildDie() {
    const g = new THREE.Group();

    // Silicon die
    const die = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.5, 9),
      new THREE.MeshStandardMaterial({ color: 0x78909C, roughness: 0.4, metalness: 0.3 })
    );
    die.position.y = 0.25;
    g.add(die);

    // Die edge glow
    const edgeGeo = new THREE.EdgesGeometry(die.geometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x448AFF, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.copy(die.position);
    g.add(edges);

    // Tiny bond wires connecting die to substrate
    for (let i = -4; i <= 4; i += 0.8) {
      [[-4.5, i], [4.5, i], [i, -4.5], [i, 4.5]].forEach(([x, z]) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(x, 0.5, z),
          new THREE.Vector3(x * 1.3, 1.5, z * 1.3),
          new THREE.Vector3(x * 1.5, 0, z * 1.5)
        );
        const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.03, 4, false);
        const wire = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 }));
        g.add(wire);
      });
    }

    groups.die = g;
    scene.add(g);
  }

  /* ---- Cores & Cache ---- */
  function buildCores() {
    const g = new THREE.Group();
    const coreColor = 0x0288D1;
    const cacheColor = 0x26C6DA;
    const ioColor = 0xFF7043;

    // 8 cores in a 4×2 grid
    const corePositions = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const x = (col - 1.5) * 2.0;
        const z = (row - 0.5) * 2.0;
        corePositions.push([x, z]);

        const core = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.4, 1.6),
          new THREE.MeshStandardMaterial({ color: coreColor, roughness: 0.3, metalness: 0.4 })
        );
        core.position.set(x, 0.2, z);
        g.add(core);

        // Core label
        const lc = document.createElement('canvas');
        lc.width = 128; lc.height = 128;
        const lctx = lc.getContext('2d');
        lctx.fillStyle = '#01579B';
        lctx.fillRect(0, 0, 128, 128);
        lctx.fillStyle = '#ffffff';
        lctx.font = 'bold 48px sans-serif';
        lctx.textAlign = 'center';
        lctx.fillText('C' + (row * 4 + col), 64, 78);
        const coreTex = new THREE.CanvasTexture(lc);
        const coreLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 1.2),
          new THREE.MeshBasicMaterial({ map: coreTex, transparent: true })
        );
        coreLabel.rotation.x = -Math.PI / 2;
        coreLabel.position.set(x, 0.41, z);
        g.add(coreLabel);
      }
    }

    // L3 Cache block
    const cache = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.25, 1.2),
      new THREE.MeshStandardMaterial({ color: cacheColor, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    cache.position.set(0, 0.13, 2.4);
    g.add(cache);

    // Cache label
    const clc = document.createElement('canvas');
    clc.width = 256; clc.height = 64;
    const clctx = clc.getContext('2d');
    clctx.fillStyle = '#00838F';
    clctx.fillRect(0, 0, 256, 64);
    clctx.fillStyle = '#fff';
    clctx.font = 'bold 28px sans-serif';
    clctx.textAlign = 'center';
    clctx.fillText('L3 Cache — 32 MB', 128, 42);
    const cacheTex = new THREE.CanvasTexture(clc);
    const cacheLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 1),
      new THREE.MeshBasicMaterial({ map: cacheTex, transparent: true })
    );
    cacheLabel.rotation.x = -Math.PI / 2;
    cacheLabel.position.set(0, 0.27, 2.4);
    g.add(cacheLabel);

    // IO / Memory Controller
    const io = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.25, 4.5),
      new THREE.MeshStandardMaterial({ color: ioColor, roughness: 0.3 })
    );
    io.position.set(-4.2, 0.13, 0);
    g.add(io);

    // Interconnect lines between cores
    const lineMat = new THREE.LineBasicMaterial({ color: 0x80DEEA });
    for (let i = 0; i < corePositions.length - 1; i++) {
      const [x1, z1] = corePositions[i];
      const [x2, z2] = corePositions[i + 1];
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.42, z1),
        new THREE.Vector3(x2, 0.42, z2)
      ]);
      g.add(new THREE.Line(geo, lineMat));
    }

    groups.cores = g;
    scene.add(g);
  }

  /* ---- Transistors ---- */
  function buildTransistors() {
    const g = new THREE.Group();

    // Create a grid of transistor-like structures
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x00C853, metalness: 0.6, roughness: 0.3 });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, metalness: 0.8, roughness: 0.2 });
    const oxideMat = new THREE.MeshStandardMaterial({ color: 0xB3E5FC, transparent: true, opacity: 0.6 });
    const substrateMat = new THREE.MeshStandardMaterial({ color: 0x90A4AE, roughness: 0.5 });

    // Substrate
    const substrate = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 8),
      substrateMat
    );
    substrate.position.y = -0.1;
    g.add(substrate);

    // Transistor rows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const x = (col - 2.5) * 1.2;
        const z = (row - 1.5) * 1.8;
        const tg = buildMiniTransistor(x, z, gateMat, wireMat, oxideMat);
        g.add(tg);
      }
    }

    // Metal interconnect layers
    for (let layer = 0; layer < 3; layer++) {
      const y = 0.7 + layer * 0.35;
      // Horizontal wires
      for (let i = -3; i <= 3; i += 1.5) {
        const wire = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.04, 0.06),
          wireMat
        );
        wire.position.set(0, y, i);
        g.add(wire);
      }
      // Vertical wires
      for (let i = -3; i <= 3; i += 1.2) {
        const wire = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.04, 8),
          wireMat
        );
        wire.position.set(i, y + 0.05, 0);
        g.add(wire);
      }
      // Vias
      for (let i = -3; i <= 3; i += 1.5) {
        for (let j = -3; j <= 3; j += 1.2) {
          const via = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6),
            wireMat
          );
          via.position.set(j, y - 0.15, i);
          g.add(via);
        }
      }
    }

    groups.transistors = g;
    scene.add(g);
  }

  function buildMiniTransistor(x, z, gateMat, wireMat, oxideMat) {
    const tg = new THREE.Group();

    // Source
    const src = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.5), wireMat);
    src.position.set(x - 0.35, 0.125, z);
    tg.add(src);

    // Drain
    const drn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.5), wireMat);
    drn.position.set(x + 0.35, 0.125, z);
    tg.add(drn);

    // Oxide layer
    const ox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.5), oxideMat);
    ox.position.set(x, 0.28, z);
    tg.add(ox);

    // Gate
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), gateMat);
    gate.position.set(x, 0.41, z);
    tg.add(gate);

    return tg;
  }

  /* ---- Visibility Management ---- */
  function updateLayerVisibility(layerIdx) {
    currentLayerIndex = Math.max(0, Math.min(LAYERS.length - 1, layerIdx));

    LAYERS.forEach(function (name, i) {
      if (groups[name]) {
        groups[name].visible = (i <= currentLayerIndex);
        // Fade outer layers when zoomed in
        if (i < currentLayerIndex && groups[name].visible) {
          groups[name].traverse(function (child) {
            if (child.material && child.material.opacity !== undefined) {
              child.material.transparent = true;
              child.material.opacity = 0.15;
            }
          });
        } else if (i === currentLayerIndex) {
          groups[name].traverse(function (child) {
            if (child.material && child.material.opacity !== undefined && child.material._origOpacity === undefined) {
              child.material.transparent = false;
              child.material.opacity = 1;
            }
          });
        }
      }
    });

    // Update legend
    document.querySelectorAll('.legend-item').forEach(function (el, i) {
      el.classList.toggle('active', i <= currentLayerIndex);
    });
  }

  /* ---- Zoom Change ---- */
  function onZoomChange() {
    if (!camera) return;
    var dist = camera.position.distanceTo(controls.target);
    currentZoom = dist;

    // Determine layer from distance
    var layerIdx = 0;
    for (var i = 0; i < ZOOM_THRESHOLDS.length; i++) {
      if (dist < ZOOM_THRESHOLDS[i].max) {
        layerIdx = ZOOM_THRESHOLDS[i].layer;
      }
    }
    if (layerIdx !== currentLayerIndex) {
      updateLayerVisibility(layerIdx);
    }

    // Update UI
    var maxDist = 40, minDist = 2;
    var pct = 1 - (dist - minDist) / (maxDist - minDist);
    pct = Math.max(0, Math.min(1, pct));
    var zoomMultiplier = (1 + pct * 19).toFixed(1);

    var fillEl = document.getElementById('zoom-bar-fill');
    var valEl = document.getElementById('zoom-value');
    var nameEl = document.getElementById('zoom-level-name');
    if (fillEl) fillEl.style.width = (pct * 100) + '%';
    if (valEl) valEl.textContent = zoomMultiplier + '×';
    if (nameEl) nameEl.textContent = LAYER_LABELS[LAYERS[currentLayerIndex]];
  }

  /* ---- Animation Loop ---- */
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  /* ---- Resize ---- */
  function onResize() {
    var canvas = renderer.domElement;
    var parent = canvas.parentElement;
    if (!parent) return;
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

})();
