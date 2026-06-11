/**
 * Color palette extraction via histogram binning and K-means clustering in
 * CIELAB space.
 *
 * Derived from Google's color palette extraction research.
 * Copyright 2018 Google LLC — licensed under the Apache License, Version 2.0.
 * See the NOTICE file distributed with this work for details.
 */
import { labToRgb, rgbToHex, rgbToLab } from './color';
import { add, clone, distanceSquared, fromValues, scale, type Vec3 } from './vec3';

/** Raw RGBA pixel data, as produced by `CanvasRenderingContext2D.getImageData().data`. */
export type PixelData = Uint8ClampedArray | readonly number[];

export class PaletteExtractor {
  /** Total number of cells in the histogram (16 × 16 × 16 RGB buckets). */
  static readonly HISTOGRAM_SIZE = 4096;

  /**
   * Squared LAB-distance coefficient controlling how strongly weights near a
   * selected seed are attenuated. Higher values push seeds further apart.
   * For photos, anywhere from 900 to 6400 is reasonable.
   */
  static readonly SQUARED_SEPARATION_COEFFICIENT = 3650;

  /**
   * Histogram bins containing accumulated LAB values.
   * Sparse: only indices for non-empty bins are set, and the `in` checks below
   * rely on that.
   */
  #labs: Vec3[] = [];

  /** Pixel count for each histogram bin. */
  #weights: number[] = [];

  /** Seeds selected from the histogram. */
  #seeds: Vec3[] = [];

  /** Accumulated weight for each seed's cluster. */
  #seedWeights: number[] = [];

  /**
   * Generates a palette from raw RGBA pixel data.
   *
   * @param data Pixel colors, as extracted with `canvasContext.getImageData().data`.
   * @param paletteSize Maximum number of colors in the palette (default 5).
   * @returns Hex color strings, e.g. `['#1c0de7', '#e7731b']`. May contain
   *   fewer than `paletteSize` entries when the image has fewer distinct colors.
   */
  processImageData(data: PixelData, paletteSize = 5): string[] {
    this.#computeHistogram(data);
    this.#selectSeeds(paletteSize);
    this.#clusterColors();
    return this.#exportPalette();
  }

  /** Step 1: bins every pixel's LAB color into a 4096-cell RGB histogram. */
  #computeHistogram(data: PixelData): void {
    const l = data.length;
    this.#labs = [];
    this.#weights = new Array<number>(PaletteExtractor.HISTOGRAM_SIZE).fill(0);

