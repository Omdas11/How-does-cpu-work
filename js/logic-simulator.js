/* ==========================================================
   Logic Simulator — 2D visual arithmetic with logic gates
   Electron flow shown as water-like streams (not spheres)
   ========================================================== */

(function () {
  'use strict';

  var canvas, ctx;
  var animationId;
  var animationSpeed = 5;
  var isAnimating = false;
  var animationTime = 0;
  var animationStartTime = 0;
  var currentA = 5, currentB = 3, currentResult = 0, currentOp = 'add';
  var dpr = 1;

  /* ---------- Colour palette ---------- */
  var C = {
    bg:         '#f5f7fa',
    wire:       '#B0BEC5',
    wireActive: '#0288D1',
    flowHigh:   '#00E676',
    flowLow:    '#90A4AE',
    gateAnd:    '#1E88E5',
    gateOr:     '#7B1FA2',
    gateXor:    '#F57C00',
    inputA:     '#0288D1',
    inputB:     '#7B1FA2',
    output:     '#00C853',
    carry:      '#F57C00',
    text:       '#263238',
    labelBg:    '#ffffff',
    gridLine:   '#e8ecf1'
  };

  /* ================================================================
     PUBLIC INIT
     ================================================================ */
  window.initLogicSimulator = function () {
    canvas = document.getElementById('logic-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resizeCanvas();

    drawCircuit();

    document.getElementById('calculate-btn').addEventListener('click', runCalculation);
    document.getElementById('speed-slider').addEventListener('input', function (e) {
      animationSpeed = parseInt(e.target.value, 10);
      document.getElementById('speed-label').textContent = animationSpeed;
    });

    window.addEventListener('resize', function () {
      resizeCanvas();
      drawCircuit();
    });
  };

  function resizeCanvas() {
    var parent = canvas.parentElement;
    if (!parent) return;
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ================================================================
     DRAW STATIC 2D CIRCUIT
     ================================================================ */
  function drawCircuit() {
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Layout constants
    var margin = 40;
    var bitW = (w - margin * 2) / 8;
    var topY = 50;
    var gateY1 = topY + 80;
    var gateY2 = gateY1 + 70;
    var gateY3 = gateY2 + 70;
    var outY = gateY3 + 60;
    var carryY = gateY2 + 30;

    // Title labels
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.inputA;
    ctx.fillText('A₇  ←  Input Bus A  →  A₀', w / 2, topY - 20);
    ctx.fillStyle = C.inputB;
    ctx.fillText('B₇  ←  Input Bus B  →  B₀', w / 2, topY);
    ctx.fillStyle = C.output;
    ctx.fillText('Sum₇  ←  Output Bus  →  Sum₀', w / 2, outY + 30);

    var bitsA = toBin(currentA).split('').map(Number);
    var bitsB = toBin(currentB).split('').map(Number);
    var bitsR = toBin(currentResult).split('').map(Number);

    for (var bit = 0; bit < 8; bit++) {
      var cx = margin + bitW * bit + bitW / 2;
      var aVal = bitsA[bit];
      var bVal = bitsB[bit];
      var rVal = bitsR[bit];

      // Input dots
      drawInputDot(cx - 10, topY + 16, aVal, C.inputA);
      drawInputDot(cx + 10, topY + 16, bVal, C.inputB);

      // Wires from inputs to XOR gate
      drawWire(cx - 10, topY + 22, cx - 6, gateY1 - 12, false);
      drawWire(cx + 10, topY + 22, cx + 6, gateY1 - 12, false);

      // XOR gate (first)
      drawGate(cx, gateY1, 'XOR', C.gateXor);

      // Wire from XOR1 to XOR2
      drawWire(cx, gateY1 + 14, cx, gateY2 - 12, false);

      // AND gate (for carry)
      drawGate(cx + bitW * 0.3, gateY2, 'AND', C.gateAnd);

      // XOR gate 2 (with carry-in)
      drawGate(cx, gateY2, 'XOR', C.gateXor);

      // OR gate (carry out)
      drawGate(cx + bitW * 0.3, gateY3, 'OR', C.gateOr);

      // Wire from XOR2 to output
      drawWire(cx, gateY2 + 14, cx, outY - 6, false);

      // Output dot
      drawOutputDot(cx, outY, rVal);

      // Carry chain wire (horizontal)
      if (bit < 7) {
        drawWire(cx + bitW * 0.3, gateY3 + 14, cx + bitW + bitW * 0.3, gateY2 - 12, false);
      }

      // Bit label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#546E7A';
      ctx.textAlign = 'center';
      ctx.fillText('Bit ' + (7 - bit), cx, outY + 50);
    }
  }

  function drawInputDot(x, y, val, baseColor) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = val ? baseColor : '#CFD8DC';
    ctx.fill();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = val ? '#fff' : '#78909C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function drawOutputDot(x, y, val) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = val ? C.output : '#CFD8DC';
    ctx.fill();
    ctx.strokeStyle = C.output;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = val ? '#fff' : '#78909C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function drawGate(x, y, label, color) {
    var gw = 28, gh = 22;
    // Rounded rect gate body
    ctx.beginPath();
    roundRect(ctx, x - gw / 2, y - gh / 2, gw, gh, 5);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = shadeColor(color, -20);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gate label
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function drawWire(x1, y1, x2, y2, active) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = active ? C.wireActive : C.wire;
    ctx.lineWidth = active ? 2 : 1;
    ctx.globalAlpha = active ? 1 : 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ================================================================
     WATER-LIKE FLOW ANIMATION
     ================================================================ */
  function drawFlowOnWire(x1, y1, x2, y2, progress, color) {
    // Draw a stream of "water" flowing from (x1,y1) to (x2,y2)
    // progress: 0 to 1 means how far the head of the stream has traveled
    var headPct = Math.min(progress, 1);
    var tailPct = Math.max(progress - 0.4, 0);

    var hx = x1 + (x2 - x1) * headPct;
    var hy = y1 + (y2 - y1) * headPct;
    var tx = x1 + (x2 - x1) * tailPct;
    var ty = y1 + (y2 - y1) * tailPct;

    // Gradient from tail (transparent) to head (solid)
    var grad = ctx.createLinearGradient(tx, ty, hx, hy);
    grad.addColorStop(0, colorWithAlpha(color, 0));
    grad.addColorStop(0.3, colorWithAlpha(color, 0.5));
    grad.addColorStop(1, colorWithAlpha(color, 0.9));

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Ripple dots along the stream (water-like effect)
    var numDots = 4;
    for (var i = 0; i < numDots; i++) {
      var dotPct = tailPct + (headPct - tailPct) * (i / numDots);
      var dx = x1 + (x2 - x1) * dotPct;
      var dy = y1 + (y2 - y1) * dotPct;
      var wobble = Math.sin((progress * 10 + i * 2)) * 2;
      // perpendicular offset
      var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      var nx = -(y2 - y1) / (len || 1);
      var ny = (x2 - x1) / (len || 1);
      ctx.beginPath();
      ctx.arc(dx + nx * wobble, dy + ny * wobble, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = colorWithAlpha(color, 0.6);
      ctx.fill();
    }
  }

  /* ================================================================
     CALCULATION & ANIMATION
     ================================================================ */
  function runCalculation() {
    var a = parseInt(document.getElementById('inputA').value, 10) || 0;
    var b = parseInt(document.getElementById('inputB').value, 10) || 0;
    var op = document.getElementById('operation').value;

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

    currentA = a;
    currentB = b;
    currentResult = result;
    currentOp = op;

    document.getElementById('result-text').textContent = 'Result: ' + result;
    document.getElementById('binA').textContent = toBin(a);
    document.getElementById('binB').textContent = toBin(b);
    document.getElementById('binOut').textContent = toBin(result);

    isAnimating = true;
    animationStartTime = performance.now();

    if (!animationId) {
      animate();
    }
  }

  function toBin(n) {
    return ('00000000' + (n >>> 0).toString(2)).slice(-8);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    animationId = requestAnimationFrame(animate);

    var w = canvas.width / dpr;
    var h = canvas.height / dpr;

    // Redraw static circuit
    drawCircuit();

    if (!isAnimating) return;

    var elapsed = (performance.now() - animationStartTime) / 1000;
    var speedFactor = animationSpeed / 5;
    var totalDuration = 3.0 / speedFactor;

    if (elapsed > totalDuration) {
      isAnimating = false;
      animationId = null;
      return;
    }

    var margin = 40;
    var bitW = (w - margin * 2) / 8;
    var topY = 50;
    var gateY1 = topY + 80;
    var gateY2 = gateY1 + 70;
    var outY = gateY2 + 70 + 60;

    var bitsA = toBin(currentA).split('').map(Number);
    var bitsB = toBin(currentB).split('').map(Number);
    var bitsR = toBin(currentResult).split('').map(Number);

    // Draw flowing animation per bit
    for (var bit = 0; bit < 8; bit++) {
      var cx = margin + bitW * bit + bitW / 2;
      var bitDelay = bit * (0.15 / speedFactor);
      var bitElapsed = Math.max(0, elapsed - bitDelay);
      var bitDur = (totalDuration - bitDelay) / 3;

      var aVal = bitsA[bit];
      var bVal = bitsB[bit];
      var rVal = bitsR[bit];

      // Phase 1: input to XOR gate
      var p1 = Math.min(bitElapsed / bitDur, 1);
      if (p1 > 0) {
        drawFlowOnWire(cx - 10, topY + 22, cx - 6, gateY1 - 12, p1, aVal ? C.flowHigh : C.flowLow);
        drawFlowOnWire(cx + 10, topY + 22, cx + 6, gateY1 - 12, p1, bVal ? C.flowHigh : C.flowLow);
      }

      // Phase 2: through gates
      var p2 = Math.min(Math.max(0, (bitElapsed - bitDur) / bitDur), 1);
      if (p2 > 0) {
        drawFlowOnWire(cx, gateY1 + 14, cx, gateY2 - 12, p2, '#448AFF');
      }

      // Phase 3: to output
      var p3 = Math.min(Math.max(0, (bitElapsed - bitDur * 2) / bitDur), 1);
      if (p3 > 0) {
        drawFlowOnWire(cx, gateY2 + 14, cx, outY - 6, p3, rVal ? C.flowHigh : C.flowLow);
      }
    }
  }

  /* ---- Helpers ---- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function shadeColor(hex, amt) {
    var r = parseInt(hex.slice(1, 3), 16) + amt;
    var g = parseInt(hex.slice(3, 5), 16) + amt;
    var b = parseInt(hex.slice(5, 7), 16) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function colorWithAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

})();
