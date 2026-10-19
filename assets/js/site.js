(function () {
  var d = document, w = window;
  var mobile = function () { var m = d.querySelector('.M'); return m && getComputedStyle(m).display !== 'none'; };
  var tree = function () { return d.querySelector(mobile() ? '.M' : '.D'); };

  // In-page anchors (#top, #bottom and chapter anchors) scroll within the visible layout.
  function go(slug, smooth) {
    var b = smooth ? 'smooth' : 'auto';
    if (slug === 'top') { w.scrollTo({top: 0, behavior: b}); return true; }
    if (slug === 'bottom') { w.scrollTo({top: d.documentElement.scrollHeight, behavior: b}); return true; }
    var t = tree() && tree().querySelector('[data-a="' + slug + '"]');
    if (!t) return false;
    w.scrollTo({top: w.scrollY + t.getBoundingClientRect().top, behavior: b});
    return true;
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
  function close() { lb.hidden = true; media.innerHTML = ''; d.documentElement.style.overflow = ''; }
  function showPhoto(i) {
    gi = (i + gal.length) % gal.length;
    var a = gal[gi], im = a.querySelector('img,video');
    open('<img src="' + a.getAttribute('href') + '" alt="' + ((im && im.getAttribute('alt')) || '') + '">', true);
  }
  if (lb) {
    lb.querySelector('.lb-ov').addEventListener('click', close);
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
      showPhoto(gal.indexOf(a));
      return;
    }
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' && href.length > 1 && go(href.slice(1), true)) {
      e.preventDefault();
      var mm = a.closest('.mm'); if (mm) toggleMenu(false);
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

  // Chapter menus (wide screens): highlight the section currently in view.
  var am = d.querySelector('.am');
  if (am) {
    var links = Array.prototype.slice.call(am.querySelectorAll('a'));
    var mark = function () {
      if (getComputedStyle(am).display === 'none') return;
      var cur = null, mid = 60;
      links.forEach(function (l) {
        var t = d.querySelector('.D [data-a="' + l.getAttribute('href').slice(1) + '"]');
        if (t && t.getBoundingClientRect().top <= mid) cur = l;
      });
      links.forEach(function (l) { l.classList.toggle('on', l === cur); });
    };
    w.addEventListener('scroll', mark, {passive: true});
    w.addEventListener('resize', mark);
    mark();
  }
})();
