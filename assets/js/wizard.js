/* ==========================================================================
   TELEVISTA WIZARD — modal state machine
   Self-mounting, no framework. Vanilla JS island.

   Usage:
     1. Include this script + assets/css/wizard.css on any page.
     2. Add `data-wizard-trigger` to any element that should open the wizard.
        Optionally `data-wizard-intent="get_started"` to skip the intent step,
        and `data-wizard-plan="growth"` to preselect a plan band.
     3. The wizard renders itself into a #tv-wizard-root div which it creates
        on first open. No template HTML needed in the page.

   Public surface:
     window.TelevistaWizard.open(opts)   — programmatic open
     window.TelevistaWizard.close()
     window.TelevistaWizard.config       — see CONFIG below
   ========================================================================== */

(function () {
  "use strict";

  /* ─── CONFIG ──────────────────────────────────────────────────────────
     Swap these once Calendly + n8n are live. Everything else stays untouched. */
  const CONFIG = {
    // Calendly event-type URLs. Two events:
    //   - discovery: Amer + Mahmoud (for "exploring" intent — they need more context)
    //   - sales:     Amer only (for "get_started" and "talk_to_sales" intents)
    calendlyUrls: {
      discovery:
        "https://calendly.com/d/cvx4-8n5-rdg/discovery-meeting?primary_color=004643&hide_gdpr_banner=1",
      sales:
        "https://calendly.com/amer-televistaleadgeneration/sales-and-discovery-meeting?primary_color=004643&hide_gdpr_banner=1",
    },

    // Intent → which Calendly event to route to.
    //   exploring     → discovery (Amer + Mahmoud): they need more context,
    //                   team helps them understand how the operation works
    //   get_started   → sales (Amer only): they're decision-ready, founder closes
    //   talk_to_sales → sales (Amer only): pure Q&A, founder handles
    intentRouting: {
      exploring:     "discovery",
      get_started:   "sales",
      talk_to_sales: "sales",
    },

    // n8n webhook for wizard submissions. Receives the full payload at the
    // final step. Should respond 2xx; we don't block the Calendly load on it.
    submitEndpoint: "/api/wizard-submit", // placeholder — point at n8n when live

    // Whether to also POST partial step data (one POST per step) for
    // mid-funnel attribution. Adds load on n8n; turn off if not needed.
    submitPartials: false,

    // Light analytics — fires gtag events if gtag is available.
    fireGtagEvents: true,
  };

  /* ─── Field option data ──────────────────────────────────────────────── */

  const VERTICALS = [
    { v: "real_estate_investor", label: "Real Estate Investor" },
    { v: "wholesaler",           label: "Wholesaler" },
    { v: "roofing_solar",        label: "Roofing or Solar" },
    { v: "b2b_saas",             label: "B2B / SaaS" },
    { v: "insurance",            label: "Insurance" },
    { v: "home_improvement",     label: "Home Improvement" },
    { v: "other",                label: "Something else" },
  ];

  /**
   * Deals/jobs/policies per month bands, tuned to each vertical's real-world
   * volume pattern. Real-estate investors typically do 1-5 deals/mo; roofing
   * crews do 30-100 installs; B2B SaaS varies. Same field semantically
   * ("monthly transaction volume"), different bands so the prospect can pick
   * an honest answer.
   */
  const DEALS_BANDS_BY_VERTICAL = {
    // Low-volume, high-ticket
    real_estate_investor: [
      { v: "0to1",   label: "0 – 1" },
      { v: "2to5",   label: "2 – 5" },
      { v: "6to15",  label: "6 – 15" },
      { v: "gt15",   label: "15+" },
    ],
    wholesaler: [
      { v: "0to1",   label: "0 – 1" },
      { v: "2to5",   label: "2 – 5" },
      { v: "6to15",  label: "6 – 15" },
      { v: "gt15",   label: "15+" },
    ],
    insurance: [
      { v: "lt10",    label: "Under 10" },
      { v: "10to30",  label: "10 – 30" },
      { v: "30to75",  label: "30 – 75" },
      { v: "gt75",    label: "75+" },
    ],
    // Mid-to-high volume
    roofing_solar: [
      { v: "lt15",    label: "Under 15" },
      { v: "15to50",  label: "15 – 50" },
      { v: "50to100", label: "50 – 100" },
      { v: "gt100",   label: "100+" },
    ],
    home_improvement: [
      { v: "lt15",    label: "Under 15" },
      { v: "15to50",  label: "15 – 50" },
      { v: "50to100", label: "50 – 100" },
      { v: "gt100",   label: "100+" },
    ],
    // Variable / SaaS pattern
    b2b_saas: [
      { v: "lt5",    label: "Under 5" },
      { v: "5to20",  label: "5 – 20" },
      { v: "20to50", label: "20 – 50" },
      { v: "gt50",   label: "50+" },
    ],
    // Fallback used for "other" and any unset vertical
    other: [
      { v: "lt5",    label: "Under 5" },
      { v: "5to15",  label: "5 – 15" },
      { v: "15to50", label: "15 – 50" },
      { v: "gt50",   label: "50+" },
    ],
  };

  function dealsBandsFor(vertical) {
    return DEALS_BANDS_BY_VERTICAL[vertical] || DEALS_BANDS_BY_VERTICAL.other;
  }

  function dealsLabel(deals, vertical) {
    if (!deals) return "—";
    const bands = dealsBandsFor(vertical);
    const m = bands.find((b) => b.v === deals);
    if (m) return m.label;
    // Fallback: scan all vertical band sets in case vertical changed after picking
    for (const key in DEALS_BANDS_BY_VERTICAL) {
      const found = DEALS_BANDS_BY_VERTICAL[key].find((b) => b.v === deals);
      if (found) return found.label;
    }
    return deals;
  }

  /**
   * Vertical-aware headline for the volume step. "Deals" for RE-style verticals,
   * "jobs" for roofing/home improvement, "policies" for insurance, "customers"
   * for B2B SaaS. Same question semantically, tuned vocabulary so it doesn't
   * read like a templated form.
   */
  function dealsHeadlineFor(vertical) {
    const noun = volumeNounFor(vertical);
    return "How many " + noun + " do you close per month?";
  }

  function volumeNounFor(vertical) {
    return {
      real_estate_investor: "deals",
      wholesaler:           "deals",
      roofing_solar:        "jobs",
      home_improvement:     "jobs",
      insurance:            "policies",
      b2b_saas:             "new customers",
    }[vertical] || "deals";
  }

  function volumeKeyFor(vertical) {
    // Summary-row label — capitalized, abbreviated to fit the narrow column.
    const noun = volumeNounFor(vertical);
    return noun.charAt(0).toUpperCase() + noun.slice(1) + " / mo";
  }

  const BUDGET_BANDS = [
    { v: "lt2k",  label: "Under $2k" },
    { v: "2to3k", label: "$2k – $3k" },
    { v: "3to5k", label: "$3k – $5k" },
    { v: "gt5k",  label: "$5k+" },
  ];

  /* ─── State ──────────────────────────────────────────────────────────── */

  let root = null;          // backdrop element (created on first open)
  let modal = null;
  let bodyEl = null;
  let stepMarkEl = null;
  let footEl = null;
  let backBtn = null;
  let nextBtn = null;
  let calendlyLoaded = false;
  let openerFocusEl = null; // for restoring focus on close

  const state = {
    open: false,
    intent: null,   // "exploring" | "get_started" | "talk_to_sales"
    stepIndex: 0,
    // form data
    name: "",
    vertical: "",
    deals: "",
    budget: "",
    previous: "",
    question: "",
    email: "",
    phone: "",
    // attribution (captured at first open)
    utm: {},
    referrer: "",
    sessionId: null,
    // derived
    submitting: false,
  };

  /* ─── Step definitions ────────────────────────────────────────────────
     Each intent has its own ordered step list. The Intent step is index 0
     for every flow; selecting an intent sets state.intent and advances. */

  const STEPS = {
    // The intent question itself
    intent: {
      key: "intent",
      eyebrow: "Strategy call",
      headline: "What brings you to <em>Televista</em>?",
      sub: "Three choices. Pick the one that fits — we'll take it from there.",
      render: renderIntentStep,
      validate: () => !!state.intent,
    },

    name: {
      key: "name",
      eyebrow: (s) => `${labelForIntent(s.intent)} · About you`,
      headline: (s) => "First, what should we call you?",
      sub: "We'll use this on the call and in your portal — nothing else.",
      render: renderTextField("name", "Your first name", { type: "text", autocomplete: "given-name" }),
      validate: () => state.name.trim().length >= 1,
      errorFor: () => "We need at least a first name to keep going.",
    },

    business: {
      key: "business",
      eyebrow: (s) => `Hi, ${s.name || "there"} — let's keep it short`,
      headline: "What's your business?",
      sub: "So we know whose playbook to bring to the call.",
      render: renderSelectField("vertical", VERTICALS, "Pick the closest fit"),
      validate: () => !!state.vertical,
      errorFor: () => "Choose the closest fit — even \"Something else\" works.",
    },

    deals: {
      key: "deals",
      eyebrow: "Volume",
      headline: (s) => dealsHeadlineFor(s.vertical),
      sub: "Rough is fine. We're sizing the conversation, not auditing you.",
      render: function (container) {
        // Look up bands at render time so they track the selected vertical.
        const bands = dealsBandsFor(state.vertical);
        // If the previously-picked band doesn't exist in the current vertical's
        // bands (e.g. user went back and changed vertical), clear the selection.
        if (state.deals && !bands.find((b) => b.v === state.deals)) {
          state.deals = "";
        }
        renderPillField("deals", bands)(container);
      },
      validate: () => !!state.deals,
      errorFor: () => "Pick the band that fits — we won't hold you to it.",
    },

    budget: {
      key: "budget",
      eyebrow: "Investment",
      headline: "What's your monthly budget for outbound?",
      sub: "Helps us recommend the right plan before the call.",
      render: renderPillField("budget", BUDGET_BANDS),
      validate: () => !!state.budget,
      errorFor: () => "Pick a band — we can refine on the call.",
    },

    previous: {
      key: "previous",
      eyebrow: "Context",
      headline: "What have you tried so far?",
      sub: "Optional — but the more you share, the better-prepared we'll be.",
      render: renderTextareaField("previous", "Other agencies, in-house team, dialer software, nothing yet…"),
      validate: () => true, // optional
    },

    question: {
      key: "question",
      eyebrow: "Your question",
      headline: "What's the one thing you want to know?",
      sub: "Optional — gives the call a clear starting point.",
      render: renderTextareaField("question", "Pricing, results, how the team works, fit for my market…"),
      validate: () => true, // optional
    },

    contact: {
      key: "contact",
      eyebrow: "Last step before we wrap",
      headline: "Where can we reach you?",
      sub: "We'll send a meeting confirmation and a portal link — no spam.",
      render: renderContactFields,
      validate: () =>
        isValidEmail(state.email) && state.phone.replace(/\D/g, "").length >= 7,
      errorFor: () => {
        if (!isValidEmail(state.email)) return "That email doesn't look quite right.";
        return "Add a phone we can reach you on.";
      },
    },

    exploringEmail: {
      // Lighter version of "contact" for the exploring branch — email only
      key: "exploringEmail",
      eyebrow: "Last step",
      headline: "Where should we send the details?",
      sub: "We'll email a meeting confirmation and a few notes you can read on your own time.",
      render: renderEmailOnlyField,
      validate: () => isValidEmail(state.email),
      errorFor: () => "That email doesn't look quite right.",
    },

    summary: {
      key: "summary",
      eyebrow: (s) => `Almost there, ${s.name || "friend"}`,
      headline: "Here's what we'll bring to the call.",
      sub: "Pick a time on the next screen and we'll lock it in.",
      render: renderSummary,
      validate: () => true,
      nextLabel: "Choose your time",
      nextIsFinal: true,
    },

    calendly: {
      key: "calendly",
      eyebrow: "Pick a time",
      headline: (s) => `Lock it in, ${s.name || "friend"}.`,
      sub: "Once you book, we'll send a confirmation and your portal link.",
      render: renderCalendly,
      validate: () => true,
      hideFoot: true,
    },
  };

  // Per-intent ordered step lists. Intent step is implicit at index 0.
  const FLOWS = {
    exploring:     ["intent", "name", "business", "exploringEmail", "summary", "calendly"],
    get_started:   ["intent", "name", "business", "deals", "budget", "previous", "contact", "summary", "calendly"],
    talk_to_sales: ["intent", "name", "business", "deals", "question", "contact", "summary", "calendly"],
  };

  /* ─── Helpers ─────────────────────────────────────────────────────────── */

  function labelForIntent(i) {
    if (i === "exploring")     return "Exploring";
    if (i === "get_started")   return "Getting started";
    if (i === "talk_to_sales") return "Talking to sales";
    return "Strategy call";
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());
  }

  function generateSessionId() {
    return "tvw_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  function captureAttribution() {
    const params = new URLSearchParams(location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });
    state.utm = utm;
    state.referrer = document.referrer || "";
    // Persist a session id so partial submits can be reconciled
    let sid = null;
    try { sid = sessionStorage.getItem("tv_wizard_sid"); } catch (e) {}
    if (!sid) {
      sid = generateSessionId();
      try { sessionStorage.setItem("tv_wizard_sid", sid); } catch (e) {}
    }
    state.sessionId = sid;
  }

  function fireEvent(name, params) {
    if (CONFIG.fireGtagEvents && typeof window.gtag === "function") {
      try { window.gtag("event", name, params || {}); } catch (e) {}
    }
  }

  /* ─── Modal lifecycle ─────────────────────────────────────────────────── */

  function ensureMounted() {
    if (root) return;

    root = document.createElement("div");
    root.className = "tv-w-backdrop";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "tv-w-headline");
    root.innerHTML = `
      <div class="tv-w-modal" role="document">
        <div class="tv-w-head">
          <div class="tv-w-step-mark" aria-live="polite">
            <span class="now">I</span><span class="sep">·</span><span class="total">VII</span>
          </div>
          <button class="tv-w-close" type="button" aria-label="Close">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="tv-w-body" tabindex="-1"></div>
        <div class="tv-w-foot">
          <button class="tv-w-back" type="button">← Back</button>
          <button class="tv-w-next" type="button">
            <span class="tv-w-next-label">Continue</span>
            <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    modal    = root.querySelector(".tv-w-modal");
    bodyEl   = root.querySelector(".tv-w-body");
    stepMarkEl = root.querySelector(".tv-w-step-mark");
    footEl   = root.querySelector(".tv-w-foot");
    backBtn  = root.querySelector(".tv-w-back");
    nextBtn  = root.querySelector(".tv-w-next");

    // event bindings
    root.querySelector(".tv-w-close").addEventListener("click", close);
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    backBtn.addEventListener("click", goBack);
    nextBtn.addEventListener("click", goNext);
    document.addEventListener("keydown", onKey);
  }

  function open(opts) {
    ensureMounted();
    openerFocusEl = document.activeElement;
    captureAttribution();

    // Reset state but keep UTMs + sessionId
    state.intent = opts && opts.intent ? opts.intent : null;
    state.stepIndex = 0;
    state.name = "";
    state.vertical = "";
    state.deals = "";
    state.budget = (opts && opts.plan) || "";
    state.previous = "";
    state.question = "";
    state.email = "";
    state.phone = "";
    state.submitting = false;
    modal.classList.remove("is-submitting");

    // Compensate for scrollbar hiding
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--tv-w-scrollbar-comp", sw + "px");
    document.body.classList.add("tv-w-scroll-lock");

    state.open = true;
    root.classList.add("is-open");

    // If opener forced an intent, skip step 0
    if (state.intent) {
      state.stepIndex = 1;
    }

    renderCurrentStep();
    fireEvent("wizard_open", { intent: state.intent || "(none)" });
  }

  function close() {
    if (!root || !state.open) return;
    root.classList.add("is-closing");
    document.body.classList.remove("tv-w-scroll-lock");
    state.open = false;
    fireEvent("wizard_close", { step: getCurrentStepKey() });
    setTimeout(() => {
      root.classList.remove("is-open", "is-closing");
      if (openerFocusEl && openerFocusEl.focus) {
        try { openerFocusEl.focus(); } catch (e) {}
      }
    }, 260);
  }

  function onKey(e) {
    if (!state.open) return;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Enter") {
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      // Don't intercept Enter in textarea
      if (tag === "TEXTAREA") return;
      // If on intent step, Enter does nothing (must click a card)
      if (getCurrentStepKey() === "intent") return;
      e.preventDefault();
      goNext();
    }
  }

  /* ─── Step navigation ─────────────────────────────────────────────────── */

  function getFlow() {
    if (!state.intent) return ["intent"];
    return FLOWS[state.intent] || FLOWS.get_started;
  }

  function getCurrentStepKey() {
    const flow = getFlow();
    return flow[state.stepIndex] || flow[0];
  }

  function getCurrentStep() {
    return STEPS[getCurrentStepKey()];
  }

  function goNext() {
    const step = getCurrentStep();
    if (!step) return;

    // Validate
    if (!step.validate(state)) {
      const msg = step.errorFor ? step.errorFor(state) : "Please complete this step.";
      showStepError(msg);
      return;
    }
    clearStepError();

    // Submit on entering Calendly step (the booking is the conversion event)
    const flow = getFlow();
    const nextIdx = state.stepIndex + 1;
    if (nextIdx >= flow.length) return;

    state.stepIndex = nextIdx;

    // Fire submit when entering summary (penultimate step before Calendly)
    if (getCurrentStepKey() === "summary") {
      submit();
    }

    renderCurrentStep();
    fireEvent("wizard_step", { step: getCurrentStepKey(), intent: state.intent });
  }

  function goBack() {
    if (state.stepIndex === 0) return;
    state.stepIndex -= 1;
    // If we backed all the way to the intent step, clear the intent so they
    // can pick a different path
    if (getCurrentStepKey() === "intent") {
      state.intent = null;
    }
    clearStepError();
    renderCurrentStep();
  }

  function goToStepKey(key) {
    const flow = getFlow();
    const idx = flow.indexOf(key);
    if (idx >= 0) {
      state.stepIndex = idx;
      renderCurrentStep();
    }
  }

  /* ─── Renderers ───────────────────────────────────────────────────────── */

  function renderCurrentStep() {
    const step = getCurrentStep();
    const flow = getFlow();

    // Update step mark (Roman numerals)
    const total = state.intent ? flow.length - 1 : "VII"; // before intent picked, show placeholder
    const current = state.intent ? state.stepIndex : 1;
    stepMarkEl.querySelector(".now").textContent = toRoman(current);
    stepMarkEl.querySelector(".total").textContent = state.intent ? toRoman(total) : "VII";

    // Resolve potentially function-typed fields
    const eyebrow  = resolveStr(step.eyebrow);
    const headline = resolveStr(step.headline);
    const sub      = resolveStr(step.sub);

    // Animate out current, swap, animate in new
    const oldStep = bodyEl.querySelector(".tv-w-step.is-active");
    const newStepEl = document.createElement("section");
    newStepEl.className = "tv-w-step";
    if (step.key === "calendly") newStepEl.classList.add("has-calendly");

    const intro = document.createElement("div");
    intro.innerHTML = `
      ${eyebrow  ? `<p class="tv-w-eyebrow">${eyebrow}</p>` : ""}
      ${headline ? `<h2 class="tv-w-headline" id="tv-w-headline">${headline}</h2>` : ""}
      ${sub      ? `<p class="tv-w-sub">${sub}</p>` : ""}
    `;
    newStepEl.appendChild(intro);

    // Step body
    step.render(newStepEl, state);

    // Error placeholder
    const errEl = document.createElement("p");
    errEl.className = "tv-w-error-msg";
    errEl.setAttribute("role", "alert");
    newStepEl.appendChild(errEl);

    const finishSwap = () => {
      bodyEl.innerHTML = "";
      bodyEl.appendChild(newStepEl);
      // Trigger reflow + activate
      void newStepEl.offsetWidth;
      newStepEl.classList.add("is-active");
      // Auto-focus the first input or first intent card for keyboard users
      const focusTarget = newStepEl.querySelector(
        "input, select, textarea, .tv-w-intent, .tv-w-pill"
      );
      if (focusTarget) {
        setTimeout(() => { try { focusTarget.focus(); } catch (e) {} }, 80);
      }
    };

    if (oldStep) {
      oldStep.classList.add("is-leaving");
      setTimeout(finishSwap, 220);
    } else {
      finishSwap();
    }

    // Footer state
    updateFooter(step);
  }

  function updateFooter(step) {
    if (step.hideFoot) {
      footEl.style.display = "none";
    } else {
      footEl.style.display = "";
    }
    backBtn.disabled = state.stepIndex === 0;

    const label = step.nextLabel || (step.key === "intent" ? "" : "Continue");
    nextBtn.querySelector(".tv-w-next-label").textContent = label;
    nextBtn.classList.toggle("is-final", !!step.nextIsFinal);
    // Hide the next button entirely on the intent step (cards advance themselves)
    nextBtn.style.display = step.key === "intent" ? "none" : "";
  }

  function showStepError(msg) {
    const errEl = bodyEl.querySelector(".tv-w-error-msg");
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add("is-visible");
    }
  }

  function clearStepError() {
    const errEl = bodyEl.querySelector(".tv-w-error-msg");
    if (errEl) {
      errEl.classList.remove("is-visible");
      errEl.textContent = "";
    }
  }

  function resolveStr(v) {
    if (typeof v === "function") return v(state);
    return v || "";
  }

  function toRoman(n) {
    if (typeof n !== "number" || n < 1) return String(n);
    const map = [
      [10, "X"], [9, "IX"], [8, "VIII"], [7, "VII"], [6, "VI"],
      [5, "V"], [4, "IV"], [3, "III"], [2, "II"], [1, "I"],
    ];
    let out = "";
    let rem = n;
    for (const [val, sym] of map) {
      while (rem >= val) { out += sym; rem -= val; }
    }
    return out;
  }

  /* ─── Field renderers ─────────────────────────────────────────────────── */

  function renderIntentStep(container) {
    const intents = [
      { v: "exploring",     title: "Just exploring",        sub: "I want to understand what you do." },
      { v: "get_started",   title: "Ready to get started",  sub: "I know what I want — let's launch." },
      { v: "talk_to_sales", title: "I have questions",      sub: "Walk me through it before I commit." },
    ];
    const wrap = document.createElement("div");
    wrap.className = "tv-w-intents";
    intents.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tv-w-intent";
      btn.setAttribute("data-intent", it.v);
      btn.innerHTML = `
        <span class="tv-w-intent-text">
          <span class="tv-w-intent-title">${it.title}</span>
          <span class="tv-w-intent-sub">${it.sub}</span>
        </span>
        <svg class="tv-w-intent-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      btn.addEventListener("click", () => {
        state.intent = it.v;
        state.stepIndex = 1;
        clearStepError();
        renderCurrentStep();
        fireEvent("wizard_intent", { intent: it.v });
      });
      wrap.appendChild(btn);
    });
    container.appendChild(wrap);
  }

  function renderTextField(key, placeholder, attrs) {
    return function (container) {
      const f = document.createElement("div");
      f.className = "tv-w-field";
      f.innerHTML = `
        <label class="tv-w-label" for="tv-w-${key}">${placeholderToLabel(placeholder)}</label>
        <div class="tv-w-input-wrap">
          <input id="tv-w-${key}" class="tv-w-input" type="${(attrs && attrs.type) || "text"}"
            autocomplete="${(attrs && attrs.autocomplete) || "off"}"
            placeholder="${placeholder}" />
        </div>
      `;
      const input = f.querySelector("input");
      input.value = state[key] || "";
      input.addEventListener("input", (e) => {
        state[key] = e.target.value;
        clearStepError();
      });
      container.appendChild(f);
    };
  }

  function renderTextareaField(key, placeholder) {
    return function (container) {
      const f = document.createElement("div");
      f.className = "tv-w-field";
      f.innerHTML = `
        <label class="tv-w-label" for="tv-w-${key}">Optional</label>
        <div class="tv-w-input-wrap">
          <textarea id="tv-w-${key}" class="tv-w-textarea" rows="3" placeholder="${placeholder}"></textarea>
        </div>
      `;
      const ta = f.querySelector("textarea");
      ta.value = state[key] || "";
      ta.addEventListener("input", (e) => { state[key] = e.target.value; });
      container.appendChild(f);
    };
  }

  function renderSelectField(key, options, placeholder) {
    return function (container) {
      const f = document.createElement("div");
      f.className = "tv-w-field";
      f.innerHTML = `
        <label class="tv-w-label" for="tv-w-${key}">Your business</label>
        <div class="tv-w-input-wrap">
          <select id="tv-w-${key}" class="tv-w-select">
            <option value="">${placeholder}</option>
            ${options.map((o) => `<option value="${o.v}">${o.label}</option>`).join("")}
          </select>
        </div>
      `;
      const sel = f.querySelector("select");
      sel.value = state[key] || "";
      sel.addEventListener("change", (e) => {
        state[key] = e.target.value;
        clearStepError();
      });
      container.appendChild(f);
    };
  }

  function renderPillField(key, options) {
    return function (container) {
      const wrap = document.createElement("div");
      wrap.className = "tv-w-pills";
      options.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tv-w-pill";
        b.textContent = o.label;
        b.setAttribute("data-value", o.v);
        if (state[key] === o.v) b.classList.add("is-selected");
        b.addEventListener("click", () => {
          state[key] = o.v;
          wrap.querySelectorAll(".tv-w-pill").forEach((p) => p.classList.remove("is-selected"));
          b.classList.add("is-selected");
          clearStepError();
          // Auto-advance on pill selection (deals/budget) for snappier feel
          setTimeout(goNext, 240);
        });
        wrap.appendChild(b);
      });
      container.appendChild(wrap);
    };
  }

  function renderContactFields(container) {
    const f = document.createElement("div");
    f.className = "tv-w-field";
    f.innerHTML = `
      <label class="tv-w-label" for="tv-w-email">Email</label>
      <div class="tv-w-input-wrap">
        <input id="tv-w-email" class="tv-w-input" type="email" autocomplete="email" placeholder="you@company.com" />
      </div>
    `;
    const emailInput = f.querySelector("input");
    emailInput.value = state.email || "";
    emailInput.addEventListener("input", (e) => { state.email = e.target.value; clearStepError(); });
    container.appendChild(f);

    const f2 = document.createElement("div");
    f2.className = "tv-w-field";
    f2.innerHTML = `
      <label class="tv-w-label" for="tv-w-phone">Phone</label>
      <div class="tv-w-input-wrap">
        <input id="tv-w-phone" class="tv-w-input" type="tel" autocomplete="tel" placeholder="(555) 123-4567" />
      </div>
    `;
    const phoneInput = f2.querySelector("input");
    phoneInput.value = state.phone || "";
    phoneInput.addEventListener("input", (e) => { state.phone = e.target.value; clearStepError(); });
    container.appendChild(f2);
  }

  function renderEmailOnlyField(container) {
    const f = document.createElement("div");
    f.className = "tv-w-field";
    f.innerHTML = `
      <label class="tv-w-label" for="tv-w-email">Email</label>
      <div class="tv-w-input-wrap">
        <input id="tv-w-email" class="tv-w-input" type="email" autocomplete="email" placeholder="you@company.com" />
      </div>
    `;
    const input = f.querySelector("input");
    input.value = state.email || "";
    input.addEventListener("input", (e) => { state.email = e.target.value; clearStepError(); });
    container.appendChild(f);
  }

  function renderSummary(container) {
    const rows = [
      ["You",          state.name],
      ["Business",     verticalLabel(state.vertical)],
      state.deals    ? [volumeKeyFor(state.vertical), dealsLabel(state.deals, state.vertical)] : null,
      state.budget   ? ["Budget",     bandLabel(BUDGET_BANDS, state.budget)] : null,
      state.previous ? ["Tried",      truncate(state.previous, 120)] : null,
      state.question ? ["Question",   truncate(state.question, 120)] : null,
      ["Email",        state.email],
      state.phone    ? ["Phone",      state.phone] : null,
    ].filter(Boolean);

    const wrap = document.createElement("div");
    wrap.className = "tv-w-summary";
    rows.forEach(([k, v]) => {
      const row = document.createElement("div");
      row.className = "tv-w-summary-row";
      row.innerHTML = `
        <span class="tv-w-summary-key">${k}</span>
        <span class="tv-w-summary-val">${escapeHtml(v || "—")}</span>
      `;
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  }

  function renderCalendly(container) {
    const url = buildCalendlyUrl();

    // Build the wrapper + a clean target element. NO data-url attribute —
    // we use Calendly's programmatic initInlineWidget() so every render gets
    // a fresh, correctly-targeted widget (the data-url auto-scan only fires
    // on initial script load and is unreliable for re-renders).
    const wrap = document.createElement("div");
    wrap.className = "tv-w-calendly-wrap";
    const widgetEl = document.createElement("div");
    // IMPORTANT: do NOT include the "calendly-inline-widget" class. Calendly's
    // script auto-scans every element with that class on load and calls
    // .split("?") on its data-url attribute — which crashes if data-url is
    // absent. We mount the widget programmatically via initInlineWidget()
    // below, so this element only needs our own sizing class.
    widgetEl.className = "tv-w-calendly-inline";
    // A faint placeholder so the user sees motion while Calendly loads.
    widgetEl.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Inter,sans-serif;color:#8a8275;font-size:14px;">Loading your scheduler…</div>';
    wrap.appendChild(widgetEl);
    container.appendChild(wrap);

    function initWidget() {
      if (!window.Calendly || typeof window.Calendly.initInlineWidget !== "function") {
        // Script not ready yet — retry briefly. Bail after ~5s.
        if (!initWidget._tries) initWidget._tries = 0;
        if (initWidget._tries++ < 25) {
          setTimeout(initWidget, 200);
        }
        return;
      }
      // Clear the placeholder so Calendly mounts cleanly
      widgetEl.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: widgetEl,
      });
    }

    if (!calendlyLoaded) {
      const s = document.createElement("script");
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      // Opt out of Cloudflare's Rocket Loader, which rewrites async scripts
      // and routinely breaks third-party widgets like Calendly.
      s.setAttribute("data-cfasync", "false");
      s.onload = initWidget;
      s.onerror = function () {
        widgetEl.innerHTML =
          '<div style="padding:24px;font-family:Inter,sans-serif;color:#b14a3a;text-align:center;">Could not load the scheduler. Please refresh the page and try again, or email team@televistaleadgeneration.com.</div>';
      };
      document.body.appendChild(s);
      calendlyLoaded = true;
    } else {
      initWidget();
    }

    fireEvent("wizard_calendly_view", { intent: state.intent });
  }

  function buildCalendlyUrl() {
    // Pick the right Calendly event based on the prospect's intent.
    const eventKey =
      (CONFIG.intentRouting && CONFIG.intentRouting[state.intent]) || "sales";
    const base =
      (CONFIG.calendlyUrls && CONFIG.calendlyUrls[eventKey]) ||
      CONFIG.calendlyUrls.sales;
    const params = new URLSearchParams();

    if (state.name)  params.set("name", state.name);
    if (state.email) params.set("email", state.email);

    // Custom intake answers (Calendly accepts a1..a10 by question order)
    // Set up your Calendly intake questions in this order:
    //   Q1 → Vertical
    //   Q2 → Deals/mo band
    //   Q3 → Budget band
    //   Q4 → Previous lead gen / question
    //   Q5 → Intent
    if (state.vertical) params.set("a1", verticalLabel(state.vertical));
    if (state.deals)    params.set("a2", dealsLabel(state.deals, state.vertical));
    if (state.budget)   params.set("a3", bandLabel(BUDGET_BANDS, state.budget));
    const a4 = state.previous || state.question;
    if (a4) params.set("a4", truncate(a4, 240));
    if (state.intent) params.set("a5", labelForIntent(state.intent));

    const sep = base.indexOf("?") === -1 ? "?" : "&";
    // URLSearchParams.toString() encodes spaces as "+" (form-urlencoded),
    // but Calendly's intake form expects "%20". Swap them so prefilled
    // multi-word values render correctly ("Real Estate Investor", not
    // "Real+Estate+Investor").
    return base + sep + params.toString().replace(/\+/g, "%20");
  }

  function placeholderToLabel(p) {
    // Map placeholder copy back to a short label. Simple heuristic.
    if (/name/i.test(p)) return "Your name";
    if (/email/i.test(p)) return "Email";
    if (/phone/i.test(p)) return "Phone";
    return "Tell us";
  }

  function verticalLabel(v) {
    const m = VERTICALS.find((x) => x.v === v);
    return m ? m.label : v || "—";
  }

  function bandLabel(bands, v) {
    const m = bands.find((x) => x.v === v);
    return m ? m.label : v || "—";
  }

  function truncate(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ─── Submission ──────────────────────────────────────────────────────── */

  function buildPayload(opts) {
    return Object.assign(
      {
        session_id: state.sessionId,
        intent: state.intent,
        name: state.name,
        vertical: state.vertical,
        deals_band: state.deals,
        budget_band: state.budget,
        previous: state.previous,
        question: state.question,
        email: state.email,
        phone: state.phone,
        page: location.pathname + location.search,
        referrer: state.referrer,
        utm: state.utm,
        timestamp: new Date().toISOString(),
      },
      opts || {}
    );
  }

  function submit() {
    if (state.submitting) return;
    state.submitting = true;
    modal.classList.add("is-submitting");

    const payload = buildPayload({ stage: "wizard_complete" });

    // Fire-and-forget: don't block the Calendly load on this network call.
    // If the endpoint is the placeholder, just skip.
    if (CONFIG.submitEndpoint && CONFIG.submitEndpoint !== "/api/wizard-submit") {
      const ctrl = (window.AbortController) ? new AbortController() : null;
      const tid = setTimeout(() => { if (ctrl) ctrl.abort(); }, 8000);
      fetch(CONFIG.submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined,
        keepalive: true,
      })
        .catch(() => { /* swallow — Calendly is the real conversion */ })
        .finally(() => {
          clearTimeout(tid);
          state.submitting = false;
          modal.classList.remove("is-submitting");
        });
    } else {
      // Placeholder endpoint — just clear the spinner after a beat so UX
      // doesn't feel broken in dev
      setTimeout(() => {
        state.submitting = false;
        modal.classList.remove("is-submitting");
      }, 400);
    }

    fireEvent("wizard_complete", {
      intent: state.intent,
      vertical: state.vertical,
      deals_band: state.deals,
    });
  }

  /* ─── Trigger attachment ──────────────────────────────────────────────── */

  function attachTriggers() {
    // Direct DOM scan once on DOMContentLoaded
    bindAllTriggers();

    // Also delegate so dynamically-injected buttons work
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-wizard-trigger]");
      if (!t) return;
      e.preventDefault();
      open({
        intent: t.getAttribute("data-wizard-intent") || null,
        plan:   t.getAttribute("data-wizard-plan")   || null,
      });
    });
  }

  function bindAllTriggers() {
    // No-op for now since we use event delegation, but useful to call after
    // dynamic content insertion in case we add focus styles or ARIA later.
  }

  /* ─── Calendly postMessage listener ───────────────────────────────────
     Calendly's "redirect after booking" setting tries to navigate from inside
     the embedded iframe, which modern browsers block as a cross-origin frame
     navigation. We instead listen for Calendly's `event_scheduled` event from
     the parent page and do the redirect ourselves. Works in every browser. */

  function setupCalendlyListener() {
    window.addEventListener("message", function (e) {
      // Only trust messages from Calendly origins
      if (!e.origin || !/^https?:\/\/([a-z0-9-]+\.)?calendly\.com$/.test(e.origin)) {
        return;
      }
      // Only act when our wizard modal is open (so direct embeds elsewhere
      // on the site, if any, aren't hijacked)
      if (!state.open) return;

      var data = e.data || {};
      var eventName = data.event || "";

      if (eventName === "calendly.event_scheduled") {
        fireEvent("wizard_booking_confirmed", {
          intent: state.intent,
          vertical: state.vertical,
        });

        // Build the redirect URL — pass intent + UTMs so thank-you.html and
        // any downstream analytics can attribute the booking correctly.
        var qs = new URLSearchParams();
        qs.set("source", "wizard");
        if (state.intent)   qs.set("intent", state.intent);
        if (state.vertical) qs.set("vertical", state.vertical);
        Object.keys(state.utm || {}).forEach(function (k) {
          if (state.utm[k]) qs.set(k, state.utm[k]);
        });

        // Small delay so Calendly's own success animation flashes briefly
        // before we navigate away — feels less abrupt than instant redirect.
        setTimeout(function () {
          window.location.href = "/thank-you.html?" + qs.toString();
        }, 600);
      }
    });
  }

  /* ─── Public API ──────────────────────────────────────────────────────── */

  window.TelevistaWizard = {
    open: open,
    close: close,
    config: CONFIG,
  };

  setupCalendlyListener();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachTriggers);
  } else {
    attachTriggers();
  }
})();
