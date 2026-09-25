/* CUN Floating Theme + AI — smooth, touch-friendly */
(function () {
  'use strict';

  // ---- Light scroll-in (no layout jump) ----
  if ('IntersectionObserver' in window) {
    var els = document.querySelectorAll('.feature-card, .info-card, .programme-card, .news-card, .quick-action');
    if (els.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      els.forEach(function (el) {
        el.classList.add('will-reveal');
        io.observe(el);
      });
    }
  }

  // ---- Theme / text ----
  function applyTheme(theme) {
    var root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'light' || theme === 'gray') root.setAttribute('data-theme', theme);
    try { localStorage.setItem('cun-theme', theme || 'dark'); } catch (e) {}
    syncThemeUI(theme || 'dark');
  }

  function applyTextSize(size) {
    document.documentElement.classList.toggle('cun-text-sm', size === 'sm');
    try { localStorage.setItem('cun-text-size', size || 'normal'); } catch (e) {}
    document.querySelectorAll('[data-text-opt]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-text-opt') === (size || 'normal'));
    });
  }

  function syncThemeUI(theme) {
    var ft = document.getElementById('cun-fab-theme');
    if (ft) {
      ft.textContent = theme === 'light' ? '\u263E' : theme === 'gray' ? '\u25D1' : '\u2600';
    }
    document.querySelectorAll('[data-theme-opt]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-opt') === theme);
    });
  }

  try {
    var st = localStorage.getItem('cun-theme') || 'dark';
    applyTheme(st === 'light' || st === 'gray' ? st : 'dark');
    if (localStorage.getItem('cun-text-size') === 'sm') applyTextSize('sm');
  } catch (e) {}

  var HIDE_KEY = 'cun-fabs-hidden';
  function isHidden() {
    try { return sessionStorage.getItem(HIDE_KEY) === '1'; } catch (e) { return false; }
  }
  function setHidden(v) {
    try { v ? sessionStorage.setItem(HIDE_KEY, '1') : sessionStorage.removeItem(HIDE_KEY); } catch (e) {}
  }

  function buildFabs() {
    var stack = document.getElementById('cun-fab-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'cun-fab-stack';
      stack.className = 'cun-fab-stack';
      stack.setAttribute('aria-label', 'Quick controls');
      document.body.appendChild(stack);
    }

    var themeFab = document.getElementById('cun-fab-theme');
    if (!themeFab) {
      themeFab = document.createElement('button');
      themeFab.id = 'cun-fab-theme';
      themeFab.type = 'button';
      themeFab.className = 'cun-fab cun-fab-theme';
      themeFab.setAttribute('aria-label', 'Theme and display options');
      themeFab.title = 'Theme & display';
      themeFab.innerHTML = '<span class="cun-fab-icon">\u2600</span>';
      stack.appendChild(themeFab);
    }

    var aiFab = document.getElementById('cun-fab-ai');
    if (!aiFab) {
      aiFab = document.createElement('button');
      aiFab.id = 'cun-fab-ai';
      aiFab.type = 'button';
      aiFab.className = 'cun-fab cun-fab-ai';
      aiFab.setAttribute('aria-label', 'Open AI Concierge');
      aiFab.title = 'AI Concierge';
      aiFab.innerHTML = '<span class="cun-fab-icon">\u2726</span>';
      stack.appendChild(aiFab);
    }

    // Settings panel as SIBLING of theme button (not child) — fixes tap blocking
    var panel = document.getElementById('cun-settings-panel');
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

    var menu = document.getElementById('cun-fab-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'cun-fab-menu';
      menu.className = 'cun-fab-menu';
      menu.innerHTML =
        '<button type="button" data-action="hide">Hide for now</button>' +
        '<button type="button" data-action="close">Cancel</button>';
      stack.appendChild(menu);
    }

    // Order: Theme, AI (panel/menu are absolute so order among fabs matters)
    stack.appendChild(themeFab);
    stack.appendChild(aiFab);
    stack.appendChild(panel);
    stack.appendChild(menu);

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

    var cur = document.documentElement.getAttribute('data-theme') || 'dark';
    syncThemeUI(cur);
    applyTextSize(document.documentElement.classList.contains('cun-text-sm') ? 'sm' : 'normal');

    if (stack._bound) return;
    stack._bound = true;

    function closeAll() {
      panel.classList.remove('open');
      menu.classList.remove('open');
    }

    function openPanel() {
      menu.classList.remove('open');
      panel.classList.add('open');
    }

    // THEME TAP — pointer events work for mouse + touch
    function onThemeActivate(e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.classList.contains('open')) closeAll();
      else openPanel();
    }
    themeFab.addEventListener('click', onThemeActivate);
    themeFab.addEventListener('touchend', function (e) {
      // prevent ghost click
      e.preventDefault();
      onThemeActivate(e);
    }, { passive: false });

    // Panel options
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var t = e.target.closest('[data-theme-opt], [data-text-opt], [data-action]');
      if (!t) return;
      var themeOpt = t.getAttribute('data-theme-opt');
      var textOpt = t.getAttribute('data-text-opt');
      var action = t.getAttribute('data-action');
      if (themeOpt) applyTheme(themeOpt);
      else if (textOpt) applyTextSize(textOpt);
      else if (action === 'hide') {
        themeFab.classList.add('hidden-fab');
        aiFab.classList.add('hidden-fab');
        setHidden(true);
        closeAll();
      } else if (action === 'close') closeAll();
    });

    // AI: short tap = navigate, long press = hide menu
    var longTimer = null;
    var longFired = false;
    function clearLong() { clearTimeout(longTimer); }

    aiFab.addEventListener('pointerdown', function () {
      longFired = false;
      clearLong();
      longTimer = setTimeout(function () {
        longFired = true;
        panel.classList.remove('open');
        menu.classList.add('open');
        if (navigator.vibrate) try { navigator.vibrate(20); } catch (err) {}
      }, 650);
    });
    aiFab.addEventListener('pointerup', function (e) {
      clearLong();
      if (longFired) { longFired = false; return; }
      if (menu.classList.contains('open')) return;
      window.location.href = 'ai-assistant.html';
    });
    aiFab.addEventListener('pointerleave', clearLong);
    aiFab.addEventListener('pointercancel', clearLong);

    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      var action = e.target.getAttribute('data-action');
      if (action === 'hide') {
        themeFab.classList.add('hidden-fab');
        aiFab.classList.add('hidden-fab');
        setHidden(true);
        closeAll();
      } else if (action === 'close') closeAll();
    });

    // Close when tapping outside
    document.addEventListener('click', function (e) {
      if (!stack.contains(e.target)) closeAll();
    });
    document.addEventListener('touchstart', function (e) {
      if (!stack.contains(e.target)) closeAll();
    }, { passive: true });
  }

  function start() {
    if (document.body) buildFabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  // one safety retry only
  setTimeout(start, 400);
})();
