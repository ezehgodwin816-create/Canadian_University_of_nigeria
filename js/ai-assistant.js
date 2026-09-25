/**
 * CUN AI Concierge — conversational reasoning layer
 * - Greets and chats naturally
 * - Answers CUN questions from published data
 * - "It's not yet made public." ONLY for missing school/official info
 * - General questions: web search + reasoned fallbacks
 * - Developer identity: Mr Ezeh Godwin Chukwunonso
 */
(function () {
  "use strict";

  var messages = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");
  if (!messages || !form || !input) return;

  var pendingDev = null; /* null | "ask_contact" | "ask_more" */
  var chatHistory = []; /* recent turns for light context */

  var pages = [
    ["Admissions", "admissions.html", "admissions application entry apply requirements"],
    ["How to Apply", "how-to-apply.html", "how to apply application process steps"],
    ["Programmes", "programmes.html", "programmes courses degree study"],
    ["Faculties", "faculties.html", "faculties academic areas"],
    ["Fees & Payments", "fees.html", "fees tuition payments"],
    ["Scholarships", "scholarships.html", "scholarships funding"],
    ["Academic Calendar", "academic-calendar.html", "calendar semester academic dates"],
    ["Student Support", "student-support.html", "support help welfare counselling"],
    ["Accommodation", "accommodation.html", "hostel accommodation housing"],
    ["Library", "library.html", "library books learning"],
    ["Research", "research.html", "research projects publications"],
    ["Careers", "careers.html", "careers jobs employment"],
    ["Contact", "contact.html", "contact address office phone email"],
    ["Application Status", "application-status.html", "application status track"],
    ["Student / Staff Login", "login.html", "portal login student staff"]
  ];

  function normal(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function add(role, text) {
    var el = document.createElement("div");
    el.className = "ai-msg " + (role === "user" ? "user" : "bot") + " ai-message " + role;
    el.style.whiteSpace = "pre-wrap";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    chatHistory.push({ role: role, text: text });
    if (chatHistory.length > 12) chatHistory.shift();
  }

  function isYes(n) {
    return /^(yes|yeah|yep|yup|sure|ok|okay|please|of course|yea|ya|alright|fine)\b/.test(n) ||
      /\b(yes please|sure thing|go ahead)\b/.test(n);
  }
  function isNo(n) {
    return /^(no|nope|nah|not now|no thanks)\b/.test(n);
  }

  /* ---------- Intent detection (reasoning about what the user wants) ---------- */
  function isGreeting(n) {
    return /^(hi|hii|hiii|hello|hey|hey there|hi there|good morning|good afternoon|good evening|howdy|yo|sup|what's up|whats up|hiya)\b/.test(n) ||
      n === "hi" || n === "hello" || n === "hey";
  }
  function isThanks(n) {
    return /^(thanks|thank you|thx|ty|appreciate|grateful)\b/.test(n) ||
      /\b(thank you|thanks a lot|thanks so much)\b/.test(n);
  }
  function isBye(n) {
    return /^(bye|goodbye|see you|later|take care|good night|goodnight)\b/.test(n);
  }
  function isHowAreYou(n) {
    return /\b(how are you|how're you|how r you|how's it going|how are things|you good|are you ok|are you okay)\b/.test(n);
  }
  function isWhoAreYou(n) {
    return /\b(who are you|what are you|your name|what is your name|what do you do)\b/.test(n);
  }
  function isHelp(n) {
    return /^(help|menu|options|what can you do|what can u do)\b/.test(n) ||
      /\b(help me|can you help|what do you know)\b/.test(n);
  }
  function isJoke(n) {
    return /\b(joke|funny|make me laugh|tell me a joke)\b/.test(n);
  }
  function isDeveloperQuestion(n) {
    return (
      /\b(who (built|made|created|developed|designed|coded)|developer|who (is|are) (the )?(developer|creator|author)|who developed|who made (this|the) (site|website|web|platform|ai|assistant|concierge))\b/.test(n) ||
      /\b(your (creator|developer|maker|builder)|built by|made by|created by)\b/.test(n) ||
      /\bezeh\b|\bgodwin\b|\bchukwunonso\b/.test(n)
    );
  }
  /** School-related: user is asking about CUN / university facts */
  function isSchoolQuestion(n) {
    return (
      /\b(cun|canadian university|university of nigeria|admissions?|programme|programmes|program|programs|faculty|faculties|fees?|tuition|scholarship|hostel|accommodation|utme|jamb|matriculation|nuc|campus|semester|course registration|student portal|staff portal|apply|application|bursary|matriculation|cgpa|transcript)\b/.test(n) ||
      /\b(when (does|do|is|are)|where (is|are)|how (do|can|much)|what (are|is) the)\b/.test(n) &&
        /\b(school|university|admission|fee|course|class|lecture)\b/.test(n)
    );
  }

  function greetReply(n) {
    var hour = new Date().getHours();
    var timeHi = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    if (/good morning/.test(n)) return "Good morning! Welcome to the CUN AI Concierge. How can I help you today — admissions, programmes, or anything else?";
    if (/good afternoon/.test(n)) return "Good afternoon! I'm here to help with CUN information or general questions. What would you like to know?";
    if (/good evening/.test(n)) return "Good evening! How can I assist you with Canadian University of Nigeria or a general question?";
    return timeHi + "! I'm the CUN AI Concierge. Ask me about the university, or anything else on your mind.";
  }

  function smallTalk(n) {
    if (isHowAreYou(n)) {
      return "I'm doing well, thank you for asking — ready to help. How can I assist you today?";
    }
    if (isWhoAreYou(n)) {
      return "I'm the CUN AI Concierge — a helper on the Canadian University of Nigeria website. I answer questions about the school from published information, can look up general knowledge online, and I'm happy to chat. What do you need?";
    }
    if (isThanks(n)) {
      return "You're welcome! If you have another question about CUN or anything else, just ask.";
    }
    if (isBye(n)) {
      return "Goodbye! Best wishes — come back anytime if you need help with CUN or other questions.";
    }
    if (isHelp(n)) {
      return (
        "Here's what I can do:\n" +
        "• Answer questions about Canadian University of Nigeria (admissions, programmes, location, portals…)\n" +
        "• Look up general knowledge on the web when I can\n" +
        "• Tell you who built this platform if you ask\n" +
        "• Chat politely for simple messages like hi or thanks\n\n" +
        "What would you like to start with?"
      );
    }
    if (isJoke(n)) {
      return "Why did the student bring a ladder to campus?\nBecause they heard the courses were on another level!\n\nWant a serious answer about CUN next, or another joke?";
    }
    return null;
  }

  /* ---------- Developer flow ---------- */
  function developerIntro() {
    pendingDev = "ask_contact";
    return (
      "This website and the CUN AI Concierge were developed by Mr Ezeh Godwin Chukwunonso.\n\n" +
      "Would you like his contact information?"
    );
  }
  function developerContact() {
    pendingDev = "ask_more";
    return (
      "Here is how you can reach Mr Ezeh Godwin Chukwunonso:\n\n" +
      "Phone / WhatsApp: 07060570520\n" +
      "Email: ezehgodwin816@gmail.com\n\n" +
      "Would you like more information about him?"
    );
  }
  function developerFullProfile() {
    pendingDev = null;
    return (
      "More about Mr Ezeh Godwin Chukwunonso:\n\n" +
      "Address: Abuja, Nigeria\n\n" +
      "Role: Software Developer & White Hat Hacker (ethical security specialist)\n\n" +
      "He designs and builds modern, reliable software — websites, web apps, portals and digital platforms — with a strong focus on clarity, performance and user experience. " +
      "As a white hat / ethical security practitioner, he also helps organisations test systems for weaknesses so they can be fixed before attackers find them.\n\n" +
      "Strengths include:\n" +
      "• Full-stack web development and clean UI/UX\n" +
      "• Secure authentication, portals and data-aware applications\n" +
      "• Ethical security testing and practical hardening advice\n" +
      "• Turning real business or school needs into working digital products\n\n" +
      "If you need help developing software, improving an existing product, or testing software for security (hack-proof hardening), you can contact him directly:\n\n" +
      "Phone / WhatsApp: 07060570520\n" +
      "Email: ezehgodwin816@gmail.com\n" +
      "Location: Abuja, Nigeria"
    );
  }
  function handleDeveloperFlow(n) {
    if (pendingDev === "ask_contact") {
      if (isYes(n)) return developerContact();
      if (isNo(n)) {
        pendingDev = null;
        return "No problem. If you need his details later, just ask who developed this website.";
      }
      return "Please reply with yes or no: would you like Mr Ezeh Godwin Chukwunonso's contact information?";
    }
    if (pendingDev === "ask_more") {
      if (isYes(n)) return developerFullProfile();
      if (isNo(n)) {
        pendingDev = null;
        return "Alright. You already have his phone and email if you need them later.";
      }
      return "Please reply with yes or no: would you like more information about Mr Ezeh Godwin Chukwunonso?";
    }
    return null;
  }

  /* ---------- CUN knowledge ---------- */
  function localCunAnswer(q) {
    var n = normal(q);
    var d = window.CUN_DATA || {};
    var u = d.university || {};
    var faqs = d.faqs || [];

    for (var i = 0; i < faqs.length; i++) {
      var fq = normal(faqs[i].q);
      var tokens = fq.split(" ").filter(function (t) { return t.length > 3; });
      var hits = tokens.filter(function (t) { return n.indexOf(t) !== -1; }).length;
      if (hits >= 2 || (tokens.length && hits / tokens.length >= 0.5)) {
        return faqs[i].a;
      }
    }

    if (/\b(where|location|located|address|campus|utako)\b/.test(n) && /\b(cun|university|campus|school)\b/.test(n) || /\bwhere is cun\b/.test(n)) {
      return (u.name || "Canadian University of Nigeria") +
        " is located in Abuja, Federal Capital Territory, Nigeria. Public listings identify Utako, Abuja as the campus area. For directions, see the Contact page.";
    }
    if (/\b(nuc|licence|license|accreditation|recognised|recognized)\b/.test(n)) {
      return "The National Universities Commission (NUC) lists Canadian University of Nigeria, Abuja among Nigeria's private universities and recorded its establishment in 2023. Programme-level accreditation should be confirmed on the current NUC record for each programme.";
    }
    if (/\b(apply|application|how to apply|admission process)\b/.test(n)) {
      return "You can start or continue an application on the Apply page: select a programme, enter your details, upload documents and submit. Track progress on Application Status. Open: apply.html";
    }
    if (/\b(requirement|requirements|utme|direct entry|o.?level|jamb)\b/.test(n)) {
      return "Public reports identify UTME and Direct Entry pathways. Exact subjects and cut-offs depend on programme and session — check Admission Requirements and the official CUN notice. Open: admission-requirements.html";
    }
    if (/\b(programme|programmes|program|programs|course|courses|degree|what can i study)\b/.test(n)) {
      var programmes = d.programmes || [];
      if (programmes.length) {
        return "Publicly reported areas include Health Sciences, Computing, and Management & Social Sciences.\n\n" +
          programmes.slice(0, 12).map(function (x) { return "• " + (x.name || x.title); }).join("\n") +
          "\n\nSee programmes.html for the full catalogue.";
      }
      return "Initial public reports list Health Sciences, Computing, and Management & Social Sciences. See programmes.html for details.";
    }
    if (/\b(fee|fees|tuition|payment|how much)\b/.test(n)) {
      return "A full public fee schedule is not listed on this site in complete detail. It's not yet made public here. Please use your official portal statement or contact Admissions/Bursary. See also fees.html";
    }
    if (/\b(scholarship|scholarships|funding)\b/.test(n)) {
      return "See scholarships.html for published scholarship information. If a specific award is missing, it's not yet made public.";
    }
    if (/\b(hostel|accommodation|housing)\b/.test(n)) {
      return "See accommodation.html for campus housing information.";
    }
    if (/\b(contact|phone|email|office)\b/.test(n) && !isDeveloperQuestion(n)) {
      return "Official university contacts are on contact.html.";
    }
    if (/\b(portal|login|student portal|staff portal)\b/.test(n)) {
      return "Sign in at login.html for the Student or Staff portal after authentication.";
    }
    if (/\b(about|mission|vision|history|what is cun)\b/.test(n)) {
      return (u.name || "Canadian University of Nigeria") +
        " (" + (u.tagline || "Where Knowledge Meets Global Excellence") +
        ") is presented on this platform as a private university in " +
        (u.location || "Abuja, Nigeria") + ". See the About pages for more institutional information.";
    }

    var matches = [];
    for (var p = 0; p < pages.length; p++) {
      var keys = pages[p][2].split(/\s+/);
      var score = 0;
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].length > 2 && n.indexOf(keys[k]) !== -1) score++;
      }
      if (score > 0) matches.push({ score: score, title: pages[p][0], href: pages[p][1] });
    }
    matches.sort(function (a, b) { return b.score - a.score; });
    if (matches.length && matches[0].score >= 1) {
      return "Relevant CUN pages:\n" +
        matches.slice(0, 3).map(function (m) { return "• " + m.title + " — " + m.href; }).join("\n") +
        "\n\nOpen the page for full details. If something specific is missing there, it's not yet made public.";
    }
    return null;
  }

  /* ---------- Web search ---------- */
  function webSearch(q) {
    var query = String(q || "").trim();
    if (query.length < 2) return Promise.resolve(null);

    var wikiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query.replace(/\s+/g, "_"));
    var ddgUrl = "https://api.duckduckgo.com/?q=" + encodeURIComponent(query) + "&format=json&no_redirect=1&no_html=1&skip_disambig=1";

    var wikiP = fetch(wikiUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return null;
        if (data.type === "standard" && data.extract) {
          return data.extract + (data.content_urls && data.content_urls.desktop ? "\n\nSource: " + data.content_urls.desktop.page : "\n\nSource: Wikipedia");
        }
        if (data.type === "disambiguation") return "That topic has several meanings. Try asking with more detail (for example a full name or a specific place).";
        return null;
      })
      .catch(function () { return null; });

    var ddgP = fetch(ddgUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return null;
        if (data.AbstractText) return data.AbstractText + (data.AbstractURL ? "\n\nSource: " + data.AbstractURL : "");
        if (data.Answer) return String(data.Answer);
        if (data.Definition) return data.Definition + (data.DefinitionURL ? "\n\nSource: " + data.DefinitionURL : "");
        if (data.RelatedTopics && data.RelatedTopics.length) {
          var bits = [];
          for (var i = 0; i < data.RelatedTopics.length && bits.length < 3; i++) {
            var t = data.RelatedTopics[i];
            if (t.Text) bits.push("• " + t.Text);
            else if (t.Topics && t.Topics[0] && t.Topics[0].Text) bits.push("• " + t.Topics[0].Text);
          }
          if (bits.length) return "Here's related information I found:\n" + bits.join("\n");
        }
        return null;
      })
      .catch(function () { return null; });

    return Promise.all([wikiP, ddgP]).then(function (r) { return r[0] || r[1] || null; });
  }

  function remoteAnswer(q) {
    var base = window.CUN_CONFIG && window.CUN_CONFIG.supabaseUrl;
    if (!base) return Promise.resolve(null);
    var endpoint = ((window.CUN_CONFIG && window.CUN_CONFIG.aiEndpoint) || base + "/functions/v1/cun-ai").trim();
    var headers = { "Content-Type": "application/json" };
    if (window.CUN_CONFIG && window.CUN_CONFIG.supabaseAnonKey) headers.apikey = window.CUN_CONFIG.supabaseAnonKey;
    return fetch(endpoint, { method: "POST", headers: headers, body: JSON.stringify({ question: q }) })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { return (data && (data.answer || data.output)) || null; })
      .catch(function () { return null; });
  }

  /** Reasoned general fallback — never use "not yet made public" here */
  function generalReasonedFallback(q) {
    var n = normal(q);
    if (/\b(weather|temperature)\b/.test(n)) {
      return "I don't have live weather sensors here. For current weather, check a weather app or search your city name plus \"weather\". If you tell me the city, I can still try a general web lookup.";
    }
    if (/\b(time|what time|date|today)\b/.test(n)) {
      try {
        return "On your device, the current date/time appears as: " + new Date().toLocaleString() + ". For official university deadlines, always check CUN notices.";
      } catch (e) {
        return "Please check the date and time on your device. For official CUN deadlines, use the university's published notices.";
      }
    }
    if (/\b(math|calculate|plus|minus|\d+\s*[\+\-\*\/]\s*\d+)\b/.test(n)) {
      var m = q.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/x×])\s*(\d+(?:\.\d+)?)/);
      if (m) {
        var a = parseFloat(m[1]), b = parseFloat(m[3]), op = m[2], r;
        if (op === "+") r = a + b;
        else if (op === "-") r = a - b;
        else if (op === "*" || op === "x" || op === "×") r = a * b;
        else if (op === "/") r = b === 0 ? "undefined (division by zero)" : a / b;
        return "That works out to: " + r;
      }
    }
    if (/\b(advice|suggest|recommend|should i)\b/.test(n)) {
      return "I can share general thoughts, but for personal academic or financial decisions you should confirm with CUN staff or a qualified adviser. Tell me more about what you're deciding and I'll help you think it through.";
    }
    return (
      "I understood your message, but I couldn't find a solid published answer for it just now.\n\n" +
      "You can:\n" +
      "• Rephrase with more detail\n" +
      "• Ask about CUN (admissions, programmes, location, portals)\n" +
      "• Ask a general knowledge question (I'll try the web)\n\n" +
      "What would you like to try next?"
    );
  }

  /**
   * Main reasoning pipeline
   */
  async function answerQuestion(q) {
    var n = normal(q);
    if (!n) return "Please type a message and I'll respond.";

    /* 1) Developer follow-up state */
    var flow = handleDeveloperFlow(n);
    if (flow) return flow;

    /* 2) Social / conversational — NEVER "not yet made public" */
    if (isGreeting(n)) return greetReply(n);
    var talk = smallTalk(n);
    if (talk) return talk;

    /* 3) Developer identity */
    if (isDeveloperQuestion(n)) return developerIntro();

    /* 4) School knowledge */
    var local = localCunAnswer(q);
    if (local) return local;

    /* 5) Optional server AI */
    try {
      var remote = await remoteAnswer(q);
      if (remote) return remote;
    } catch (e) {}

    /* 6) Web search for non-trivial questions */
    if (n.split(" ").length >= 1 && n.length >= 3) {
      try {
        var web = await webSearch(q);
        if (web) return web;
        /* Try shortened query (first 6 words) */
        var short = q.trim().split(/\s+/).slice(0, 6).join(" ");
        if (short !== q.trim()) {
          web = await webSearch(short);
          if (web) return web;
        }
      } catch (e) {}
    }

    /* 7) School-shaped question with no data → official phrase */
    if (isSchoolQuestion(n)) {
      return "It's not yet made public.";
    }

    /* 8) Everything else — reasoned conversational fallback */
    return generalReasonedFallback(q);
  }

  document.querySelectorAll(".ai-prompt[data-question]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-question") || "";
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  });

  add(
    "assistant",
    "Hi! I'm the CUN AI Concierge. I can chat, answer questions about Canadian University of Nigeria, look up general knowledge online, and tell you who built this platform if you ask. How can I help?"
  );

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var q = (input.value || "").trim();
    if (!q) return;
    input.value = "";
    add("user", q);

    var send = form.querySelector('button[type="submit"]');
    if (send) {
      send.disabled = true;
      send.textContent = "Thinking…";
    }

    var typing = document.createElement("div");
    typing.className = "ai-msg bot ai-message assistant";
    typing.id = "ai-typing";
    typing.textContent = "Thinking…";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    var answer;
    try {
      answer = await answerQuestion(q);
    } catch (err) {
      answer = generalReasonedFallback(q);
    }

    var tip = document.getElementById("ai-typing");
    if (tip) tip.remove();
    add("assistant", answer || generalReasonedFallback(q));

    if (send) {
      send.disabled = false;
      send.textContent = "Ask CUN";
    }
    input.focus();
  });
})();
