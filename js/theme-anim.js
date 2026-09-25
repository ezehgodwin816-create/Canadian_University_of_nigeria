/* CUN Floating AI + Theme/Settings panel
   Theme button opens options: Dark (Normal) | Gray | Light
   + Text size reduction + Hide controls
   Hide uses sessionStorage — refresh brings buttons back
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

  // ---- Theme + text helpers ----
  function applyTheme(theme) {
    var root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'light' || theme === 'gray') {
      root.setAttribute('data-theme', theme);
    }
    try { localStorage.setItem('cun-theme', theme || 'dark'); } catch (e) {}
    updateThemeButtons(theme || 'dark');
    updateThemeIcon(theme || 'dark');
  }

  function applyTextSize(size) {
    var root = document.documentElement;
    root.classList.remove('cun-text-sm');
    if (size === 'sm') root.classList.add('cun-text-sm');
    try { localStorage.setItem('cun-text-size', size || 'normal'); } catch (e) {}
    updateTextButtons(size || 'normal');
  }

  function updateThemeIcon(theme) {
    var ft = document.getElementById('cun-fab-theme');
    if (!ft) return;
    if (theme === 'light') ft.textContent = '\u263E';
    else if (theme === 'gray') ft.textContent = '\u25D1';
    else ft.textContent = '\u2600';
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll('[data-theme-opt]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme-opt') === theme);
    });
  }

  function updateTextButtons(size) {
    document.querySelectorAll('[data-text-opt]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-text-opt') === size);
    });
  }

  // Restore saved preferences
  try {
    var savedTheme = localStorage.getItem('cun-theme') || 'dark';
    if (savedTheme === 'light' || savedTheme === 'gray') applyTheme(savedTheme);
    else applyTheme('dark');
    var savedText = localStorage.getItem('cun-text-size') || 'normal';
    if (savedText === 'sm') applyTextSize('sm');
  } catch (e) {}

  // Header theme button → open same panel if possible, else cycle
  var headerThemeBtn = document.getElementById('theme-toggle');
  if (headerThemeBtn) {
    headerThemeBtn.addEventListener('click', function () {
      var panel = document.getElementById('cun-settings-panel');
      if (panel) {
        panel.classList.toggle('open');
      } else {
        var cur = document.documentElement.getAttribute('data-theme') || 'dark';
        var next = cur === 'dark' ? 'gray' : cur === 'gray' ? 'light' : 'dark';
        applyTheme(next);
      }
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
    var panel = document.getElementById('cun-settings-panel');

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
      themeFab.setAttribute('aria-label', 'Theme and display options');
      themeFab.title = 'Theme & display options';
      themeFab.textContent = '\u2600';
      stack.insertBefore(themeFab, stack.firstChild);
    }
    if (!aiFab) {
      aiFab = document.createElement('button');
      aiFab.id = 'cun-fab-ai';
      aiFab.className = 'cun-fab cun-fab-ai';
      aiFab.type = 'button';
      aiFab.setAttribute('aria-label', 'Open AI Concierge');
      aiFab.title = 'AI Concierge';
      aiFab.textContent = '\u2726';
      stack.appendChild(aiFab);
    }

    // Settings panel (replaces simple long-press menu for theme)
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'cun-settings-panel';
      panel.className = 'cun-settings-panel';
      panel.innerHTML =
        '<h4>Theme</h4>' +
        '<div class="opt-group"><div class="cun-settings-row">' +
          '<button type="button" class="cun-settings-btn" data-theme-opt="dark">Normal</button>' +
          '<button type="button" class="cun-settings-btn" data-theme-opt="gray">Gray</button>' +
          '<button type="button" class="cun-settings-btn" data-theme-opt="light">Light</button>' +
        '</div></div>' +
        '<h4>Text size</h4>' +
        '<div class="opt-group"><div class="cun-settings-row">' +
          '<button type="button" class="cun-settings-btn" data-text-opt="normal">Normal</button>' +
          '<button type="button" class="cun-settings-btn" data-text-opt="sm">Smaller</button>' +
        '</div></div>' +
        '<div class="cun-settings-divider"></div>' +
        '<button type="button" class="cun-settings-action danger" data-action="hide">Hide buttons</button>' +
        '<button type="button" class="cun-settings-action" data-action="close">Close</button>';
      stack.appendChild(panel);
    }

    // Keep old long-press menu for AI only (optional)
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'cun-fab-menu';
      menu.id = 'cun-fab-menu';
      menu.innerHTML =
        '<button type="button" data-action="hide">Hide for now</button>' +
        '<button type="button" data-action="close">Cancel</button>';
      stack.appendChild(menu);
    }

    themeFab.className = 'cun-fab cun-fab-theme';
    aiFab.className = 'cun-fab cun-fab-ai';
    stack.className = 'cun-fab-stack';

    if (isHidden()) {
      themeFab.classList.add('hidden-fab');
      aiFab.classList.add('hidden-fab');
    } else {
      themeFab.classList.remove('hidden-fab');
      aiFab.classList.remove('hidden-fab');
    }

    // Sync active states
    var curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeButtons(curTheme);
    updateThemeIcon(curTheme);
    var curText = document.documentElement.classList.contains('cun-text-sm') ? 'sm' : 'normal';
    updateTextButtons(curText);

    if (stack._cunBound) return;
    stack._cunBound = true;

    // Theme FAB → open settings panel
    themeFab.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.remove('open');
      panel.classList.toggle('open');
    });

    // AI FAB → go to AI page (short click) or long-press hide menu
    aiFab.addEventListener('click', function () {
      if (aiFab._longPressed) { aiFab._longPressed = false; return; }
      window.location.href = 'ai-assistant.html';
    });

    // Panel option clicks
    panel.addEventListener('click', function (e) {
      var t = e.target;
      var themeOpt = t.getAttribute('data-theme-opt');
      var textOpt = t.getAttribute('data-text-opt');
      var action = t.getAttribute('data-action');

      if (themeOpt) {
        applyTheme(themeOpt);
      } else if (textOpt) {
        applyTextSize(textOpt);
      } else if (action === 'hide') {
        themeFab.classList.add('hidden-fab');
        aiFab.classList.add('hidden-fab');
        setHidden(true);
        panel.classList.remove('open');
      } else if (action === 'close') {
        panel.classList.remove('open');
      }
    });

    // Long-press on AI for hide menu
    var longPressTimer = null;
    var LONG_MS = 700;

    function startLongPress(btn) {
      btn._longPressed = false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(function () {
        btn._longPressed = true;
        panel.classList.remove('open');
        var rect = btn.getBoundingClientRect();
        var stackRect = stack.getBoundingClientRect();
        menu.style.bottom = (stackRect.bottom - rect.bottom) + 'px';
        menu.classList.add('open');
        if (navigator.vibrate) {
          try { navigator.vibrate(30); } catch (err) {}
        }
      }, LONG_MS);
    }
    function cancelLongPress() { clearTimeout(longPressTimer); }

    aiFab.addEventListener('mousedown', function (e) {
      if (e.button === 0) startLongPress(aiFab);
    });
    aiFab.addEventListener('touchstart', function () { startLongPress(aiFab); }, { passive: true });
    aiFab.addEventListener('mouseup', cancelLongPress);
    aiFab.addEventListener('mouseleave', cancelLongPress);
    aiFab.addEventListener('touchend', cancelLongPress);
    aiFab.addEventListener('touchcancel', cancelLongPress);

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

    // Close panels when clicking outside
    document.addEventListener('click', function (e) {
      if (!stack.contains(e.target)) {
        panel.classList.remove('open');
        menu.classList.remove('open');
      }
    });
    document.addEventListener('touchstart', function (e) {
      if (!stack.contains(e.target)) {
        panel.classList.remove('open');
        menu.classList.remove('open');
      }
    }, { passive: true });
  }

  function init() { ensureFabs(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 200);
  setTimeout(init, 800);
})();
