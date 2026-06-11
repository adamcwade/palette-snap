import { describe, expect, it } from 'vitest';
import { labToRgb, rgbToHex, rgbToLab } from '../src/core/color';

describe('rgbToHex', () => {
  it('converts colors with zero-padded components', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(0, 128, 17)).toBe('#008011');
  });

  it('throws on out-of-range components', () => {
    expect(() => rgbToHex(256, 0, 0)).toThrow();
    expect(() => rgbToHex(-1, 0, 0)).toThrow();
    expect(() => rgbToHex(0, 12.5, 0)).toThrow();
  });
});

describe('rgbToLab', () => {
  it('converts white to L=100, a≈0, b≈0', () => {
    const [l, a, b] = rgbToLab(255, 255, 255);
    expect(l).toBeCloseTo(100, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it('converts black to [0, 0, 0]', () => {
    const [l, a, b] = rgbToLab(0, 0, 0);
    expect(l).toBeCloseTo(0, 5);
    expect(a).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it('converts pure red to known LAB values', () => {
    const [l, a, b] = rgbToLab(255, 0, 0);
    expect(l).toBeCloseTo(53.24, 1);
    expect(a).toBeCloseTo(80.09, 1);
    expect(b).toBeCloseTo(67.2, 1);
  });
});

describe('LAB ↔ RGB round-trip', () => {
  const samples: Array<[number, number, number]> = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [200, 30, 30],
    [10, 10, 200],
    [240, 240, 20],
    [128, 128, 128],
    [17, 84, 219],
  ];

  it.each(samples)('round-trips rgb(%i, %i, %i) within ±1 per channel', (r, g, b) => {
    const [l, a, labB] = rgbToLab(r, g, b);
    const [r2, g2, b2] = labToRgb(l, a, labB);
    expect(Math.abs(r2 - r)).toBeLessThanOrEqual(1);
    expect(Math.abs(g2 - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(b2 - b)).toBeLessThanOrEqual(1);
  });
});
