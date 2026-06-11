import { useCallback, useEffect, useRef, useState } from 'react';
import { extractColors } from '../core/PaletteExtractor';

/** Anything `extract()` can read pixels from. Strings are URLs or data URLs. */
export type PaletteSource = File | Blob | HTMLImageElement | string;

export interface UsePaletteOptions {
  /** Maximum number of colors to extract. Default 5. */
  paletteSize?: number;
  /**
   * Images wider than this are downscaled before extraction. Smaller is
   * faster with nearly identical palettes. Default 400.
   */
  maxImageWidth?: number;
  /** `crossOrigin` applied when loading string URL sources. Default `'anonymous'`. */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface UsePaletteResult {
  /** Extracted hex colors, most dominant first. Empty until extraction completes. */
  colors: string[];
  /** Displayable URL for the most recently extracted image, or null. */
  previewUrl: string | null;
  loading: boolean;
  error: Error | null;
  /** Extracts a palette from the given source. Browser-only. */
  extract: (source: PaletteSource) => Promise<string[]>;
  /** Clears colors, preview, and error state. */
  reset: () => void;
}

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load image${src.startsWith('data:') ? '' : `: ${src}`}`));
    img.src = src;
  });
}

function readPixels(img: HTMLImageElement, maxWidth: number): Uint8ClampedArray {
  const ratio = img.naturalWidth / img.naturalHeight;
  const width = Math.max(1, Math.round(Math.min(maxWidth, img.naturalWidth)));
  const height = Math.max(1, Math.round(width / ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not create a 2d canvas context');
  }
  ctx.drawImage(img, 0, 0, width, height);
  try {
    return ctx.getImageData(0, 0, width, height).data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'SecurityError') {
      throw new Error(
        'Cannot read pixels from a cross-origin image. Serve the image with CORS headers ' +
          'or pass a File/Blob instead.',
      );
    }
    throw err;
  }
}

/**
 * Headless palette extraction. Hand `extract()` a File, Blob, image element,
 * or URL and get back hex colors plus a preview URL for rendering the image.
 */
export function usePalette(options: UsePaletteOptions = {}): UsePaletteResult {
  const { paletteSize = 5, maxImageWidth = 400, crossOrigin = 'anonymous' } = options;

  const [colors, setColors] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Discards results from superseded extract() calls.
  const requestToken = useRef(0);
  // Object URLs we created, so we can revoke them.
  const ownedUrl = useRef<string | null>(null);

  const releaseOwnedUrl = useCallback(() => {
    if (ownedUrl.current) {
      URL.revokeObjectURL(ownedUrl.current);
      ownedUrl.current = null;
    }
  }, []);

  useEffect(() => releaseOwnedUrl, [releaseOwnedUrl]);

  const extract = useCallback(
    async (source: PaletteSource): Promise<string[]> => {
      const token = ++requestToken.current;
      setLoading(true);
      setError(null);

      let objectUrl: string | null = null;
      try {
        let img: HTMLImageElement;
        let preview: string;

        if (typeof source === 'string') {
          img = await loadImage(source, crossOrigin);
          preview = source;
        } else if (source instanceof HTMLImageElement) {
          img = source.complete
            ? source
            : await loadImage(source.src, source.crossOrigin ?? undefined);
          preview = source.src;
        } else {
          objectUrl = URL.createObjectURL(source);
          img = await loadImage(objectUrl);
          preview = objectUrl;
        }

        const palette = extractColors(readPixels(img, maxImageWidth), paletteSize);

        if (token === requestToken.current) {
          releaseOwnedUrl();
          ownedUrl.current = objectUrl;
          setColors(palette);
          setPreviewUrl(preview);
          setLoading(false);
        } else if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        return palette;
      } catch (err) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        const wrapped = err instanceof Error ? err : new Error(String(err));
        if (token === requestToken.current) {
          setError(wrapped);
          setLoading(false);
        }
        throw wrapped;
      }
    },
    [paletteSize, maxImageWidth, crossOrigin, releaseOwnedUrl],
  );

  const reset = useCallback(() => {
    requestToken.current++;
    releaseOwnedUrl();
    setColors([]);
    setPreviewUrl(null);
    setLoading(false);
    setError(null);
  }, [releaseOwnedUrl]);

  return { colors, previewUrl, loading, error, extract, reset };
}
