import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvasUi } from '../store/canvasUi';
import { FONT_OPTIONS, FONT_CATEGORIES, type FontOption } from '../data/fonts';
import {
  ANIMATION_OPTIONS,
  BACKGROUND_PRESETS,
  CHART_PALETTES,
  DEFAULT_SLIDE_SIZE,
  IMAGE_MASK_OPTIONS,
  SLIDE_SIZE_PRESETS,
  TEXT_EFFECT_OPTIONS,
  TRANSITION_OPTIONS,
  type AnimationKind,
  type AnimationProps,
  type BrushKind,
  type CanvasElement,
  type ChartElement,
  type ChartType,
  type ImageElement,
  type ImageFilterPreset,
  type ImageMaskKind,
  type MediaElement,
  type PathElement,
  type ShapeElement,
  type ShadowProps,
  type SlideBackground,
  type SlideTransition,
  type TableElement,
  type TextAlignment,
  type TextDecoration,
  type TextEffectKind,
  type TextElement,
  type FontWeight,
} from '../types/editor';
import { backgroundToCss } from '../utils/background';
import { FILTER_PRESET_OPTIONS } from '../utils/filters';
import { coverCrop, CROP_PRESETS } from '../utils/imageCrop';
import { createSampleAudioDataUrl } from '../utils/media';
import { ColorField } from './common/ColorField';
import { NumberField } from './common/NumberField';

const TEXT_PRESETS: {
  label: string;
  fontSize: number;
  fontWeight: FontWeight;
  italic: boolean;
  lineHeight: number;
}[] = [
  { label: 'Title', fontSize: 56, fontWeight: 800, italic: false, lineHeight: 1.15 },
  { label: 'Heading', fontSize: 36, fontWeight: 700, italic: false, lineHeight: 1.2 },
  { label: 'Subhead', fontSize: 26, fontWeight: 600, italic: false, lineHeight: 1.3 },
  { label: 'Body', fontSize: 18, fontWeight: 400, italic: false, lineHeight: 1.45 },
  { label: 'Caption', fontSize: 13, fontWeight: 400, italic: false, lineHeight: 1.4 },
  { label: 'Quote', fontSize: 24, fontWeight: 300, italic: true, lineHeight: 1.4 },
];

