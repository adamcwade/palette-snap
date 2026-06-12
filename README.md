# palette-snap

<p align="center">
  <img src="https://raw.githubusercontent.com/adamcwade/palette-snap/main/docs/demo.svg" alt="Animated demo: an image is dropped into the PaletteSnap dropzone, its color palette is extracted into five swatches, and clicking a swatch copies its hex code" width="720">
</p>

A React component & hook for extracting color palettes from images, right in the browser, with zero dependencies.

Drop in an image, get back its dominant colors as hex codes. The extraction runs entirely client-side using histogram binning and K-means clustering in the perceptually-uniform CIELAB color space, so the palettes look like what your eyes actually see.

- 🎨 **`<PaletteSnap />`**: a drag-and-drop upload zone with image preview and click-to-copy swatches, each adjustable with a built-in color picker
- 🪝 **`usePalette()`**: a headless hook when you want your own UI
- ⚙️ **`extractColors()`**: the framework-free core, if all you have is raw pixel data
- 📦 ESM + CJS + TypeScript types, React 17+, no runtime dependencies

## Installation

```bash
npm install palette-snap
```

## Quick start

```tsx
import { PaletteSnap } from 'palette-snap';

function App() {
  return (
    <PaletteSnap
      paletteSize={5}
      onPaletteChange={(colors) => console.log(colors)}
      // → ['#1c4d8f', '#e8b04a', '#7a3b2e', '#cdd5d0', '#2f2a26']
    />
  );
}
```

That's it. The component renders a dropzone, accepts a dragged or selected image, shows a preview, and displays the extracted palette as swatches. Clicking a swatch copies its hex code to the clipboard, and the pencil button on each swatch opens a color picker so you can fine-tune any generated color. Edits are reported through `onPaletteChange` just like extractions.

### `<PaletteSnap />` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `paletteSize` | `number` | `5` | Maximum number of colors to extract |
| `maxImageWidth` | `number` | `400` | Images are downscaled to this width before extraction (faster, near-identical results) |
| `onPaletteChange` | `(colors: string[]) => void` | | Called with hex colors after every successful extraction |
| `onError` | `(error: Error) => void` | | Called when loading or extraction fails |
| `onCopy` | `(hex: string) => void` | | Called after a swatch is copied to the clipboard |
| `copyOnClick` | `boolean` | `true` | Copy a swatch's hex code on click |
| `editable` | `boolean` | `true` | Show a color picker on each swatch so colors can be adjusted |
| `showSwatches` | `boolean` | `true` | Render the built-in swatch row (set `false` to render your own) |
| `label` | `ReactNode` | `'Drag & drop…'` | Empty-state prompt inside the dropzone |
| `initialImage` | `string` | | Image URL to load and extract on mount |
| `disabled` | `boolean` | `false` | Disable uploads |
| `className` / `style` | | | Root element class / style overrides |
| `classNames` | `PaletteSnapClassNames` | | Per-slot class hooks: `root`, `dropzone`, `preview`, `swatches`, `swatch`, `swatchLabel` |

The default styling is intentionally minimal inline CSS, so no stylesheet import is needed, and every slot accepts a class name so you can restyle it with Tailwind, CSS modules, or plain CSS.

## Headless usage with `usePalette`

```tsx
import { usePalette } from 'palette-snap';

function MyUploader() {
  const { colors, previewUrl, loading, error, extract, setColors, reset } = usePalette({
    paletteSize: 4,
  });

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && extract(e.target.files[0])}
      />
      {loading && <p>Extracting…</p>}
      {error && <p>{error.message}</p>}
      {previewUrl && <img src={previewUrl} alt="" width={200} />}
      {colors.map((hex) => (
        <span key={hex} style={{ background: hex }}>{hex}</span>
      ))}
    </div>
  );
}
```

`extract()` accepts a `File`, `Blob`, `HTMLImageElement`, or URL string and resolves with the hex colors. `setColors()` replaces the current palette, which is handy for wiring up your own color pickers. URL sources are loaded with `crossOrigin="anonymous"` by default; the image's server must send CORS headers, otherwise the browser blocks pixel access (you'll get a descriptive error). `File`/`Blob` sources always work.

The hook is SSR-safe to import (Next.js etc.) because canvas work only happens inside `extract()`, which is browser-only.

## Framework-free core

If you already have raw RGBA pixel data (from `canvas.getImageData()`, or anywhere else), use the core directly. It has no React or DOM dependency:

```ts
import { extractColors } from 'palette-snap';

const ctx = canvas.getContext('2d');
const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
const colors = extractColors(data, 5); // ['#1c4d8f', '#e8b04a', ...]
```

Low-level color conversions are exported too: `rgbToLab`, `labToRgb`, `rgbToHex`.

## How it works

The extraction algorithm is derived from Google's color palette extraction research and runs in four steps:

1. **Histogram**: every pixel is bucketed into one of 4,096 bins (16×16×16 in RGB), while its color is accumulated in CIELAB space, where numeric distance matches perceived color difference.
2. **Seed selection**: the heaviest bins are picked as starting colors. After each pick, weights of nearby colors are attenuated, so seeds spread across the image's range instead of clustering around one dominant hue.
3. **K-means clustering**: bins are assigned to their closest seed in LAB space and seeds are re-averaged until assignments stabilize.
4. **Export**: the converged cluster centers are converted back to RGB hex codes.

Because everything runs on a downscaled image (≤400px wide by default), extraction completes in a few milliseconds.

## Demo

```bash
git clone https://github.com/adamcwade/palette-snap.git
cd palette-snap && npm install
cd demo && npm install && npm run dev
```

Then open the printed localhost URL and drop in an image.

## Development

```bash
npm install
npm test          # vitest: color conversion + extraction golden tests
npm run typecheck
npm run build     # tsup → dist/ (ESM + CJS + d.ts)
```

The core algorithm is covered by golden tests that pin its output to the original reference implementation. The hook and component are exercised manually via the demo app (headless DOM environments lack a real canvas).

## License

[MIT](./LICENSE) © Adam Wade

The palette extraction algorithm is derived from Google's color palette extraction research, © 2018 Google LLC, used under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See [NOTICE](./NOTICE).
