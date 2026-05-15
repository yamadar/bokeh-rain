// === 純粋な数学・幾何ヘルパー ===
// DOM/canvas/window に一切触れない。すべて引数で受け取る。

import {
  focalD,
  depthMin,
  depthMax,
  SPRITE_BASE_R,
  SPRITE_GROWTH,
  SPRITE_COUNT,
  LOG_GROWTH,
  RIPPLE_SPRITE_COUNT,
} from './config.js';

// groundY(d) = horizonY + (bottomY - horizonY) / (1 + 5d)
//   d=0    → 1.0H   下端
//   d=1    → 0.667H ピント面
//   d=∞    → 0.6H   水平線
export function groundY(d, H) {
  return H * 0.6 + (H * 0.4) / (1 + 5 * d);
}

export function vScale(d, H) {
  return (H * 0.28) / d;
}

export function hScale(d, W) {
  return (W * 0.42) / d;
}

// 円錯乱 — cap して暴走防止
export function blurOf(d, DPR) {
  const raw = Math.abs(1 / d - 1 / focalD) * 60 + 0.6;
  return Math.min(raw, 230) * DPR;
}

// 深度分布 — focal=1 を中心に幾何級数的に分布。
// u ∈ [0,1) を受け取り depth を返す純関数(乱数注入でテスト可能)。
export function depthFromUniform(u) {
  const dev = (u - 0.5) * 2;
  const skewed = Math.sign(dev) * Math.pow(Math.abs(dev), 1.4);
  return Math.max(depthMin, Math.min(depthMax, focalD * Math.pow(6, skewed)));
}

// i 番目のスプライトの半径
export function spriteRadius(i) {
  return SPRITE_BASE_R * Math.pow(SPRITE_GROWTH, i);
}

// 半径 r に最も近いスプライトの index を返す(0..SPRITE_COUNT-1 にクランプ)
export function pickSpriteIndex(r) {
  let i = Math.round(Math.log(r / SPRITE_BASE_R) / LOG_GROWTH);
  if (i < 0) i = 0;
  else if (i >= SPRITE_COUNT) i = SPRITE_COUNT - 1;
  return i;
}

// 波紋スプライトの index を返す(0..RIPPLE_SPRITE_COUNT-1 にクランプ)
export function pickRippleSpriteIndex(rPx) {
  let i = Math.round(rPx / 18);
  if (i < 0) i = 0;
  else if (i >= RIPPLE_SPRITE_COUNT) i = RIPPLE_SPRITE_COUNT - 1;
  return i;
}
