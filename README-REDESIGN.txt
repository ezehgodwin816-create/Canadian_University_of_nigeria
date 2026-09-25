CUN WEBSITE REDESIGN — Neuro-Futuristic Theme
==============================================

This zip contains ONLY the files you need to replace/upload on GitHub Pages.

FILES TO UPLOAD / REPLACE
-------------------------
css/style.css          ← full new dark futuristic design system
css/responsive.css     ← mobile-first, NO horizontal scroll/swipe
index.html             ← redesigned homepage (hero, features, stats, CTAs)
login.html             ← Student + Staff portal tabs (workflow preserved)
js/theme-anim.js       ← optional smooth scroll animations
assets/logo.svg        ← keep existing or replace
assets/favicon.svg
assets/images/*.jpg    ← optimised open images (Unsplash)

HOW TO INSTALL
--------------
1. Unzip this archive.
2. In your GitHub repo (Canadian_University_of_nigeria), replace the matching files:
   - css/style.css
   - css/responsive.css
   - index.html
   - login.html
   - assets/images/ (add the new jpgs; existing ones are fine too)
   - js/theme-anim.js (optional — add <script src="js/theme-anim.js" defer></script> before </body> if desired)
3. Commit & push. GitHub Pages will update in ~1 minute.

WHAT STAYED THE SAME
--------------------
• All page links, forms, application flow, portals, AI assistant logic
• Auth.js / app.js / components.js behaviour
• staff-portal.html & student-portal.html structure (they pick up new CSS automatically)
• No backend or workflow changes

WHAT CHANGED (DESIGN ONLY)
--------------------------
• Dark NeuroAI-inspired theme (deep navy + cyan/purple neon)
• Smooth transitions, hover glows, floating hero orb
• Theme toggle (light/dark) on homepage
• Mobile: overflow-x locked, no left-right swipe movement
• Staff login tab on login.html → redirects to staff-portal.html
• Feature cards, stats strip, glass cards, gradient buttons
• Optimised images for faster load

NOTES
-----
• Other HTML pages will automatically look better because they use the same css/style.css.
• If a page still looks “old”, hard-refresh (Ctrl+Shift+R) or clear cache.
• AI Concierge page (ai-assistant.html) inherits the new styles; no functional change.
