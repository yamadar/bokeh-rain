// === 雨粒 ===
// canvas に描画するため非純粋。main.js から view 経由で利用される。

import { TAU, RIPPLE_MAX, SNOW_FALL_FACTOR, SNOW_SWAY_AMP } from './config.js';
import { groundY, vScale, hScale, blurOf, depthFromUniform, pickSpriteIndex } from './geometry.js';
import { Splash } from './splash.js';
import { Ripple } from './ripple.js';

export class Drop {
  // view: { get W(), get H(), DPR, ctx, sprites, splashSprite, rippleSprites, splashes, ripples }
  constructor(view, initial) {
    this.view = view;
    // 降る量の増減用 — 安定したランク。climate.intensity を下回ると活性。
    this.rank = Math.random();
    this.parked = false;
    this.reset(initial);
  }

  reset(initial) {
    const { W, H, DPR } = this.view;

    // 深度分布 — focal=1 を中心に幾何級数的に分布、近距離もしっかり出す
    this.depth = depthFromUniform(Math.random());

    // 画面X座標が左端〜右端で均等になるよう worldX を逆算
    // screenX = W/2 + worldX * hScale(depth)
    const margin = blurOf(this.depth, DPR) + 80 * DPR;
    const screenX = -margin + Math.random() * (W + 2 * margin);
    this.worldX = (screenX - W / 2) / hScale(this.depth, W);

    const topWY = groundY(this.depth, H) / vScale(this.depth, H);
    this.worldY = initial ? Math.random() * topWY * 1.1 : topWY * (1.0 + Math.random() * 0.2);

    // 雨らしい速度 — 深度補正なし。vScale が小さい(=近距離)ほど画面上で速く動く視差
    this.fallSpeed = 0.022 + Math.random() * 0.016;

    this.phase = Math.random() * TAU;
    this.pulseSpeed = 0.006 + Math.random() * 0.022;
    this.pulseDepth = 0.25 + Math.random() * 0.3;
    this.lightness = 72 + Math.random() * 10;

    // 雪モードのヒラヒラ横揺れ
    this.swayPhase = Math.random() * TAU;
    this.swaySpeed = 0.02 + Math.random() * 0.035;
    this.swayAmp = 0.5 + Math.random() * 0.5;
  }

  screenPos(wY) {
    const { W, H, DPR, climate } = this.view;
    const y = wY !== undefined ? wY : this.worldY;
    let x = W / 2 + this.worldX * hScale(this.depth, W);
    if (climate.snow) {
      x += Math.sin(this.swayPhase) * SNOW_SWAY_AMP * this.swayAmp * DPR;
    }
    return {
      x,
      y: groundY(this.depth, H) - y * vScale(this.depth, H),
    };
  }

  update() {
    const { DPR, splashes, ripples, climate } = this.view;
    const active = this.rank < climate.intensity;

    // 降る量の増減 — 不活性な雨粒は着弾後に待機(parked)し、描画されない。
    if (this.parked) {
      if (!active) return;
      this.parked = false;
      this.reset(false);
    }

    this.phase += this.pulseSpeed;
    this.swayPhase += this.swaySpeed;

    // 速度の増減 — climate.speed で全体を変調。雪はさらにゆっくり。
    let speed = this.fallSpeed * climate.speed;
    if (climate.snow) speed *= SNOW_FALL_FACTOR;
    this.worldY -= speed;

    if (this.worldY < 0) {
      const pos = this.screenPos(0);
      const blur = blurOf(this.depth, DPR);
      splashes.push(new Splash(this.view, pos.x, pos.y, blur));
      if (ripples.length < RIPPLE_MAX) {
        ripples.push(new Ripple(this.view, pos.x, pos.y, this.depth, blur));
      }
      if (active) this.reset(false);
      else this.parked = true;
    }
  }

  draw() {
    if (this.parked) return;
    const { W, H, DPR, ctx, sprites, palette } = this.view;
    const pos = this.screenPos();
    const r = blurOf(this.depth, DPR);
    if (pos.x < -r - 60 || pos.x > W + r + 60) return;
    if (pos.y < -r - 60 || pos.y > H + r + 60) return;

    const flicker = 1 - this.pulseDepth + this.pulseDepth * (0.5 + 0.5 * Math.sin(this.phase));
    const rPx = r / DPR;
    const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(rPx));
    const baseAlpha = Math.min(1, sizeAtten * flicker * 1.15);

    if (rPx < 2.5) {
      // ピント面付近: 鋭い点 + 広いハロー (小さいので直接描画)
      const h = palette.hue;
      const s = palette.sat;
      const l = this.lightness;
      const haloR = r * 7;
      const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, haloR);
      g.addColorStop(0, `hsla(${h}, ${s}%, 95%, ${baseAlpha})`);
      g.addColorStop(0.15, `hsla(${h}, ${s}%, ${l + 5}%, ${baseAlpha * 0.5})`);
      g.addColorStop(0.5, `hsla(${h}, ${s}%, ${l - 5}%, ${baseAlpha * 0.08})`);
      g.addColorStop(1, `hsla(${h}, ${s}%, ${l - 10}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, haloR, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(${palette.coreRGB}, ${Math.min(1, baseAlpha)})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 0.9, 0, TAU);
      ctx.fill();
    } else {
      // off-focus: スプライトを scaled drawImage、globalAlpha で輝度変調
      const sprite = sprites[pickSpriteIndex(r)];
      const w = sprite.size * (r / sprite.r);
      ctx.globalAlpha = baseAlpha;
      ctx.drawImage(sprite.canvas, pos.x - w / 2, pos.y - w / 2, w, w);
      ctx.globalAlpha = 1;
    }
  }
}
