/* ==========================================================
   Transistor Viewer — 3D MOSFET & FinFET models
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Helper: create a labelled viewer ---------- */
  function createViewer(canvasId, labelsId, buildFn, labelData) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa);

    var camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(5, 4, 5);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 6)); // ~8K quality render

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.5, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 12, 8);
    scene.add(dirLight);

    buildFn(scene);

    // Labels
    var labelsContainer = document.getElementById(labelsId);
    if (labelsContainer && labelData) {
      labelData.forEach(function (lbl) {
        var chip = document.createElement('span');
        chip.className = 'label-chip';
        chip.style.borderLeft = '3px solid ' + lbl.color;
        chip.textContent = lbl.text;
        labelsContainer.appendChild(chip);
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
      var parent = canvas.parentElement;
      if (!parent) return;
      var w = parent.clientWidth;
      var h = parent.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ---------- MOSFET ---------- */
  function buildMOSFET(scene) {
    // Silicon substrate
    var substrate = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.8, 3),
      new THREE.MeshStandardMaterial({ color: 0x90A4AE, roughness: 0.5 })
    );
    substrate.position.y = 0;
    scene.add(substrate);

    // P-type body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.6, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xB0BEC5, roughness: 0.4 })
    );
    body.position.y = 0.5;
    scene.add(body);

    // Source region (n+)
    var source = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x42A5F5, roughness: 0.3 })
    );
    source.position.set(-1.5, 0.7, 0);
    scene.add(source);

    // Drain region (n+)
    var drain = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x42A5F5, roughness: 0.3 })
    );
    drain.position.set(1.5, 0.7, 0);
    scene.add(drain);

    // Gate oxide (thin insulating layer)
    var oxide = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xE1F5FE, transparent: true, opacity: 0.7 })
    );
    oxide.position.set(0, 0.95, 0);
    scene.add(oxide);

    // Gate electrode (polysilicon)
    var gate = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.5, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xE53935, roughness: 0.2, metalness: 0.6 })
    );
    gate.position.set(0, 1.25, 0);
    scene.add(gate);

    // Metal contacts
    var contactMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, metalness: 0.9, roughness: 0.1 });

    var srcContact = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12), contactMat);
    srcContact.position.set(-1.5, 1.3, 0);
    scene.add(srcContact);

    var drnContact = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12), contactMat);
    drnContact.position.set(1.5, 1.3, 0);
    scene.add(drnContact);

    var gateContact = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12), contactMat);
    gateContact.position.set(0, 1.75, 0);
    scene.add(gateContact);

    // Labels (floating text sprites)
    addTextSprite(scene, 'Source', -1.5, 2.0, 0, '#1565C0');
    addTextSprite(scene, 'Gate', 0, 2.3, 0, '#C62828');
    addTextSprite(scene, 'Drain', 1.5, 2.0, 0, '#1565C0');
    addTextSprite(scene, 'Oxide', 0, 1.1, 1.5, '#0277BD');
    addTextSprite(scene, 'Substrate', 0, -0.3, 1.8, '#546E7A');

    // Channel region indicator (thin highlighted area under gate)
    var channel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x00E676, emissive: 0x00E676, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 })
    );
    channel.position.set(0, 0.82, 0);
    scene.add(channel);
  }

  /* ---------- FinFET ---------- */
  function buildFinFET(scene) {
    // Substrate
    var substrate = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.6, 4),
      new THREE.MeshStandardMaterial({ color: 0x90A4AE, roughness: 0.5 })
    );
    substrate.position.y = 0;
    scene.add(substrate);

    // Fins (the 3D silicon channels)
    var finMat = new THREE.MeshStandardMaterial({ color: 0x42A5F5, roughness: 0.3 });
    for (var i = -1; i <= 1; i++) {
      var fin = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1.2, 0.25),
        finMat
      );
      fin.position.set(0, 0.9, i * 0.8);
      scene.add(fin);
    }

    // Gate wrapping around fins
    var gateMat = new THREE.MeshStandardMaterial({ color: 0xE53935, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.85 });
    var gateMain = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.6, 3.5),
      gateMat
    );
    gateMain.position.set(0, 1.1, 0);
    scene.add(gateMain);

    // Gate oxide (thin layer between gate and fins)
    var oxideMat = new THREE.MeshStandardMaterial({ color: 0xE1F5FE, transparent: true, opacity: 0.4 });
    var oxideWrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.4, 3.2),
      oxideMat
    );
    oxideWrap.position.set(0, 1.1, 0);
    scene.add(oxideWrap);

    // Source region
    var srcMat = new THREE.MeshStandardMaterial({ color: 0x1E88E5, roughness: 0.3 });
    var srcBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 3.0),
      srcMat
    );
    srcBlock.position.set(-2.0, 0.8, 0);
    scene.add(srcBlock);

    // Drain region
    var drnBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.0, 3.0),
      srcMat
    );
    drnBlock.position.set(2.0, 0.8, 0);
    scene.add(drnBlock);

    // Metal contacts
    var contactMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, metalness: 0.9, roughness: 0.1 });

    var srcContact = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12), contactMat);
    srcContact.position.set(-2.0, 1.6, 0);
    scene.add(srcContact);

    var drnContact = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12), contactMat);
    drnContact.position.set(2.0, 1.6, 0);
    scene.add(drnContact);

    var gateContact = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), contactMat);
    gateContact.position.set(0, 2.15, 0);
    scene.add(gateContact);

    // Labels
    addTextSprite(scene, 'Source', -2.0, 2.3, 0, '#1565C0');
    addTextSprite(scene, 'Gate', 0, 2.7, 0, '#C62828');
    addTextSprite(scene, 'Drain', 2.0, 2.3, 0, '#1565C0');
    addTextSprite(scene, 'Fin', 0, 0.5, 1.8, '#1565C0');
    addTextSprite(scene, 'Substrate', 0, -0.3, 2.3, '#546E7A');
  }

  /* ---------- Text Sprite Helper ---------- */
  function addTextSprite(scene, text, x, y, z, color) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = color || '#263238';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 42);

    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    var mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2, 0.5, 1);
    scene.add(sprite);
  }

  /* ---------- Public Init ---------- */
  window.initTransistorViewer = function () {
    createViewer('mosfet-canvas', 'mosfet-labels', buildMOSFET, [
      { text: 'Gate (Polysilicon)', color: '#E53935' },
      { text: 'Source / Drain (n+)', color: '#42A5F5' },
      { text: 'Oxide Layer', color: '#0288D1' },
      { text: 'Substrate (p-type)', color: '#90A4AE' },
      { text: 'Channel', color: '#00E676' }
    ]);

    createViewer('finfet-canvas', 'finfet-labels', buildFinFET, [
      { text: 'Gate (Tri-Gate)', color: '#E53935' },
      { text: 'Silicon Fin', color: '#42A5F5' },
      { text: 'Source / Drain', color: '#1E88E5' },
      { text: 'Substrate', color: '#90A4AE' }
    ]);
  };

})();
