MOBILE SCROLL FIX (iOS / Android)
=================================

Replace ALL of these:

  index.html
  css/style.css
  css/responsive.css
  js/theme-anim.js

Why it was stuck:
  On many phones (especially iPhone Safari), setting overflow-x:hidden
  on BOTH html and body blocks vertical scrolling.

This fix:
  • Uses overflow-y: scroll on html
  • Uses overflow-x: clip on body only (does not block vertical scroll)
  • touch-action: pan-y so the finger can scroll the page
  • Removes preventDefault on the theme button touch handler
  • Scroll is only locked when the ☰ menu is open

After upload:
  1. Hard refresh (or clear site data / close tab and reopen)
  2. Try scrolling the homepage with one finger

If it still fails, open the phone browser menu → "Request Desktop Site"
once, then switch back — that clears stubborn CSS cache on some phones.
