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

// === パレット（光色） ===
// hue/sat を差し替えるだけで雨(琥珀)↔雪(白)を切り替える。
export const RAIN_PALETTE = { hue: BULB_HUE, sat: 100, coreRGB: '255, 245, 220' };
export const SNOW_PALETTE = { hue: 210, sat: 0, coreRGB: '255, 255, 255' };

// === 天候の増減（量・速度） ===
// 現状を Max(=1.0) とし、min..1.0 を正弦的に往復させる。
export const INTENSITY_MIN = 0.35; // 降る量の最小割合
export const INTENSITY_PERIOD_MS = 22000; // 量の増減周期
export const SPEED_MIN = 0.45; // 落下速度の最小割合
export const SPEED_PERIOD_MS = 14000; // 速度の増減周期

// === 雪モード ===
// 時刻(hour)で切り替わる。SNOW_START_HOUR〜SNOW_END_HOUR が雪。
export const SNOW_START_HOUR = 18;
export const SNOW_END_HOUR = 6;
export const SNOW_FALL_FACTOR = 0.32; // 雪の落下速度倍率（ゆっくり）
export const SNOW_SWAY_AMP = 24; // ヒラヒラ横揺れの最大幅(px)
