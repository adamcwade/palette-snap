import type { CSSProperties } from 'react';

/**
 * Neutral default styles, kept deliberately minimal so they're easy to
 * override via the `classNames` and `style` props.
 */
export const root: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  fontFamily: 'inherit',
};

export const dropzone: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
  padding: 16,
  border: '2px dashed #c4c4c4',
  borderRadius: 12,
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'border-color 150ms ease, background-color 150ms ease',
  backgroundColor: '#fafafa',
  color: '#555',
  textAlign: 'center',
};

export const dropzoneDragging: CSSProperties = {
  borderColor: '#4f8ef7',
  backgroundColor: '#f0f6ff',
};

export const dropzoneDisabled: CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.6,
};

export const preview: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const previewOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.75)',
  opacity: 0,
  transition: 'opacity 150ms ease',
  fontWeight: 600,
  padding: 12,
};

export const previewOverlayVisible: CSSProperties = {
  opacity: 1,
};

export const swatches: CSSProperties = {
  display: 'flex',
  gap: 8,
};

export const swatch: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  height: 64,
  padding: 6,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  font: 'inherit',
};

export const swatchLabel: CSSProperties = {
  fontSize: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  padding: '2px 6px',
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  color: '#222',
};
