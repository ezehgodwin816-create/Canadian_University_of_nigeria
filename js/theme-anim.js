/* CUN Floating AI + Theme controls + scroll animations
   - Right-side floating buttons
   - Long-press (~700ms) shows "Hide for now"
   - Hide lasts only for the current session (sessionStorage)
   - Full page refresh brings them back
*/
(function () {
  'use strict';

  // ---------- Scroll-in animations ----------
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

  // ---------- Theme helper ----------
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('cun-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('cun-theme', '');
    }
    // Update floating theme icon if present
    var ft = document.getElementById('cun-fab-theme');
    if (ft) ft.textContent = theme === 'light' ? '☾' : '☀';
  }

  // Restore saved theme
  var savedTheme = localStorage.getItem('cun-theme');
  if (savedTheme === 'light') applyTheme('light');

  // Header theme button (if still present)
  var headerThemeBtn = document.getElementById('theme-toggle');
  if (headerThemeBtn) {
    headerThemeBtn.addEventListener('click', function () {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      applyTheme(isLight ? 'dark' : 'light');
    });
  }

  // ---------- Floating controls ----------
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

  function createFabs() {
    if (document.getElementById('cun-fab-stack')) return; // already exists

    var stack = document.createElement('div');
    stack.id = 'cun-fab-stack';
    stack.className = 'cun-fab-stack';
    stack.setAttribute('aria-label', 'Quick controls');

    // Theme FAB
    var themeFab = document.createElement('button');
    themeFab.id = 'cun-fab-theme';
    themeFab.className = 'cun-fab cun-fab-theme';
    themeFab.type = 'button';
    themeFab.setAttribute('aria-label', 'Toggle light / dark theme');
    themeFab.title = 'Theme';
    themeFab.textContent = document.documentElement.getAttribute('data-theme') === 'light' ? '☾' : '☀';

    // AI FAB
    var aiFab = document.createElement('button');
    aiFab.id = 'cun-fab-ai';
    aiFab.className = 'cun-fab cun-fab-ai';
    aiFab.type = 'button';
    aiFab.setAttribute('aria-label', 'Open AI Concierge');
    aiFab.title = 'AI Concierge';
    aiFab.innerHTML = '✦';

    // Shared long-press menu
    var menu = document.createElement('div');
    menu.className = 'cun-fab-menu';
    menu.id = 'cun-fab-menu';
    menu.innerHTML =
      '<button type="button" data-action="hide">Hide for now</button>' +
      '<button type="button" data-action="close">Cancel</button>';

    stack.appendChild(themeFab);
    stack.appendChild(aiFab);
    stack.appendChild(menu);
    document.body.appendChild(stack);

    if (isHidden()) {
      themeFab.classList.add('hidden-fab');
      aiFab.classList.add('hidden-fab');
    }

    // --- Click handlers ---
    themeFab.addEventListener('click', function (e) {
      if (themeFab._longPressed) { themeFab._longPressed = false; return; }
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      applyTheme(isLight ? 'dark' : 'light');
    });

    aiFab.addEventListener('click', function (e) {
      if (aiFab._longPressed) { aiFab._longPressed = false; return; }
      window.location.href = 'ai-assistant.html';
    });

    // --- Long-press logic ---
    var longPressTimer = null;
    var LONG_MS = 700;

    function startLongPress(btn, e) {
      btn._longPressed = false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(function () {
        btn._longPressed = true;
        // Position menu near the pressed button
        var rect = btn.getBoundingClientRect();
        var stackRect = stack.getBoundingClientRect();
        menu.style.bottom = (stackRect.bottom - rect.bottom) + 'px';
        menu.classList.add('open');
        // Haptic feedback if available
        if (navigator.vibrate) try { navigator.vibrate(30); } catch (err) {}
      }, LONG_MS);
    }

    function cancelLongPress() {
      clearTimeout(longPressTimer);
    }

    [themeFab, aiFab].forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { if (e.button === 0) startLongPress(btn, e); });
      btn.addEventListener('touchstart', function (e) { startLongPress(btn, e); }, { passive: true });
      btn.addEventListener('mouseup', cancelLongPress);
      btn.addEventListener('mouseleave', cancelLongPress);
      btn.addEventListener('touchend', cancelLongPress);
      btn.addEventListener('touchcancel', cancelLongPress);
    });

    // Menu actions
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

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!stack.contains(e.target)) menu.classList.remove('open');
    });
    document.addEventListener('touchstart', function (e) {
      if (!stack.contains(e.target)) menu.classList.remove('open');
    }, { passive: true });
  }

  // Create on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFabs);
  } else {
    createFabs();
  }
})();