    for (let i = 0; i < l; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lab = clone(rgbToLab(r, g, b));
      const index = (Math.floor(r / 16) * 16 + Math.floor(g / 16)) * 16 + Math.floor(b / 16);
      if (!(index in this.#labs)) {
        this.#labs[index] = lab;
      } else {
        add(this.#labs[index], lab, this.#labs[index]);
      }
      this.#weights[index]++;
    }
  }

  /**
   * Step 2: iteratively selects seeds as the heaviest bins, attenuating
   * weights around each selection to maximize color variance.
   */
  #selectSeeds(nbSeeds: number): void {
    this.#seeds = [];
    const mutableWeights = [...this.#weights];

    for (let i = 0; i < nbSeeds; ++i) {
      const maxIndex = this.#getHeaviestIndex(mutableWeights);

      // An empty heaviest bin means previous seeds already cover every
      // non-empty bin.
      if (mutableWeights[maxIndex] === 0) {
        break;
      }

      const seedColor = this.#addSeedByIndex(maxIndex);

      // Force the next seed to be different (unless all bin weights are 0).
      mutableWeights[maxIndex] = 0;
      this.#attenuateWeightsAroundSeed(mutableWeights, seedColor);
    }
  }

  /** Step 3: runs K-means on the histogram from the seeds until convergence. */
  #clusterColors(): void {
    if (!this.#seeds.length) {
      throw new Error('Please select seeds before clustering');
    }

    const clusterIndices = new Array<number>(PaletteExtractor.HISTOGRAM_SIZE).fill(0);
    let optimumReached = false;
    while (!optimumReached) {
      optimumReached = true;
      const newSeeds: Vec3[] = [];
      this.#seedWeights = new Array<number>(this.#seeds.length).fill(0);

      // Assign every bin of the color histogram to the closest seed.
      for (let i = 0; i < PaletteExtractor.HISTOGRAM_SIZE; i++) {
        if (this.#weights[i] === 0) continue;

        const clusterIndex = this.#getClosestSeedIndex(i);
        // Optimum is reached when no cluster assignment changes.
        if (optimumReached && clusterIndex !== clusterIndices[i]) {
          optimumReached = false;
        }
        clusterIndices[i] = clusterIndex;
        this.#addColorToSeed(newSeeds, clusterIndex, i);
      }
      // Average accumulated colors to get new seeds.
      this.#updateSeedsWithNewSeeds(newSeeds);
    }
  }

  /** Step 4: exports the current seeds as hex color strings. */
  #exportPalette(): string[] {
    if (!this.#seeds.length) {
      throw new Error('Please select seeds and get clusters before exporting a new palette');
    }

    return this.#seeds.map((seed) => {
      const rgb = labToRgb(seed[0], seed[1], seed[2]);
      return rgbToHex(rgb[0], rgb[1], rgb[2]);
    });
  }

  #attenuateWeightsAroundSeed(mutableWeights: number[], seedColor: Vec3): void {
    for (let i = 0; i < PaletteExtractor.HISTOGRAM_SIZE; i++) {
      if (this.#weights[i] > 0) {
        const targetColor = fromValues(0, 0, 0);
        scale(this.#labs[i], 1 / this.#weights[i], targetColor);
        mutableWeights[i] *=
          1 -
          Math.exp(
            -distanceSquared(seedColor, targetColor) /
              PaletteExtractor.SQUARED_SEPARATION_COEFFICIENT,
          );
      }
    }
  }

  /** Pushes the average color of a histogram bin onto the seeds list. */
  #addSeedByIndex(index: number): Vec3 {
    const seedColor = fromValues(0, 0, 0);
    scale(this.#labs[index], 1 / this.#weights[index], seedColor);
    this.#seeds.push(seedColor);
    return seedColor;
  }

  #getHeaviestIndex(weights: number[]): number {
    let heaviest = 0;
    let index = 0;
    for (let m = 0; m < PaletteExtractor.HISTOGRAM_SIZE; m++) {
      if (weights[m] > heaviest) {
        heaviest = weights[m];
        index = m;
      }
    }
    return index;
  }

  /** Accumulates a histogram bin's colors and weights into a cluster. */
  #addColorToSeed(seeds: Vec3[], clusterIndex: number, histogramIndex: number): void {
    if (!(clusterIndex in seeds)) {
      seeds[clusterIndex] = fromValues(0, 0, 0);
    }
    add(seeds[clusterIndex], this.#labs[histogramIndex], seeds[clusterIndex]);
    this.#seedWeights[clusterIndex] += this.#weights[histogramIndex];
  }

  /** Replaces the seeds with the weight-averaged accumulated cluster colors. */
  #updateSeedsWithNewSeeds(newSeeds: Vec3[]): void {
    for (let i = 0; i < this.#seeds.length; i++) {
      if (!(i in newSeeds) || this.#seedWeights[i] === 0) {
        newSeeds[i] = fromValues(0, 0, 0);
      } else {
        scale(newSeeds[i], 1 / this.#seedWeights[i], newSeeds[i]);
      }
      this.#seeds[i] = clone(newSeeds[i]);
    }
  }

  /** Finds the seed closest (in LAB space) to a histogram bin's average color. */
  #getClosestSeedIndex(index: number): number {
    const color = clone(this.#labs[index]);
    scale(color, 1 / this.#weights[index], color);
    let seedDistMin = Number.MAX_SAFE_INTEGER;
    let seedIndex = 0;
    for (let i = 0; i < this.#seeds.length; i++) {
      const dist = distanceSquared(this.#seeds[i], color);
      if (dist < seedDistMin) {
        seedDistMin = dist;
        seedIndex = i;
      }
    }
    return seedIndex;
  }
}

/**
 * Extracts a color palette from raw RGBA pixel data.
 *
 * Convenience wrapper around {@link PaletteExtractor} that returns an empty
 * array for empty input instead of throwing.
 *
 * @param data Pixel colors, as extracted with `canvasContext.getImageData().data`.
 * @param paletteSize Maximum number of colors in the palette (default 5).
 * @returns Hex color strings, most dominant first.
 */
export function extractColors(data: PixelData, paletteSize = 5): string[] {
  if (data.length < 4 || paletteSize < 1) {
    return [];
  }
  return new PaletteExtractor().processImageData(data, paletteSize);
}
