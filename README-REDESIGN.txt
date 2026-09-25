CUN WEBSITE REDESIGN — Neuro-Futuristic Theme (Updated)
=======================================================

This zip contains ONLY the files you need to replace/upload on GitHub Pages.

FILES TO UPLOAD / REPLACE
-------------------------
css/style.css          ← full dark futuristic design + floating button styles
css/responsive.css     ← mobile-first, NO horizontal scroll/swipe
index.html             ← redesigned homepage + floating controls script
login.html             ← Student + Staff portal tabs
js/theme-anim.js       ← floating AI + Theme buttons + scroll animations
assets/logo.svg
assets/favicon.svg
assets/images/*.jpg    ← optimised open images

FLOATING AI + THEME BUTTONS (right side)
----------------------------------------
• Two circular floating buttons appear on the bottom-right of the page.
• AI button (✦) → opens AI Concierge.
• Theme button (☀ / ☾) → toggles light / dark mode.
• LONG-PRESS (hold ~0.7 seconds) on either button → small menu appears:
    “Hide for now”  – hides both buttons for the current browser session
    “Cancel”
• After hide, a full page REFRESH brings the buttons back (sessionStorage only).
• Smooth entrance animation and pulse on the AI button.
• Works on mobile (touch long-press) and desktop (mouse hold).

HOW TO INSTALL
--------------
1. Unzip this archive.
2. In your GitHub repo replace the matching files.
3. Commit & push.

To enable floating buttons on OTHER pages (optional but recommended):
  Add this line before </body> on any page:
  <script src="js/theme-anim.js" defer></script>

WHAT STAYED THE SAME
--------------------
• All page links, forms, application flow, portals, AI assistant logic
• No backend or workflow changes

NOTES
-----
• Hard-refresh (Ctrl+Shift+R) after upload if cache shows old design.
• Images are medium quality for fast loading.
