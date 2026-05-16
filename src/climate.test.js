import { describe, it, expect } from 'vitest';
import { oscillate, isSnowHour, climateAt } from './climate.js';
import { INTENSITY_MIN, SPEED_MIN } from './config.js';

describe('oscillate', () => {
  it('timeMs=0 で min を返す', () => {
    expect(oscillate(0, 1000, 0.3)).toBeCloseTo(0.3);
  });

  it('periodMs/2 で 1.0(Max) を返す', () => {
    expect(oscillate(500, 1000, 0.3)).toBeCloseTo(1.0);
  });

  it('1周期後は min に戻る', () => {
    expect(oscillate(1000, 1000, 0.3)).toBeCloseTo(0.3);
  });

  it('常に min..1.0 の範囲に収まる', () => {
    for (let t = 0; t <= 3000; t += 37) {
      const v = oscillate(t, 1000, 0.3);
      expect(v).toBeGreaterThanOrEqual(0.3 - 1e-9);
      expect(v).toBeLessThanOrEqual(1.0 + 1e-9);
    }
  });

  it('前半周期は単調増加する', () => {
    let prev = -Infinity;
    for (let t = 0; t <= 500; t += 25) {
      const v = oscillate(t, 1000, 0.3);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe('isSnowHour', () => {
  it('start<end: 範囲内が真、開始は含み終了は含まない', () => {
    expect(isSnowHour(10, 8, 12)).toBe(true);
    expect(isSnowHour(8, 8, 12)).toBe(true);
    expect(isSnowHour(12, 8, 12)).toBe(false);
    expect(isSnowHour(7, 8, 12)).toBe(false);
  });

  it('start>end: 日付を跨ぐ範囲', () => {
    expect(isSnowHour(23, 18, 6)).toBe(true);
    expect(isSnowHour(3, 18, 6)).toBe(true);
    expect(isSnowHour(18, 18, 6)).toBe(true);
    expect(isSnowHour(6, 18, 6)).toBe(false);
    expect(isSnowHour(12, 18, 6)).toBe(false);
  });

  it('start===end は常に偽', () => {
    expect(isSnowHour(5, 9, 9)).toBe(false);
  });
});

describe('climateAt', () => {
  it('intensity/speed は下限以上 1.0 以下', () => {
    for (let t = 0; t < 60000; t += 1234) {
      const c = climateAt(t, new Date(2026, 0, 1, 12));
      expect(c.intensity).toBeGreaterThanOrEqual(INTENSITY_MIN - 1e-9);
      expect(c.intensity).toBeLessThanOrEqual(1 + 1e-9);
      expect(c.speed).toBeGreaterThanOrEqual(SPEED_MIN - 1e-9);
      expect(c.speed).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('時刻で雪モードが決まる', () => {
    expect(climateAt(0, new Date(2026, 0, 1, 23)).snow).toBe(true);
    expect(climateAt(0, new Date(2026, 0, 1, 12)).snow).toBe(false);
  });
});