export function PropertiesSidebar() {
  const slideElements = useEditorStore((state) => state.project.slides[state.currentSlideIndex].elements);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const slide = useEditorStore((state) => state.currentSlide());
  const updateElement = useEditorStore((state) => state.updateElement);
  const updateSelected = useEditorStore((state) => state.updateSelected);
  const endHistory = useEditorStore((state) => state.endHistory);
  const setBackground = useEditorStore((state) => state.setBackground);
  const gridSize = useEditorStore((state) => state.project.viewport.gridSize);
  const setViewport = useEditorStore((state) => state.setViewport);
  const slideSize = useEditorStore((state) => state.project.slideSize ?? DEFAULT_SLIDE_SIZE);
  const setSlideSize = useEditorStore((state) => state.setSlideSize);
  const groupSelected = useEditorStore((state) => state.groupSelected);
  const ungroupSelected = useEditorStore((state) => state.ungroupSelected);
  const tool = useEditorStore((state) => state.tool);
  const replaceImage = useReplaceImage();

  const selected = useMemo(() => {
    const ids = new Set(selectedIds);
    return slideElements.filter((el) => ids.has(el.id));
  }, [slideElements, selectedIds]);

  const single = selected.length === 1 ? selected[0] : null;

  if (selected.length === 0) {
    return (
      <aside className="properties-sidebar">
        {tool === 'pen' ? <PenToolSettings /> : null}
        <PanelTitle>Slide background</PanelTitle>
        <BackgroundEditor key={slide.id} current={slide.backgroundFill} onApply={setBackground} />
        <SlideNotesEditor />
        <SlideTransitionEditor />
        <SlideSectionEditor />
        <BrandKitEditor />
        <PanelTitle>Canvas</PanelTitle>
        <NumberField
          label="Grid size"
          min={5}
          max={100}
          step={5}
          suffix="px"
          value={gridSize}
          onChange={(value) => setViewport({ gridSize: clamp(Math.round(value), 5, 200) })}
        />
        <PanelTitle>Slide size</PanelTitle>
        <div className="size-presets">
          {SLIDE_SIZE_PRESETS.map((preset) => {
            const active =
              preset.size.width === slideSize.width && preset.size.height === slideSize.height;
            return (
              <button
                key={preset.label}
                type="button"
                className={`size-preset-chip ${active ? 'is-active' : ''}`}
                onClick={() => setSlideSize(preset.size)}
                title={`${preset.size.width}×${preset.size.height}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="field-grid">
          <NumberField
            label="Width"
            min={200}
            max={4000}
            step={10}
            suffix="px"
            value={slideSize.width}
            onChange={(value) => setSlideSize({ ...slideSize, width: value })}
          />
          <NumberField
            label="Height"
            min={200}
            max={4000}
            step={10}
            suffix="px"
            value={slideSize.height}
            onChange={(value) => setSlideSize({ ...slideSize, height: value })}
          />
        </div>
        <p className="sidebar-hint">
          Resizing scales existing content to fit. {slideSize.width}×{slideSize.height} px.
        </p>
        <p className="sidebar-hint">Select an element on the canvas to edit its properties.</p>
      </aside>
    );
  }

  return (
    <aside className="properties-sidebar">
      <PanelTitle>
        {selected.length > 1 ? `${selected.length} elements` : describeType(single!)}
      </PanelTitle>

      {selected.length > 1 ? (
        <ColorField
          label="Fill (all)"
          value={getAnyFill(selected[0])}
          onChange={(value) =>
            updateSelected({ fill: value, stroke: value } as unknown as Partial<CanvasElement>)
          }
        />
      ) : null}

      {single?.type === 'text' ? <TextControls element={single} onChange={(patch) => updateElement(single.id, patch)} /> : null}
      {single?.type === 'shape' ? <ShapeControls element={single} onChange={(patch) => updateElement(single.id, patch)} /> : null}
      {single?.type === 'image' ? <ImageControls element={single} onReplace={replaceImage} onChange={(patch) => updateElement(single.id, patch)} /> : null}
      {single?.type === 'chart' ? <ChartControls element={single} /> : null}
      {single?.type === 'table' ? <TableControls element={single} /> : null}
      {single?.type === 'path' ? <PathControls element={single} onChange={(patch) => updateElement(single.id, patch)} /> : null}
      {single?.type === 'media' ? <MediaControls element={single} onChange={(patch) => updateElement(single.id, patch)} /> : null}

      <PanelTitle>Transform</PanelTitle>
      <div className="field-grid">
        <NumberField label="X" value={Math.round(single?.x ?? 0)} onChange={(value) => updateSelected({ x: value })} />
        <NumberField label="Y" value={Math.round(single?.y ?? 0)} onChange={(value) => updateSelected({ y: value })} />
        <NumberField label="W" min={4} value={Math.round(single?.width ?? 0)} onChange={(value) => updateSelected({ width: value })} />
        <NumberField label="H" min={0} value={Math.round(single?.height ?? 0)} onChange={(value) => updateSelected({ height: value })} />
      </div>
      <NumberField
        label="Rotation"
        min={-180}
        max={180}
        suffix="°"
        value={Math.round(single?.rotation ?? 0)}
        onChange={(value) => updateSelected({ rotation: value })}
      />
      <NumberField
        label="Opacity"
        min={0}
        max={1}
        step={0.05}
        value={single?.opacity ?? 1}
        onChange={(value) => updateSelected({ opacity: clamp(value, 0, 1) })}
      />

      <PanelTitle>Shadow</PanelTitle>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={single?.shadow.enabled ?? false}
          onChange={(event) => updateSelected({ shadow: patchShadow(single!.shadow, { enabled: event.target.checked }) })}
        />
        Enable shadow
      </label>
      {single?.shadow.enabled ? (
        <>
          <ColorField
            label="Color"
            value={single.shadow.color}
            onChange={(value) => updateSelected({ shadow: patchShadow(single.shadow, { color: value }) })}
          />
          <NumberField
            label="Blur"
            min={0}
            max={80}
            value={single.shadow.blur}
            onChange={(value) => updateSelected({ shadow: patchShadow(single.shadow, { blur: value }) })}
          />
          <NumberField
            label="Offset X"
            min={-60}
            max={60}
            value={single.shadow.offsetX}
            onChange={(value) => updateSelected({ shadow: patchShadow(single.shadow, { offsetX: value }) })}
          />
          <NumberField
            label="Offset Y"
            min={-60}
            max={60}
            value={single.shadow.offsetY}
            onChange={(value) => updateSelected({ shadow: patchShadow(single.shadow, { offsetY: value }) })}
          />
          <NumberField
            label="Shadow opacity"
            min={0}
            max={1}
            step={0.05}
            value={single.shadow.opacity}
            onChange={(value) => updateSelected({ shadow: patchShadow(single.shadow, { opacity: clamp(value, 0, 1) }) })}
          />
        </>
      ) : null}

      <PanelTitle>Animation</PanelTitle>
      {single ? <AnimationControls element={single} /> : null}

      <PanelTitle>Arrange</PanelTitle>
      <div className="button-row">
        <button
          type="button"
          className="sidebar-action"
          disabled={selected.length < 2}
          onClick={groupSelected}
        >
          ⊞ Group
        </button>
        <button
          type="button"
          className="sidebar-action"
          disabled={!single?.groupId}
          onClick={ungroupSelected}
        >
          ⊟ Ungroup
        </button>
      </div>

      <button type="button" className="sidebar-action" onClick={() => { updateSelected({ locked: !(single?.locked ?? false) }); endHistory(); }}>
        {single?.locked ? 'Unlock element' : 'Lock element'}
      </button>
    </aside>
  );
}

function switchBackgroundKind(current: SlideBackground, kind: SlideBackground['kind']): SlideBackground {
  if (kind === 'solid') {
    return { kind: 'solid', color: current.kind === 'solid' ? current.color : current.from ?? '#ffffff' };
  }
  const from = current.kind === 'solid' ? '#6366f1' : current.from;
  const to = current.kind === 'solid' ? '#0f172a' : current.to;
  if (kind === 'linear') {
    return { kind: 'linear', from, to, angle: current.kind === 'linear' ? current.angle : 90 };
  }
  return { kind: 'radial', from, to };
}

function BackgroundEditor({
  current,
  onApply,
}: {
  current: SlideBackground;
  onApply: (fill: SlideBackground) => void;
}) {
  const [custom, setCustom] = useState<SlideBackground>(current);

  return (
    <div className="background-editor">
      <div className="preset-grid">
        {BACKGROUND_PRESETS.map((preset, index) => (
          <button
            key={index}
            type="button"
            className="preset-swatch"
            style={{ background: backgroundToCss(preset) }}
            title={backgroundToCss(preset)}
            onClick={() => {
              setCustom(preset);
              onApply(preset);
            }}
          />
        ))}
      </div>

      <div className="field-row">
        <span className="field-label">Custom</span>
        <div className="segmented">
          {(['solid', 'linear', 'radial'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className={custom.kind === kind ? 'is-active' : ''}
              onClick={() => setCustom(switchBackgroundKind(custom, kind))}
            >
              {kind[0].toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {custom.kind === 'solid' ? (
        <ColorField
          label="Color"
          value={custom.color}
          onChange={(color) => {
            const next = { kind: 'solid', color } as SlideBackground;
            setCustom(next);
            onApply(next);
          }}
        />
      ) : (
        <>
          <ColorField
            label="From"
            value={custom.from}
            onChange={(from) => {
              const next = { ...custom, from } as SlideBackground;
              setCustom(next);
              onApply(next);
            }}
          />
          <ColorField
            label="To"
            value={custom.to}
            onChange={(to) => {
              const next = { ...custom, to } as SlideBackground;
              setCustom(next);
              onApply(next);
            }}
          />
          {custom.kind === 'linear' ? (
            <NumberField
              label="Angle"
              min={0}
              max={360}
              suffix="°"
              value={custom.angle}
              onChange={(angle) => {
                const next = { ...custom, angle } as SlideBackground;
                setCustom(next);
                onApply(next);
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="sidebar-title">{children}</h3>;
}

function describeType(element: CanvasElement): string {
  switch (element.type) {
    case 'text':
      return 'Text';
    case 'shape':
      switch (element.shape) {
        case 'rect':
          return 'Rectangle';
        case 'ellipse':
          return 'Ellipse';
        case 'line':
          return 'Line';
        case 'arrow':
          return 'Arrow';
        case 'triangle':
          return 'Triangle';
        case 'diamond':
          return 'Diamond';
        case 'star':
          return 'Star';
        case 'pentagon':
          return 'Pentagon';
        case 'hexagon':
          return 'Hexagon';
      }
      break;
    case 'image':
      return 'Image';
    case 'chart':
      return 'Chart';
    case 'table':
      return 'Table';
    case 'path':
      return 'Freehand Draw';
    case 'media':
      return element.mediaType === 'video' ? 'Video Embed' : 'Audio Track';
  }
  return 'Element';
}

function getAnyFill(element: CanvasElement): string {
  if (element.type === 'text') return element.fill;
  if (element.type === 'shape') return element.shape === 'line' || element.shape === 'arrow' ? element.stroke : element.fill;
  if (element.type === 'path') return element.stroke;
  if (element.type === 'media') return element.posterColor ?? '#6366f1';
  if (element.type === 'chart') return element.accent;
  if (element.type === 'table') return element.headerFill;
  return '#000000';
}

function patchShadow(shadow: ShadowProps, patch: Partial<ShadowProps>): ShadowProps {
  return { ...shadow, ...patch };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ControlProps<T> {
  element: T;
  onChange: (patch: Partial<T>) => void;
}

function TextControls({ element, onChange }: ControlProps<TextElement>) {
  const [category, setCategory] = useState<FontOption['category'] | 'all'>('all');
  const brandKit = useEditorStore((state) => state.project.brandKit);
  const font = FONT_OPTIONS.find((option) => option.family === element.fontFamily) ?? FONT_OPTIONS[0];
  const visibleFonts = FONT_OPTIONS.filter((f) => category === 'all' || f.category === category);
  const brandFonts = brandKit?.fontFamilies ?? [];
  const brandColors = brandKit?.colors ?? [];

  return (
    <>
      <PanelTitle>Text</PanelTitle>
      <div className="size-presets">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`size-preset-chip ${
              element.fontSize === preset.fontSize && element.fontWeight === preset.fontWeight
                ? 'is-active'
                : ''
            }`}
            onClick={() =>
              onChange({
                fontSize: preset.fontSize,
                fontWeight: preset.fontWeight,
                italic: preset.italic,
                lineHeight: preset.lineHeight,
              })
            }
            title={`${preset.fontSize}px / ${preset.fontWeight}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {brandColors.length > 0 ? (
        <div className="brand-strip">
          <span className="field-label">Brand</span>
          {brandColors.map((c) => (
            <button
              key={c}
              type="button"
              className="brand-chip"
              style={{ background: c }}
              title={`Apply ${c}`}
              onClick={() => onChange({ fill: c })}
            />
          ))}
        </div>
      ) : null}
      <div className="field-row">
        <span className="field-label">Font</span>
        <select
          className="select-input"
          value={category}
          onChange={(event) => setCategory(event.target.value as FontOption['category'] | 'all')}
        >
          {FONT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="select-input"
          value={element.fontFamily}
          onChange={(event) => {
            const next = FONT_OPTIONS.find((f) => f.family === event.target.value);
            const patch: Partial<TextElement> = { fontFamily: event.target.value };
            if (next && !next.weights.includes(element.fontWeight)) {
              patch.fontWeight = (next.weights.includes(400) ? 400 : next.weights[0]) as FontWeight;
            }
            onChange(patch);
          }}
        >
          {brandFonts.length > 0 ? (
            <optgroup label="Brand">
              {brandFonts.map((family) => (
                <option key={family} value={family}>
                  ★ {family}
                </option>
              ))}
            </optgroup>
          ) : null}
          {visibleFonts.map((option) => (
            <option key={option.family} value={option.family}>
              {option.family}
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <span className="field-label">Weight</span>
        <select
          className="select-input"
          value={element.fontWeight}
          onChange={(event) => onChange({ fontWeight: Number(event.target.value) as FontWeight })}
        >
          {font.weights.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </div>
      <NumberField
        label="Size"
        min={8}
        max={220}
        suffix="px"
        value={element.fontSize}
        onChange={(value) => onChange({ fontSize: clamp(value, 8, 400) })}
      />
      <div className="field-row">
        <span className="field-label">Align</span>
        <div className="segmented">
          {(['left', 'center', 'right', 'justify'] as TextAlignment[]).map((align) => (
            <button
              key={align}
              type="button"
              className={element.align === align ? 'is-active' : ''}
              onClick={() => onChange({ align })}
            >
              {align[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="field-row">
        <span className="field-label">Style</span>
        <div className="segmented">
          <button
            type="button"
            className={element.italic ? 'is-active' : ''}
            onClick={() => onChange({ italic: !element.italic })}
          >
            It
          </button>
          {(['none', 'underline', 'line-through'] as TextDecoration[]).map((decoration) => (
            <button
              key={decoration}
              type="button"
              className={element.decoration === decoration ? 'is-active' : ''}
              onClick={() => onChange({ decoration })}
            >
              {decoration === 'none' ? '—' : decoration === 'underline' ? 'U' : 'S'}
            </button>
          ))}
        </div>
      </div>
      <ColorField label="Color" value={element.fill} onChange={(value) => onChange({ fill: value })} />
      <NumberField
        label="Line height"
        min={0.8}
        max={3}
        step={0.05}
        value={element.lineHeight}
        onChange={(value) => onChange({ lineHeight: value })}
      />
      <NumberField
        label="Letter spacing"
        min={-5}
        max={20}
        step={0.5}
        value={element.letterSpacing}
        onChange={(value) => onChange({ letterSpacing: value })}
      />

      <PanelTitle>Text Effects &amp; Curve</PanelTitle>
      <div className="field-row">
        <span className="field-label">Effect</span>
        <select
          className="select-input"
          value={element.effect ?? 'none'}
          onChange={(e) => onChange({ effect: e.target.value as TextEffectKind })}
        >
          {TEXT_EFFECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <NumberField
        label="Curve arc"
        min={-180}
        max={180}
        step={5}
        suffix="°"
        value={element.curve ?? 0}
        onChange={(value) => onChange({ curve: clamp(value, -180, 180) })}
      />
      <ColorField
        label="Outline / Glow"
        value={element.stroke ?? '#4f46e5'}
        onChange={(value) => onChange({ stroke: value })}
      />
      <NumberField
        label="Outline width"
        min={0}
        max={20}
        step={0.5}
        value={element.strokeWidth ?? 0}
        onChange={(value) => onChange({ strokeWidth: clamp(value, 0, 20) })}
      />
      <button
        type="button"
        className="sidebar-action"
        onClick={() => useCanvasUi.getState().setRightPanel('magic')}
      >
        ✨ Rewrite with Magic Write…
      </button>
    </>
  );
}

function ShapeControls({ element, onChange }: ControlProps<ShapeElement>) {
  const isLine = element.shape === 'line' || element.shape === 'arrow';
  return (
    <>
      <PanelTitle>Shape</PanelTitle>
      {!isLine ? (
        <ColorField label="Fill" value={element.fill} onChange={(value) => onChange({ fill: value })} />
      ) : null}
      <ColorField label="Stroke" value={element.stroke} onChange={(value) => onChange({ stroke: value })} />
      <NumberField
        label="Stroke width"
        min={0}
        max={40}
        value={element.strokeWidth}
        onChange={(value) => onChange({ strokeWidth: clamp(value, 0, 80) })}
      />
      {element.shape === 'rect' ? (
        <NumberField
          label="Corner radius"
          min={0}
          max={200}
          value={element.cornerRadius}
          onChange={(value) => onChange({ cornerRadius: clamp(value, 0, 400) })}
        />
      ) : null}
      {element.shape === 'star' ? (
        <NumberField
          label="Inner radius"
          min={0.1}
          max={0.9}
          step={0.05}
          value={element.innerRadiusRatio ?? 0.5}
          onChange={(value) => onChange({ innerRadiusRatio: clamp(value, 0.1, 0.9) })}
        />
      ) : null}
    </>
  );
}

function ImageControls({
  element,
  onChange,
  onReplace,
}: ControlProps<ImageElement> & { onReplace: () => void }) {
  const updateImageFilters = useEditorStore((state) => state.updateImageFilters);
  const setFilter = (patch: Partial<ImageElement['filters']>) =>
    updateImageFilters(element.id, patch);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = element.src;
    return () => {
      cancelled = true;
    };
  }, [element.src]);

  return (
    <>
      <PanelTitle>Image</PanelTitle>
      <NumberField
        label="Corner radius"
        min={0}
        max={200}
        value={element.cornerRadius}
        onChange={(value) => onChange({ cornerRadius: clamp(value, 0, 400) })}
      />
      <button type="button" className="sidebar-action" onClick={onReplace}>
        Replace image…
      </button>

      <PanelTitle>Frame / Mask</PanelTitle>
      <div className="field-row">
        <span className="field-label">Frame</span>
        <select
          className="select-input"
          value={element.mask ?? 'none'}
          onChange={(e) => onChange({ mask: e.target.value as ImageMaskKind })}
        >
          {IMAGE_MASK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({opt.category})
            </option>
          ))}
        </select>
      </div>
      {element.mask && element.mask !== 'none' ? (
        <ColorField
          label="Frame color"
          value={element.frameColor ?? '#1e293b'}
          onChange={(value) => onChange({ frameColor: value })}
        />
      ) : null}

      <PanelTitle>Crop</PanelTitle>
      <div className="chip-row">
        {CROP_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="chip"
            disabled={!natural}
            title={preset.aspect === null ? 'Remove crop, show full image' : `Crop to ${preset.label}`}
            onClick={() => {
              if (!natural) return;
              if (preset.aspect === null) {
                onChange({ crop: undefined });
                return;
              }
              const fx = element.crop && element.crop.width > 0 ? (element.crop.x + element.crop.width / 2) / natural.width : 0.5;
              const fy = element.crop && element.crop.height > 0 ? (element.crop.y + element.crop.height / 2) / natural.height : 0.5;
              onChange({ crop: coverCrop(natural, preset.aspect, fx, fy) });
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {element.crop ? (
        <p className="panel-hint">
          Crop: {Math.round(element.crop.width)}×{Math.round(element.crop.height)}px at ({Math.round(element.crop.x)}, {Math.round(element.crop.y)})
        </p>
      ) : (
        <p className="panel-hint">No crop — full image shown.</p>
      )}

      <PanelTitle>Filters</PanelTitle>
      <div className="field-row">
        <span className="field-label">Preset</span>
        <select
          className="select-input"
          value={element.filters.preset}
          onChange={(event) => setFilter({ preset: event.target.value as ImageFilterPreset })}
        >
          {FILTER_PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <NumberField
        label="Brightness"
        min={-1}
        max={1}
        step={0.05}
        value={element.filters.brightness}
        onChange={(value) => setFilter({ brightness: clamp(value, -1, 1) })}
      />
      <NumberField
        label="Contrast"
        min={-1}
        max={1}
        step={0.05}
        value={element.filters.contrast}
        onChange={(value) => setFilter({ contrast: clamp(value, -1, 1) })}
      />
      <NumberField
        label="Saturation"
        min={-1}
        max={1}
        step={0.05}
        value={element.filters.saturation}
        onChange={(value) => setFilter({ saturation: clamp(value, -1, 1) })}
      />
      <NumberField
        label="Blur"
        min={0}
        max={20}
        step={0.5}
        value={element.filters.blur}
        onChange={(value) => setFilter({ blur: clamp(value, 0, 40) })}
      />
      <button
        type="button"
        className="sidebar-action"
        onClick={() =>
          setFilter({ brightness: 0, contrast: 0, saturation: 0, blur: 0, preset: 'none' })
        }
      >
        Reset filters
      </button>
    </>
  );
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'donut', label: 'Donut' },
];

function ChartControls({ element }: { element: ChartElement }) {
  const updateChart = useEditorStore((state) => state.updateChart);
  const setSeries = (index: number, patch: Partial<ChartElement['series'][number]>) => {
    const series = element.series.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateChart(element.id, { series });
  };
  const applyPalette = (palette: string[]) => {
    const series = element.series.map((s, i) => ({ ...s, color: palette[i % palette.length] }));
    updateChart(element.id, { series, accent: palette[0] });
  };

  return (
    <>
      <PanelTitle>Chart</PanelTitle>
      <div className="field-row">
        <span className="field-label">Type</span>
        <div className="segmented">
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={element.chartType === type.value ? 'is-active' : ''}
              onClick={() => updateChart(element.id, { chartType: type.value })}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <span className="field-label">Title</span>
        <input
          className="text-input"
          value={element.title}
          onChange={(event) => updateChart(element.id, { title: event.target.value })}
        />
      </div>

      <div className="field-row">
        <span className="field-label">Palette</span>
        <div className="chip-row">
          {CHART_PALETTES.map((palette, index) => (
            <button
              key={index}
              type="button"
              className="palette-mini"
              title={`Palette ${index + 1}`}
              onClick={() => applyPalette(palette)}
            >
              {palette.slice(0, 5).map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={element.showLegend}
            onChange={(event) => updateChart(element.id, { showLegend: event.target.checked })}
          />
          Legend
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={element.showValues}
            onChange={(event) => updateChart(element.id, { showValues: event.target.checked })}
          />
          Value labels
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={element.showGrid}
            disabled={element.chartType === 'pie' || element.chartType === 'donut'}
            onChange={(event) => updateChart(element.id, { showGrid: event.target.checked })}
          />
          Grid lines
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={element.smooth}
            disabled={element.chartType === 'pie' || element.chartType === 'donut' || element.chartType === 'bar'}
            onChange={(event) => updateChart(element.id, { smooth: event.target.checked })}
          />
          Smooth curves
        </label>
      </div>

      <ColorField label="Background" value={element.background} onChange={(value) => updateChart(element.id, { background: value })} />
      <ColorField label="Text" value={element.textColor} onChange={(value) => updateChart(element.id, { textColor: value })} />

      <PanelTitle>Data</PanelTitle>
      <div className="series-list">
        {element.series.map((s, index) => (
          <div className="series-row" key={index}>
            <input
              type="color"
              className="series-color"
              value={s.color}
              onChange={(event) => setSeries(index, { color: event.target.value })}
              title="Series color"
            />
            <input
              className="text-input series-label"
              value={s.label}
              onChange={(event) => setSeries(index, { label: event.target.value })}
            />
            <input
              type="number"
              className="number-input series-value"
              value={s.value}
              onChange={(event) => setSeries(index, { value: Number(event.target.value) || 0 })}
            />
            <button
              type="button"
              className="layer-icon"
              title="Remove series"
              disabled={element.series.length <= 1}
              onClick={() => updateChart(element.id, { series: element.series.filter((_, i) => i !== index) })}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button
          type="button"
          className="sidebar-action"
          onClick={() => {
            const palette = CHART_PALETTES[element.series.length % CHART_PALETTES.length];
            const next = [
              ...element.series,
              { label: `Item ${element.series.length + 1}`, value: 50, color: palette[element.series.length % palette.length] },
            ];
            updateChart(element.id, { series: next });
          }}
        >
          + Series
        </button>
      </div>
    </>
  );
}

function TableControls({ element }: { element: TableElement }) {
  const updateTable = useEditorStore((state) => state.updateTable);

  const setCell = (r: number, c: number, value: string) => {
    const cells = Array.from({ length: element.rows }, (_, ri) =>
      Array.from({ length: element.cols }, (_, ci) => {
        if (ri === r && ci === c) return value;
        return element.cells[ri]?.[ci] ?? '';
      }),
    );
    updateTable(element.id, { cells });
  };

  const resize = (dim: 'rows' | 'cols', delta: number) => {
    const next = Math.max(dim === 'rows' ? 1 : 2, Math.min(20, element[dim] + delta));
    updateTable(element.id, { [dim]: next });
  };

  return (
    <>
      <PanelTitle>Table</PanelTitle>
      <div className="button-row">
        <button type="button" className="sidebar-action" onClick={() => resize('rows', 1)}>
          + Row
        </button>
        <button type="button" className="sidebar-action" onClick={() => resize('rows', -1)} disabled={element.rows <= 1}>
          − Row
        </button>
        <button type="button" className="sidebar-action" onClick={() => resize('cols', 1)}>
          + Col
        </button>
        <button type="button" className="sidebar-action" onClick={() => resize('cols', -1)} disabled={element.cols <= 2}>
          − Col
        </button>
      </div>

      <div className="table-editor">
        {Array.from({ length: element.rows }, (_, r) => (
          <div className="table-editor-row" key={r}>
            {Array.from({ length: element.cols }, (_, c) => (
              <input
                key={c}
                className={`table-cell-input ${r === 0 ? 'is-header' : ''}`}
                value={element.cells[r]?.[c] ?? ''}
                onChange={(event) => setCell(r, c, event.target.value)}
                aria-label={`Row ${r + 1} column ${c + 1}`}
              />
            ))}
          </div>
        ))}
      </div>

      <PanelTitle>Style</PanelTitle>
      <ColorField label="Header fill" value={element.headerFill} onChange={(value) => updateTable(element.id, { headerFill: value })} />
      <ColorField label="Header text" value={element.headerText} onChange={(value) => updateTable(element.id, { headerText: value })} />
      <ColorField label="Body fill" value={element.bodyFill} onChange={(value) => updateTable(element.id, { bodyFill: value })} />
      <ColorField label="Body text" value={element.bodyText} onChange={(value) => updateTable(element.id, { bodyText: value })} />
      <ColorField label="Alternate rows" value={element.altFill} onChange={(value) => updateTable(element.id, { altFill: value })} />
      <ColorField label="Border" value={element.borderColor} onChange={(value) => updateTable(element.id, { borderColor: value })} />
      <div className="field-grid">
        <NumberField
          label="Font size"
          min={8}
          max={40}
          value={element.fontSize}
          onChange={(value) => updateTable(element.id, { fontSize: clamp(value, 8, 60) })}
        />
        <NumberField
          label="Header size"
          min={8}
          max={40}
          value={element.headerFontSize}
          onChange={(value) => updateTable(element.id, { headerFontSize: clamp(value, 8, 60) })}
        />
      </div>
      <NumberField
        label="Column width"
        min={40}
        max={600}
        suffix="px"
        value={Math.round(element.colWidths[0] ?? 150)}
        onChange={(value) =>
          updateTable(element.id, { colWidths: element.colWidths.map(() => clamp(value, 40, 800)) })
        }
      />
      <NumberField
        label="Row height"
        min={24}
        max={240}
        suffix="px"
        value={Math.round(element.rowHeights[0] ?? 48)}
        onChange={(value) =>
          updateTable(element.id, { rowHeights: element.rowHeights.map(() => clamp(value, 24, 400)) })
        }
      />
    </>
  );
}

function AnimationControls({ element }: { element: CanvasElement }) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const endHistory = useEditorStore((state) => state.endHistory);
  const anim: AnimationProps = element.animation ?? { kind: 'none', duration: 500, delay: 0 };

  const patch = (partial: Partial<AnimationProps>) => {
    const next = { ...anim, ...partial };
    updateElement(element.id, { animation: next });
    endHistory();
  };

  return (
    <>
      <div className="field-row">
        <span className="field-label">On slide entry</span>
        <select
          className="select-input"
          value={anim.kind}
          onChange={(event) => patch({ kind: event.target.value as AnimationKind })}
        >
          {ANIMATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {anim.kind !== 'none' ? (
        <div className="field-grid">
          <NumberField
            label="Duration"
            min={100}
            max={4000}
            step={50}
            suffix="ms"
            value={anim.duration}
            onChange={(value) => patch({ duration: clamp(value, 100, 8000) })}
          />
          <NumberField
            label="Delay"
            min={0}
            max={5000}
            step={50}
            suffix="ms"
            value={anim.delay}
            onChange={(value) => patch({ delay: clamp(value, 0, 10000) })}
          />
        </div>
      ) : null}
    </>
  );
}

function SlideNotesEditor() {
  const slide = useEditorStore((state) => state.currentSlide());
  const setSlideNotes = useEditorStore((state) => state.setSlideNotes);
  return (
    <div className="field-row">
      <span className="field-label">Speaker notes</span>
      <textarea
        className="notes-input"
        rows={4}
        placeholder="Notes for presenter view…"
        value={slide.notes ?? ''}
        onChange={(event) => setSlideNotes(event.target.value)}
      />
    </div>
  );
}

function SlideTransitionEditor() {
  const slide = useEditorStore((state) => state.currentSlide());
  const setSlideTransition = useEditorStore((state) => state.setSlideTransition);
  return (
    <>
      <PanelTitle>Transition</PanelTitle>
      <select
        className="select-input"
        value={slide.transition ?? 'none'}
        onChange={(event) => setSlideTransition(event.target.value as SlideTransition)}
      >
        {TRANSITION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </>
  );
}

function SlideSectionEditor() {
  const index = useEditorStore((state) => state.currentSlideIndex);
  const section = useEditorStore((state) => state.currentSlide().section ?? '');
  const setSlideSection = useEditorStore((state) => state.setSlideSection);
  const [prev, setPrev] = useState({ index, section });
  const [draft, setDraft] = useState(section);
  if (prev.index !== index || prev.section !== section) {
    setPrev({ index, section });
    setDraft(section);
  }

  const commit = (next: string, untilNext = false) => {
    setSlideSection(index, next.trim() || undefined, untilNext);
  };

  return (
    <>
      <PanelTitle>Section</PanelTitle>
      <div className="field-row">
        <input
          className="text-input"
          placeholder="Section name…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit(draft);
          }}
        />
      </div>
      <button
        type="button"
        className="sidebar-action"
        disabled={!draft.trim()}
        onClick={() => commit(draft, true)}
        title="Assign this section to following slides until the next section"
      >
        Apply to following slides
      </button>
    </>
  );
}

function BrandKitEditor() {
  const brandKit = useEditorStore((state) => state.project.brandKit);
  const addBrandColor = useEditorStore((state) => state.addBrandColor);
  const removeBrandColor = useEditorStore((state) => state.removeBrandColor);
  const addBrandFont = useEditorStore((state) => state.addBrandFont);
  const removeBrandFont = useEditorStore((state) => state.removeBrandFont);
  const [color, setColor] = useState('#4f46e5');
  const [font, setFont] = useState(FONT_OPTIONS[0]?.family ?? 'Inter');

  const colors = brandKit?.colors ?? [];
  const fonts = brandKit?.fontFamilies ?? [];

  return (
    <>
      <PanelTitle>Brand kit</PanelTitle>
      <ColorField label="Brand color" value={color} onChange={setColor} />
      <div className="brand-swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className="brand-swatch"
            style={{ background: c }}
            title={`${c} — click to remove`}
            onClick={() => removeBrandColor(c)}
          >
            ×
          </button>
        ))}
        <button type="button" className="sidebar-action" onClick={() => addBrandColor(color)}>
          ＋ Add
        </button>
      </div>
      <div className="field-row">
        <select
          className="select-input"
          value={font}
          onChange={(event) => setFont(event.target.value)}
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.family} value={option.family}>
              {option.family}
            </option>
          ))}
        </select>
        <button type="button" className="sidebar-action" onClick={() => addBrandFont(font)}>
          ＋
        </button>
      </div>
      {fonts.map((family) => (
        <div key={family} className="brand-font-row">
          <span>{family}</span>
          <button type="button" className="layer-icon" onClick={() => removeBrandFont(family)} title="Remove">
            ×
          </button>
        </div>
      ))}
    </>
  );
}

function useReplaceImage(): () => void {
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const slideElements = useEditorStore((state) => state.project.slides[state.currentSlideIndex].elements);
  const updateElement = useEditorStore((state) => state.updateElement);

  return () => {
    const target = slideElements.find((el) => el.id === selectedIds[0]);
    if (!target || target.type !== 'image') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const probe = new window.Image();
        probe.onload = () => {
          const ratio = probe.height / probe.width;
          updateElement(target.id, {
            src,
            height: Math.max(4, Math.round(target.width * ratio)),
            crop: undefined,
          });
        };
        probe.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
}

function PenToolSettings() {
  const penBrush = useCanvasUi((s) => s.penBrush);
  const penColor = useCanvasUi((s) => s.penColor);
  const penWidth = useCanvasUi((s) => s.penWidth);
  const setPenBrush = useCanvasUi((s) => s.setPenBrush);
  const setPenColor = useCanvasUi((s) => s.setPenColor);
  const setPenWidth = useCanvasUi((s) => s.setPenWidth);

  return (
    <>
      <PanelTitle>✏️ Draw Brush</PanelTitle>
      <div className="segmented">
        {(['pen', 'marker', 'highlighter'] as BrushKind[]).map((b) => (
          <button
            key={b}
            type="button"
            className={penBrush === b ? 'is-active' : ''}
            onClick={() => setPenBrush(b)}
          >
            {b[0].toUpperCase() + b.slice(1)}
          </button>
        ))}
      </div>
      <ColorField label="Ink color" value={penColor} onChange={setPenColor} />
      <NumberField
        label="Stroke width"
        min={1}
        max={48}
        suffix="px"
        value={penWidth}
        onChange={(v) => setPenWidth(clamp(v, 1, 60))}
      />
      <p className="sidebar-hint">Click and drag anywhere on the slide to draw freehand strokes.</p>
    </>
  );
}

function PathControls({ element, onChange }: ControlProps<PathElement>) {
  return (
    <>
      <PanelTitle>Freehand Stroke</PanelTitle>
      <div className="field-row">
        <span className="field-label">Brush</span>
        <div className="segmented">
          {(['pen', 'marker', 'highlighter'] as BrushKind[]).map((b) => (
            <button
              key={b}
              type="button"
              className={element.brush === b ? 'is-active' : ''}
              onClick={() => onChange({ brush: b })}
            >
              {b[0].toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ColorField label="Stroke" value={element.stroke} onChange={(value) => onChange({ stroke: value })} />
      <NumberField
        label="Width"
        min={1}
        max={60}
        suffix="px"
        value={element.strokeWidth}
        onChange={(value) => onChange({ strokeWidth: clamp(value, 1, 60) })}
      />
    </>
  );
}

function MediaControls({ element, onChange }: ControlProps<MediaElement>) {
  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = element.mediaType === 'video' ? 'video/*' : 'audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ src: String(reader.result), title: file.name });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <>
      <PanelTitle>{element.mediaType === 'video' ? 'Video Embed' : 'Audio Track'}</PanelTitle>
      <div className="field-row">
        <span className="field-label">Title</span>
        <input
          className="text-input"
          value={element.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="field-row">
        <span className="field-label">URL</span>
        <input
          className="text-input"
          placeholder={element.mediaType === 'video' ? 'YouTube or MP4 URL…' : 'MP3/WAV URL…'}
          value={element.src.startsWith('data:') ? '' : element.src}
          onChange={(e) => onChange({ src: e.target.value })}
        />
      </div>
      <button type="button" className="sidebar-action" onClick={pickFile}>
        Upload {element.mediaType} file…
      </button>
      {element.mediaType === 'audio' ? (
        <div className="chip-row">
          <button
            type="button"
            className="chip"
            onClick={() => onChange({ src: createSampleAudioDataUrl('chime'), title: 'Crystal Chime' })}
          >
            🎵 Chime
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => onChange({ src: createSampleAudioDataUrl('ambient'), title: 'Ambient Pad' })}
          >
            🎵 Ambient
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => onChange({ src: createSampleAudioDataUrl('upbeat'), title: 'Upbeat Synth' })}
          >
            🎵 Upbeat
          </button>
        </div>
      ) : null}
      <ColorField
        label="Accent color"
        value={element.posterColor ?? '#6366f1'}
        onChange={(value) => onChange({ posterColor: value })}
      />
      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(element.autoplay)}
            onChange={(e) => onChange({ autoplay: e.target.checked })}
          />
          Autoplay in Present
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(element.loop)}
            onChange={(e) => onChange({ loop: e.target.checked })}
          />
          Loop playback
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(element.muted)}
            onChange={(e) => onChange({ muted: e.target.checked })}
          />
          Muted
        </label>
      </div>
    </>
  );
}
