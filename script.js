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

  // ヒーローの波: ばらばらの細い帯 (一本一本が縁) が左から順に合流し、一本の大きな波になる。
  // ページを開いたときに一度だけ合流を見せ、そのあとは一本の波が静かに揺れ続ける。
  const canvas = document.querySelector('[data-wave]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, t0 = 0, raf = 0, strands = [];
  const C = ['#6DCCD5', '#96CDA8', '#D1E135'];
  const rnd = (seed) => { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const smooth = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rnd(3); const n = w < 600 ? 16 : 28; strands = [];
    for (let i = 0; i < n; i++) strands.push({ y0: h * (.06 + (i / n) * .88 + (r() - .5) * .05), off: r() - .5, ph: r() * 6.28, delay: r(), amp: .02 + r() * .04, freq: 5 + r() * 6 });
  };
  const draw = (s) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, C[0]); g.addColorStop(.55, C[1]); g.addColorStop(1, C[2]);
    const n = strands.length, base = h * .83, maxW = w < 600 ? 26 : 44;
    const front = (k) => smooth((s - 1.8 - k * 3.6) / 1.6); // 合流の前線 (左から右へ)
    const laneY = (k) => base + Math.sin(k * 4.2 + s * .8) * h * .07 + Math.sin(k * 1.6 + s * .5) * h * .035;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 束の本体: 合流した本数に応じて太く・濃くなる一本の波
    for (let x = 0; x < w; x += 12) {
      const k0 = x / w, k1 = Math.min(1, (x + 14) / w); const p0 = front(k0);
      if (p0 <= .02) continue;
      let arrived = 0; for (const st of strands) if (ease((s - st.delay) / 2) >= k1) arrived++;
      const t = p0 * arrived / n;
      ctx.strokeStyle = g; ctx.globalAlpha = .12 + .5 * t; ctx.lineWidth = 2 + maxW * t;
      ctx.beginPath(); ctx.moveTo(x, laneY(k0)); ctx.lineTo(x + 14, laneY(k1)); ctx.stroke();
    }
    // 個々の帯: 束に入ると位置を少しずらし、より合わさった質感に
    for (const st of strands) {
      const prog = ease((s - st.delay) / 2); if (prog <= 0) continue;
      ctx.strokeStyle = g; ctx.beginPath();
      for (let x = 0; x <= w * prog; x += 5) {
        const k = x / w, pull = front(k);
        const free = st.y0 + Math.sin(k * st.freq + st.ph + s * 1.1) * h * st.amp;
        const inBundle = laneY(k) + st.off * maxW * .8 * Math.sin(k * 3 + st.ph + s * .7);
        const y = free * (1 - pull) + inBundle * pull;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.globalAlpha = .5; ctx.lineWidth = 1.1; ctx.stroke();
    }
    // 束の中央に、光が通るような細い筋
    ctx.globalAlpha = .35; ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.beginPath();
    for (let x = 0; x <= w; x += 6) { const k = x / w; if (front(k) < .9) { ctx.moveTo(x, laneY(k)); continue; } ctx.lineTo(x, laneY(k) - 2); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const loop = (now) => { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); };
  resize();
  if (reduceMotion) { draw(60); window.addEventListener('resize', () => { resize(); draw(60); }); return; } // 動きを減らす設定: 合流が終わった姿を静止で
  window.addEventListener('resize', resize);
  t0 = performance.now();
  // 画面に見えているときだけ動かす
  const heroIo = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
    else { cancelAnimationFrame(raf); raf = 0; }
  });
  heroIo.observe(canvas);
})();
