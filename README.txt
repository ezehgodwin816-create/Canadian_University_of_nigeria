LOGIN AUTH FIX
==============

Replace ONLY this file:

  login.html

What was wrong:
  The redesigned login page was missing js/app.js.
  app.js is what creates window.SupabaseClient from js/config.js.
  Without it, Auth.login returns:
  "Authentication is not configured. Check js/config.js."

What this fix does:
  • Loads scripts in the correct production order:
      js/config.js  →  js/app.js  →  js/auth.js
  • Uses the original Auth.login(email, password) call
  • Redirects by the role Auth returns (student / staff / admin)
  • Keeps the new visual design

Your auth workflow is unchanged. No other files are modified.

After upload: hard-refresh the login page.
