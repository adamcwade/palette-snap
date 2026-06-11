import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { usePalette } from '../hooks/usePalette';
import * as styles from './styles';

export interface PaletteSnapClassNames {
  root?: string;
  dropzone?: string;
  preview?: string;
  swatches?: string;
  swatch?: string;
  swatchLabel?: string;
}

export interface PaletteSnapProps {
  /** Maximum number of colors to extract. Default 5. */
  paletteSize?: number;
  /** Images wider than this are downscaled before extraction. Default 400. */
  maxImageWidth?: number;
  /** Called with the extracted hex colors after every successful extraction. */
  onPaletteChange?: (colors: string[]) => void;
  /** Called when image loading or extraction fails. */
  onError?: (error: Error) => void;
  /** Called after a swatch's hex code is copied to the clipboard. */
  onCopy?: (hex: string) => void;
  /** Copy a swatch's hex code on click. Default true. */
  copyOnClick?: boolean;
  /** Render the built-in swatch row. Set false to render your own via `onPaletteChange`. Default true. */
  showSwatches?: boolean;
  /** Empty-state prompt shown inside the dropzone. */
  label?: ReactNode;
  /** Image URL to load and extract on mount. */
  initialImage?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Class hooks for each rendered slot, for restyling with your own CSS. */
  classNames?: PaletteSnapClassNames;
}

/**
 * Drag-and-drop image dropzone that extracts and displays a color palette.
 */
export function PaletteSnap({
  paletteSize = 5,
  maxImageWidth = 400,
  onPaletteChange,
  onError,
  onCopy,
  copyOnClick = true,
  showSwatches = true,
  label = 'Drag & drop an image, or click to upload',
  initialImage,
  disabled = false,
  className,
  style,
  classNames = {},
}: PaletteSnapProps) {
  const { colors, previewUrl, loading, error, extract } = usePalette({
    paletteSize,
    maxImageWidth,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSource = useCallback(
    (source: File | string) => {
      extract(source)
        .then((palette) => onPaletteChange?.(palette))
        .catch((err: Error) => onError?.(err));
    },
    [extract, onPaletteChange, onError],
  );

  useEffect(() => {
    if (initialImage) handleSource(initialImage);
    // Load the initial image once; later prop changes are intentionally ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSource(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleSource(file);
    }
  };

  const handleCopy = (hex: string) => {
    if (!copyOnClick) return;
    navigator.clipboard
      .writeText(hex)
      .then(() => {
        setCopied(hex);
        onCopy?.(hex);
        setTimeout(() => setCopied((current) => (current === hex ? null : current)), 1200);
      })
      .catch(() => {
        // Clipboard access denied — nothing useful to do.
      });
  };

  const dropzoneStyle: CSSProperties = {
    ...styles.dropzone,
    ...(isDragging ? styles.dropzoneDragging : undefined),
    ...(disabled ? styles.dropzoneDisabled : undefined),
  };

  return (
    <div
      className={[className, classNames.root].filter(Boolean).join(' ') || undefined}
      style={{ ...styles.root, ...style }}
    >
      <div
        role="button"
        aria-label="Upload an image to extract its color palette"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={classNames.dropzone}
        style={dropzoneStyle}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          setIsDragging(false);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className={classNames.preview}
              style={styles.preview}
            />
            <div
              style={{
                ...styles.previewOverlay,
                ...(hovering || loading ? styles.previewOverlayVisible : undefined),
              }}
            >
              {loading ? 'Extracting palette…' : 'Drop or click to replace this image'}
            </div>
          </>
        ) : (
          <div>{loading ? 'Extracting palette…' : label}</div>
        )}
      </div>

      {error && <div style={{ color: '#c0392b', fontSize: 14 }}>{error.message}</div>}

      {showSwatches && colors.length > 0 && (
        <div className={classNames.swatches} style={styles.swatches}>
          {colors.map((hex) => (
            <button
              key={hex}
              type="button"
              title={copyOnClick ? `Copy ${hex}` : hex}
              className={classNames.swatch}
              style={{ ...styles.swatch, backgroundColor: hex }}
              onClick={() => handleCopy(hex)}
            >
              <span className={classNames.swatchLabel} style={styles.swatchLabel}>
                {copied === hex ? 'Copied!' : hex}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
