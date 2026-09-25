/**
 * CUN AI Concierge
 * - Answers from published CUN site data
 * - Web search (Wikipedia + DuckDuckGo Instant Answer) for general questions
 * - If nothing found: "It's not yet made public."
 * - Developer identity flow for Mr Ezeh Godwin Chukwunonso
 */
(function () {
  "use strict";

  var messages = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");
  if (!messages || !form || !input) return;

  /* Conversation state for developer follow-ups */
  var pendingDev = null; /* null | "ask_contact" | "ask_more" */

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
    ["Student Portal", "login.html", "student portal login"],
    ["Staff Portal", "staff-portal.html", "staff portal login"]
  ];

  function normal(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function add(role, text) {
    var el = document.createElement("div");
    /* Support both class names used in CSS */
    el.className = "ai-msg " + (role === "user" ? "user" : "bot") + " ai-message " + role;
    el.style.whiteSpace = "pre-wrap";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function isYes(n) {
    return /^(yes|yeah|yep|yup|sure|ok|okay|please|of course|yea|ya)\b/.test(n) ||
      /\b(yes|sure|please|okay|ok)\b/.test(n);
  }

  function isNo(n) {
    return /^(no|nope|nah|not now|no thanks)\b/.test(n) ||
      /\b(no thanks|not interested)\b/.test(n);
  }

  function isDeveloperQuestion(n) {
    return (
      /\b(who (built|made|created|developed|designed|coded)|developer|who (is|are) (the )?(developer|creator|author)|who developed|who made (this|the) (site|website|web|platform|ai|assistant|concierge))\b/.test(n) ||
      /\b(your (creator|developer|maker|builder)|built by|made by|created by)\b/.test(n) ||
      /\bezeh\b|\bgodwin\b|\bchukwunonso\b/.test(n)
    );
  }

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

  /* ---------- CUN local knowledge ---------- */
  function localCunAnswer(q) {
    var n = normal(q);
    var d = window.CUN_DATA || {};
    var u = d.university || {};
    var faqs = d.faqs || [];

    /* FAQ match */
    for (var i = 0; i < faqs.length; i++) {
      var fq = normal(faqs[i].q);
      var tokens = fq.split(" ").filter(function (t) { return t.length > 3; });
      var hits = tokens.filter(function (t) { return n.indexOf(t) !== -1; }).length;
      if (hits >= 2 || (tokens.length && hits / tokens.length >= 0.5)) {
        return faqs[i].a;
      }
    }

    if (/\b(where|location|located|address|campus|utako|abuja)\b/.test(n) && /\b(cun|university|campus|school)\b/.test(n) || /\bwhere is cun\b/.test(n)) {
      return (
        (u.name || "Canadian University of Nigeria") +
        " is located in Abuja, Federal Capital Territory, Nigeria. " +
        "Public listings identify Utako, Abuja as the campus area. " +
        "For the most current directions, see the Contact page."
      );
    }

    if (/\b(nuc|licence|license|accreditation|recognised|recognized|approved)\b/.test(n)) {
      return (
        "The National Universities Commission (NUC) lists Canadian University of Nigeria, Abuja among Nigeria's private universities and recorded its establishment in 2023. " +
        "Programme-level accreditation should always be confirmed against the current NUC record for the specific programme."
      );
    }

    if (/\b(apply|application|how to apply|admission process)\b/.test(n)) {
      return (
        "You can start or continue an application from the Apply page on this site. " +
        "Select a programme, enter your details, upload required documents and submit. " +
        "You can also track status from the Application Status page after applying. " +
        "Open: apply.html"
      );
    }

    if (/\b(requirement|requirements|utme|direct entry|olevel|o.level|jamb)\b/.test(n)) {
      return (
        "Public launch reports identify undergraduate admission pathways through UTME and Direct Entry. " +
        "Exact subject combinations and cut-offs can change by programme and session. " +
        "Please check Admission Requirements on this site and confirm with the official CUN admissions notice. " +
        "Open: admission-requirements.html"
      );
    }

    if (/\b(programme|programmes|program|programs|course|courses|degree|what can i study)\b/.test(n)) {
      var programmes = d.programmes || [];
      if (programmes.length) {
        return (
          "Publicly reported CUN offerings include programmes in areas such as Health Sciences, Computing, and Management & Social Sciences.\n\n" +
          programmes.slice(0, 12).map(function (x) { return "• " + (x.name || x.title); }).join("\n") +
          (programmes.length > 12 ? "\n…and more on the Programmes page." : "") +
          "\n\nOpen: programmes.html"
        );
      }
      return (
        "Initial public reports list academic areas in Health Sciences, Computing, and Management & Social Sciences. " +
        "See the Programmes page for the current catalogue. Open: programmes.html"
      );
    }

    if (/\b(fee|fees|tuition|payment|how much)\b/.test(n)) {
      return (
        "A complete public fee schedule is not published on this platform, so exact amounts are not listed here. " +
        "It's not yet made public on this site in full detail. " +
        "Please use the official fee statement in your portal or contact Admissions / Bursary. " +
        "See also: fees.html"
      );
    }

    if (/\b(scholarship|scholarships|funding|bursary)\b/.test(n)) {
      return "Scholarship information is summarised on the Scholarships page. Open: scholarships.html — if a specific award is missing there, it's not yet made public.";
    }

    if (/\b(hostel|accommodation|housing|residence)\b/.test(n)) {
      return "Campus accommodation information is on the Accommodation page. Open: accommodation.html";
    }

    if (/\b(contact|phone|email|office hours)\b/.test(n) && !isDeveloperQuestion(n)) {
      return "Use the Contact page for official university contact channels. Open: contact.html";
    }

    if (/\b(portal|login|student portal|staff portal)\b/.test(n)) {
      return "Students and staff can sign in from the Login page. Open: login.html — Student Portal and Staff Portal are available after authentication.";
    }

    if (/\b(about|mission|vision|history|who is cun|what is cun)\b/.test(n)) {
      var name = u.name || "Canadian University of Nigeria";
      var tag = u.tagline || "Where Knowledge Meets Global Excellence";
      return (
        name + " (" + tag + ") is presented on this platform as a private university in " +
        (u.location || "Abuja, Nigeria") +
        ". See About and related pages for mission, vision and institutional information."
      );
    }

    /* Page keyword matches */
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
      var top = matches.slice(0, 3);
      return (
        "Here are the most relevant CUN pages for your question:\n" +
        top.map(function (m) { return "• " + m.title + " — " + m.href; }).join("\n") +
        "\n\nOpen the page for full current details. If something specific is missing there, it's not yet made public."
      );
    }

    return null;
  }

  /* ---------- Web search (CORS-friendly sources) ---------- */
  function webSearch(q) {
    return new Promise(function (resolve) {
      var query = String(q || "").trim();
      if (!query || query.length < 3) {
        resolve(null);
        return;
      }

      var wikiUrl =
        "https://en.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(query.replace(/\s+/g, "_"));

      var ddgUrl =
        "https://api.duckduckgo.com/?q=" +
        encodeURIComponent(query) +
        "&format=json&no_redirect=1&no_html=1&skip_disambig=1";

      var wikiP = fetch(wikiUrl)
        .then(function (r) {
          if (!r.ok) return null;
          return r.json();
        })
        .then(function (data) {
          if (!data) return null;
          if (data.type === "standard" && data.extract) {
            return (
              data.extract +
              (data.content_urls && data.content_urls.desktop
                ? "\n\nSource: " + data.content_urls.desktop.page
                : "\n\nSource: Wikipedia")
            );
          }
          if (data.type === "disambiguation") {
            return "That topic has several meanings on Wikipedia. Try a more specific question.";
          }
          return null;
        })
        .catch(function () {
          return null;
        });

      var ddgP = fetch(ddgUrl)
        .then(function (r) {
          if (!r.ok) return null;
          return r.json();
        })
        .then(function (data) {
          if (!data) return null;
          if (data.AbstractText) {
            return (
              data.AbstractText +
              (data.AbstractURL ? "\n\nSource: " + data.AbstractURL : "")
            );
          }
          if (data.Answer) return String(data.Answer);
          if (data.RelatedTopics && data.RelatedTopics.length) {
            var bits = [];
            for (var i = 0; i < data.RelatedTopics.length && bits.length < 3; i++) {
              var t = data.RelatedTopics[i];
              if (t.Text) bits.push("• " + t.Text);
              else if (t.Topics && t.Topics[0] && t.Topics[0].Text) bits.push("• " + t.Topics[0].Text);
            }
            if (bits.length) return "Related information:\n" + bits.join("\n");
          }
          return null;
        })
        .catch(function () {
          return null;
        });

      Promise.all([wikiP, ddgP]).then(function (results) {
        var answer = results[0] || results[1] || null;
        resolve(answer);
      });
    });
  }

  /* Optional remote Edge Function (if deployed) */
  function remoteAnswer(q) {
    var base = window.CUN_CONFIG && window.CUN_CONFIG.supabaseUrl;
    if (!base) return Promise.resolve(null);
    var endpoint = ((window.CUN_CONFIG && window.CUN_CONFIG.aiEndpoint) || base + "/functions/v1/cun-ai").trim();
    var headers = { "Content-Type": "application/json" };
    if (window.CUN_CONFIG && window.CUN_CONFIG.supabaseAnonKey) {
      headers.apikey = window.CUN_CONFIG.supabaseAnonKey;
    }
    return fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ question: q })
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        return (data && (data.answer || data.output)) || null;
      })
      .catch(function () {
        return null;
      });
  }

  function handleDeveloperFlow(n) {
    if (pendingDev === "ask_contact") {
      if (isYes(n)) return developerContact();
      if (isNo(n)) {
        pendingDev = null;
        return "No problem. If you need his details later, just ask who developed this website.";
      }
      /* unclear — gently re-ask */
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

  async function answerQuestion(q) {
    var n = normal(q);

    /* 1) Ongoing developer follow-up */
    var flow = handleDeveloperFlow(n);
    if (flow) return flow;

    /* 2) Who developed this? */
    if (isDeveloperQuestion(n)) {
      return developerIntro();
    }

    /* 3) CUN local catalogue */
    var local = localCunAnswer(q);
    if (local) return local;

    /* 4) Optional server AI */
    try {
      var remote = await remoteAnswer(q);
      if (remote) return remote;
    } catch (e) {}

    /* 5) Web search */
    try {
      var web = await webSearch(q);
      if (web) return web;
    } catch (e) {}

    /* 6) Honest fallback */
    return "It's not yet made public.";
  }

  /* Suggested prompt buttons */
  document.querySelectorAll(".ai-prompt[data-question]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-question") || "";
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  });

  add(
    "assistant",
    "Welcome to the CUN AI Concierge. Ask me about admissions, programmes, fees, campus life, or general questions. If something is not published yet, I will tell you clearly."
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
    typing.textContent = "Searching for an answer…";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    var answer;
    try {
      answer = await answerQuestion(q);
    } catch (err) {
      answer = "It's not yet made public.";
    }

    var tip = document.getElementById("ai-typing");
    if (tip) tip.remove();

    add("assistant", answer || "It's not yet made public.");

    if (send) {
      send.disabled = false;
      send.textContent = "Ask CUN";
    }
    input.focus();
  });
})();
