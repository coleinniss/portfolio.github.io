/*
 * Cole Inniss portfolio — shared behaviour for every page
 *  - animated wavy underlines (highlights, hovers, separators)
 *  - custom text-selection highlight with a wave underneath
 *  - flying / perching toucan cursor
 *  - smooth page-leave transition
 *  - "Let's talk" email pop-up
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTERACTIVE = 'a, button, [role="button"], [role="link"], [role="tab"], summary, .about-toggle, .project-cover, .project-title-link, .title-sweep';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var root = document.querySelector('.page-root');

  /* ---------- wave shape ---------- */
  // A travelling wave between two fixed, rounded ends. Each line (k) gets its own pattern.
  var PATTERNS = [
    { P: 20, A: 3.2, s: 20, b: 0.45, o: 0 },
    { P: 18, A: 2.9, s: 16, b: 0.6, o: 5 },
    { P: 22, A: 3.4, s: 24, b: 0.35, o: 9 },
    { P: 19, A: 3.0, s: -18, b: 0.55, o: 3 }
  ];
  function waveD(w, t, k, sc) {
    sc = sc || 1; t = t || 0; k = k | 0;
    var V = PATTERNS[((k % 4) + 4) % 4];
    var Y = 6, TAU = Math.PI * 2, ramp = Math.min(14, w / 4);
    var P = V.P * (sc < 1 ? 0.75 : 1), A = V.A * sc;
    var ph = t * V.s * (sc < 1 ? 0.75 : 1) + V.o;
    var breathe = 0.82 + 0.18 * Math.sin(t * V.b * TAU / 2 + k);
    var n = Math.max(2, Math.round(w / 1.5)), d = '';
    for (var i = 0; i <= n; i++) {
      var x = w * i / n;
      var e = Math.min(1, x / ramp, (w - x) / ramp);
      var env = Math.sin(e * Math.PI / 2) * breathe;
      d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + (Y - A * env * Math.cos(TAU * (x - ph) / P)).toFixed(2);
    }
    return d;
  }

  function makeWave(cls, x, y, w, thin) {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('width', w);
    svg.setAttribute('height', 12);
    svg.setAttribute('overflow', 'visible');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.left = x + 'px';
    svg.style.top = y + 'px';
    var sc = thin ? 0.55 : 1;
    var path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('class', 'sq-path');
    path.setAttribute('data-w', w);
    path.setAttribute('data-s', sc);
    path.setAttribute('d', waveD(w, 0, 0, sc));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#3E5A22');
    path.setAttribute('stroke-width', thin ? 2 : 4);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  function startWaves() {
    if (reduceMotion) return;
    var t0 = performance.now();
    function step(now) {
      var t = (now - t0) / 1000;
      var paths = document.querySelectorAll('.wv-path, .sq-path');
      for (var i = 0; i < paths.length; i++) {
        var w = +paths[i].getAttribute('data-w') || 200;
        paths[i].setAttribute('d', waveD(w, t, i, +paths[i].getAttribute('data-s') || 1));
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- underline waves under highlights and hover targets ---------- */
  var sqLayer = document.createElement('div');
  sqLayer.className = 'sq-layer';
  sqLayer.setAttribute('aria-hidden', 'true');
  var sqSig = '', hoverKey = '';

  function measureSquiggles() {
    var sx = window.scrollX, sy = window.scrollY, items = [];
    function add(sel, key, ext) {
      ext = ext || 0;
      document.querySelectorAll(sel).forEach(function (el, i) {
        var small = parseFloat(getComputedStyle(el).fontSize) < 20;
        var rs = el.getClientRects();
        for (var j = 0; j < rs.length; j++) {
          var r = rs[j];
          if (r.width < 4) continue;
          items.push({ x: Math.round(r.left + sx - ext), y: Math.round(r.bottom + sy - 11), w: Math.round(r.width + ext * 2), key: key ? key + i : '', thin: small });
        }
      });
    }
    add('.tagline', '', 9); add('.hl', '', 9); add('.project-title-link', 't'); add('.about-toggle-label', 'a'); add('.title-sweep', 'n');
    var sig = JSON.stringify(items);
    if (sig === sqSig) return;
    sqSig = sig;
    sqLayer.textContent = '';
    items.forEach(function (q) {
      var svg = makeWave('sq-svg' + (q.key ? ' sq-gated' : ''), q.x, q.y, q.w, q.thin);
      if (q.key) svg.setAttribute('data-key', q.key);
      sqLayer.appendChild(svg);
    });
    applyHover();
  }
  function applyHover() {
    sqLayer.querySelectorAll('.sq-gated').forEach(function (svg) {
      svg.classList.toggle('is-on', !!hoverKey && svg.getAttribute('data-key') === hoverKey);
    });
  }
  function onHover(e) {
    var t = e.target, k = '';
    if (t && t.closest) {
      var card = t.closest('.project-card');
      if (card && (t.closest('.project-title-link') || t.closest('.project-cover'))) k = 't' + Array.prototype.indexOf.call(document.querySelectorAll('.project-card'), card);
      else if (t.closest('.about-toggle')) k = 'a0';
      else if (t.closest('.title-sweep')) k = 'n0';
    }
    if (k !== hoverKey) { hoverKey = k; applyHover(); }
  }
  var mRaf = 0;
  function measureSoon() { cancelAnimationFrame(mRaf); mRaf = requestAnimationFrame(measureSquiggles); }

  /* ---------- custom text selection highlight ---------- */
  var selLayer = document.createElement('div');
  selLayer.className = 'sel-layer';
  selLayer.setAttribute('aria-hidden', 'true');
  var selSig = '';

  function clearSelection() {
    selSig = '';
    selLayer.textContent = '';
  }
  function noSelect(el) {
    if (!el) return true;
    if (el.closest(INTERACTIVE + ', .sr-only, .lp-card')) return true;
    var cs = getComputedStyle(el);
    return cs.userSelect === 'none' || cs.webkitUserSelect === 'none';
  }
  function updateSelection() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { clearSelection(); return; }
    var range = sel.getRangeAt(0);
    var rootNode = range.commonAncestorContainer;
    if (!rootNode || !rootNode.isConnected) { clearSelection(); return; }
    if (rootNode.nodeType === 3) rootNode = rootNode.parentNode;
    var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
    var boxes = [], node, count = 0, vw = document.documentElement.clientWidth;
    while ((node = walker.nextNode()) && count < 2000) {
      if (!range.intersectsNode(node) || noSelect(node.parentElement)) continue;
      var inHl = !!node.parentElement.closest('.tagline, .hl');
      var text = node.nodeValue || '';
      var start = node === range.startContainer ? range.startOffset : 0;
      var end = node === range.endContainer ? range.endOffset : text.length;
      var re = /\S+/g, m;
      while ((m = re.exec(text)) && count < 2000) {
        var s = Math.max(m.index, start), e = Math.min(m.index + m[0].length, end);
        if (e <= s) continue;
        var r = document.createRange();
        r.setStart(node, s); r.setEnd(node, e);
        var list = r.getClientRects();
        for (var i = 0; i < list.length; i++) {
          var b = list[i];
          if (b.width > 0.5 && b.height > 2 && b.right > 0 && b.left < vw) boxes.push({ l: Math.max(0, b.left), r: Math.min(vw, b.right), t: b.top, b: b.bottom, deep: inHl });
        }
        count++;
      }
    }
    if (!boxes.length) { clearSelection(); return; }
    boxes.sort(function (a, b) { return (a.b - b.b) || (a.l - b.l); });
    var lines = [];
    boxes.forEach(function (bx) {
      var h = bx.b - bx.t, last = lines[lines.length - 1];
      if (last && Math.abs(last.b - bx.b) < 3 && bx.l - last.r < h * 0.45 && bx.l >= last.l) {
        last.r = Math.max(last.r, bx.r); last.t = Math.min(last.t, bx.t); last.deep = last.deep || bx.deep;
      } else lines.push({ l: bx.l, r: bx.r, t: bx.t, b: bx.b, deep: bx.deep });
    });
    var PAD = 9;
    var sig = JSON.stringify(lines.map(function (l) { return [Math.round(l.l), Math.round(l.t), Math.round(l.r), Math.round(l.b), l.deep]; }));
    if (sig === selSig) return;
    selSig = sig;
    selLayer.textContent = '';
    lines.forEach(function (l) {
      var mark = document.createElement('div');
      mark.className = 'sel-mark' + (l.deep ? ' is-deep' : '');
      mark.style.left = Math.round(l.l - PAD) + 'px';
      mark.style.top = Math.round(l.t) + 'px';
      mark.style.width = Math.round(l.r - l.l + PAD * 2) + 'px';
      mark.style.height = Math.round(l.b - l.t) + 'px';
      selLayer.appendChild(mark);
    });
    lines.filter(function (l) { return !l.deep; }).forEach(function (l) {
      var thin = (l.b - l.t) < 28;
      selLayer.appendChild(makeWave('sel-wave', Math.round(l.l - PAD), Math.round(l.b - (thin ? 4 : 6)), Math.max(16, Math.round(l.r - l.l + PAD * 2)), thin));
    });
  }

  /* ---------- toucan cursor ---------- */
  var toucan = document.getElementById('toucan');
  var lastX = null, lastY = null, facingLeft = false, perchTimer = 0;
  function placeToucan(x, y, perched) {
    // Flying: beak tip on the pointer. Perched: the branch under its feet sits on the pointer.
    var hotX = perched ? (facingLeft ? 27.3 : 32.7) : (facingLeft ? 8.2 : 51.8);
    var hotY = perched ? 40.8 : 19.8;
    toucan.style.transform = 'translate3d(' + (x - hotX) + 'px,' + (y - hotY) + 'px,0)';
  }
  function moveToucan(e) {
    if (!toucan || (e.pointerType && e.pointerType !== 'mouse')) return;
    var dx = lastX == null ? 0 : e.clientX - lastX;
    lastX = e.clientX; lastY = e.clientY;
    if (dx < -3 && !facingLeft) { facingLeft = true; toucan.classList.add('is-left'); }
    else if (dx > 3 && facingLeft) { facingLeft = false; toucan.classList.remove('is-left'); }
    toucan.classList.remove('is-perched', 'is-landing');
    placeToucan(e.clientX, e.clientY, false);
    toucan.classList.add('is-visible');
    clearTimeout(perchTimer);
    perchTimer = setTimeout(function () {
      toucan.classList.add('is-landing', 'is-perched');
      placeToucan(lastX, lastY, true);
    }, 450);
  }

  /* ---------- page-leave transition ---------- */
  var leaving = false;
  function leaveTo(e) {
    var a = e.currentTarget, href = a && a.getAttribute('href');
    if (leaving || !href || href.charAt(0) === '#') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed && a.contains(sel.anchorNode)) return;
    e.preventDefault();
    leaving = true;
    if (root) root.classList.add('is-leaving');
    setTimeout(function () { window.location.href = a.href; }, reduceMotion ? 200 : 680);
  }
  // coming back with the browser's back button restores the page from cache — undo the fade
  window.addEventListener('pageshow', function () { leaving = false; if (root) root.classList.remove('is-leaving'); });

  /* ---------- contact pop-up ---------- */
  var cm = document.querySelector('.cm-root');
  var cmReturn = null;
  function openContact(e) {
    if (!cm) return;
    if (e) e.preventDefault();
    cmReturn = e && e.currentTarget;
    cm.hidden = false;
    document.getElementById('cm-error').hidden = true;
    document.getElementById('cm-sent').hidden = true;
    setTimeout(function () { var el = document.getElementById('cm-from'); if (el) el.focus(); }, 30);
  }
  function closeContact() {
    if (!cm || cm.hidden) return;
    cm.hidden = true;
    if (cmReturn && cmReturn.focus) cmReturn.focus();
  }
  function sendContact(e) {
    e.preventDefault();
    var fromEl = document.getElementById('cm-from');
    var from = (fromEl.value || '').trim();
    var msg = (document.getElementById('cm-msg').value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
      document.getElementById('cm-error').hidden = false;
      fromEl.focus();
      return;
    }
    document.getElementById('cm-error').hidden = true;
    var subject = 'Portfolio note from ' + from;
    var body = (msg || 'Hi Cole,') + '\n\n— ' + from;
    window.location.href = 'mailto:coleinniss@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    document.getElementById('cm-sent').hidden = false;
  }

  /* ---------- wire everything up ---------- */
  document.body.appendChild(sqLayer);
  document.body.appendChild(selLayer);
  startWaves();
  measureSoon();
  window.addEventListener('resize', measureSoon);
  if (window.ResizeObserver) new ResizeObserver(measureSoon).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
  setTimeout(measureSoon, 300); setTimeout(measureSoon, 1200);
  document.addEventListener('portfolio:layout', measureSoon);

  document.addEventListener('mouseover', onHover);
  document.addEventListener('focusin', onHover);
  document.addEventListener('selectionchange', updateSelection);
  window.addEventListener('scroll', updateSelection, true);
  window.addEventListener('resize', updateSelection);
  document.addEventListener('mousedown', function (e) {
    if (e.button === 0 && !e.shiftKey) clearSelection();
    var t = e.target;
    if (e.button === 0 && t && t.closest && t.closest(INTERACTIVE) && !t.closest('.cm-root input, .cm-root textarea')) {
      e.preventDefault(); // no drag-selecting from links and buttons
      var cur = window.getSelection(); if (cur) cur.removeAllRanges();
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeContact(); });

  window.addEventListener('pointermove', moveToucan, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { if (toucan) toucan.classList.remove('is-visible'); });

  document.querySelectorAll('[data-transition]').forEach(function (a) { a.addEventListener('click', leaveTo); });
  document.querySelectorAll('[data-contact-open]').forEach(function (a) { a.addEventListener('click', openContact); });
  document.querySelectorAll('[data-contact-close]').forEach(function (a) { a.addEventListener('click', closeContact); });
  var form = document.querySelector('.cm-form');
  if (form) form.addEventListener('submit', sendContact);

  window.Portfolio = { measure: measureSoon, clearSelection: clearSelection };
})();
