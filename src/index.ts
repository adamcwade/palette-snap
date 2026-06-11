export {
  PaletteExtractor,
  extractColors,
  type PixelData,
} from './core/PaletteExtractor';
export { rgbToLab, labToRgb, rgbToHex, type Rgb, type Lab } from './core/color';
export {
  usePalette,
  type PaletteSource,
  type UsePaletteOptions,
  type UsePaletteResult,
} from './hooks/usePalette';
export {
  PaletteSnap,
  type PaletteSnapProps,
  type PaletteSnapClassNames,
} from './components/PaletteSnap';
