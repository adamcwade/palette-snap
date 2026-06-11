import { useState } from 'react';
import { PaletteSnap } from 'palette-snap';

export function App() {
  const [colors, setColors] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [paletteSize, setPaletteSize] = useState(5);

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ marginBottom: 4 }}>palette-snap</h1>
      <p style={{ marginTop: 0, color: '#57534e' }}>
        Drop an image below to extract its color palette. Click a swatch to copy its hex code.
      </p>

      <label style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
        Palette size:{' '}
        <select value={paletteSize} onChange={(e) => setPaletteSize(Number(e.target.value))}>
          {[3, 4, 5, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <PaletteSnap
        paletteSize={paletteSize}
        onPaletteChange={setColors}
        onCopy={(hex) => {
          setCopied(hex);
          setTimeout(() => setCopied(null), 1500);
        }}
        onError={(err) => alert(err.message)}
      />

      {copied && (
        <p style={{ fontSize: 14, color: '#15803d' }}>Copied {copied} to the clipboard.</p>
      )}

      {colors.length > 0 && (
        <pre
          style={{
            background: '#1c1917',
            color: '#e7e5e4',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(colors, null, 2)}
        </pre>
      )}
    </main>
  );
}
