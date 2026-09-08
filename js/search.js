/**
 * Site-wide search (demo, client-side)
 */

function performSearch(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const data = window.CUN_DATA || {};

  // Programmes
  (data.programmes || []).forEach((p) => {
    if (p.name.toLowerCase().includes(q) || (p.overview || "").toLowerCase().includes(q)) {
      results.push({ type: "Programme", title: p.name, url: `programme.html?id=${p.id}`, excerpt: p.overview?.slice(0, 120) + "..." });
    }
  });

  // News
  (data.news || []).forEach((n) => {
    if (n.title.toLowerCase().includes(q) || (n.excerpt || "").toLowerCase().includes(q)) {
      results.push({ type: "News", title: n.title, url: `news-detail.html?id=${n.id}`, excerpt: n.excerpt });
    }
  });

  // Events
  (data.events || []).forEach((e) => {
    if (e.title.toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q)) {
      results.push({ type: "Event", title: e.title, url: `event-detail.html?id=${e.id}`, excerpt: e.description?.slice(0, 120) });
    }
  });

  // FAQs
  (data.faqs || []).forEach((f) => {
    if (f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)) {
      results.push({ type: "FAQ", title: f.q, url: "faq.html", excerpt: f.a.slice(0, 120) });
    }
  });

  // Static pages (basic)
  const pages = [
    { title: "About CUN", url: "about.html", keywords: "about mission vision" },
    { title: "Admissions", url: "admissions.html", keywords: "apply admission undergraduate postgraduate" },
    { title: "Programmes", url: "programmes.html", keywords: "courses degrees programmes" },
    { title: "Student Life", url: "student-life.html", keywords: "campus clubs sports" },
    { title: "Contact", url: "contact.html", keywords: "contact email phone" },
    { title: "Library", url: "library.html", keywords: "library books research" },
    { title: "Research", url: "research.html", keywords: "research centres innovation" }
  ];
  pages.forEach((p) => {
    if (p.title.toLowerCase().includes(q) || p.keywords.includes(q)) {
      results.push({ type: "Page", title: p.title, url: p.url, excerpt: "University page" });
    }
  });

  return results;
}

window.performSearch = performSearch;
