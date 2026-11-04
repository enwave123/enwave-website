// 株式会社ENWAVE コーポレートサイト (2026-11 リニューアル)
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ヘッダー: スクロールしたら背景を付ける
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // スマホのメニュー
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));

  // スクロールで表示
  const items = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  // ヒーローの波 (ロゴの色。ティール → ライム)
  const canvas = document.querySelector('[data-wave]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, t = 0, raf = 0;
  const waves = [
    { amp: 0.060, len: 1.15, speed: 0.00035, y: 0.72, alpha: 0.70, width: 2.0 },
    { amp: 0.045, len: 0.85, speed: 0.00050, y: 0.76, alpha: 0.50, width: 1.6 },
    { amp: 0.075, len: 1.45, speed: 0.00025, y: 0.80, alpha: 0.38, width: 1.3 },
    { amp: 0.035, len: 0.65, speed: 0.00060, y: 0.84, alpha: 0.26, width: 1.0 },
  ];
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#4fc6cf');
    grad.addColorStop(0.6, '#8fd6a9');
    grad.addColorStop(1, '#c6e03a');
    waves.forEach((wv, i) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const p = x / w;
        const y = h * wv.y
          + Math.sin(p * Math.PI * 2 * wv.len + t * wv.speed * 6 + i) * h * wv.amp
          + Math.sin(p * Math.PI * 5 * wv.len - t * wv.speed * 3) * h * wv.amp * 0.25;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad;
      ctx.globalAlpha = wv.alpha;
      ctx.lineWidth = wv.width;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };
  const loop = (now) => { t = now; draw(); raf = requestAnimationFrame(loop); };
  resize();
  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
  if (reduceMotion) { draw(); return; }
  // 画面に見えているときだけ動かす
  const heroIo = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
    else { cancelAnimationFrame(raf); raf = 0; }
  });
  heroIo.observe(canvas);
})();
