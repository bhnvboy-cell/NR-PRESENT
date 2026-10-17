import { useMemo, useState } from 'react';
import { useCanvasUi } from '../../store/canvasUi';
import { generatePalette, hslToHex, hexToHsl, HARMONY_OPTIONS, SEED_COLORS, type HarmonyKind } from '../../utils/palette';
import { useEditorStore } from '../../store/editorStore';

export function PalettePanel() {
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);
  const [seed, setSeed] = useState('#6366f1');
  const [harmony, setHarmony] = useState<HarmonyKind>('complementary');
  const [copied, setCopied] = useState<string | null>(null);
  const updateSelected = useEditorStore((state) => state.updateSelected);
  const hasSelection = useEditorStore((state) => state.selectedIds.length > 0);
  const brandKit = useEditorStore((state) => state.project.brandKit);
  const addBrandColor = useEditorStore((state) => state.addBrandColor);
  const removeBrandColor = useEditorStore((state) => state.removeBrandColor);
  const [savedToKit, setSavedToKit] = useState(false);

  const palette = useMemo(() => generatePalette(seed, harmony), [seed, harmony]);
  const { h, s, l } = useMemo(() => hexToHsl(seed), [seed]);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 900);
    } catch {
      /* clipboard unavailable */
    }
  };

  const randomize = () => {
    const next = hslToHex(Math.random() * 360, 55 + Math.random() * 35, 45 + Math.random() * 25);
    setSeed(next);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Palette generator</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="palette-seed">
          <input
            type="color"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            title="Seed color"
            className="palette-seed-input"
          />
          <div className="palette-seed-meta">
            <strong>{seed.toUpperCase()}</strong>
            <span>
              HSL {Math.round(h)}° {Math.round(s)}% {Math.round(l)}%
            </span>
          </div>
          <button type="button" className="chip" onClick={randomize} title="Random seed">
            🎲
          </button>
        </div>

        <div className="chip-row">
          {HARMONY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${harmony === opt.value ? 'is-active' : ''}`}
              onClick={() => setHarmony(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="panel-hint">Seeds</p>
        <div className="swatch-row">
          {SEED_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${seed === c ? 'is-active' : ''}`}
              style={{ background: c }}
              onClick={() => setSeed(c)}
              title={c}
            />
          ))}
        </div>

        <ul className="palette-list">
          {palette.map((hex) => (
            <li key={hex} className="palette-swatch">
              <span className="palette-chip" style={{ background: hex }} />
              <span className="palette-hex">{hex.toUpperCase()}</span>
              {copied === hex ? (
                <span className="palette-copied">Copied</span>
              ) : (
                <button type="button" className="palette-copy" onClick={() => copy(hex)}>
                  Copy
                </button>
              )}
              <button
                type="button"
                className="palette-apply"
                disabled={!hasSelection}
                onClick={() => updateSelected({ fill: hex })}
                title={hasSelection ? 'Apply to selected fill' : 'Select an object first'}
              >
                Apply
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="sidebar-action"
          onClick={() => {
            palette.forEach((hex) => addBrandColor(hex));
            setSavedToKit(true);
            window.setTimeout(() => setSavedToKit(false), 1500);
          }}
        >
          {savedToKit ? '✓ Saved to brand kit' : '★ Save palette to brand kit'}
        </button>

        {brandKit && brandKit.colors.length > 0 ? (
          <>
            <p className="panel-hint">Brand kit</p>
            <div className="swatch-row">
              {brandKit.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="swatch"
                  style={{ background: c }}
                  title={`${c} — click to remove`}
                  onClick={() => removeBrandColor(c)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
