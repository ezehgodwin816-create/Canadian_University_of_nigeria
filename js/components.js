/**
 * Shared UI components: Toast, Modal, Mobile menu, Header helpers
 */

const Toast = {
  container: null,
  ensure() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.setAttribute("aria-live", "polite");
      document.body.appendChild(this.container);
    }
  },
  show(message, type = "info", duration = 4000) {
    this.ensure();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<div style="flex:1">${message}</div><button aria-label="Close" style="opacity:0.6;font-size:1.2rem">&times;</button>`;
    el.querySelector("button").onclick = () => el.remove();
    this.container.appendChild(el);
    setTimeout(() => el.remove(), duration);
  },
  success(msg) { this.show(msg, "success"); },
  error(msg) { this.show(msg, "error"); },
  warning(msg) { this.show(msg, "warning"); },
  info(msg) { this.show(msg, "info"); }
};

const Modal = {
  open(title, bodyHtml, footerHtml = "") {
    let overlay = document.getElementById("cun-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "cun-modal";
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 id="modal-title"></h3>
            <button class="btn btn-ghost" id="modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) this.close(); });
      document.getElementById("modal-close").onclick = () => this.close();
    }
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = bodyHtml;
    document.getElementById("modal-footer").innerHTML = footerHtml;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  },
  close() {
    const overlay = document.getElementById("cun-modal");
    if (overlay) {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  }
};

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  const closeBtn = document.querySelector(".mobile-menu-close");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => menu.classList.add("open"));
  if (closeBtn) closeBtn.addEventListener("click", () => menu.classList.remove("open"));
  menu.addEventListener("click", (e) => { if (e.target === menu) menu.classList.remove("open"); });
}

function initHeaderSearch() {
  const btn = document.querySelector(".search-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      window.location.href = "search.html";
    });
  }
}

function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .mobile-nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initHeaderSearch();
  setActiveNav();
});

window.Toast = Toast;
window.Modal = Modal;
