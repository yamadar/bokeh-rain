import './style.css';

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;

  function resize() {
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  resize();
  addEventListener('resize', resize);

  const TAU = Math.PI * 2;
  const BULB_HUE = 34;

  // === 幾何 ===
  // 水平線:        Y = H * 0.6   (画面下から40%)
  // ピント地面:    Y = H * 2/3   (画面下から1/3)
  // 下端:          Y = H
  // groundY(d) = horizonY + (bottomY - horizonY) / (1 + 5d)
  //   d=0    → 1.0H   下端
  //   d=1    → 0.667H ピント面
  //   d=∞    → 0.6H   水平線
  const focalD = 1.0;
  const depthMin = 0.025;     // 近距離 — 下端付近まで届く
  const depthMax = 3.0;

  function groundY(d) {
    return H * 0.6 + (H * 0.4) / (1 + 5 * d);
  }
  function vScale(d) { return H * 0.28 / d; }
  function hScale(d) { return W * 0.42 / d; }
  // 円錯乱 — cap して暴走防止
  function blurOf(d) {
    const raw = Math.abs(1 / d - 1 / focalD) * 60 + 0.6;
    return Math.min(raw, 230) * DPR;
  }

  // === スプライトアトラス ===
  // createRadialGradient を毎フレーム数百回呼ぶのは重い。
  // 対数刻みの半径でオフスクリーン canvas にボケを焼き付け、drawImage + globalAlpha で再利用
  const SPRITE_BASE_R = 4;
  const SPRITE_GROWTH = 1.4;
  const SPRITE_COUNT = 18;
  const LOG_GROWTH = Math.log(SPRITE_GROWTH);
  const sprites = [];
  function buildSprites() {
    for (let i = 0; i < SPRITE_COUNT; i++) {
      const r = SPRITE_BASE_R * Math.pow(SPRITE_GROWTH, i);
      const size = Math.ceil(r * 2 + 4);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const sx = c.getContext('2d');
      const cx = size / 2, cy = size / 2;
      const g = sx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,    `hsla(${BULB_HUE}, 100%, 84%, 1)`);
      g.addColorStop(0.35, `hsla(${BULB_HUE}, 100%, 76%, 0.65)`);
      g.addColorStop(0.7,  `hsla(${BULB_HUE}, 95%, 68%, 0.25)`);
      g.addColorStop(1,    `hsla(${BULB_HUE}, 90%, 61%, 0)`);
      sx.fillStyle = g;
      sx.beginPath();
      sx.arc(cx, cy, r, 0, TAU);
      sx.fill();
      sprites.push({ canvas: c, r, size });
    }
  }
  buildSprites();
  function pickSprite(r) {
    let i = Math.round(Math.log(r / SPRITE_BASE_R) / LOG_GROWTH);
    if (i < 0) i = 0;
    else if (i >= SPRITE_COUNT) i = SPRITE_COUNT - 1;
    return sprites[i];
  }

  // 飛沫スプライト (単一)
  const splashSpriteR = 50;
  const splashSpriteSize = splashSpriteR * 2 + 4;
  const splashSprite = document.createElement('canvas');
  splashSprite.width = splashSprite.height = splashSpriteSize;
  {
    const sx = splashSprite.getContext('2d');
    const cx = splashSpriteSize / 2;
    const g = sx.createRadialGradient(cx, cx, 0, cx, cx, splashSpriteR);
    g.addColorStop(0,   `hsla(${BULB_HUE}, 100%, 90%, 0.6)`);
    g.addColorStop(0.5, `hsla(${BULB_HUE}, 100%, 75%, 0.25)`);
    g.addColorStop(1,   `hsla(${BULB_HUE}, 95%, 60%, 0)`);
    sx.fillStyle = g;
    sx.beginPath();
    sx.arc(cx, cx, splashSpriteR, 0, TAU);
    sx.fill();
  }

  // === 波紋スプライトアトラス ===
  // 5段階の柔らかさ(sharp→soft)で事前に焼く。
  // ピント面=鋭いリング、遠/近=幅広く拡散したリング
  const RIPPLE_SPRITE_COUNT = 5;
  const RIPPLE_SPRITE_SIZE = 128;
  const rippleSprites = [];
  (function buildRippleSprites() {
    for (let i = 0; i < RIPPLE_SPRITE_COUNT; i++) {
      const softness = i / (RIPPLE_SPRITE_COUNT - 1);
      const c = document.createElement('canvas');
      c.width = c.height = RIPPLE_SPRITE_SIZE;
      const sx = c.getContext('2d');
      const cx = RIPPLE_SPRITE_SIZE / 2;
      const outerR = RIPPLE_SPRITE_SIZE * 0.49;
      const hw = 0.025 + softness * 0.32;       // リング幅
      const peak = 1 - softness * 0.55;
      const g = sx.createRadialGradient(cx, cx, 0, cx, cx, outerR);
      g.addColorStop(Math.max(0, 0.5 - hw * 1.4), `hsla(${BULB_HUE}, 100%, 70%, 0)`);
      g.addColorStop(Math.max(0, 0.5 - hw * 0.5), `hsla(${BULB_HUE}, 100%, 82%, ${peak * 0.5})`);
      g.addColorStop(0.5,                          `hsla(${BULB_HUE}, 100%, 92%, ${peak})`);
      g.addColorStop(Math.min(1, 0.5 + hw * 0.5), `hsla(${BULB_HUE}, 100%, 82%, ${peak * 0.5})`);
      g.addColorStop(Math.min(1, 0.5 + hw * 1.4), `hsla(${BULB_HUE}, 100%, 70%, 0)`);
      sx.fillStyle = g;
      sx.beginPath();
      sx.arc(cx, cx, outerR, 0, TAU);
      sx.fill();
      rippleSprites.push(c);
    }
  })();
  function pickRippleSprite(rPx) {
    let i = Math.round(rPx / 18);
    if (i < 0) i = 0;
    else if (i >= RIPPLE_SPRITE_COUNT) i = RIPPLE_SPRITE_COUNT - 1;
    return rippleSprites[i];
  }

  // === 雨粒 ===
  class Drop {
    constructor(initial) { this.reset(initial); }
    reset(initial) {
      // 深度分布 — focal=1 を中心に幾何級数的に分布、近距離もしっかり出す
      const u = Math.random();
      const dev = (u - 0.5) * 2;
      const skewed = Math.sign(dev) * Math.pow(Math.abs(dev), 1.4);
      this.depth = Math.max(depthMin, Math.min(depthMax, focalD * Math.pow(6, skewed)));

      // 画面X座標が左端〜右端で均等になるよう worldX を逆算
      // screenX = W/2 + worldX * hScale(depth)
      const margin = blurOf(this.depth) + 80 * DPR;
      const screenX = -margin + Math.random() * (W + 2 * margin);
      this.worldX = (screenX - W / 2) / hScale(this.depth);

      const topWY = groundY(this.depth) / vScale(this.depth);
      this.worldY = initial
        ? Math.random() * topWY * 1.1
        : topWY * (1.0 + Math.random() * 0.2);

      // 雨らしい速度 — 深度補正なし。vScale が小さい(=近距離)ほど画面上で速く動く視差
      this.fallSpeed = 0.022 + Math.random() * 0.016;

      this.phase = Math.random() * TAU;
      this.pulseSpeed = 0.006 + Math.random() * 0.022;
      this.pulseDepth = 0.25 + Math.random() * 0.3;
      this.lightness = 72 + Math.random() * 10;
    }

    screenPos(wY) {
      const y = wY !== undefined ? wY : this.worldY;
      return {
        x: W / 2 + this.worldX * hScale(this.depth),
        y: groundY(this.depth) - y * vScale(this.depth)
      };
    }

    update() {
      this.worldY -= this.fallSpeed;
      this.phase += this.pulseSpeed;
      if (this.worldY < 0) {
        const pos = this.screenPos(0);
        const blur = blurOf(this.depth);
        splashes.push(new Splash(pos.x, pos.y, blur));
        if (ripples.length < RIPPLE_MAX) {
          ripples.push(new Ripple(pos.x, pos.y, this.depth, blur));
        }
        this.reset(false);
      }
    }

    draw() {
      const pos = this.screenPos();
      const r = blurOf(this.depth);
      if (pos.x < -r - 60 || pos.x > W + r + 60) return;
      if (pos.y < -r - 60 || pos.y > H + r + 60) return;

      const flicker = (1 - this.pulseDepth) + this.pulseDepth * (0.5 + 0.5 * Math.sin(this.phase));
      const rPx = r / DPR;
      const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(rPx));
      const baseAlpha = Math.min(1, sizeAtten * flicker * 1.15);

      if (rPx < 2.5) {
        // ピント面付近: 鋭い点 + 広いハロー (小さいので直接描画)
        const h = BULB_HUE;
        const l = this.lightness;
        const haloR = r * 7;
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, haloR);
        g.addColorStop(0,    `hsla(${h}, 100%, 95%, ${baseAlpha})`);
        g.addColorStop(0.15, `hsla(${h}, 100%, ${l + 5}%, ${baseAlpha * 0.5})`);
        g.addColorStop(0.5,  `hsla(${h}, 95%, ${l - 5}%, ${baseAlpha * 0.08})`);
        g.addColorStop(1,    `hsla(${h}, 90%, ${l - 10}%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, haloR, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 245, 220, ${Math.min(1, baseAlpha)})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.9, 0, TAU);
        ctx.fill();
      } else {
        // off-focus: スプライトを scaled drawImage、globalAlpha で輝度変調
        const sprite = pickSprite(r);
        const w = sprite.size * (r / sprite.r);
        ctx.globalAlpha = baseAlpha;
        ctx.drawImage(sprite.canvas, pos.x - w / 2, pos.y - w / 2, w, w);
        ctx.globalAlpha = 1;
      }
    }
  }

  // === 着弾 ===
  class Splash {
    constructor(x, y, blur) {
      this.x = x; this.y = y;
      this.blur = blur;
      this.life = 1.0;
      this.maxR = (8 + Math.random() * 20) * DPR;   // 元のサイズ (8〜28px)
    }
    update() { this.life -= 0.045; }
    draw() {
      if (this.life <= 0) return;
      const r = this.maxR * (1.3 - this.life);
      const rPx = this.blur / DPR;
      const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(Math.max(1, rPx)));
      const a = this.life * this.life * sizeAtten;
      const w = splashSpriteSize * (r / splashSpriteR);
      ctx.globalAlpha = a;
      ctx.drawImage(splashSprite, this.x - w / 2, this.y - w / 2, w, w);
      ctx.globalAlpha = 1;
    }
    get dead() { return this.life <= 0; }
  }

  // === 波紋 ===
  // 地面着弾時のリング。ピント面で鋭く、遠/近でボケる。
  // 地面を斜めに見ているので楕円(Y方向を圧縮)
  const RIPPLE_MAX = 100;
  const RIPPLE_Y_SQUASH = 0.32;
  class Ripple {
    constructor(x, y, depth, blur) {
      this.x = x; this.y = y;
      this.blur = blur;
      this.t = 0;
      this.life = 0.016 + Math.random() * 0.012;
      this.maxR = Math.min(W * 0.45, 0.13 * hScale(depth));
      this.sprite = pickRippleSprite(blur / DPR);
    }
    update() { this.t += this.life; }
    draw() {
      if (this.t >= 1) return;
      const r = this.maxR * Math.pow(this.t, 0.55);    // ease-out 拡大
      const a = this.t < 0.15
        ? this.t / 0.15                                // 立ち上がり
        : Math.pow(1 - (this.t - 0.15) / 0.85, 1.5);   // 減衰
      const rPx = this.blur / DPR;
      const sizeAtten = Math.min(1, 3.4 / Math.sqrt(Math.max(1, rPx)));
      const alpha = a * sizeAtten * 0.7;
      const w = r * 2;
      const h = w * RIPPLE_Y_SQUASH;
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sprite, this.x - w / 2, this.y - h / 2, w, h);
      ctx.globalAlpha = 1;
    }
    get dead() { return this.t >= 1; }
  }

  const drops = [];
  const N = 300;
  for (let i = 0; i < N; i++) drops.push(new Drop(true));
  let splashes = [];
  let ripples = [];

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // 波紋を最初に描く(光点の下に)
    for (const r of ripples) { r.update(); r.draw(); }
    ripples = ripples.filter(r => !r.dead);

    for (const d of drops) { d.update(); d.draw(); }
    for (const s of splashes) { s.update(); s.draw(); }
    splashes = splashes.filter(s => !s.dead);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
