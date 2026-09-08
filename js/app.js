/**
 * Core app utilities
 */

function sanitize(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function generateAppNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CUN/${year}/${rand}`;
}

// LocalStorage helpers for demo persistence
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

window.sanitize = sanitize;
window.formatDate = formatDate;
window.getQueryParam = getQueryParam;
window.generateAppNumber = generateAppNumber;
window.Store = Store;
