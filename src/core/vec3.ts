/**
 * Minimal 3-component vector helpers operating on Float32Array.
 *
 * Float32Array is intentional: the extraction algorithm's output depends on
 * float32 rounding, so these must not be widened to number[] / float64.
 */
export type Vec3 = Float32Array;

/** Component-wise addition of `a` and `b`, stored into `out` (may alias `a` or `b`). */
export function add(a: Vec3, b: Vec3, out: Vec3): Vec3 {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/** Multiplies each component of `v` by `scalar`, stored into `out` (may alias `v`). */
export function scale(v: Vec3, scalar: number, out: Vec3): Vec3 {
  out[0] = v[0] * scalar;
  out[1] = v[1] * scalar;
  out[2] = v[2] * scalar;
  return out;
}

/** Squared euclidean distance between two points. */
export function distanceSquared(a: Vec3, b: Vec3): number {
  const x = a[0] - b[0];
  const y = a[1] - b[1];
  const z = a[2] - b[2];
  return x * x + y * y + z * z;
}

/** Creates a new Float32 vec3 initialized from the given values. */
export function fromValues(x: number, y: number, z: number): Vec3 {
  const v = new Float32Array(3);
  v[0] = x;
  v[1] = y;
  v[2] = z;
  return v;
}

/** Creates a new Float32 vec3 from any 3-element array-like. */
export function fromArray(values: ArrayLike<number>): Vec3 {
  return fromValues(values[0], values[1], values[2]);
}

/** Clones a vec3. */
export const clone = fromArray;
