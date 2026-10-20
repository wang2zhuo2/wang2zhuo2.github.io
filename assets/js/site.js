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

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.dataset.lightbox === 'vimeo') {
      e.preventDefault();
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
})();
