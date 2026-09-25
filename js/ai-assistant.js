/**
 * CUN AI Concierge — final conversational layer
 * Order of reasoning:
 *  1) Social (hi/hello/thanks…) — never Wikipedia, never "not public"
 *  2) Developer identity flow
 *  3) CUN published knowledge
 *  4) Web search only for real questions
 *  5) "It's not yet made public." only for missing school facts
 */
(function () {
  "use strict";

  var messagesEl = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");
  if (!messagesEl || !form || !input) return;

  var pendingDev = null;
  var NOT_PUBLIC = "It's not yet made public.";

  var pages = [
    ["Admissions", "admissions.html", "admissions application entry apply requirements"],
    ["How to Apply", "how-to-apply.html", "how to apply application process"],
    ["Programmes", "programmes.html", "programmes courses degree study"],
    ["Faculties", "faculties.html", "faculties departments academic"],
    ["Fees", "fees.html", "fees tuition payment"],
    ["Scholarships", "scholarships.html", "scholarships funding"],
    ["Calendar", "academic-calendar.html", "calendar semester dates"],
    ["Support", "student-support.html", "support counselling help"],
    ["Accommodation", "accommodation.html", "hostel accommodation housing"],
    ["Library", "library.html", "library books"],
    ["Research", "research.html", "research"],
    ["Contact", "contact.html", "contact phone email office"],
    ["Login / Portals", "login.html", "portal login student staff"]
  ];

  function normal(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Render message; optional sourceLabel shows a small chip, not a raw URL dump */
  function addMessage(role, text, sourceLabel) {
    var el = document.createElement("div");
    el.className = "ai-msg " + (role === "user" ? "user" : "bot") + " ai-message " + role;

    var body = document.createElement("div");
    body.className = "ai-msg-body";
    body.style.whiteSpace = "pre-wrap";
    body.textContent = text;
    el.appendChild(body);

    if (sourceLabel && role !== "user") {
      var src = document.createElement("div");
      src.className = "ai-msg-source";
      src.innerHTML = '<span class="ai-src-icon" aria-hidden="true">🔗</span> <span>' + escapeHtml(sourceLabel) + "</span>";
      el.appendChild(src);
    }

    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showTyping() {
    hideTyping();
    var el = document.createElement("div");
    el.id = "ai-typing";
    el.className = "ai-msg bot ai-message assistant ai-typing";
    el.innerHTML = '<span class="ai-dots" aria-label="Assistant is typing"><span></span><span></span><span></span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById("ai-typing");
    if (t) t.remove();
  }

  function isYes(n) {
    return /^(yes|yeah|yep|yup|sure|ok|okay|please|of course|yea|ya|alright|fine)\b/.test(n);
  }
  function isNo(n) {
    return /^(no|nope|nah|not now|no thanks)\b/.test(n);
  }

  /* ---- Social detection (must run BEFORE any web search) ---- */
  function isGreeting(n) {
    if (!n) return false;
    /* exact short greetings */
    if (/^(hi|hii|hiii|hello|helo|hey|yo|sup|howdy|hiya)$/.test(n)) return true;
    if (/^(hi|hello|hey|yo)\s+(there|all|friend|team)?$/.test(n)) return true;
    if (/^(good\s+morning|good\s+afternoon|good\s+evening|good\s+day)$/.test(n)) return true;
    if (/^(what'?s\s+up|whats\s+up|wassup)$/.test(n)) return true;
    return false;
  }
  function isThanks(n) {
    return /^(thanks|thank\s*you|thx|ty|thank\s*u)(\s+.*)?$/.test(n) ||
      /\b(thank you|thanks a lot|thanks so much)\b/.test(n);
  }
  function isBye(n) {
    return /^(bye|goodbye|good\s*bye|see\s*you|later|take\s*care|good\s*night|goodnight)(\s+.*)?$/.test(n);
  }
  function isHowAreYou(n) {
    return /\b(how are you|how're you|how r you|how's it going|how are things|you good)\b/.test(n);
  }
  function isWhoAreYou(n) {
    return /\b(who are you|what are you|your name|what is your name|what do you do)\b/.test(n);
  }
  function isHelp(n) {
    return /^(help|menu|options)$/.test(n) ||
      /\b(what can you do|what can u do|help me|can you help)\b/.test(n);
  }
  function isJoke(n) {
    return /\b(joke|funny|make me laugh|tell me a joke)\b/.test(n);
  }
  function isDeveloperQuestion(n) {
    return (
      /\b(who (built|made|created|developed|designed|coded)|developer|who developed|who made (this|the) (site|website|web|platform|ai|assistant))\b/.test(n) ||
      /\b(your (creator|developer|maker|builder)|built by|made by|created by)\b/.test(n) ||
      /\bezeh\b|\bgodwin\b|\bchukwunonso\b/.test(n)
    );
  }
  function isSchoolQuestion(n) {
    return /\b(cun|canadian university|university of nigeria|admissions?|programme|programmes|program|programs|faculty|faculties|fees?|tuition|scholarship|hostel|accommodation|utme|jamb|matriculation|nuc|campus|semester|course registration|student portal|staff portal|bursary|cgpa|transcript)\b/.test(n);
  }

  function greetReply(n) {
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    if (/good morning/.test(n)) return "Good morning! Welcome to the CUN AI Concierge. How can I help you today?";
    if (/good afternoon/.test(n)) return "Good afternoon! How can I help — CUN info or another question?";
    if (/good evening/.test(n)) return "Good evening! What would you like to know?";
    return part + "! I'm the CUN AI Concierge. Ask me about the university, or anything else on your mind.";
  }

  function socialReply(n) {
    if (isGreeting(n)) return greetReply(n);
    if (isHowAreYou(n)) return "I'm doing well, thanks for asking — ready to help. What do you need?";
    if (isWhoAreYou(n)) {
      return "I'm the CUN AI Concierge on the Canadian University of Nigeria website. I answer questions about the school from published information, can look up general knowledge, and I'm happy to chat. How can I help?";
    }
    if (isThanks(n)) return "You're welcome! Ask anytime if you need more help.";
    if (isBye(n)) return "Goodbye! Wishing you all the best — come back anytime.";
    if (isHelp(n)) {
      return "I can help with:\n• CUN admissions, programmes, location, portals\n• General knowledge questions\n• Who built this website\n• Simple chat (hi, thanks, etc.)\n\nWhat would you like?";
    }
    if (isJoke(n)) {
      return "Why did the laptop go to school?\nBecause it wanted a higher degree of learning!\n\nWant something about CUN next?";
    }
    return null;
  }

  /* Developer */
  function developerIntro() {
    pendingDev = "ask_contact";
    return "This website and the CUN AI Concierge were developed by Mr Ezeh Godwin Chukwunonso.\n\nWould you like his contact information?";
  }
  function developerContact() {
    pendingDev = "ask_more";
    return "Here is how you can reach Mr Ezeh Godwin Chukwunonso:\n\nPhone / WhatsApp: 07060570520\nEmail: ezehgodwin816@gmail.com\n\nWould you like more information about him?";
  }
  function developerFullProfile() {
    pendingDev = null;
    return (
      "More about Mr Ezeh Godwin Chukwunonso:\n\n" +
      "Address: Abuja, Nigeria\n\n" +
      "Role: Software Developer & White Hat Hacker (ethical security specialist)\n\n" +
      "He builds modern websites, web apps and portals with a focus on clarity, performance and security. " +
      "As a white hat practitioner, he also helps test systems so weaknesses can be fixed before attackers find them.\n\n" +
      "Strengths:\n• Full-stack web development & UI/UX\n• Secure portals and authentication\n• Ethical security testing\n• Turning real needs into working products\n\n" +
      "For software development or security testing, contact him:\nPhone / WhatsApp: 07060570520\nEmail: ezehgodwin816@gmail.com\nLocation: Abuja, Nigeria"
    );
  }
  function handleDevFlow(n) {
    if (pendingDev === "ask_contact") {
      if (isYes(n)) return developerContact();
      if (isNo(n)) { pendingDev = null; return "No problem. Ask anytime who developed this site if you need his details later."; }
      return "Please reply yes or no: would you like Mr Ezeh Godwin Chukwunonso's contact information?";
    }
    if (pendingDev === "ask_more") {
      if (isYes(n)) return developerFullProfile();
      if (isNo(n)) { pendingDev = null; return "Alright. You already have his phone and email if you need them."; }
      return "Please reply yes or no: would you like more information about him?";
    }
    return null;
  }

  /* CUN knowledge */
  function localCun(q) {
    var n = normal(q);
    var d = window.CUN_DATA || {};
    var u = d.university || {};
    var faqs = d.faqs || [];

    for (var i = 0; i < faqs.length; i++) {
      var fq = normal(faqs[i].q);
      var tokens = fq.split(" ").filter(function (t) { return t.length > 3; });
      var hits = tokens.filter(function (t) { return n.indexOf(t) !== -1; }).length;
      if (hits >= 2 || (tokens.length && hits / tokens.length >= 0.5)) return { text: faqs[i].a };
    }

    if ((/\b(where|location|located|campus|utako)\b/.test(n) && /\b(cun|university|campus|school)\b/.test(n)) || /\bwhere is cun\b/.test(n)) {
      return { text: (u.name || "Canadian University of Nigeria") + " is in Abuja, FCT, Nigeria (Utako area in public listings). See the Contact page for more." };
    }
    if (/\b(nuc|licence|license|accreditation)\b/.test(n)) {
      return { text: "NUC lists Canadian University of Nigeria, Abuja among private universities (establishment recorded 2023). Confirm programme-level accreditation on the current NUC record." };
    }
    if (/\b(apply|application|how to apply)\b/.test(n)) {
      return { text: "Start or continue on the Apply page: choose a programme, enter details, upload documents, submit. Track status on Application Status. → apply.html" };
    }
    if (/\b(requirement|requirements|utme|direct entry|jamb)\b/.test(n)) {
      return { text: "Public pathways include UTME and Direct Entry. Exact subjects/cut-offs vary — see Admission Requirements and official CUN notices. → admission-requirements.html" };
    }
    if (/\b(programme|programmes|program|programs|course|courses|degree|study)\b/.test(n)) {
      var programmes = d.programmes || [];
      if (programmes.length) {
        return { text: "Reported areas include Health Sciences, Computing, and Management & Social Sciences.\n\n" + programmes.slice(0, 12).map(function (x) { return "• " + (x.name || x.title); }).join("\n") + "\n\n→ programmes.html" };
      }
      return { text: "Public reports list Health Sciences, Computing, and Management & Social Sciences. → programmes.html" };
    }
    if (/\b(fee|fees|tuition|how much)\b/.test(n)) {
      return { text: "A complete fee schedule is not fully published on this site. " + NOT_PUBLIC + " Please use your portal statement or contact Admissions/Bursary." };
    }
    if (/\b(scholarship|scholarships)\b/.test(n)) {
      return { text: "See scholarships.html. If a specific award is missing, " + NOT_PUBLIC.toLowerCase() };
    }
    if (/\b(hostel|accommodation|housing)\b/.test(n)) return { text: "See accommodation.html for housing information." };
    if (/\b(contact|phone|email)\b/.test(n) && !isDeveloperQuestion(n)) return { text: "Official contacts are on contact.html." };
    if (/\b(portal|login)\b/.test(n)) return { text: "Sign in at login.html for Student or Staff portal." };
    if (/\b(about|mission|vision|what is cun)\b/.test(n)) {
      return { text: (u.name || "Canadian University of Nigeria") + " — " + (u.tagline || "Where Knowledge Meets Global Excellence") + ". Private university presentation for " + (u.location || "Abuja, Nigeria") + "." };
    }

    var matches = [];
    for (var p = 0; p < pages.length; p++) {
      var keys = pages[p][2].split(/\s+/), score = 0;
      for (var k = 0; k < keys.length; k++) if (keys[k].length > 2 && n.indexOf(keys[k]) !== -1) score++;
      if (score) matches.push({ score: score, title: pages[p][0], href: pages[p][1] });
    }
    matches.sort(function (a, b) { return b.score - a.score; });
    if (matches.length && matches[0].score >= 1) {
      return { text: "Relevant pages:\n" + matches.slice(0, 3).map(function (m) { return "• " + m.title + " — " + m.href; }).join("\n") };
    }
    return null;
  }

  /** Web search — returns { text, sourceLabel } or null. Never call for pure greetings. */
  function webSearch(q) {
    var query = String(q || "").trim();
    if (query.length < 3) return Promise.resolve(null);

    var wikiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query.replace(/\s+/g, "_"));
    var ddgUrl = "https://api.duckduckgo.com/?q=" + encodeURIComponent(query) + "&format=json&no_redirect=1&no_html=1&skip_disambig=1";

    var wikiP = fetch(wikiUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || data.type !== "standard" || !data.extract) return null;
        return { text: data.extract, sourceLabel: "Wikipedia" };
      })
      .catch(function () { return null; });

    var ddgP = fetch(ddgUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return null;
        if (data.AbstractText) return { text: data.AbstractText, sourceLabel: data.AbstractSource || "Web" };
        if (data.Answer) return { text: String(data.Answer), sourceLabel: "Web" };
        if (data.Definition) return { text: data.Definition, sourceLabel: "Web" };
        return null;
      })
      .catch(function () { return null; });

    return Promise.all([wikiP, ddgP]).then(function (r) { return r[0] || r[1] || null; });
  }

  function looksLikeRealQuestion(n) {
    if (!n || n.length < 3) return false;
    if (isGreeting(n) || isThanks(n) || isBye(n)) return false;
    /* single dictionary-word greetings already excluded; block bare "hello" style */
    if (n.split(" ").length === 1 && n.length <= 12) {
      /* allow single-word topics like "photosynthesis" but not hi/hello */
      if (/^(hi|hello|hey|yo|sup|thanks|bye|ok|okay|yes|no)$/.test(n)) return false;
    }
    return true;
  }

  function generalFallback(q) {
    return "I heard you. I don't have a solid answer for that yet.\n\nTry rephrasing, ask about CUN (admissions, programmes, location), or ask a clear general-knowledge question.";
  }

  async function answerQuestion(q) {
    var n = normal(q);
    if (!n) return { text: "Please type a message and I'll reply." };

    /* 1) Developer follow-up */
    var dev = handleDevFlow(n);
    if (dev) return { text: dev };

    /* 2) Social FIRST — critical: never Wikipedia on "hello" */
    var social = socialReply(n);
    if (social) return { text: social };

    /* 3) Developer ask */
    if (isDeveloperQuestion(n)) return { text: developerIntro() };

    /* 4) CUN data */
    var local = localCun(q);
    if (local) return local;

    /* 5) Web only for real questions */
    if (looksLikeRealQuestion(n)) {
      try {
        var web = await webSearch(q);
        if (web && web.text) return web;
        var short = q.trim().split(/\s+/).slice(0, 8).join(" ");
        if (short !== q.trim()) {
          web = await webSearch(short);
          if (web && web.text) return web;
        }
      } catch (e) {}
    }

    /* 6) Missing school fact only */
    if (isSchoolQuestion(n)) return { text: NOT_PUBLIC };

    /* 7) Friendly fallback */
    return { text: generalFallback(q) };
  }

  /* Prompt chips */
  document.querySelectorAll(".ai-prompt[data-question]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-question") || "";
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  });

  addMessage(
    "assistant",
    "Hi! I'm the CUN AI Concierge. I can chat, answer questions about Canadian University of Nigeria, look up general knowledge, and tell you who built this site if you ask. How can I help?"
  );

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var q = (input.value || "").trim();
    if (!q) return;
    input.value = "";
    addMessage("user", q);

    var send = form.querySelector('button[type="submit"]');
    if (send) {
      send.disabled = true;
      send.textContent = "…";
    }

    showTyping();

    var result;
    try {
      result = await answerQuestion(q);
    } catch (err) {
      result = { text: generalFallback(q) };
    }

    hideTyping();
    if (!result || !result.text) result = { text: generalFallback(q) };
    addMessage("assistant", result.text, result.sourceLabel || null);

    if (send) {
      send.disabled = false;
      send.textContent = "Ask CUN";
    }
    input.focus();
  });
})();
