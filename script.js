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
    // 4) 縁の広がり (マウス・クリックで生まれる):
    //    ひとつの縁から次の縁が生まれて右へ広がり (連鎖)、広がったものが一本の支流にまとまり、太くなりながら大きな波に流れ込む
    const now = s;
    // 連鎖: 生まれて少し経った点が、次の点を右斜めに生む
    for (const p of sparks.slice()) {
      if (p.gen < p.maxGen && !p.spawned && now - p.born > .26 && sparks.length < 260) {
        p.spawned = true; const kids = p.gen === 0 ? 3 : 2;
        for (let i = 0; i < kids; i++) {
          const a = (Math.random() - .5) * 2.4; const r = (55 + Math.random() * 70) * (w < 600 ? .6 : 1);
          sparks.push({ x: p.x + Math.cos(a) * r + 10, y: p.y + Math.sin(a) * r, ox: p.ox, oy: p.oy, L: p.L, gen: p.gen + 1, maxGen: p.maxGen, born: now, life: p.life - .25, parent: p, spawned: false, cx: p.cx, cy: p.cy, a: 0 });
        }
      }
    }
    sparks = sparks.filter((p) => now - p.born < p.life);
    // 支流の道筋: 生まれた場所から、右下へ曲がって大きな波に入る
    const streamY = (ox, oy, L, x) => { const u = smooth((x - ox) / L); return oy * (1 - u) + laneY(Math.min(1, x / w)) * u; };
    for (const p of sparks) {
      const age = now - p.born; const t = age / p.life;
      const gather = smooth((age - 1.6) / 1.8);                                 // 後半で支流にまとまる
      const drift = Math.min(age, 1.2) * 26 + Math.max(0, age - 1.2) * 70;      // 右へ流れる速さ (まとまってからは速く)
      const fx = p.x + drift, fy = p.y;
      const sy = streamY(p.ox, p.oy, p.L, fx);
      p.cx = fx; p.cy = fy * (1 - gather) + sy * gather;
      p.a = (age < .25 ? age / .25 : 1) * (1 - smooth((t - .75) / .25));
    }
    // 線: 親子の線 (縁が縁を呼ぶ) と、近い点どうしの線。まとまるほど太く
    ctx.strokeStyle = g;
    for (const p of sparks) {
      if (p.parent && p.parent.a > 0) { ctx.globalAlpha = .45 * Math.min(p.a, p.parent.a); ctx.lineWidth = 1 + 1.5 * smooth((now - p.born - 1.2) / 1.6); ctx.beginPath(); ctx.moveTo(p.parent.cx, p.parent.cy); ctx.lineTo(p.cx, p.cy); ctx.stroke(); }
    }
    const reach = w < 600 ? 90 : 130;
    for (let i = 0; i < sparks.length; i++) for (let j = i + 1; j < sparks.length; j++) {
      const a = sparks[i], b = sparks[j]; if (a.ox !== b.ox) continue;
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      if (d < reach) { ctx.globalAlpha = (1 - d / reach) * .3 * Math.min(a.a, b.a); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke(); }
    }
    // 支流の本体: まとまった点の数に応じて太くなり、大きな波へ流れ込む
    const groups = new Map();
    for (const p of sparks) { const key = p.ox; if (!groups.has(key)) groups.set(key, { ox: p.ox, oy: p.oy, L: p.L, n: 0, born: Infinity, a: 0 }); const gr = groups.get(key); gr.n++; gr.born = Math.min(gr.born, p.born); gr.a = Math.max(gr.a, p.a); }
    for (const gr of groups.values()) {
      const age = now - gr.born; const prog = smooth((age - 1.0) / 2.2); if (prog <= 0) continue;
      const endX = gr.ox + gr.L * prog; const fade = 1 - smooth((age - 4.2) / 1.2);
      ctx.strokeStyle = g; ctx.lineCap = 'round';
      for (let x = gr.ox; x < endX; x += 10) {
        const u = (x - gr.ox) / gr.L; ctx.globalAlpha = (.12 + .4 * u) * fade; ctx.lineWidth = 1 + (W * .6) * u * Math.min(1, gr.n / 18);
        ctx.beginPath(); ctx.moveTo(x, streamY(gr.ox, gr.oy, gr.L, x)); ctx.lineTo(Math.min(endX, x + 11), streamY(gr.ox, gr.oy, gr.L, Math.min(endX, x + 11))); ctx.stroke();
      }
    }
    // 点
    for (const p of sparks) {
      const r = 2.4 - 1.2 * smooth((now - p.born - 1.2) / 1.6);
      ctx.globalAlpha = .9 * p.a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, 6.28); ctx.fill();
      ctx.globalAlpha = .22 * p.a; ctx.beginPath(); ctx.arc(p.cx, p.cy, r * 3, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  // 縁の種をまく: maxGen が大きいほど広がる。L = 支流が大きな波に入るまでの横の長さ
  const seed = (x, y, maxGen) => {
    if (sparks.length > 200) return;
    const L = Math.max(160, Math.min(w - x, w * (w < 600 ? .55 : .38)));
    sparks.push({ x, y, ox: x, oy: y, L, gen: 0, maxGen, born: S, life: 5.2, parent: null, spawned: false, cx: x, cy: y, a: 0 });
  };
  const hero = canvas.parentElement;
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch' || S - lastSpawn < .55) return; lastSpawn = S; const [x, y] = local(e); seed(x, y, 3); }, { passive: true });
  hero.addEventListener('pointerdown', (e) => { if (e.target.closest('a, button')) return; const [x, y] = local(e); seed(x, y, 5); }, { passive: true });
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
