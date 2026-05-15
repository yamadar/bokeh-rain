import { describe, it, expect } from 'vitest';
import {
  groundY,
  vScale,
  hScale,
  blurOf,
  depthFromUniform,
  spriteRadius,
  pickSpriteIndex,
  pickRippleSpriteIndex,
} from './geometry.js';
import {
  focalD,
  depthMin,
  depthMax,
  SPRITE_BASE_R,
  SPRITE_GROWTH,
  SPRITE_COUNT,
  RIPPLE_SPRITE_COUNT,
} from './config.js';

describe('groundY', () => {
  const H = 1000;

  it('at d=0 sits at the bottom edge (1.0H)', () => {
    expect(groundY(0, H)).toBeCloseTo(H);
  });

  it('at focal depth d=1 sits at 2/3 H', () => {
    expect(groundY(1, H)).toBeCloseTo(H * (2 / 3));
  });

  it('approaches the horizon (0.6H) as depth grows', () => {
    expect(groundY(1e6, H)).toBeGreaterThan(H * 0.6);
    expect(groundY(1e6, H)).toBeLessThan(H * 0.601);
  });

  it('is strictly decreasing in depth (nearer drops sit lower)', () => {
    let prev = Infinity;
    for (let d = 0; d <= 3; d += 0.25) {
      const y = groundY(d, H);
      expect(y).toBeLessThan(prev);
      prev = y;
    }
  });

  it('scales linearly with H', () => {
    expect(groundY(0.7, 2000)).toBeCloseTo(2 * groundY(0.7, 1000));
  });
});

describe('vScale / hScale', () => {
  it('vScale is inversely proportional to depth', () => {
    expect(vScale(0.5, 1000)).toBeCloseTo(2 * vScale(1, 1000));
  });

  it('hScale is inversely proportional to depth', () => {
    expect(hScale(0.5, 1000)).toBeCloseTo(2 * hScale(1, 1000));
  });

  it('both shrink monotonically as depth increases', () => {
    let pv = Infinity;
    let ph = Infinity;
    for (let d = 0.1; d <= 3; d += 0.3) {
      const v = vScale(d, 800);
      const h = hScale(d, 1200);
      expect(v).toBeLessThan(pv);
      expect(h).toBeLessThan(ph);
      pv = v;
      ph = h;
    }
  });
});

describe('blurOf', () => {
  it('is near-minimal (~0.6*DPR) at the focal plane', () => {
    expect(blurOf(focalD, 1)).toBeCloseTo(0.6);
    expect(blurOf(focalD, 2)).toBeCloseTo(1.2);
  });

  it('increases away from focus on both sides', () => {
    const atFocus = blurOf(focalD, 1);
    expect(blurOf(0.3, 1)).toBeGreaterThan(atFocus);
    expect(blurOf(2.5, 1)).toBeGreaterThan(atFocus);
  });

  it('is capped at 230*DPR even for extreme near depths', () => {
    expect(blurOf(0.001, 1)).toBe(230);
    expect(blurOf(0.001, 2)).toBe(460);
  });

  it('scales with DPR', () => {
    expect(blurOf(0.5, 2)).toBeCloseTo(2 * blurOf(0.5, 1));
  });
});

describe('depthFromUniform', () => {
  it('maps u=0.5 to the focal depth', () => {
    expect(depthFromUniform(0.5)).toBeCloseTo(focalD);
  });

  it('stays within [depthMin, depthMax] across the whole unit interval', () => {
    for (let u = 0; u <= 1; u += 0.05) {
      const d = depthFromUniform(u);
      expect(d).toBeGreaterThanOrEqual(depthMin);
      expect(d).toBeLessThanOrEqual(depthMax);
    }
  });

  it('endpoints of the unit interval map to focalD/6 and focalD*6', () => {
    // dev=±1 → skewed=±1 → focalD * 6^±1; both lie inside [depthMin, depthMax]
    expect(depthFromUniform(0)).toBeCloseTo(focalD / 6);
    expect(depthFromUniform(1)).toBeCloseTo(focalD * 6 > depthMax ? depthMax : focalD * 6);
  });

  it('clamps out-of-range inputs to the configured bounds', () => {
    // u far outside [0,1] drives the geometric term past the limits
    expect(depthFromUniform(-100)).toBe(depthMin);
    expect(depthFromUniform(100)).toBe(depthMax);
  });

  it('is monotonically non-decreasing in u', () => {
    let prev = -Infinity;
    for (let u = 0; u <= 1; u += 0.02) {
      const d = depthFromUniform(u);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });
});

describe('spriteRadius', () => {
  it('starts at the base radius', () => {
    expect(spriteRadius(0)).toBe(SPRITE_BASE_R);
  });

  it('grows geometrically by SPRITE_GROWTH per index', () => {
    for (let i = 0; i < SPRITE_COUNT - 1; i++) {
      expect(spriteRadius(i + 1) / spriteRadius(i)).toBeCloseTo(SPRITE_GROWTH);
    }
  });
});

describe('pickSpriteIndex', () => {
  it('round-trips an exact sprite radius back to its index', () => {
    for (let i = 0; i < SPRITE_COUNT; i++) {
      expect(pickSpriteIndex(spriteRadius(i))).toBe(i);
    }
  });

  it('clamps below the base radius to index 0', () => {
    expect(pickSpriteIndex(0.001)).toBe(0);
    expect(pickSpriteIndex(SPRITE_BASE_R / 4)).toBe(0);
  });

  it('clamps above the largest radius to the last index', () => {
    expect(pickSpriteIndex(spriteRadius(SPRITE_COUNT) * 10)).toBe(SPRITE_COUNT - 1);
  });

  it('is non-decreasing as radius grows', () => {
    let prev = -1;
    for (let r = 1; r < 5000; r *= 1.3) {
      const idx = pickSpriteIndex(r);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
});

describe('pickRippleSpriteIndex', () => {
  it('maps tiny blur to the sharpest sprite (index 0)', () => {
    expect(pickRippleSpriteIndex(0)).toBe(0);
    expect(pickRippleSpriteIndex(-50)).toBe(0);
  });

  it('clamps large blur to the softest sprite', () => {
    expect(pickRippleSpriteIndex(10000)).toBe(RIPPLE_SPRITE_COUNT - 1);
  });

  it('stays within bounds and is non-decreasing across the blur range', () => {
    let prev = -1;
    for (let rPx = 0; rPx <= 200; rPx += 5) {
      const idx = pickRippleSpriteIndex(rPx);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(RIPPLE_SPRITE_COUNT);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
});
