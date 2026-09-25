SCROLL FIX (critical)
=====================

Replace these files:

  index.html
  css/style.css
  css/responsive.css
  js/theme-anim.js

What was wrong:
  CSS rules blocked vertical scrolling and pull-to-refresh
  (overscroll-behavior-y: none and overly aggressive overflow locks).

What this does:
  • Vertical scroll works again (up and down)
  • Pull-to-refresh works again on mobile
  • Homepage still does not move left/right
  • Theme button still works
  • Header still only shows ☰ on the homepage

After upload: hard-refresh once (Ctrl+Shift+R), then try scrolling.
