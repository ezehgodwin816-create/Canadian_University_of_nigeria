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


function enhanceGlobalNavigation() {
  const nav = document.querySelector('.main-nav');
  if (nav && !nav.dataset.enhanced) {
    nav.dataset.enhanced = 'true';
    nav.innerHTML = `
      <div class="nav-item has-menu"><a href="about.html" class="nav-link">About <span aria-hidden="true">⌄</span></a><div class="nav-mega" role="menu">
        <a href="about.html">University Overview</a><a href="history.html">History</a><a href="leadership.html">Leadership</a><a href="governance.html">Governance</a><a href="accreditation.html">Accreditation</a><a href="directory.html">Directory</a>
      </div></div>
      <div class="nav-item has-menu"><a href="academics.html" class="nav-link">Academics <span aria-hidden="true">⌄</span></a><div class="nav-mega" role="menu">
        <a href="academics.html">Academic Overview</a><a href="programmes.html">Programmes</a><a href="faculties.html">Faculties</a><a href="departments.html">Departments</a><a href="academic-calendar.html">Academic Calendar</a><a href="library.html">Library</a><a href="research.html">Research</a>
      </div></div>
      <div class="nav-item has-menu"><a href="admissions.html" class="nav-link">Admissions <span aria-hidden="true">⌄</span></a><div class="nav-mega" role="menu">
        <a href="admissions.html">Admissions Overview</a><a href="undergraduate-admissions.html">Undergraduate</a><a href="postgraduate-admissions.html">Postgraduate</a><a href="international-admissions.html">International</a><a href="admission-requirements.html">Requirements</a><a href="how-to-apply.html">How to Apply</a><a href="fees.html">Fees</a><a href="application-status.html">Check Status</a>
      </div></div>
      <div class="nav-item"><a href="research.html" class="nav-link">Research</a></div>
      <div class="nav-item has-menu"><a href="student-life.html" class="nav-link">Campus Life <span aria-hidden="true">⌄</span></a><div class="nav-mega" role="menu">
        <a href="student-life.html">Campus Life</a><a href="accommodation.html">Accommodation</a><a href="clubs.html">Clubs & Societies</a><a href="sports.html">Sports</a><a href="health.html">Health Services</a><a href="student-support.html">Student Support</a>
      </div></div>
      <div class="nav-item has-menu"><a href="news.html" class="nav-link">News & Events <span aria-hidden="true">⌄</span></a><div class="nav-mega" role="menu">
        <a href="news.html">News</a><a href="events.html">Events</a><a href="gallery.html">Gallery</a><a href="downloads.html">Document Centre</a><a href="faq.html">FAQs</a>
      </div></div>
      <div class="nav-item"><a href="contact.html" class="nav-link">Contact</a></div>`;
  }
  const mobile = document.querySelector('.mobile-nav');
  if (mobile && !mobile.dataset.enhanced) {
    mobile.dataset.enhanced='true';
    mobile.innerHTML=`<a href="about.html">About</a><a href="academics.html">Academics</a><a href="admissions.html">Admissions</a><a href="programmes.html">Programmes</a><a href="faculties.html">Faculties</a><a href="research.html">Research</a><a href="student-life.html">Campus Life</a><a href="news.html">News</a><a href="events.html">Events</a><a href="library.html">Library</a><a href="contact.html">Contact</a><a href="login.html">Portals</a><a href="apply.html" class="btn btn-accent" style="margin-top:1rem;text-align:center">Apply Now</a>`;
  }
  document.querySelectorAll('.has-menu > .nav-link').forEach(link=>{
    link.setAttribute('aria-haspopup','true');
    link.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();link.parentElement.classList.toggle('open')}});
  });
}

document.addEventListener('DOMContentLoaded', enhanceGlobalNavigation);
window.enhanceGlobalNavigation=enhanceGlobalNavigation;
