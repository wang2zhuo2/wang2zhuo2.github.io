(function () {
  var d = document, w = window;
  var mobile = function () { var m = d.querySelector('.M'); return m && getComputedStyle(m).display !== 'none'; };
  var tree = function () { return d.querySelector(mobile() ? '.M' : '.D'); };

  // In-page anchors (#top, #bottom and chapter anchors) scroll within the visible layout.
  // Chapter anchors leave room above the heading (and for the desktop header, which may reappear).
  function chapterOffset() {
    var zd = parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--zd')) || 1;
    return mobile() ? 20 : 96 * zd;
  }
  function go(slug, smooth) {
    var b = smooth ? 'smooth' : 'auto';
    if (slug === 'top') { w.scrollTo({top: 0, behavior: b}); return true; }
    if (slug === 'bottom') { w.scrollTo({top: d.documentElement.scrollHeight, behavior: b}); return true; }
    var t = tree() && tree().querySelector('[data-a="' + slug + '"]');
    if (!t) return false;
    var off = t.classList.contains('toc-a') ? chapterOffset() : 0;
    w.scrollTo({top: Math.max(0, w.scrollY + t.getBoundingClientRect().top - off), behavior: b});
    return true;
  }

  // Desktop header (Wix "disappears" effect): hides while scrolling down, returns after ~450px of scrolling up.
  var hdr = d.querySelector('.D .hdr');
  if (hdr) {
    var lastY = w.scrollY, upAcc = 0;
    w.addEventListener('scroll', function () {
      var y = w.scrollY, dy = y - lastY; lastY = y;
      if (y <= hdr.offsetHeight) { hdr.classList.remove('hide'); upAcc = 0; return; }
      if (dy > 0) { upAcc = 0; hdr.classList.add('hide'); }
      else if (dy < 0) { upAcc -= dy; if (upAcc >= 450) hdr.classList.remove('hide'); }
    }, {passive: true});
  }

  // Lazy video sources: only videos in the visible layout load; they pause when off-screen.
  var vio = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else if (v.getAttribute('src')) { v.pause(); }
    });
  }, {rootMargin: '400px 0px'}) : null;
  d.querySelectorAll('video[data-src]').forEach(function (v) {
    v.muted = true;
    if (vio) vio.observe(v); else v.src = v.dataset.src;
  });

  // Lightbox (Vimeo showreel + photo gallery).
  var lb = d.querySelector('.lb'), media = lb && lb.querySelector('.lb-media'), gal = [], gi = 0;
  function open(html, isGal) {
    media.innerHTML = html; lb.classList.toggle('gal', !!isGal); lb.hidden = false;
    d.documentElement.style.overflow = 'hidden';
  }
  function close() { lb.hidden = true; lb.classList.remove('tall'); media.innerHTML = ''; d.documentElement.style.overflow = ''; }
  function showPhoto(i) {
    gi = (i + gal.length) % gal.length;
    var a = gal[gi], im = a.querySelector('img,video');
    open('<img src="' + a.getAttribute('href') + '" alt="' + ((im && im.getAttribute('alt')) || '') + '">', true);
    lb.classList.toggle('tall', a.dataset.tall === '1');
    lb.scrollTop = 0;
  }
  if (lb) {
    lb.querySelector('.lb-ov').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { showPhoto(gi - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { showPhoto(gi + 1); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (lb.classList.contains('gal') && e.key === 'ArrowLeft') showPhoto(gi - 1);
      if (lb.classList.contains('gal') && e.key === 'ArrowRight') showPhoto(gi + 1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, {passive: true});
    lb.addEventListener('touchend', function (e) {
      if (sx === null || !lb.classList.contains('gal')) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) showPhoto(gi + (dx < 0 ? 1 : -1));
    });
  }

  // Visitor analytics (Umami). No-op when the tracker is absent or blocked.
  function track(name, data) {
    try { if (w.umami && w.umami.track) w.umami.track(name, data); } catch (err) {}
  }

  // Time on page: seconds the page was visible and the visitor not idle for 5+ minutes, plus the furthest scroll
  // point (%). Reported when the visitor leaves or switches away, then again for each later stretch. Nothing is
  // reported for a page seen under 10 s, so a short single-page visit still counts as a bounce in Umami.
  (function () {
    var IDLE = 300000, engaged = 0, reported = 0, depth = 0, vis = d.visibilityState === 'visible';
    var lastTick = Date.now(), lastAct = lastTick;
    function tick() {
      var t = Date.now();
      if (vis && t - lastAct < IDLE) engaged += Math.min(t - lastTick, 5000);
      lastTick = t;
    }
    function scrolled() {
      var h = d.documentElement.scrollHeight;
      depth = Math.max(depth, h ? Math.min(100, Math.round((w.scrollY + w.innerHeight) / h * 100)) : 100);
    }
    function report() {
      tick(); scrolled();
      var s = Math.round((engaged - reported) / 1000);
      if (engaged < 10000 || s < 1) return;
      reported = engaged;
      track('time-on-page', {page: location.pathname, seconds: s, scroll: depth});
    }
    function seen() { tick(); vis = d.visibilityState === 'visible'; lastAct = Date.now(); }
    setInterval(tick, 1000);
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(function (t) {
      w.addEventListener(t, function () { lastAct = Date.now(); }, {passive: true, capture: true});
    });
    w.addEventListener('scroll', function () { lastAct = Date.now(); scrolled(); }, {passive: true});
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') { report(); vis = false; } else seen(); });
    w.addEventListener('pagehide', report);
    w.addEventListener('pageshow', function (e) { if (e.persisted) seen(); });
    scrolled();
  })();

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.dataset.lightbox === 'vimeo') {
      e.preventDefault();
      track('showreel-open');
      open('<iframe src="https://player.vimeo.com/video/1237053593?autoplay=true&muted=true&loop=false&byline=false&portrait=false&title=false" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Showreel"></iframe>');
      return;
    }
    if (a.dataset.gallery) {
      e.preventDefault();
      gal = Array.prototype.slice.call(tree().querySelectorAll('a[data-gallery="' + a.dataset.gallery + '"]'));
      // Masonry columns change the DOM order; browse in the original photo order.
      gal.sort(function (x, y) { return (+x.dataset.i || 0) - (+y.dataset.i || 0); });
      showPhoto(gal.indexOf(a));
      return;
    }
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) track('email-click');
    else if (/^https?:/i.test(href) && a.hostname !== location.hostname && !/(^|\.)zonenwang\.com$/i.test(a.hostname)) {
      if (/(^|\.)linkedin\.com$/i.test(a.hostname)) track('linkedin-click');
      else track('outbound-click', {url: a.href});
    }
    if (href.charAt(0) === '#' && href.length > 1 && go(href.slice(1), true)) {
      e.preventDefault();
      var mm = a.closest('.mm'); if (mm) toggleMenu(false);
      if (a.closest('.toc-sheet')) toggleSheet(false);
      if (a.closest('.toc') && history.replaceState) history.replaceState(null, '', href);
    }
  });
  if (location.hash) w.addEventListener('load', function () { go(location.hash.slice(1), false); });

  // Parallax hero backgrounds (Wix BgParallax): media top = k * section top, media height >= viewport.
  var pxs = Array.prototype.slice.call(d.querySelectorAll('[data-px]'));
  function parallax() {
    pxs.forEach(function (el) {
      if (!el.offsetHeight) return;
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > w.innerHeight + 200) return;
      var z = r.height / el.offsetHeight || 1, k = parseFloat(el.dataset.px);
      var h = Math.max(el.offsetHeight, w.innerHeight / z);
      el.querySelectorAll('.pxm').forEach(function (m) {
        m.style.height = h + 'px';
        m.style.transform = 'translate3d(0,' + ((k - 1) * r.top / z) + 'px,0)';
      });
    });
  }
  if (pxs.length) {
    w.addEventListener('scroll', parallax, {passive: true});
    w.addEventListener('resize', parallax);
    parallax();
  }

  // Mobile drawer menu.
  var hb = d.querySelector('.M .hb'), mm = d.querySelector('.M .mm');
  function toggleMenu(open) {
    if (!hb || !mm) return;
    mm.hidden = !open; hb.classList.toggle('open', open);
    hb.setAttribute('aria-expanded', open ? 'true' : 'false');
    hb.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  if (hb && mm) {
    hb.addEventListener('click', function () { toggleMenu(mm.hidden); });
    mm.querySelector('.mm-ov').addEventListener('click', function () { toggleMenu(false); });
  }

  // Horizontal photo sliders: arrows step one image at a time and hide at the ends.
  d.querySelectorAll('.sl').forEach(function (sl) {
    var t = sl.querySelector('.sl-t'), n = sl.querySelector('.sl-n'), p = sl.querySelector('.sl-p');
    var upd = function () {
      p.hidden = t.scrollLeft <= 2;
      n.hidden = t.scrollLeft + t.clientWidth >= t.scrollWidth - 2;
    };
    var step = function (dir) {
      var items = t.querySelectorAll('.sl-i'), x = t.scrollLeft, target = null;
      for (var i = 0; i < items.length; i++) {
        var o = items[i].offsetLeft - t.offsetLeft;
        if (dir > 0 && o > x + 2) { target = o; break; }
        if (dir < 0 && o < x - 2) target = o;
      }
      if (target === null) target = dir > 0 ? t.scrollWidth : 0;
      t.scrollTo({left: target, behavior: 'smooth'});
    };
    n.addEventListener('click', function () { step(1); });
    p.addEventListener('click', function () { step(-1); });
    t.addEventListener('scroll', upd, {passive: true});
    w.addEventListener('resize', upd);
    upd();
  });

  // Contents navigation (project pages).
  var toc = d.querySelector('.toc'), fab = d.querySelector('.toc-fab'), sheet = d.querySelector('.toc-sheet');
  function toggleSheet(open) {
    if (!sheet) return;
    sheet.hidden = !open;
    if (fab) { fab.setAttribute('aria-expanded', open ? 'true' : 'false'); fab.classList.toggle('open', open); }
  }
  if (toc) {
    var card = toc.querySelector('.toc-card'), rail = toc.querySelector('.toc-rail');
    var keys = [], parentOf = {}, anchors = {}, found = [], current, layoutKey;
    (function () {
      var l1 = null;
      card.querySelectorAll('li').forEach(function (li) {
        var k = li.querySelector('a').dataset.k;
        keys.push(k);
        if (li.classList.contains('l1')) l1 = k; else parentOf[k] = l1;
      });
    })();
    var collect = function () {
      var t = tree();
      anchors = {}; found = [];
      keys.forEach(function (k) {
        var el = t && t.querySelector('.toc-a[data-a="' + k + '"]');
        if (el) { anchors[k] = el; found.push(k); }
      });
      d.querySelectorAll('.toc [data-k], .toc-sheet [data-k]').forEach(function (el) {
        var na = !anchors[el.dataset.k];
        el.classList.toggle('na', na);
        if (el.parentElement.tagName === 'LI') el.parentElement.classList.toggle('na', na);
      });
    };
    var mark = function () {
      // Current chapter: the last heading that has reached the top band; at the very bottom of the page,
      // the last heading on screen (short final chapters can never scroll up to the top).
      var k = null, lim = chapterOffset() + 40;
      found.forEach(function (key) { if (anchors[key].getBoundingClientRect().top <= lim) k = key; });
      if (Math.ceil(w.scrollY + w.innerHeight) >= d.documentElement.scrollHeight - 2) {
        found.forEach(function (key) { if (anchors[key].getBoundingClientRect().top < w.innerHeight * 0.6) k = key; });
      }
      if (k !== current) {
        current = k;
        d.querySelectorAll('.toc [data-k], .toc-sheet [data-k]').forEach(function (el) {
          el.classList.toggle('on', el.dataset.k === k);
          el.classList.toggle('in', !!k && parentOf[k] === el.dataset.k);
        });
      }
      var first = found.length ? anchors[found[0]].getBoundingClientRect().top : Infinity;
      var ftr = tree() && tree().querySelector('.ftr');
      var show = first < w.innerHeight * 0.85 && !(ftr && ftr.getBoundingClientRect().top < w.innerHeight - 40);
      toc.classList.toggle('show', show);
      if (fab) fab.classList.toggle('show', show);
    };
    var place = function () {
      if (mobile()) return;
      var cw = d.documentElement.clientWidth;
      var contentRight = Math.min(cw * 1391 / 1440, cw / 2 + 671);
      var wide = cw - contentRight >= card.offsetWidth + 56;
      toc.classList.toggle('wide', wide);
      if (wide) {
        toc.style.left = Math.round(contentRight + 28) + 'px';
        toc.style.right = 'auto';
      } else {
        var up = d.querySelector('.D .fxl a[href="#top"]');
        var ur = up && up.getBoundingClientRect();
        var cx = ur && ur.width ? ur.left + ur.width / 2 : cw - 25;
        toc.style.left = 'auto';
        toc.style.right = Math.max(4, Math.round(cw - cx - rail.offsetWidth / 2)) + 'px';
      }
    };
    var refresh = function () {
      var lk = mobile() ? 'm' : 'd';
      if (lk !== layoutKey) { layoutKey = lk; collect(); current = undefined; }
      place();
      mark();
    };
    // Touch-screen laptops have no hover: tapping the rail toggles the card; following a link closes it.
    rail.addEventListener('click', function () { toc.classList.toggle('peek'); });
    card.addEventListener('click', function (e) { if (e.target.closest('a')) { toc.classList.remove('peek'); if (d.activeElement && d.activeElement.blur) d.activeElement.blur(); } });
    d.addEventListener('click', function (e) { if (!e.target.closest('.toc')) toc.classList.remove('peek'); });
    w.addEventListener('scroll', mark, {passive: true});
    w.addEventListener('resize', refresh);
    w.addEventListener('load', refresh);
    refresh();
  }
  if (fab && sheet) {
    fab.addEventListener('click', function () { toggleSheet(sheet.hidden); });
    sheet.querySelector('.toc-sheet-ov').addEventListener('click', function () { toggleSheet(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) toggleSheet(false); });
  }

  // About: a project named in the story and its evidence tile highlight each other.
  d.querySelectorAll('[data-ev]').forEach(function (el) {
    var mark = function (on) {
      el.closest('.D,.M').querySelectorAll('[data-ev="' + el.dataset.ev + '"]').forEach(function (x) { x.classList.toggle('hl', on); });
    };
    el.addEventListener('mouseenter', function () { mark(true); });
    el.addEventListener('mouseleave', function () { mark(false); });
    el.addEventListener('focus', function () { mark(true); });
    el.addEventListener('blur', function () { mark(false); });
  });

  // Footer lines: a sparse gold line network behind the contact block, drifting at an even pace. A soft light eases
  // toward the mouse (on phones it wanders on its own and follows a touch on the footer): lines near it brighten and
  // points there part instead of gathering. It runs only while the footer is on screen and stays still for visitors
  // who prefer reduced motion.
  (function () {
    var cvs = [].slice.call(d.querySelectorAll('.ffx canvas'));
    if (!cvs.length) return;
    var still = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var cv = null, ctx = null, W = 0, H = 0, s = 1, raf = 0, last = 0, vis = false, pts = null, L = null, ptr = null, ptrAt = -1e9;
    function rgba(a) { return 'rgba(210,160,110,' + Math.min(1, a).toFixed(3) + ')'; }
    function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
    function glow(x, y, R) { var dx = x - L.x, dy = y - L.y; return Math.exp(-(dx * dx + dy * dy) / (R * R)); }
    function edge(x) { var m = W * 0.08; return smooth(0, m, x) * smooth(0, m, W - x); }
    function size() {
      var c = null;
      for (var i = 0; i < cvs.length; i++) if (cvs[i].getClientRects().length) { c = cvs[i]; break; }
      if (!c) return false;
      var r = c.getBoundingClientRect(), nw, nh;
      s = Math.min(w.devicePixelRatio || 1, 2);
      nw = Math.round(r.width * s); nh = Math.round(r.height * s);
      if (c !== cv) { cv = c; ctx = c.getContext('2d'); pts = null; L = null; }
      if (c.width !== nw || c.height !== nh) {
        // The points keep their place in the footer when it changes size (rotation, zoom).
        if (pts && c.width && c.height) pts.forEach(function (p) { p.x *= nw / c.width; p.y *= nh / c.height; });
        c.width = nw; c.height = nh;
      }
      W = nw; H = nh;
      return W > 0 && H > 0;
    }
    function draw(dt) {
      var i, j;
      if (!pts) {
        var n = Math.max(26, Math.min(64, Math.round(W * H / (s * s * 6500))));
        pts = [];
        for (i = 0; i < n; i++) {
          // 14 to 30 px a second, each in its own direction; points wrap around the edges.
          var an = Math.random() * 6.2832, v = (14 + Math.random() * 16) * s;
          pts.push({x: Math.random() * W, y: Math.random() * H, vx: Math.cos(an) * v, vy: Math.sin(an) * v});
        }
      }
      var D = Math.max(95 * s, Math.min(170 * s, W * 0.14)), R = Math.max(W * 0.2, 140 * s), P = [];
      pts.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -20) p.x += W + 40; else if (p.x > W + 20) p.x -= W + 40;
        if (p.y < -20) p.y += H + 40; else if (p.y > H + 20) p.y -= H + 40;
        var g = glow(p.x, p.y, R), ddx = p.x - L.x, ddy = p.y - L.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        P.push({x: p.x + ddx / dd * 14 * s * g, y: p.y + ddy / dd * 14 * s * g, g: g});
      });
      ctx.lineWidth = Math.max(1, s * 0.6);
      for (i = 0; i < P.length; i++) {
        for (j = i + 1; j < P.length; j++) {
          var a = P[i], b = P[j], dist = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
          if (dist > D) continue;
          var q = 1 - dist / D;
          ctx.strokeStyle = rgba(q * q * (0.22 + 0.25 * (a.g + b.g)) * edge((a.x + b.x) / 2));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      P.forEach(function (p) { ctx.fillStyle = rgba((0.35 + 0.5 * p.g) * edge(p.x)); ctx.fillRect(p.x - s * 0.75, p.y - s * 0.75, s * 1.5, s * 1.5); });
    }
    function frame(ts) {
      raf = 0;
      if (!vis || d.hidden || !size()) return;
      var t = ts / 1000, dt = last ? Math.min(0.05, t - last) : 0.016, act = ptr && ts - ptrAt < 2500;
      last = t;
      // Without a recent pointer the light wanders on a wide loop.
      var tx = act ? ptr.x : W * (0.5 + 0.34 * Math.sin(t * 0.18)), ty = act ? ptr.y : H * (0.6 + 0.2 * Math.sin(t * 0.26 + 1.3));
      if (!L) L = {x: tx, y: ty};
      var e = 1 - Math.exp(-dt * (act ? 5 : 1.2));
      L.x += (tx - L.x) * e; L.y += (ty - L.y) * e;
      ctx.clearRect(0, 0, W, H);
      draw(dt);
      if (!still) raf = w.requestAnimationFrame(frame);
    }
    function kick() { if (!raf && vis && !d.hidden) { last = 0; raf = w.requestAnimationFrame(frame); } }
    function point(e) {
      if (still || !cv) return;
      var r = cv.getBoundingClientRect();
      if (e.pointerType !== 'mouse' && (e.clientY < r.top || e.clientY > r.bottom)) return;
      ptr = {x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s}; ptrAt = w.performance.now();
      kick();
    }
    w.addEventListener('pointermove', point, {passive: true});
    w.addEventListener('pointerdown', point, {passive: true});
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.target.fxOn = en.isIntersecting; });
        vis = cvs.some(function (c) { return c.fxOn; });
        kick();
      });
      cvs.forEach(function (c) { io.observe(c); });
    } else { vis = true; }
    d.addEventListener('visibilitychange', kick);
    // Phones fire resize when the toolbar slides away on scroll: no reset here, size() handles real size changes.
    w.addEventListener('resize', kick);
    kick();
  })();
})();
