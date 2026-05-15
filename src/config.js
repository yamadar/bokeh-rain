// === 定数・設定 ===
// DOM/canvas に一切触れない純粋な定数モジュール。

export const TAU = Math.PI * 2;
export const BULB_HUE = 34;

// === 幾何 ===
// 水平線:        Y = H * 0.6   (画面下から40%)
// ピント地面:    Y = H * 2/3   (画面下から1/3)
// 下端:          Y = H
export const focalD = 1.0;
export const depthMin = 0.025; // 近距離 — 下端付近まで届く
export const depthMax = 3.0;

// === スプライトアトラス ===
export const SPRITE_BASE_R = 4;
export const SPRITE_GROWTH = 1.4;
export const SPRITE_COUNT = 18;
export const LOG_GROWTH = Math.log(SPRITE_GROWTH);

// === 波紋スプライトアトラス ===
export const RIPPLE_SPRITE_COUNT = 5;
export const RIPPLE_SPRITE_SIZE = 128;

// === シミュレーション ===
export const DROP_COUNT = 300;
export const RIPPLE_MAX = 100;
export const RIPPLE_Y_SQUASH = 0.32;
