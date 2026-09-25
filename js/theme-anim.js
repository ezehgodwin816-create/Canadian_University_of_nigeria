/* CUN smooth theme + scroll animations — non-breaking enhancement */
(function () {
  'use strict';
  // Intersection observer for animate-in elements
  if ('IntersectionObserver' in window) {
    const els = document.querySelectorAll('.animate-in, .feature-card, .info-card, .programme-card, .news-card');
    const io = new IntersectionObserver(function (entries) {
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
  // Prevent horizontal overscroll on touch
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1) return;
  }, { passive: true });
})();
