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

  // ヒーローの波: ばらばらの細い帯 (一本一本が縁) が左から順に合流し、ねじれながら一本の大きな波になる。
  // ページを開いたときに一度だけ合流を見せ、そのあとは一本の波が静かに揺れ続ける。
  // マウスを当てる・クリックすると、そこに新しい縁 (光の点) が生まれ、互いにつながってから波に加わる。
  const canvas = document.querySelector('[data-wave]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, t0 = 0, raf = 0, strands = [], sparks = [], lastSpawn = 0;
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
    const ribbons = 6; // 束の中では 6 本のリボンにまとまり、縄のようにねじれる
    for (let i = 0; i < n; i++) strands.push({ y0: h * (.06 + (i / n) * .88 + (r() - .5) * .05), ph: r() * 6.28, delay: r(), amp: .02 + r() * .04, freq: 5 + r() * 6, rib: i % ribbons, tph: (i % ribbons) / ribbons * 6.28 + (r() - .5) * .35, rr: .34 + (Math.floor(i / ribbons) % 3) * .05 });
  };
  let S = 0; // 経過秒 (描画関数の外からも参照)
  const base = () => h * .83, maxW = () => (w < 600 ? 26 : 44);
  const front = (k) => smooth((S - 1.8 - k * 3.6) / 1.6); // 合流の前線 (左から右へ)
  const laneY = (k) => base() + Math.sin(k * 4.2 + S * .8) * h * .07 + Math.sin(k * 1.6 + S * .5) * h * .035;
  const draw = (s) => {
    S = s; ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, C[0]); g.addColorStop(.55, C[1]); g.addColorStop(1, C[2]);
    const n = strands.length, W = maxW();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 1) 束の芯: 合流した本数に応じて太く・濃くなる (左は細く、右へ行くほど太い)。薄い下地
    for (let x = 0; x < w; x += 12) {
      const k0 = x / w, k1 = Math.min(1, (x + 14) / w); const p0 = front(k0);
      if (p0 <= .02) continue;
      let arrived = 0; for (const st of strands) if (ease((s - st.delay) / 2) >= k1) arrived++;
      const t = p0 * arrived / n;
      ctx.strokeStyle = g; ctx.globalAlpha = .05 + .12 * t; ctx.lineWidth = 2 + W * t;
      ctx.beginPath(); ctx.moveTo(x, laneY(k0)); ctx.lineTo(x + 14, laneY(k1)); ctx.stroke();
    }
    // 2) 個々の帯: 束に入ると芯のまわりを縄のように巻く。奥を回る区間を先に (細く薄く)、手前を回る区間を後に (太く濃く) 描くと、ねじれが見える
    const TW = 1.7; // 画面の幅で何回ねじれるか
    const segs = [[], []]; // [奥, 手前]
    for (const st of strands) {
      const prog = ease((s - st.delay) / 2); if (prog <= 0) continue;
      let px = 0, py = 0, pd = 0;
      for (let x = 0; x <= w * prog; x += 5) {
        const k = x / w, pull = front(k);
        const free = st.y0 + Math.sin(k * st.freq + st.ph + s * 1.1) * h * st.amp;
        const ang = k * TW * 6.28 + st.tph - s * .7;
        const depth = Math.sin(ang);
        const bundleY = laneY(k) + Math.cos(ang) * W * st.rr;
        const y = free * (1 - pull) + bundleY * pull;
        if (x > 0) { const d = (pd + depth) / 2; segs[d * pull >= 0 ? 1 : 0].push([px, py, x, y, d * pull, pull]); }
        px = x; py = y; pd = depth;
      }
    }
    ctx.strokeStyle = g;
    for (const pass of [0, 1]) for (const [x0, y0, x1, y1, d, pull] of segs[pass]) {
      ctx.globalAlpha = .22 + .5 * (d + 1) / 2; ctx.lineWidth = 1.1 + (2.8 + 2.6 * d) * pull;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    // 3) 手前側の帯の上に、光が走る細い筋 (立体感)
    ctx.globalAlpha = .3; ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffffff'; ctx.beginPath();
    for (let x = 0; x <= w; x += 6) { const k = x / w; if (front(k) < .9) { ctx.moveTo(x, laneY(k) - W * .18); continue; } ctx.lineTo(x, laneY(k) - W * .18 + Math.sin(k * 7 + s) * 2); }
    ctx.stroke();
    // 4) 縁の点 (マウス・クリックで生まれる): 互いに線でつながり、波に引かれて加わる
    const now = s;
    sparks = sparks.filter((p) => now - p.born < p.life);
    for (const p of sparks) {
      const age = (now - p.born) / p.life; const k = p.x / w; const ty = laneY(k);
      const pullIn = smooth((age - .35) / .65);                  // 後半で波に吸い込まれる
      p.cx = p.x + p.vx * age * 60; p.cy = p.y + p.vy * age * 60; p.cy = p.cy * (1 - pullIn) + ty * pullIn;
      p.a = age < .15 ? age / .15 : 1 - smooth((age - .7) / .3);
    }
    ctx.strokeStyle = g;
    for (let i = 0; i < sparks.length; i++) {
      const a = sparks[i];
      for (let j = i + 1; j < sparks.length; j++) {
        const b = sparks[j]; const d = Math.hypot(a.cx - b.cx, a.cy - b.cy); const reach = w < 600 ? 110 : 160;
        if (d < reach) { ctx.globalAlpha = (1 - d / reach) * .5 * Math.min(a.a, b.a); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke(); }
      }
      // 波への糸: 近づくほど濃く
      const ty = laneY(a.cx / w); const dist = Math.abs(a.cy - ty);
      ctx.globalAlpha = Math.max(0, 1 - dist / (h * .5)) * .35 * a.a; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(a.cx + 18, ty); ctx.stroke();
    }
    for (const p of sparks) {
      ctx.globalAlpha = .9 * p.a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.cx, p.cy, 2.6, 0, 6.28); ctx.fill();
      ctx.globalAlpha = .25 * p.a; ctx.beginPath(); ctx.arc(p.cx, p.cy, 8, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const spawn = (x, y, count, spread) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.28, r = Math.random() * spread;
      sparks.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6 - .2, born: S, life: 3 + Math.random() * 1.5, a: 0, cx: x, cy: y });
    }
    if (sparks.length > 90) sparks.splice(0, sparks.length - 90);
  };
  const hero = canvas.parentElement;
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', (e) => { if (S - lastSpawn < .12) return; lastSpawn = S; const [x, y] = local(e); spawn(x, y, 1, 24); }, { passive: true });
  hero.addEventListener('pointerdown', (e) => { if (e.target.closest('a, button')) return; const [x, y] = local(e); spawn(x, y, 10, 70); }, { passive: true });
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
