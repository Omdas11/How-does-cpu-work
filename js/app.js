/* ==========================================================
   App — Main entry point, header behaviour, smooth scroll
   ========================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- Header scroll shadow ---- */
    var header = document.getElementById('site-header');
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });

    /* ---- Mobile menu toggle ---- */
    var menuBtn = document.getElementById('menu-toggle');
    var nav = document.querySelector('#site-header nav');
    menuBtn.addEventListener('click', function () {
      nav.classList.toggle('open');
    });

    /* ---- Active nav link on scroll ---- */
    var sections = document.querySelectorAll('.content-section, #hero');
    var navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
      var scrollY = window.scrollY + 120;
      sections.forEach(function (sec) {
        if (sec.offsetTop <= scrollY && sec.offsetTop + sec.offsetHeight > scrollY) {
          var id = sec.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
          });
        }
      });
    }
    window.addEventListener('scroll', updateActiveLink);

    /* ---- Close mobile menu on link click ---- */
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
      });
    });

    /* ---- Initialize exhibition modules ---- */
    if (typeof window.initExhibition === 'function') window.initExhibition();
  });

})();
