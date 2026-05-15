// === 波紋 ===
// 地面着弾時のリング。ピント面で鋭く、遠/近でボケる。
// 地面を斜めに見ているので楕円(Y方向を圧縮)。
// canvas に描画するため非純粋。main.js から view 経由で利用される。

import { RIPPLE_Y_SQUASH } from './config.js';
import { hScale, pickRippleSpriteIndex } from './geometry.js';

export class Ripple {
  // view: { get W(), DPR, ctx, rippleSprites }
  constructor(view, x, y, depth, blur) {
    this.view = view;
    this.x = x;
    this.y = y;
    this.blur = blur;
    this.t = 0;
    this.life = 0.016 + Math.random() * 0.012;
    this.maxR = Math.min(view.W * 0.45, 0.13 * hScale(depth, view.W));
    this.sprite = view.rippleSprites[pickRippleSpriteIndex(blur / view.DPR)];
  }

  update() {
    this.t += this.life;
  }

  draw() {
    if (this.t >= 1) return;
    const { DPR, ctx } = this.view;
    const r = this.maxR * Math.pow(this.t, 0.55); // ease-out 拡大
    const a =
      this.t < 0.15
        ? this.t / 0.15 // 立ち上がり
        : Math.pow(1 - (this.t - 0.15) / 0.85, 1.5); // 減衰
    const rPx = this.blur / DPR;
    const sizeAtten = Math.min(1, 3.4 / Math.sqrt(Math.max(1, rPx)));
    const alpha = a * sizeAtten * 0.7;
    const w = r * 2;
    const h = w * RIPPLE_Y_SQUASH;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.sprite, this.x - w / 2, this.y - h / 2, w, h);
    ctx.globalAlpha = 1;
  }

  get dead() {
    return this.t >= 1;
  }
}
