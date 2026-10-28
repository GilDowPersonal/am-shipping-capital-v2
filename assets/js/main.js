(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.replace('no-js', 'js');

  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  /* ---------- Mobile navigation ---------- */
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nav');
    if (!toggle || !nav) return;

    toggle.hidden = false;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    if (window.matchMedia) {
      var mobile = window.matchMedia('(max-width: 759px)');
      var onChange = function () { setOpen(false); };
      if (mobile.addEventListener) mobile.addEventListener('change', onChange);
      else if (mobile.addListener) mobile.addListener(onChange);
    }
  })();

  /* ---------- Scroll progress ---------- */
  (function () {
    var bar = document.querySelector('.progress span');
    if (!bar) return;
    var queued = false;

    function update() {
      queued = false;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.setProperty('--p', p.toFixed(4));
    }

    function schedule() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  })();

  /* ---------- Reveals ---------- */
  (function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal],[data-reveal-media]'));
    if (!items.length) return;
    var observer = null;

    function revealAll() {
      if (observer) observer.disconnect();
      observer = null;
      items.forEach(function (el) { el.classList.remove('is-pending'); });
    }

    function setup() {
      if ((reducedMotion && reducedMotion.matches) || !('IntersectionObserver' in window)) {
        revealAll();
        return;
      }

      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('is-pending');
          if (observer) observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

      items.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        if (el.hasAttribute('data-reveal') && el.parentElement) {
          var siblings = Array.prototype.filter.call(el.parentElement.children, function (child) {
            return child.hasAttribute('data-reveal');
          });
          el.style.transitionDelay = Math.min(siblings.indexOf(el), 3) * 90 + 'ms';
        }
        el.classList.add('is-pending');
        observer.observe(el);
      });
    }

    try {
      setup();
    } catch (error) {
      revealAll();
    }

    if (reducedMotion) {
      var onMotionChange = function () { if (reducedMotion.matches) revealAll(); };
      if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
      else if (reducedMotion.addListener) reducedMotion.addListener(onMotionChange);
    }
  })();

  /* ---------- Leg navigator (AI page) ---------- */
  (function () {
    var legnav = document.querySelector('[data-legnav]');
    if (!legnav || !('IntersectionObserver' in window)) return;

    var pairs = [];
    Array.prototype.forEach.call(legnav.querySelectorAll('a[href^="#"]'), function (link) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) pairs.push({ link: link, target: target });
    });
    if (!pairs.length) return;

    function activate(target) {
      pairs.forEach(function (pair) {
        if (pair.target === target) pair.link.setAttribute('aria-current', 'true');
        else pair.link.removeAttribute('aria-current');
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) activate(entry.target);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    pairs.forEach(function (pair) { observer.observe(pair.target); });
  })();

  /* ---------- Lightbox (gallery) ---------- */
  (function () {
    var dialog = document.querySelector('dialog.lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var links = Array.prototype.slice.call(document.querySelectorAll('a.photo-open'));
    var image = dialog.querySelector('img');
    var caption = dialog.querySelector('.lightbox-caption');
    if (!links.length || !image) return;

    var current = 0;
    var opener = null;

    function show(index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      var thumb = link.querySelector('img');
      var figure = link.closest('figure');
      image.src = link.getAttribute('href');
      image.alt = thumb ? thumb.alt : '';
      if (caption && figure) {
        var title = figure.querySelector('figcaption strong');
        var credit = figure.querySelector('figcaption .link');
        var text = figure.getAttribute('data-caption') || (title ? title.textContent : '');
        caption.textContent = (current + 1) + ' / ' + links.length + ' · ' + text + (credit ? ' · ' + credit.textContent.trim() : '');
      }
    }

    links.forEach(function (link, index) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        opener = link;
        show(index);
        dialog.showModal();
      });
    });

    var prev = dialog.querySelector('[data-prev]');
    var next = dialog.querySelector('[data-next]');
    var close = dialog.querySelector('[data-close]');
    if (prev) prev.addEventListener('click', function () { show(current - 1); });
    if (next) next.addEventListener('click', function () { show(current + 1); });
    if (close) close.addEventListener('click', function () { dialog.close(); });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      if (opener) opener.focus();
    });
  })();
})();
