import { describe, expect, it } from 'vitest';
import { PaletteExtractor, extractColors } from '../src/core/PaletteExtractor';

/** Builds RGBA pixel data: `count` pixels of a single color. */
function px(r: number, g: number, b: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(r, g, b, 255);
  return out;
}

describe('extractColors', () => {
  it('returns the single color of a solid image', () => {
    expect(extractColors(px(200, 30, 30, 100), 4)).toEqual(['#c81e1e']);
  });

  it('finds both colors of a 50/50 two-color image', () => {
    const data = [...px(10, 10, 200, 50), ...px(240, 240, 20, 50)];
    const colors = extractColors(data, 4);
    expect(colors).toHaveLength(2);
    expect(colors).toContain('#0a0ac8');
    expect(colors).toContain('#f0f014');
  });

  it('respects paletteSize when the image has more distinct colors', () => {
    const data = [
      ...px(255, 0, 0, 20),
      ...px(0, 255, 0, 20),
      ...px(0, 0, 255, 20),
      ...px(255, 255, 0, 20),
      ...px(0, 255, 255, 20),
      ...px(255, 0, 255, 20),
    ];
    expect(extractColors(data, 3)).toHaveLength(3);
  });

  it('returns fewer colors than paletteSize when the image has fewer distinct colors', () => {
    expect(extractColors(px(50, 100, 150, 64), 5)).toHaveLength(1);
  });

  it('returns [] for empty pixel data', () => {
    expect(extractColors(new Uint8ClampedArray(0))).toEqual([]);
    expect(extractColors([])).toEqual([]);
  });

  it('returns [] for paletteSize < 1', () => {
    expect(extractColors(px(1, 2, 3, 10), 0)).toEqual([]);
  });

  it('accepts Uint8ClampedArray input', () => {
    expect(extractColors(new Uint8ClampedArray(px(200, 30, 30, 100)), 4)).toEqual(['#c81e1e']);
  });
});

/**
 * Golden tests: expected values were produced by running the original
 * JavaScript extractor (space_and_style paletteExtractor/extractor.js) in
 * Node on identical pixel data. The TypeScript port must reproduce them
 * exactly — Float32Array vectors and sparse-array semantics are load-bearing.
 */
describe('golden parity with the original extractor', () => {
  it('solid: 100px of rgb(200,30,30), size 4', () => {
    expect(new PaletteExtractor().processImageData(px(200, 30, 30, 100), 4)).toEqual(['#c81e1e']);
  });

  it('twoColors: 50/50 blue/yellow, size 4', () => {
    const data = [...px(10, 10, 200, 50), ...px(240, 240, 20, 50)];
    expect(new PaletteExtractor().processImageData(data, 4)).toEqual(['#0a0ac8', '#f0f014']);
  });

  it('sixColorsCapped: six primaries, size 3', () => {
    const data = [
      ...px(255, 0, 0, 20),
      ...px(0, 255, 0, 20),
      ...px(0, 0, 255, 20),
      ...px(255, 255, 0, 20),
      ...px(0, 255, 255, 20),
      ...px(255, 0, 255, 20),
    ];
    expect(new PaletteExtractor().processImageData(data, 3)).toEqual([
      '#ab00ff',
      '#9fff7a',
      '#ff0000',
    ]);
  });

  it('gradient: 256-step ramp, size 5', () => {
    const data: number[] = [];
    for (let i = 0; i < 256; i++) data.push(i, Math.floor(i / 2), 255 - i, 255);
    expect(new PaletteExtractor().processImageData(data, 5)).toEqual([
      '#1c0de7',
      '#e7731b',
      '#894378',
      '#5428af',
      '#b85b48',
    ]);
  });
});
