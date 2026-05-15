// === 着弾 ===
// canvas に描画するため非純粋。main.js から view 経由で利用される。

export class Splash {
  // view: { DPR, ctx, splashSprite: { canvas, r, size } }
  constructor(view, x, y, blur) {
    this.view = view;
    this.x = x;
    this.y = y;
    this.blur = blur;
    this.life = 1.0;
    this.maxR = (8 + Math.random() * 20) * view.DPR; // 元のサイズ (8〜28px)
  }

  update() {
    this.life -= 0.045;
  }

  draw() {
    if (this.life <= 0) return;
    const { DPR, ctx, splashSprite } = this.view;
    const r = this.maxR * (1.3 - this.life);
    const rPx = this.blur / DPR;
    const sizeAtten = Math.min(1.0, 3.4 / Math.sqrt(Math.max(1, rPx)));
    const a = this.life * this.life * sizeAtten;
    const w = splashSprite.size * (r / splashSprite.r);
    ctx.globalAlpha = a;
    ctx.drawImage(splashSprite.canvas, this.x - w / 2, this.y - w / 2, w, w);
    ctx.globalAlpha = 1;
  }

  get dead() {
    return this.life <= 0;
  }
}
