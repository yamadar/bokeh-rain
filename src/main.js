// === エントリポイント ===
// canvas を掴み、スプライトを焼き、resize を配線し、アニメーションループを回す。
// 純粋なロジックは config.js / geometry.js に切り出してある。

import './style.css';
import { DROP_COUNT } from './config.js';
import { buildSprites, buildSplashSprite, buildRippleSprites } from './sprites.js';
import { Drop } from './drop.js';

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // 描画状態を共有する view オブジェクト。
  // W/H は resize で変わるので getter 経由で常に最新を渡す。
  const dims = { W: 0, H: 0 };
  const view = {
    get W() {
      return dims.W;
    },
    get H() {
      return dims.H;
    },
    DPR,
    ctx,
    sprites: buildSprites(),
    splashSprite: buildSplashSprite(),
    rippleSprites: buildRippleSprites(),
    splashes: [],
    ripples: [],
  };

  function resize() {
    dims.W = canvas.width = innerWidth * DPR;
    dims.H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  resize();
  addEventListener('resize', resize);

  const drops = [];
  for (let i = 0; i < DROP_COUNT; i++) drops.push(new Drop(view, true));

  function frame() {
    ctx.clearRect(0, 0, dims.W, dims.H);
    ctx.globalCompositeOperation = 'lighter';

    // 波紋を最初に描く(光点の下に)
    for (const r of view.ripples) {
      r.update();
      r.draw();
    }
    view.ripples = view.ripples.filter((r) => !r.dead);

    for (const d of drops) {
      d.update();
      d.draw();
    }
    for (const s of view.splashes) {
      s.update();
      s.draw();
    }
    view.splashes = view.splashes.filter((s) => !s.dead);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
