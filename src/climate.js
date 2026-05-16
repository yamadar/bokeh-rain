// === 天候（量・速度の増減 / 雪モード） ===
// DOM/canvas/window に一切触れない純粋モジュール。時刻はすべて引数で受け取る。

import {
  TAU,
  INTENSITY_MIN,
  INTENSITY_PERIOD_MS,
  SPEED_MIN,
  SPEED_PERIOD_MS,
  SNOW_START_HOUR,
  SNOW_END_HOUR,
} from './config.js';

// timeMs を周期 periodMs で min..1.0 の範囲を正弦的に往復させる。
// timeMs=0 で min、periodMs/2 で 1.0(Max)。
export function oscillate(timeMs, periodMs, min) {
  const wave = 0.5 - 0.5 * Math.cos((timeMs / periodMs) * TAU); // 0..1
  return min + (1 - min) * wave;
}

// hour(0..23) が雪モードの時間帯か。範囲は日付を跨いでもよい。
export function isSnowHour(hour, start = SNOW_START_HOUR, end = SNOW_END_HOUR) {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

// 現在の天候を返す。timeMs=アニメ経過ms, date=実時刻(Date)。
export function climateAt(timeMs, date) {
  return {
    intensity: oscillate(timeMs, INTENSITY_PERIOD_MS, INTENSITY_MIN),
    speed: oscillate(timeMs, SPEED_PERIOD_MS, SPEED_MIN),
    snow: isSnowHour(date.getHours()),
  };
}
