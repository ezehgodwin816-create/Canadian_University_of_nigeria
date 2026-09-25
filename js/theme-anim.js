/* CUN Floating AI + Theme controls + scroll animations
   Works with static HTML in the page OR creates the buttons if missing.
   Long-press (~700ms) shows "Hide for now".
   Hide uses sessionStorage — full page refresh brings buttons back.
*/
(function () {
  'use strict';

  // ---- Scroll-in animations ----
  if ('IntersectionObserver' in window) {
    var els = document.querySelectorAll('.animate-in, .feature-card, .info-card, .programme-card, .news-card');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
      io.observe(el);
    });
  }

  // ---- Theme helper ----
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      try { localStorage.setItem('cun-theme', 'light'); } catch (e) {}
    } else {
      root.removeAttribute('data-theme');
      try { localStorage.setItem('cun-theme', ''); } catch (e) {}
    }
    var ft = document.getElementById('cun-fab-theme');
    if (ft) ft.textContent = theme === 'light' ? '\u263E' : '\u2600';
  }

  try {
    if (localStorage.getItem('cun-theme') === 'light') applyTheme('light');
  } catch (e) {}

  var headerThemeBtn = document.getElementById('theme-toggle');
  if (headerThemeBtn) {
    headerThemeBtn.addEventListener('click', function () {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      applyTheme(isLight ? 'dark' : 'light');
    });
  }

  // ---- Floating controls ----
  var HIDE_KEY = 'cun-fabs-hidden';

  function isHidden() {
    try { return sessionStorage.getItem(HIDE_KEY) === '1'; } catch (e) { return false; }
  }
  function setHidden(val) {
    try {
      if (val) sessionStorage.setItem(HIDE_KEY, '1');
      else sessionStorage.removeItem(HIDE_KEY);
    } catch (e) {}
  }

  function ensureFabs() {
    var stack = document.getElementById('cun-fab-stack');
    var themeFab = document.getElementById('cun-fab-theme');
    var aiFab = document.getElementById('cun-fab-ai');
    var menu = document.getElementById('cun-fab-menu');

    // Create if missing
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'cun-fab-stack';
      stack.className = 'cun-fab-stack';
      stack.setAttribute('aria-label', 'Quick controls');
      document.body.appendChild(stack);
    }
    if (!themeFab) {
      themeFab = document.createElement('button');
      themeFab.id = 'cun-fab-theme';
      themeFab.className = 'cun-fab cun-fab-theme';
      themeFab.type = 'button';
      themeFab.setAttribute('aria-label', 'Toggle light / dark theme');
      themeFab.title = 'Theme (long-press to hide)';
      themeFab.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '\u263E' : '\u2600';
      stack.insertBefore(themeFab, stack.firstChild);
    }
    if (!aiFab) {
      aiFab = document.createElement('button');
      aiFab.id = 'cun-fab-ai';
      aiFab.className = 'cun-fab cun-fab-ai';
      aiFab.type = 'button';
      aiFab.setAttribute('aria-label', 'Open AI Concierge');
      aiFab.title = 'AI Concierge (long-press to hide)';
      aiFab.textContent = '\u2726';
      stack.appendChild(aiFab);
    }
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'cun-fab-menu';
      menu.id = 'cun-fab-menu';
      menu.innerHTML =
        '<button type="button" data-action="hide">Hide for now</button>' +
        '<button type="button" data-action="close">Cancel</button>';
      stack.appendChild(menu);
    }

    // Always make sure classes are correct
    themeFab.className = 'cun-fab cun-fab-theme';
    aiFab.className = 'cun-fab cun-fab-ai';
    stack.className = 'cun-fab-stack';

    // Restore visibility from session
    if (isHidden()) {
      themeFab.classList.add('hidden-fab');
      aiFab.classList.add('hidden-fab');
    } else {
      themeFab.classList.remove('hidden-fab');
      aiFab.classList.remove('hidden-fab');
    }

    // Avoid double-binding
    if (stack._cunBound) return;
    stack._cunBound = true;

    themeFab.addEventListener('click', function () {
      if (themeFab._longPressed) { themeFab._longPressed = false; return; }
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      applyTheme(isLight ? 'dark' : 'light');
    });

    aiFab.addEventListener('click', function () {
      if (aiFab._longPressed) { aiFab._longPressed = false; return; }
      window.location.href = 'ai-assistant.html';
    });

    var longPressTimer = null;
    var LONG_MS = 700;

    function startLongPress(btn) {
      btn._longPressed = false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(function () {
        btn._longPressed = true;
        var rect = btn.getBoundingClientRect();
        var stackRect = stack.getBoundingClientRect();
        menu.style.bottom = (stackRect.bottom - rect.bottom) + 'px';
        menu.classList.add('open');
        if (navigator.vibrate) {
          try { navigator.vibrate(30); } catch (err) {}
        }
      }, LONG_MS);
    }

    function cancelLongPress() {
      clearTimeout(longPressTimer);
    }

    [themeFab, aiFab].forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        if (e.button === 0) startLongPress(btn);
      });
      btn.addEventListener('touchstart', function () {
        startLongPress(btn);
      }, { passive: true });
      btn.addEventListener('mouseup', cancelLongPress);
      btn.addEventListener('mouseleave', cancelLongPress);
      btn.addEventListener('touchend', cancelLongPress);
      btn.addEventListener('touchcancel', cancelLongPress);
    });

    menu.addEventListener('click', function (e) {
      var action = e.target.getAttribute('data-action');
      if (action === 'hide') {
        themeFab.classList.add('hidden-fab');
        aiFab.classList.add('hidden-fab');
        setHidden(true);
        menu.classList.remove('open');
      } else if (action === 'close') {
        menu.classList.remove('open');
      }
    });

    document.addEventListener('click', function (e) {
      if (!stack.contains(e.target)) menu.classList.remove('open');
    });
    document.addEventListener('touchstart', function (e) {
      if (!stack.contains(e.target)) menu.classList.remove('open');
    }, { passive: true });
  }

  function init() {
    ensureFabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Extra safety for slow loads / partial HTML
  setTimeout(init, 200);
  setTimeout(init, 800);
})();
