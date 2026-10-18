/*
 * Cole Inniss portfolio — landing page only
 *  - rotating tagline after "Cole Inniss," (slides in from below every 5 s)
 *  - "Want to know more about me?" expand / collapse
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function relayout() { document.dispatchEvent(new Event('portfolio:layout')); }

  /* ---------- rotating tagline ---------- */
  var TAGLINES = [
    'designer creating thoughtful, inclusive solutions for financial ventures.',
    'researcher passionate about finding inclusive solutions for health care.',
    'researcher genuinely curious to create thoughtful, accessible solutions.'
  ];
  var tagline = document.querySelector('.tagline');
  var srCopy = tagline && tagline.parentNode.querySelector('.sr-only');
  var host = document.querySelector('[data-tagline-host]');
  var idx = 0, paused = false;

  function renderTagline(text, stage) {
    var words = text.split(' ');
    var stagger = stage === 'out' ? 25 : 45;
    tagline.textContent = '';
    words.forEach(function (w, i) {
      var outer = document.createElement('span');
      outer.className = 'tw';
      var inner = document.createElement('span');
      inner.className = 'tw-inner ' + stage;
      inner.style.animationDelay = (i * stagger) + 'ms';
      inner.textContent = w;
      outer.appendChild(inner);
      tagline.appendChild(outer);
      if (i < words.length - 1) tagline.appendChild(document.createTextNode(' '));
    });
    if (srCopy) srCopy.textContent = text;
    relayout();
  }
  function setStage(stage) {
    tagline.querySelectorAll('.tw-inner').forEach(function (el, i) {
      el.className = 'tw-inner ' + stage;
      el.style.animationDelay = (i * (stage === 'out' ? 25 : 45)) + 'ms';
    });
  }
  function later(ms) { setTimeout(step, ms); }
  function step() {
    var sel = window.getSelection();
    if (paused || (sel && !sel.isCollapsed)) { later(400); return; }
    var next = (idx + 1) % TAGLINES.length;
    if (reduceMotion) { idx = next; renderTagline(TAGLINES[idx], 'in-a'); later(5000); return; }
    // slide the current phrase up and out, then bring the next one in from below
    var outWords = TAGLINES[idx].split(' ').length;
    setStage('out');
    setTimeout(function () {
      idx = next;
      renderTagline(TAGLINES[idx], idx % 2 ? 'in-b' : 'in-a');
      later(5000);
    }, 380 + outWords * 25);
  }
  if (tagline) {
    if (host) {
      host.addEventListener('mouseenter', function () { paused = true; });
      host.addEventListener('mouseleave', function () { paused = false; });
    }
    later(5000);
  }

  /* ---------- about me expand / collapse ---------- */
  var toggle = document.querySelector('[data-about-toggle]');
  if (toggle) {
    var more = document.querySelector('.about-more');
    var photo = document.querySelector('.about-photo');
    var label = toggle.querySelector('.about-toggle-label');
    toggle.addEventListener('click', function () {
      var open = !toggle.classList.contains('is-open');
      [toggle, more, photo].forEach(function (el) { if (el) el.classList.toggle('is-open', open); });
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (photo) photo.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (label) label.textContent = open ? 'Want to know less about me? :(' : 'Want to know more about me? :D';
      // keep the wavy underlines lined up while the section animates open/closed
      var t0 = performance.now();
      (function follow(now) { relayout(); if (now - t0 < 900) requestAnimationFrame(follow); })(t0);
    });
  }
})();
