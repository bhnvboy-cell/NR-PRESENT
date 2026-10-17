import { useMemo, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import { ICONS, ICON_CATEGORIES, iconToDataUrl, type IconDef } from '../../data/icons';
import { GRAPHICS, GRAPHIC_CATEGORIES, graphicToDataUrl, EMOJIS, type GraphicDef } from '../../data/elements';
import { DEFAULT_SLIDE_SIZE, type ShapeKind } from '../../types/editor';

const PRESET_COLORS = ['#0f172a', '#ffffff', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SHAPE_KINDS: { kind: ShapeKind; label: string; preview: React.ReactNode }[] = [
  { kind: 'rect', label: 'Rectangle', preview: <rect x="3" y="6" width="18" height="12" rx="2" /> },
  { kind: 'ellipse', label: 'Ellipse', preview: <ellipse cx="12" cy="12" rx="9" ry="7" /> },
  { kind: 'line', label: 'Line', preview: <path d="M3 12h18" /> },
  { kind: 'arrow', label: 'Arrow', preview: <path d="M3 12h16m-5-5 5 5-5 5" /> },
  { kind: 'triangle', label: 'Triangle', preview: <path d="M12 4 21 19H3Z" /> },
  { kind: 'diamond', label: 'Diamond', preview: <path d="M12 3 21 12l-9 9-9-9Z" /> },
  { kind: 'star', label: 'Star', preview: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z" /> },
  { kind: 'pentagon', label: 'Pentagon', preview: <path d="m12 3 9 6.5-3.4 10.5H6.4L3 9.5Z" /> },
  { kind: 'hexagon', label: 'Hexagon', preview: <path d="m7 4 10 0 5 8-5 8H7l-5-8Z" /> },
];

type ElementsTab = 'shapes' | 'icons' | 'graphics' | 'emoji';

export function ElementsPanel() {
  const insertIcon = useEditorStore((state) => state.insertIcon);
  const addShape = useEditorStore((state) => state.addShape);
  const addEmoji = useEditorStore((state) => state.addEmoji);
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);
  const slideSize = useEditorStore((state) => state.project.slideSize ?? DEFAULT_SLIDE_SIZE);

  const [tab, setTab] = useState<ElementsTab>('shapes');
  const [category, setCategory] = useState<'all' | IconDef['category'] | GraphicDef['category']>('all');
  const [query, setQuery] = useState('');
  const [color, setColor] = useState('#4f46e5');

  const center = useMemo(() => ({ x: slideSize.width / 2, y: slideSize.height / 2 }), [slideSize]);

  const iconList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ICONS.filter(
      (icon) =>
        (tab !== 'icons' || category === 'all' || icon.category === category) &&
        (q === '' || icon.name.includes(q)),
    );
  }, [tab, category, query]);

  const graphicList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GRAPHICS.filter(
      (graphic) =>
        (tab !== 'graphics' || category === 'all' || graphic.category === category) &&
        (q === '' || graphic.name.includes(q)),
    );
  }, [tab, category, query]);

  const handleTab = (next: ElementsTab) => {
    setTab(next);
    setCategory('all');
    setQuery('');
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Elements</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="chip-row panel-tabs">
          {(
            [
              ['shapes', 'Shapes'],
              ['icons', 'Icons'],
              ['graphics', 'Graphics'],
              ['emoji', 'Emoji'],
            ] as [ElementsTab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${tab === value ? 'is-active' : ''}`}
              onClick={() => handleTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'shapes' ? (
          <>
            <p className="panel-hint">Click a shape to add it to the slide.</p>
            <div className="icon-grid">
              {SHAPE_KINDS.map((shape) => (
                <button
                  key={shape.kind}
                  type="button"
                  className="icon-cell"
                  title={shape.label}
                  onClick={() => addShape(shape.kind, center)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    aria-hidden="true"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  >
                    {shape.preview}
                  </svg>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {tab === 'icons' || tab === 'graphics' ? (
          <>
            <input
              className="panel-search"
              placeholder={tab === 'icons' ? 'Search icons…' : 'Search graphics…'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className="chip-row">
              {(tab === 'icons' ? ICON_CATEGORIES : GRAPHIC_CATEGORIES).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`chip ${category === cat.value ? 'is-active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="swatch-row" role="group" aria-label="Element color">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${color === c ? 'is-active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
              <input
                type="color"
                className="swatch-custom"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                title="Custom color"
              />
            </div>

            {tab === 'icons' ? (
              <div className="icon-grid">
                {iconList.map((icon) => (
                  <button
                    key={`${icon.category}-${icon.name}`}
                    type="button"
                    className="icon-cell"
                    title={icon.name}
                    onClick={() => insertIcon(iconToDataUrl(icon, color, 240), color)}
                  >
                    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        {icon.paths.map((d) => (
                          <path key={d} d={d} />
                        ))}
                      </g>
                    </svg>
                  </button>
                ))}
                {iconList.length === 0 ? <p className="panel-empty">No icons match.</p> : null}
              </div>
            ) : (
              <div className="icon-grid">
                {graphicList.map((graphic) => (
                  <button
                    key={`${graphic.category}-${graphic.name}`}
                    type="button"
                    className="icon-cell"
                    title={graphic.name}
                    onClick={() => insertIcon(graphicToDataUrl(graphic, color, 320), color)}
                  >
                    <img
                      src={graphicToDataUrl(graphic, color, 64)}
                      alt=""
                      width={26}
                      height={26}
                      draggable={false}
                    />
                  </button>
                ))}
                {graphicList.length === 0 ? <p className="panel-empty">No graphics match.</p> : null}
              </div>
            )}
          </>
        ) : null}

        {tab === 'emoji' ? (
          <>
            <p className="panel-hint">Click an emoji to place it on the slide.</p>
            <div className="emoji-grid">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" className="emoji-cell" onClick={() => addEmoji(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
