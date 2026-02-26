/* ==========================================================
   Logic Simulator — Visual arithmetic with logic gates
   ========================================================== */

(function () {
  'use strict';

  var scene, camera, renderer, controls;
  var animationId;
  var flowParticles = [];
  var gateObjects = [];
  var wireObjects = [];
  var animationSpeed = 5;      // 1-10
  var isAnimating = false;
  var animationTime = 0;

  /* ---------- Colour palette ---------- */
  var C = {
    wire:     0x90A4AE,
    wireOn:   0x00E676,
    wireOff:  0x455A64,
    gateBody: 0x37474F,
    gateAnd:  0x1E88E5,
    gateOr:   0x7B1FA2,
    gateXor:  0xF57C00,
    gateNot:  0xE53935,
    glow:     0x00E676,
    inputOn:  0x00E676,
    inputOff: 0x455A64,
    output:   0xFFD54F,
    bg:       0xf5f7fa
  };

  /* ================================================================
     PUBLIC INIT
     ================================================================ */
  window.initLogicSimulator = function () {
    var canvas = document.getElementById('logic-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(C.bg);

    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    buildStaticCircuit();
    animate();

    // Controls
    document.getElementById('calculate-btn').addEventListener('click', runCalculation);
    document.getElementById('speed-slider').addEventListener('input', function (e) {
      animationSpeed = parseInt(e.target.value, 10);
      document.getElementById('speed-label').textContent = animationSpeed;
    });

    window.addEventListener('resize', onResize);
  };

  /* ================================================================
     BUILD 8-BIT ADDER / LOGIC CIRCUIT (static layout)
     ================================================================ */
  function buildStaticCircuit() {
    gateObjects = [];
    wireObjects = [];

    // Ground plane
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 25),
      new THREE.MeshStandardMaterial({ color: 0xeceff1, side: THREE.DoubleSide })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Build 8 full-adder slices laid out horizontally
    for (var bit = 0; bit < 8; bit++) {
      var x = (bit - 3.5) * 4.2;
      buildFullAdderSlice(x, 0, bit);
    }

    // Input labels (A and B buses)
    addLabel(scene, 'A₇…A₀  Input Bus', 0, 0.4, -7, '#0288D1', 3);
    addLabel(scene, 'B₇…B₀  Input Bus', 0, 0.4, -4.5, '#7B1FA2', 3);
    addLabel(scene, 'Sum₇…Sum₀  Output', 0, 0.4, 7, '#00C853', 3);
    addLabel(scene, 'Carry Chain →', 12, 0.4, 2, '#F57C00', 2);
  }

  /* ---------- Full Adder Slice ---------- */
  function buildFullAdderSlice(x, y, bitIndex) {
    // XOR gate 1 (A XOR B)
    var xor1 = createGate(x, y + 0.5, -2, 'XOR', C.gateXor);
    // AND gate 1 (A AND B)
    var and1 = createGate(x + 1.2, y + 0.5, 0, 'AND', C.gateAnd);
    // XOR gate 2 (xor1 XOR Cin)
    var xor2 = createGate(x, y + 0.5, 2.5, 'XOR', C.gateXor);
    // AND gate 2 (xor1 AND Cin)
    var and2 = createGate(x + 1.2, y + 0.5, 2.5, 'AND', C.gateAnd);
    // OR gate (and1 OR and2) = Cout
    var or1 = createGate(x + 1.2, y + 0.5, 4.5, 'OR', C.gateOr);

    // Input indicators
    var inA = createInputNode(x - 0.5, y + 0.3, -5.5);
    var inB = createInputNode(x + 0.5, y + 0.3, -5.5);

    // Output indicator
    var outS = createOutputNode(x, y + 0.3, 6);

    // Wires — A,B to XOR1 & AND1
    createWire([x - 0.5, y + 0.2, -5.5], [x - 0.5, y + 0.2, -2], bitIndex);
    createWire([x + 0.5, y + 0.2, -5.5], [x + 0.5, y + 0.2, -2], bitIndex);
    createWire([x - 0.5, y + 0.2, -2], [x + 0.8, y + 0.2, 0], bitIndex);
    createWire([x + 0.5, y + 0.2, -2], [x + 1.6, y + 0.2, 0], bitIndex);

    // XOR1 to XOR2
    createWire([x, y + 0.2, -1.2], [x, y + 0.2, 2.5], bitIndex);
    // XOR2 output -> Sum
    createWire([x, y + 0.2, 3.3], [x, y + 0.2, 6], bitIndex);

    // AND1 -> OR, AND2 -> OR
    createWire([x + 1.2, y + 0.2, 0.8], [x + 1.2, y + 0.2, 4.5], bitIndex);
    createWire([x + 1.2, y + 0.2, 3.3], [x + 1.5, y + 0.2, 4.5], bitIndex);

    // Bit label
    addLabel(scene, 'Bit ' + bitIndex, x, 2.0, -6.5, '#546E7A', 1);

    gateObjects.push(
      { mesh: xor1, type: 'xor', bit: bitIndex },
      { mesh: and1, type: 'and', bit: bitIndex },
      { mesh: xor2, type: 'xor', bit: bitIndex },
      { mesh: and2, type: 'and', bit: bitIndex },
      { mesh: or1,  type: 'or',  bit: bitIndex }
    );
  }

  /* ---------- Gate Mesh ---------- */
  function createGate(x, y, z, label, color) {
    var group = new THREE.Group();

    // Body
    var geo = new THREE.BoxGeometry(1.5, 0.7, 0.8);
    var mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.2 });
    var body = new THREE.Mesh(geo, mat);
    group.add(body);

    // Glow outline (emissive, starts off)
    var edgeGeo = new THREE.EdgesGeometry(geo);
    var edgeMat = new THREE.LineBasicMaterial({ color: C.glow, transparent: true, opacity: 0 });
    var edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);
    group.userData.edgeMat = edgeMat;

    // Label
    var lc = document.createElement('canvas');
    lc.width = 128; lc.height = 48;
    var ctx = lc.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 64, 34);
    var tex = new THREE.CanvasTexture(lc);
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(1.2, 0.45, 1);
    sprite.position.y = 0.6;
    group.add(sprite);

    group.position.set(x, y, z);
    scene.add(group);
    return group;
  }

  /* ---------- Input / Output Nodes ---------- */
  function createInputNode(x, y, z) {
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: C.inputOff, emissive: 0x000000, roughness: 0.3 })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function createOutputNode(x, y, z) {
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ color: C.output, emissive: 0x000000, roughness: 0.3 })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  /* ---------- Wires ---------- */
  function createWire(from, to, bitIndex) {
    var points = [
      new THREE.Vector3(from[0], from[1], from[2]),
      new THREE.Vector3(to[0], to[1], to[2])
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: C.wire, transparent: true, opacity: 0.4 });
    var line = new THREE.Line(geo, mat);
    scene.add(line);
    wireObjects.push({ line: line, mat: mat, from: from, to: to, bit: bitIndex, active: false });
    return line;
  }

  /* ================================================================
     CALCULATION & ANIMATION
     ================================================================ */
  function runCalculation() {
    var a = parseInt(document.getElementById('inputA').value, 10) || 0;
    var b = parseInt(document.getElementById('inputB').value, 10) || 0;
    var op = document.getElementById('operation').value;

    // Clamp to 8-bit unsigned
    a = Math.max(0, Math.min(255, a));
    b = Math.max(0, Math.min(255, b));

    var result;
    switch (op) {
      case 'add': result = (a + b) & 0xFF; break;
      case 'sub': result = (a - b) & 0xFF; break;
      case 'and': result = a & b; break;
      case 'or':  result = a | b; break;
      case 'xor': result = a ^ b; break;
      default:    result = 0;
    }

    // Update display
    document.getElementById('result-text').textContent = 'Result: ' + result;
    document.getElementById('binA').textContent = toBin(a);
    document.getElementById('binB').textContent = toBin(b);
    document.getElementById('binOut').textContent = toBin(result);

    // Start animated data flow
    startDataFlowAnimation(a, b, result, op);
  }

  function toBin(n) {
    return ('00000000' + (n >>> 0).toString(2)).slice(-8);
  }

  /* ---------- Data Flow Animation ---------- */
  function startDataFlowAnimation(a, b, result, op) {
    // Remove old particles
    flowParticles.forEach(function (p) { scene.remove(p); });
    flowParticles = [];

    isAnimating = true;
    animationTime = 0;

    var bitsA = toBin(a).split('').map(Number);
    var bitsB = toBin(b).split('').map(Number);
    var bitsR = toBin(result).split('').map(Number);

    // Animate wires bit by bit — light them up sequentially
    var totalDuration = 300; // frames at speed=5
    var speedFactor = animationSpeed / 5;

    wireObjects.forEach(function (w) {
      w.mat.color.setHex(C.wire);
      w.mat.opacity = 0.4;
      w.active = false;
    });

    gateObjects.forEach(function (g) {
      if (g.mesh.userData.edgeMat) {
        g.mesh.userData.edgeMat.opacity = 0;
      }
    });

    // Create flow particles for each bit
    for (var bit = 0; bit < 8; bit++) {
      var aVal = bitsA[7 - bit];
      var bVal = bitsB[7 - bit];

      // Particles travel from input to gate to output
      var x = (bit - 3.5) * 4.2;
      var delay = bit * (30 / speedFactor);

      // Input A particle
      createFlowParticle(
        new THREE.Vector3(x - 0.5, 0.5, -5.5),
        new THREE.Vector3(x - 0.5, 0.5, -2),
        delay, aVal ? C.inputOn : C.inputOff, speedFactor
      );

      // Input B particle
      createFlowParticle(
        new THREE.Vector3(x + 0.5, 0.5, -5.5),
        new THREE.Vector3(x + 0.5, 0.5, -2),
        delay, bVal ? C.inputOn : C.inputOff, speedFactor
      );

      // Through gates
      createFlowParticle(
        new THREE.Vector3(x, 0.5, -2),
        new THREE.Vector3(x, 0.5, 2.5),
        delay + 40 / speedFactor, 0x448AFF, speedFactor
      );

      // To output
      var rVal = bitsR[7 - bit];
      createFlowParticle(
        new THREE.Vector3(x, 0.5, 2.5),
        new THREE.Vector3(x, 0.5, 6),
        delay + 80 / speedFactor, rVal ? C.glow : C.inputOff, speedFactor
      );

      // Activate gates with delay
      activateGateAfterDelay(bit, delay + 30 / speedFactor);
      activateWiresAfterDelay(bit, delay + 20 / speedFactor);
    }
  }

  function createFlowParticle(startPos, endPos, delayFrames, color, speedFactor) {
    var geo = new THREE.SphereGeometry(0.18, 12, 12);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    scene.add(mesh);

    mesh.userData = {
      startPos: startPos.clone(),
      endPos: endPos.clone(),
      delay: delayFrames,
      duration: 60 / speedFactor,
      elapsed: 0,
      started: false,
      finished: false
    };

    flowParticles.push(mesh);
    return mesh;
  }

  function activateGateAfterDelay(bit, delay) {
    var startFrame = animationTime + delay;
    var gates = gateObjects.filter(function (g) { return g.bit === bit; });

    function check() {
      if (animationTime >= startFrame) {
        gates.forEach(function (g) {
          if (g.mesh.userData.edgeMat) {
            g.mesh.userData.edgeMat.opacity = 0.9;
            g.mesh.userData.edgeMat.color.setHex(C.glow);
          }
        });
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  }

  function activateWiresAfterDelay(bit, delay) {
    var startFrame = animationTime + delay;
    var wires = wireObjects.filter(function (w) { return w.bit === bit; });

    function check() {
      if (animationTime >= startFrame) {
        wires.forEach(function (w) {
          w.mat.color.setHex(C.wireOn);
          w.mat.opacity = 0.9;
        });
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    animationTime++;

    // Update flow particles
    if (isAnimating) {
      var allDone = true;
      flowParticles.forEach(function (p) {
        var d = p.userData;
        if (d.finished) return;

        d.elapsed++;

        if (d.elapsed < d.delay) {
          allDone = false;
          return;
        }

        if (!d.started) {
          d.started = true;
          p.material.opacity = 1;
        }

        var progress = (d.elapsed - d.delay) / d.duration;
        if (progress >= 1) {
          progress = 1;
          d.finished = true;
          // Fade out
          p.material.opacity = 0.3;
        } else {
          allDone = false;
          // Pulsing glow
          p.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(d.elapsed * 0.3);
        }

        p.position.lerpVectors(d.startPos, d.endPos, progress);
      });

      if (allDone && flowParticles.length > 0) {
        isAnimating = false;
      }
    }

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

  /* ---- Label helper ---- */
  function addLabel(scene, text, x, y, z, color, scale) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = color || '#263238';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 44);

    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale || 2, (scale || 2) * 0.15, 1);
    scene.add(sprite);
  }

})();
