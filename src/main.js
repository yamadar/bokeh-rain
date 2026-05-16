// === エントリポイント ===
// canvas を掴み、スプライトを焼き、resize を配線し、アニメーションループを回す。
// 純粋なロジックは config.js / geometry.js に切り出してある。

import './style.css';
import { DROP_COUNT, RAIN_PALETTE, SNOW_PALETTE } from './config.js';
import { buildSprites, buildSplashSprite, buildRippleSprites } from './sprites.js';
import { climateAt, resolveSnow } from './climate.js';
import { Drop } from './drop.js';

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // 描画状態を共有する view オブジェクト。
  // W/H は resize で変わるので getter 経由で常に最新を渡す。
  const dims = { W: 0, H: 0 };
  // 雨(琥珀)・雪(白) それぞれのスプライトを事前に焼いておく。
  const rainKit = {
    sprites: buildSprites(RAIN_PALETTE),
    splashSprite: buildSplashSprite(RAIN_PALETTE),
    rippleSprites: buildRippleSprites(RAIN_PALETTE),
    palette: RAIN_PALETTE,
  };
  const snowKit = {
    sprites: buildSprites(SNOW_PALETTE),
    splashSprite: buildSplashSprite(SNOW_PALETTE),
    rippleSprites: buildRippleSprites(SNOW_PALETTE),
    palette: SNOW_PALETTE,
  };

  const view = {
    get W() {
      return dims.W;
    },
    get H() {
      return dims.H;
    },
    DPR,
    ctx,
    ...rainKit,
    // 天候 — 量/速度の増減と雪モード。frame で毎フレーム更新。
    climate: { intensity: 1, speed: 1, snow: false },
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

  // 雪モードのトグル — 自動(時刻判定) → 雪 → 雨 を巡回。
  const snowModes = [
    { override: 'auto', label: '雪モード: 自動' },
    { override: 'snow', label: '雪モード: 雪' },
    { override: 'rain', label: '雪モード: 雨' },
  ];
  let snowModeIndex = 0;
  const snowToggle = document.getElementById('snow-toggle');
  snowToggle.textContent = snowModes[snowModeIndex].label;
  snowToggle.addEventListener('click', () => {
    snowModeIndex = (snowModeIndex + 1) % snowModes.length;
    snowToggle.textContent = snowModes[snowModeIndex].label;
  });

  const t0 = performance.now();

  function frame() {
    // 天候を更新 — 量/速度は時間で増減、雪モードは時刻判定をボタンで上書き可。
    view.climate = climateAt(performance.now() - t0, new Date());
    view.climate.snow = resolveSnow(snowModes[snowModeIndex].override, view.climate.snow);
    const kit = view.climate.snow ? snowKit : rainKit;
    view.sprites = kit.sprites;
    view.splashSprite = kit.splashSprite;
    view.rippleSprites = kit.rippleSprites;
    view.palette = kit.palette;

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
