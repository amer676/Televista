/* ═══════════════════════════════════════════════════════════════
   Televista 2026 revamp — waves hero · live demo · pricing toggle
   Vanilla, zero deps, reduced-motion safe.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ——— hero waves (fragment shader, Cyprus-green silk) ——— */
  (function waves() {
    var canvas = document.getElementById("heroWaves");
    if (!canvas) return;
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) { canvas.style.background = "linear-gradient(180deg,#01201c,#004643)"; return; }

    var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
    var FS = [
      "precision highp float;",
      "uniform float uT; uniform vec2 uR;",
      "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }",
      "float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);",
      "  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }",
      "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p*=2.02; a*=0.5; } return v; }",
      "void main(){",
      "  vec2 uv = gl_FragCoord.xy / uR;",
      "  vec2 p = vec2(uv.x * uR.x / uR.y, uv.y);",
      "  float t = uT * 0.05;",
      "  p.y += 0.17 * sin(p.x * 2.1 + t * 1.35) + 0.06 * sin(p.x * 4.7 - t * 0.9);",
      "  vec2 q = vec2(fbm(p * 1.25 + t * 0.50), fbm(p * 1.25 - t * 0.35 + 5.2));",
      "  vec2 r = p + 0.55 * q;",
      "  float n1 = fbm(r * 1.45 + vec2(0.0, t));",
      "  float n2 = fbm(r * 2.35 - vec2(t * 0.45, 0.0) + 3.1);",
      "  float n3 = fbm(r * 3.20 + vec2(t * 0.30, -t * 0.20) + 8.7);",
      "  vec3 c = mix(vec3(0.004,0.118,0.102), vec3(0.000,0.275,0.263), smoothstep(0.28, 0.64, n1));",
      "  c = mix(c, vec3(0.051,0.427,0.373), smoothstep(0.52, 0.88, n2));",
      "  c += vec3(0.498,0.847,0.769) * pow(smoothstep(0.58, 0.95, n3), 3.0) * 0.16;",
      "  c += vec3(0.055,0.624,0.431) * pow(smoothstep(0.66, 0.92, n2), 4.0) * 0.10;",
      "  float d = length(uv - vec2(0.5, 0.42));",
      "  c *= 1.0 - 0.30 * smoothstep(0.5, 1.05, d);",
      "  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 2.0;",
      "  gl_FragColor = vec4(c, 1.0);",
      "}",
    ].join("\n");

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.background = "#01201c"; return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(prog, "uT");
    var uR = gl.getUniformLocation(prog, "uR");

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * DPR);
      canvas.height = Math.max(1, r.height * DPR);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resize);
    resize();

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.01 })
        .observe(canvas);
    }
    var t0 = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      gl.uniform1f(uT, RM ? 8.0 : ((now || performance.now()) - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(t0);
  })();

  /* ——— live demo: tabs ——— */
  (function tabs() {
    var tabs = document.querySelectorAll(".demoTabs button");
    if (!tabs.length) return;
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tabs.forEach(function (b) { b.classList.toggle("on", b === btn); });
        document.querySelectorAll(".demoPane").forEach(function (p) {
          p.hidden = p.getAttribute("data-pane") !== btn.getAttribute("data-tab");
        });
      });
    });
  })();

  /* ——— live demo: ticking dials + pace bar on first view ——— */
  (function liveNumbers() {
    var dials = document.getElementById("demoDials");
    var bar = document.getElementById("demoPaceFill");
    var card = document.querySelector(".demoCard");
    if (!card) return;
    var started = false;
    function start() {
      if (started) return;
      started = true;
      if (bar) requestAnimationFrame(function () { bar.style.width = "80%"; });
      if (dials && !RM) {
        var n = 3412;
        setInterval(function () {
          n += Math.random() < 0.6 ? 1 : 2;
          dials.textContent = n.toLocaleString("en-US");
        }, 1800);
      }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en, io) {
        if (en[0].isIntersecting) { start(); io.disconnect(); }
      }, { threshold: 0.3 }).observe(card);
    } else start();
  })();

  /* ——— live demo: waveform play toggle (visual only) ——— */
  (function playToggles() {
    document.querySelectorAll(".demoPlay").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wave = btn.parentElement.querySelector(".demoWave");
        var playing = wave.classList.toggle("playing");
        btn.innerHTML = playing
          ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
          : '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
        btn.setAttribute("aria-pressed", playing ? "true" : "false");
      });
    });
  })();

  /* ——— pricing: base ↔ with-data toggle ——— */
  (function pricing() {
    var toggles = document.querySelectorAll(".priceToggle button");
    if (!toggles.length) return;
    var amounts = document.querySelectorAll(".pricing-price .amount[data-base]");
    var deltas = document.querySelectorAll(".dataDelta");
    var extra = document.getElementById("extraCallerNote");
    function set(mode) {
      toggles.forEach(function (b) {
        var on = b.getAttribute("data-mode") === mode;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      amounts.forEach(function (a) {
        var v = Number(a.getAttribute(mode === "data" ? "data-with" : "data-base"));
        a.textContent = "$" + v.toLocaleString("en-US");
        if (!RM && a.animate) {
          a.animate(
            [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
            { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" }
          );
        }
      });
      deltas.forEach(function (d) { d.textContent = mode === "data" ? "incl. Televista data" : "+ $250/caller for Televista data"; });
      if (extra) {
        extra.textContent = mode === "data"
          ? "Additional callers: $1,350/mo each (incl. data)."
          : "Additional callers: $1,100/mo each. Add Televista data for +$250/caller.";
      }
    }
    toggles.forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-mode")); });
    });
  })();
})();
