// === スプライトアトラス構築 ===
// canvas を生成するため非純粋。main.js からのみ import される。
// createRadialGradient を毎フレーム数百回呼ぶのは重いので、
// 対数刻みの半径でオフスクリーン canvas にボケを焼き付け、
// drawImage + globalAlpha で再利用する。

import {
  TAU,
  RAIN_PALETTE,
  SPRITE_COUNT,
  RIPPLE_SPRITE_COUNT,
  RIPPLE_SPRITE_SIZE,
} from './config.js';
import { spriteRadius } from './geometry.js';

// 光点スプライト群 — { canvas, r, size } の配列。palette で色を切り替える。
export function buildSprites(palette = RAIN_PALETTE) {
  const { hue, sat } = palette;
  const sprites = [];
  for (let i = 0; i < SPRITE_COUNT; i++) {
    const r = spriteRadius(i);
    const size = Math.ceil(r * 2 + 4);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const sx = c.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const g = sx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `hsla(${hue}, ${sat}%, 84%, 1)`);
    g.addColorStop(0.35, `hsla(${hue}, ${sat}%, 76%, 0.65)`);
    g.addColorStop(0.7, `hsla(${hue}, ${sat}%, 68%, 0.25)`);
    g.addColorStop(1, `hsla(${hue}, ${sat}%, 61%, 0)`);
    sx.fillStyle = g;
    sx.beginPath();
    sx.arc(cx, cy, r, 0, TAU);
    sx.fill();
    sprites.push({ canvas: c, r, size });
  }
  return sprites;
}

// 飛沫スプライト (単一) — { canvas, r, size }
export function buildSplashSprite(palette = RAIN_PALETTE) {
  const { hue, sat } = palette;
  const r = 50;
  const size = r * 2 + 4;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const sx = canvas.getContext('2d');
  const cx = size / 2;
  const g = sx.createRadialGradient(cx, cx, 0, cx, cx, r);
  g.addColorStop(0, `hsla(${hue}, ${sat}%, 90%, 0.6)`);
  g.addColorStop(0.5, `hsla(${hue}, ${sat}%, 75%, 0.25)`);
  g.addColorStop(1, `hsla(${hue}, ${sat}%, 60%, 0)`);
  sx.fillStyle = g;
  sx.beginPath();
  sx.arc(cx, cx, r, 0, TAU);
  sx.fill();
  return { canvas, r, size };
}

// 波紋スプライト群 — 5段階の柔らかさ(sharp→soft)で事前に焼く。
// ピント面=鋭いリング、遠/近=幅広く拡散したリング
export function buildRippleSprites(palette = RAIN_PALETTE) {
  const { hue, sat } = palette;
  const rippleSprites = [];
  for (let i = 0; i < RIPPLE_SPRITE_COUNT; i++) {
    const softness = i / (RIPPLE_SPRITE_COUNT - 1);
    const c = document.createElement('canvas');
    c.width = c.height = RIPPLE_SPRITE_SIZE;
    const sx = c.getContext('2d');
    const cx = RIPPLE_SPRITE_SIZE / 2;
    const outerR = RIPPLE_SPRITE_SIZE * 0.49;
    const hw = 0.025 + softness * 0.32; // リング幅
    const peak = 1 - softness * 0.55;
    const g = sx.createRadialGradient(cx, cx, 0, cx, cx, outerR);
    g.addColorStop(Math.max(0, 0.5 - hw * 1.4), `hsla(${hue}, ${sat}%, 70%, 0)`);
    g.addColorStop(Math.max(0, 0.5 - hw * 0.5), `hsla(${hue}, ${sat}%, 82%, ${peak * 0.5})`);
    g.addColorStop(0.5, `hsla(${hue}, ${sat}%, 92%, ${peak})`);
    g.addColorStop(Math.min(1, 0.5 + hw * 0.5), `hsla(${hue}, ${sat}%, 82%, ${peak * 0.5})`);
    g.addColorStop(Math.min(1, 0.5 + hw * 1.4), `hsla(${hue}, ${sat}%, 70%, 0)`);
    sx.fillStyle = g;
    sx.beginPath();
    sx.arc(cx, cx, outerR, 0, TAU);
    sx.fill();
    rippleSprites.push(c);
  }
  return rippleSprites;
}
