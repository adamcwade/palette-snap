/**
 * Color space conversions: sRGB ↔ XYZ ↔ CIELAB, and RGB → hex.
 *
 * Conversion formulas from http://www.easyrgb.com/index.php?X=MATH and
 * http://en.wikipedia.org/wiki/Lab_color_space#CIELAB-CIEXYZ_conversions
 */

/** Reference white point: Illuminant D65. */
const REF_X = 95.047;
const REF_Y = 100;
const REF_Z = 108.883;

/** RGB triple, each component an integer in [0, 255]. */
export type Rgb = [number, number, number];
/** CIELAB triple: [L, a, b]. */
export type Lab = [number, number, number];
/** CIEXYZ triple. */
export type Xyz = [number, number, number];

/**
 * Converts RGB color values (0–255 per channel) to CIELAB.
 */
export function rgbToLab(r: number, g: number, b: number): Lab {
  const xyz = rgbToXyz(r / 255, g / 255, b / 255);
  return xyzToLab(xyz[0], xyz[1], xyz[2]);
}

/**
 * Converts CIELAB color values to RGB, with each channel rounded and
 * clamped to [0, 255].
 */
export function labToRgb(l: number, a: number, b: number): Rgb {
  const xyz = labToXyz(l, a, b);
  const rgb = xyzToRgb(xyz[0], xyz[1], xyz[2]);
  return [
    Math.min(255, Math.max(0, Math.round(rgb[0] * 255))),
    Math.min(255, Math.max(0, Math.round(rgb[1] * 255))),
    Math.min(255, Math.max(0, Math.round(rgb[2] * 255))),
  ];
}

/**
 * Converts an RGB color to its `#rrggbb` hex representation.
 * Throws if any channel is not an integer in [0, 255].
 */
export function rgbToHex(r: number, g: number, b: number): string {
  if (r !== (r & 255) || g !== (g & 255) || b !== (b & 255)) {
    throw new Error(`"(${r},${g},${b})" is not a valid RGB color`);
  }
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function componentToHex(c: number): string {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

/** Converts linear-input sRGB values (0–1 per channel) to XYZ. */
export function rgbToXyz(r: number, g: number, b: number): Xyz {
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  r *= 100;
  g *= 100;
  b *= 100;
  return [
    r * 0.4124 + g * 0.3576 + b * 0.1805,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    r * 0.0193 + g * 0.1192 + b * 0.9505,
  ];
}

/** Converts XYZ color values to sRGB (0–1 per channel, unclamped). */
export function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  x /= 100;
  y /= 100;
  z /= 100;
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
  return [r, g, b];
}

/** Converts XYZ color values to CIELAB. */
export function xyzToLab(x: number, y: number, z: number): Lab {
  const xRatio = x / REF_X;
  const yRatio = y / REF_Y;
  const zRatio = z / REF_Z;
  return [
    yRatio > 0.008856 ? 116 * Math.pow(yRatio, 1 / 3) - 16 : 903.3 * yRatio,
    500 * (labTransform(xRatio) - labTransform(yRatio)),
    200 * (labTransform(yRatio) - labTransform(zRatio)),
  ];
}

/** Converts CIELAB color values to XYZ. */
export function labToXyz(l: number, a: number, b: number): Xyz {
  const p = (l + 16) / 116;
  return [
    REF_X * Math.pow(p + a / 500, 3),
    REF_Y * Math.pow(p, 3),
    REF_Z * Math.pow(p - b / 200, 3),
  ];
}

function labTransform(t: number): number {
  return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
}
