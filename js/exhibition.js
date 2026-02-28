/* ==========================================================
   Exhibition — Component data, modal popup, click handlers
   ========================================================== */

(function () {
  'use strict';

  /* ================================================================
     COMPONENT DATA
     Each entry: { icon, title, what, how, why, example }
     ================================================================ */
  var DATA = {

    /* ---- Von Neumann components ---- */
    'input-device': {
      icon: '⌨️',
      title: 'Input Device',
      what: 'An input device is any hardware that accepts data from a user or the external environment and sends it to the computer for processing.',
      how: 'Input devices convert physical actions — keystrokes, mouse movements, touchscreen taps — into digital electrical signals that the CPU can read via input/output ports and device drivers.',
      why: 'Without input devices the computer has no way to receive commands or data from the outside world. They are the bridge between human intention and digital computation.',
      example: 'Keyboard, mouse, touchscreen, microphone, camera, barcode scanner, gamepad.'
    },

    'output-device': {
      icon: '🖥️',
      title: 'Output Device',
      what: 'An output device presents the results of CPU processing to the user or to another system in a human-perceptible form.',
      how: 'The CPU sends processed data through the system bus to output controllers (GPU, audio chip, etc.) which convert digital signals into light (display), sound (speakers), or ink (printer).',
      why: 'Without output devices computation has no visible or audible effect. They complete the feedback loop that makes computers useful.',
      example: 'Monitor, printer, speakers, projector, LED indicators, haptic motors in phones.'
    },

    'control-unit': {
      icon: '🎛️',
      title: 'Control Unit (CU)',
      what: 'The Control Unit is the "conductor" of the CPU. It orchestrates every other component, telling them what to do and when.',
      how: 'The CU fetches the next instruction from memory, decodes its opcode, and generates a sequence of control signals that activate the ALU, registers, and memory buses in the correct order. It also manages the instruction pipeline and handles branch prediction to keep execution flowing smoothly.',
      why: 'Without the Control Unit the CPU would be a collection of hardware with no coordination. The CU is what turns raw transistors into a programmable machine.',
      example: 'Intel\'s Branch Prediction Unit inside each core correctly predicts ~99% of code paths, preventing costly pipeline flushes.'
    },

    'alu': {
      icon: '➕',
      title: 'Arithmetic Logic Unit (ALU)',
      what: 'The ALU is the "calculator" inside the CPU. It performs all mathematical and logical operations on binary numbers.',
      how: 'The ALU is built from combinational logic gates: a full-adder chain handles addition and subtraction; dedicated gate networks implement AND, OR, XOR, NOT and shift operations. Inputs come from registers; the result is written back to a register along with status flags (zero, carry, overflow, sign).',
      why: 'All computation ultimately reduces to ALU operations. Every time software adds numbers, compares values, or applies logic, the ALU is doing the work.',
      example: 'A modern out-of-order core has 4 or more integer ALUs and 2+ floating-point units executing instructions in parallel every clock cycle.'
    },

    'memory-unit': {
      icon: '💾',
      title: 'Memory Unit (RAM)',
      what: 'The Memory Unit stores both the instructions of a running program and the data that program operates on. In Von Neumann architecture, programs and data share the same memory space.',
      how: 'RAM (Random Access Memory) stores data as electrical charges in arrays of capacitors (DRAM) or cross-coupled transistor pairs (SRAM). The CPU sends an address on the address bus; the memory returns the value at that address on the data bus within nanoseconds.',
      why: 'The CPU\'s registers can only hold a handful of values at once. RAM provides a much larger, fast-enough workspace for entire programs and their data.',
      example: '32 GB DDR5-6400 RAM module — 6400 MT/s, ~50 ns latency, providing ~50 GB/s bandwidth per channel.'
    },

    /* ---- CPU die blocks ---- */
    'cpu-core': {
      icon: '🧩',
      title: 'CPU Core',
      what: 'A core is a complete, independent processing unit inside the CPU die. Each core has its own Control Unit, ALU, register file, and L1/L2 caches.',
      how: 'Each core runs its own instruction stream (thread) simultaneously. P-Cores (Performance) run complex workloads at high clock speed; E-Cores (Efficiency) handle background tasks at lower power. Cores communicate through the shared L3 cache.',
      why: 'Multiple cores allow the CPU to work on several tasks in parallel, dramatically improving throughput for multi-threaded applications.',
      example: 'Intel Core Ultra 9 285K: 8 P-Cores + 16 E-Cores = 24 cores, up to 5.7 GHz boost frequency.'
    },

    'l3-cache': {
      icon: '📦',
      title: 'Shared L3 Cache',
      what: 'The L3 cache is the largest and slowest level of on-die SRAM cache, shared by all cores on the chip.',
      how: 'When a core needs data not in its private L1/L2 caches, it looks in L3. If found (cache hit) data is returned in ~10–20 ns. If not (cache miss) the memory controller fetches it from RAM (~50 ns). A ring-bus or mesh interconnect links all cores to the L3 cache.',
      why: 'L3 bridges the speed gap between the fast but tiny per-core caches and the slow but large RAM, reducing the penalty of cache misses for data shared between cores.',
      example: 'Intel Core Ultra 9 285K: 36 MB L3. AMD Ryzen 7 7800X3D: 96 MB L3 with 3D V-Cache stacking.'
    },

    'processor-graphics': {
      icon: '🎨',
      title: 'Processor Graphics (Integrated GPU)',
      what: 'An integrated GPU built onto the same silicon die as the CPU, enabling graphics output without a discrete graphics card.',
      how: 'The GPU block contains hundreds of shader cores optimised for parallel floating-point calculations (pixel rendering, video decode, AI inferencing). It shares system RAM with the CPU via the memory controller, unlike a discrete GPU which has its own VRAM.',
      why: 'Provides graphics capability in thin laptops, desktops without a graphics card, and display output in servers. Reduces cost, power, and board space compared to discrete GPUs.',
      example: 'Intel Arc Graphics (Meteor Lake) — 128 Xe2 shader cores on the same tile. Apple M4 GPU — 10 cores sharing unified memory with CPU.'
    },

    'system-agent': {
      icon: '🔀',
      title: 'System Agent + Memory Controller',
      what: 'The System Agent is the "hub" of the processor die, housing the memory controller, PCIe controller, display engine, and the interconnect that ties all die blocks together.',
      how: 'The ring bus (or mesh in larger designs) connects every core, the L3 cache, and the System Agent at extremely high bandwidth. The integrated memory controller manages DDR communication timing. The PCIe root complex links the CPU to GPUs, NVMe SSDs, and other peripherals.',
      why: 'Moving the memory controller on-die (vs. the old north-bridge chip) dramatically reduces memory latency and increases bandwidth, a major performance gain since Intel Nehalem (2008).',
      example: 'Intel\'s System Agent handles 2× DDR5 channels, up to 32× PCIe 5.0 lanes, and 4 display outputs — all from within the CPU package.'
    },

    'memory-io': {
      icon: '🔌',
      title: 'Memory Controller I/O',
      what: 'The physical interface strip at the bottom of the die that connects the on-die memory controller to the external RAM modules via high-speed I/O pads.',
      how: 'DDR5 uses a synchronous interface with a strobe-based command/data protocol. The I/O circuitry converts the low-swing internal digital signals to the differential DDR5 signal levels, manages impedance matching, and implements training algorithms for the high-speed link.',
      why: 'Modern CPUs require over 100 GB/s of memory bandwidth; this demands hundreds of tightly designed I/O pins operating at 6400+ MT/s with sub-nanosecond timing margins.',
      example: 'Intel Core Ultra 285K: 2× 64-bit DDR5 channels at up to 6400 MT/s = ~102 GB/s peak bandwidth.'
    },

    /* ---- MOSFET parts ---- */
    'mosfet-gate': {
      icon: '🔑',
      title: 'MOSFET Gate',
      what: 'The Gate is the control terminal of the transistor. It is separated from the silicon channel by a thin insulating oxide layer — no DC current flows into the gate.',
      how: 'Applying a voltage to the gate creates an electric field across the oxide that penetrates into the p-type silicon, attracting electrons to form an inversion layer (the channel) between source and drain. When the gate voltage exceeds the threshold voltage (Vt) the transistor switches ON.',
      why: 'The gate is the "switch" of the transistor. Billions of gates in a CPU collectively represent the logic state of the machine. Gate length (the distance from source to drain below the gate) defines the process node (e.g. 3 nm).',
      example: 'In Intel\'s 7 nm process node, the effective gate length is approximately 7 nm — 10,000× thinner than a human hair.'
    },

    'mosfet-source': {
      icon: '➡️',
      title: 'MOSFET Source',
      what: 'The Source is one of the two current-carrying terminals of the transistor. In an n-channel MOSFET, electrons enter the channel from the source.',
      how: 'The source region is heavily doped with donor atoms (n+) creating an excess of free electrons. When the gate is ON, these electrons flow through the inversion channel toward the drain, driven by the drain-to-source voltage (Vds).',
      why: 'Along with the drain, the source determines the current path. The source is typically tied to the lower voltage (ground in NMOS), anchoring the transistor\'s switching reference.',
      example: 'In a CMOS inverter, the NMOS source is connected to GND (0 V); the PMOS source is connected to VDD (e.g. 0.8 V in 3 nm process).'
    },

    'mosfet-drain': {
      icon: '⬅️',
      title: 'MOSFET Drain',
      what: 'The Drain is the second current-carrying terminal where electrons exit the transistor channel.',
      how: 'Like the source, the drain is heavily n-doped (n+). When the gate is ON, current flows from drain to source (conventional current direction) through the inversion channel. The drain-to-source voltage (Vds) drives this current.',
      why: 'The drain connects to the circuit node whose voltage is being driven (e.g. the output of a logic gate). The drain voltage swings between supply (VDD) and ground as the transistor switches.',
      example: 'In a CMOS inverter, the NMOS drain connects to the output node, pulling it to GND when the input is HIGH.'
    },

    'mosfet-channel': {
      icon: '〰️',
      title: 'MOSFET Channel',
      what: 'The channel is the thin conductive region that forms in the p-type silicon directly below the gate oxide when the gate is activated.',
      how: 'With no gate voltage, the p-type silicon between source and drain has no free electrons — the path is blocked. When gate voltage exceeds Vt, the electric field inverts a thin surface layer into an n-type "inversion layer". Electrons flow through this channel from source to drain.',
      why: 'The channel is what actually carries current. No channel = transistor OFF (logic 0). Channel present = transistor ON (logic 1). The channel length determines switching speed and power.',
      example: 'In TSMC\'s 5 nm node, the channel length is ~5 nm — a span of roughly 20 silicon atoms.'
    },

    'mosfet-oxide': {
      icon: '🛡️',
      title: 'Gate Oxide (SiO₂)',
      what: 'The gate oxide is an ultra-thin insulating layer between the gate metal and the silicon channel, preventing direct current flow into the gate.',
      how: 'Traditionally pure silicon dioxide (SiO₂) grown thermally. The electric field from the gate penetrates through this insulator to control the channel. Thickness has shrunk from ~100 nm in 1970s chips to ~1.2 nm at 45 nm node.',
      why: 'The oxide enables voltage-controlled switching without current through the gate — this is what gives CMOS its near-zero static power. Thinner oxide = stronger field effect = lower threshold voltage and faster switching.',
      example: 'Since 45 nm (Intel, 2007), high-k dielectric (HfO₂, hafnium oxide) replaced SiO₂ — same electrical thickness but physically thicker, reducing quantum tunnelling leakage by 10×.'
    },

    'mosfet-body': {
      icon: '🪨',
      title: 'p-type Body (Substrate)',
      what: 'The body is the bulk p-type silicon on which the transistor is built. It forms the foundation of the MOSFET structure.',
      how: 'The p-type silicon is doped with acceptor atoms (boron) creating holes as majority carriers. The source and drain n+ regions are embedded in this body, forming p-n junctions that are reverse-biased during normal operation, isolating the transistor.',
      why: 'The body provides the semiconductor material in which the channel forms, and its doping concentration controls the threshold voltage. Body contacts can also be used to reduce floating-body effects.',
      example: 'In bulk CMOS, the substrate is the actual silicon wafer. In SOI (Silicon-on-Insulator) processes, a buried oxide isolates the body from the substrate to reduce leakage.'
    },

    /* ---- FinFET parts ---- */
    'finfet-gate': {
      icon: '🔑',
      title: 'FinFET Gate (Tri-Gate)',
      what: 'The gate in a FinFET wraps around three sides of the silicon fin (left, right, and top), providing far superior electrostatic control compared to a planar gate that only contacts the top.',
      how: 'The three-sided gate creates three independent gate-channel interfaces, all controlled simultaneously by the same gate voltage. This "tri-gate" geometry means the gate electric field reaches all parts of the thin fin channel, preventing unwanted off-state leakage.',
      why: 'As transistors shrank below 22 nm, a planar gate could no longer suppress leakage through the short channel. The FinFET\'s tri-gate structure restored electrostatic control, enabling continued transistor scaling.',
      example: 'Intel\'s 3D Tri-Gate transistor (22 nm Ivy Bridge, 2012) achieved 37% higher performance at the same power, or 50% lower power at the same performance, versus 32 nm planar.'
    },

    'finfet-fin': {
      icon: '📐',
      title: 'Silicon Fin',
      what: 'The fin is a thin, vertical blade of silicon that rises from the substrate and serves as the transistor\'s channel. Current flows horizontally through the fin from source to drain.',
      how: 'The fin is etched from the silicon substrate using lithography and reactive-ion etching. Its height (typically 40–70 nm) and width (5–10 nm) determine how many gate-channel interfaces are available and how well the gate can deplete the fin of carriers.',
      why: 'The 3D fin geometry allows the gate to wrap around the channel on three sides, enabling full depletion of the channel and essentially eliminating short-channel leakage below 22 nm.',
      example: 'TSMC 5 nm FinFET: fin width ~5 nm, fin height ~50 nm, fin pitch ~27 nm. A single die may contain over 170 million fins per mm².'
    },

    'finfet-source': {
      icon: '➡️',
      title: 'FinFET Source',
      what: 'The source is the current input terminal of the FinFET, located at one end of the silicon fin.',
      how: 'In FinFETs, the source and drain regions are often epitaxially grown (SEG) above the fin ends to increase the contact area and reduce resistance. Silicide (e.g. NiSi) lowers the contact resistance further.',
      why: 'Reducing source resistance is critical at small nodes — parasitic resistance in the source/drain regions is one of the main performance limiters below 10 nm.',
      example: 'At 5 nm node, Intel and TSMC use cobalt or tungsten contacts with epitaxially grown SiGe (for PMOS) or Si:P (for NMOS) raised source/drain regions.'
    },

    'finfet-drain': {
      icon: '⬅️',
      title: 'FinFET Drain',
      what: 'The drain is the current output terminal at the opposite end of the fin from the source.',
      how: 'Like the source, the drain is formed by epitaxial growth and silicidation. The drain voltage swing (between VDD and GND) drives the logic output. In FinFETs, the drain is physically close to the gate, making careful drain-induced barrier lowering (DIBL) management essential.',
      why: 'The short fin-to-drain distance at advanced nodes means the drain electric field can penetrate toward the source, raising leakage. The tri-gate structure counteracts this effect.',
      example: 'At 3 nm, the entire transistor from source contact to drain contact spans less than 30 nm — smaller than many viruses.'
    },

    'finfet-oxide': {
      icon: '🛡️',
      title: 'FinFET Gate Oxide',
      what: 'A thin insulating layer (high-k dielectric) that separates the gate metal from the fin surface on all three exposed sides.',
      how: 'The oxide coats the top and both vertical sides of the fin before the gate metal is deposited. High-k materials like HfO₂ or HfSiON are used, allowing a physically thicker layer (reducing quantum tunnelling) while maintaining the same effective electrical thickness as a much thinner SiO₂ layer.',
      why: 'The oxide on three sides means the gate controls the full fin perimeter, not just the top surface. This greatly improves the gate\'s ability to deplete the fin of carriers and switch it cleanly.',
      example: 'Intel\'s gate-all-around (GAA) nanosheet transistors (Intel 20A/18A) use gate dielectrics as thin as 1 nm equivalent oxide thickness (EOT) of HfO₂.'
    },

    'finfet-substrate': {
      icon: '🪨',
      title: 'FinFET Substrate',
      what: 'The p-type silicon substrate is the foundation on which FinFETs are built. STI (Shallow Trench Isolation) oxide regions flank the fin bases, electrically isolating neighbouring transistors.',
      how: 'The fin rises from the substrate. Shallow Trench Isolation (STI) fills the trenches between fins with SiO₂ to prevent leakage between adjacent devices. The substrate is kept at a fixed bias voltage to prevent latch-up.',
      why: 'The substrate provides structural support and electrical isolation. STI is essential at fin pitches below 30 nm where millions of fins are packed per mm².',
      example: 'In bulk FinFET, fins are etched from the wafer itself. In SOI FinFET, fins sit on a buried oxide layer which further reduces parasitic capacitance and leakage.'
    }
  };

  /* ================================================================
     MODAL
     ================================================================ */
  var overlay  = null;
  var titleEl  = null;
  var bodyEl   = null;
  var iconEl   = null;
  var closeBtn = null;

  function openModal(componentId) {
    var info = DATA[componentId];
    if (!info) { return; }

    iconEl.textContent  = info.icon || '';
    titleEl.textContent = info.title;

    bodyEl.innerHTML =
      '<h4>What it is</h4>' +
      '<p>' + escHtml(info.what) + '</p>' +
      '<h4>How it works</h4>' +
      '<p>' + escHtml(info.how) + '</p>' +
      '<h4>Why it is important</h4>' +
      '<p>' + escHtml(info.why) + '</p>' +
      '<h4>Real-world example</h4>' +
      '<p>' + escHtml(info.example) + '</p>';

    overlay.removeAttribute('hidden');
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ================================================================
     ACCORDION (educational notes)
     ================================================================ */
  function initAccordion() {
    var headers = document.querySelectorAll('.note-header');
    headers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var body = btn.nextElementSibling;
        if (expanded) {
          btn.setAttribute('aria-expanded', 'false');
          body.hidden = true;
        } else {
          btn.setAttribute('aria-expanded', 'true');
          body.hidden = false;
        }
      });
    });
  }

  /* ================================================================
     SCROLL TO NOTE — used by die blocks
     ================================================================ */
  function scrollToNote(noteTitle) {
    var headers = document.querySelectorAll('.note-header');
    for (var i = 0; i < headers.length; i++) {
      var btn = headers[i];
      var span = btn.querySelector('span');
      if (span && span.textContent.trim() === noteTitle) {
        var body = btn.nextElementSibling;
        /* Expand the note if collapsed */
        if (btn.getAttribute('aria-expanded') !== 'true') {
          btn.setAttribute('aria-expanded', 'true');
          body.hidden = false;
        }
        /* Scroll into view */
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        /* Brief highlight */
        var item = btn.closest('.note-item');
        if (item) {
          item.style.outline = '2px solid #0288D1';
          item.style.outlineOffset = '2px';
          setTimeout(function () { item.style.outline = ''; item.style.outlineOffset = ''; }, 2000);
        }
        return;
      }
    }
  }

  /* ================================================================
     CLICK HANDLERS — attach to all clickable elements
     ================================================================ */
  function attachClickHandlers() {
    /* SVG groups: .vn-component and .t-component */
    var svgComponents = document.querySelectorAll('.vn-component, .t-component');
    svgComponents.forEach(function (el) {
      el.addEventListener('click', function () {
        openModal(el.dataset.component);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(el.dataset.component);
        }
      });
    });

    /* HTML die blocks — scroll to matching note */
    var dieBlocks = document.querySelectorAll('.die-block.clickable');
    dieBlocks.forEach(function (el) {
      el.addEventListener('click', function () {
        var noteTitle = el.dataset.note;
        if (noteTitle) {
          scrollToNote(noteTitle);
        } else {
          openModal(el.dataset.component);
        }
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var noteTitle = el.dataset.note;
          if (noteTitle) {
            scrollToNote(noteTitle);
          } else {
            openModal(el.dataset.component);
          }
        }
      });
    });
  }

  /* ================================================================
     PUBLIC INIT
     ================================================================ */
  window.initExhibition = function () {
    overlay  = document.getElementById('modal-overlay');
    titleEl  = document.getElementById('modal-title');
    bodyEl   = document.getElementById('modal-body');
    iconEl   = document.getElementById('modal-icon');
    closeBtn = document.getElementById('modal-close-btn');

    if (!overlay) { return; }

    /* Close modal */
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { closeModal(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) {
        closeModal();
      }
    });

    attachClickHandlers();
    initAccordion();
  };

})();
