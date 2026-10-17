import { useMemo, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import { SLIDE_TEMPLATES, TEMPLATE_CATEGORIES, type SlideTemplate } from '../../data/templates';
import { DECK_TEMPLATES, DECK_CATEGORIES } from '../../data/deckTemplates';
import type { SlideBackground } from '../../types/editor';

function templateBackgroundCss(bg: SlideBackground): string {
  if (bg.kind === 'solid') return bg.color;
  if (bg.kind === 'radial') return `radial-gradient(circle at 50% 40%, ${bg.from}, ${bg.to})`;
  return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
}

export function TemplateGallery() {
  const insertTemplateSlide = useEditorStore((state) => state.insertTemplateSlide);
  const insertDeck = useEditorStore((state) => state.insertDeck);
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);
  const [tab, setTab] = useState<'slides' | 'decks'>('slides');
  const [category, setCategory] = useState<string>('all');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const templates = useMemo(() => {
    if (tab !== 'slides') return [];
    const base = category === 'all' ? SLIDE_TEMPLATES : SLIDE_TEMPLATES.filter((t) => t.category === category);
    return q === '' ? base : base.filter((t) => t.name.toLowerCase().includes(q) || t.category.includes(q));
  }, [tab, category, q]);

  const decks = useMemo(() => {
    if (tab !== 'decks') return [];
    const base = category === 'all' ? DECK_TEMPLATES : DECK_TEMPLATES.filter((d) => d.category === category);
    return q === ''
      ? base
      : base.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            d.category.includes(q) ||
            d.slides.some((s) => s.name.toLowerCase().includes(q)),
        );
  }, [tab, category, q]);

  const categories = tab === 'slides' ? TEMPLATE_CATEGORIES : DECK_CATEGORIES;

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Templates</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="chip-row panel-tabs">
          <button
            type="button"
            className={`chip ${tab === 'slides' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('slides');
              setCategory('all');
            }}
          >
            Slides
          </button>
          <button
            type="button"
            className={`chip ${tab === 'decks' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('decks');
              setCategory('all');
            }}
          >
            Decks
          </button>
        </div>

        <input
          className="panel-search"
          placeholder={tab === 'slides' ? 'Search slide templates…' : 'Search decks…'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="chip-row">
          {categories.map((cat) => (
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

        <div className="chip-row">
          <button
            type="button"
            className={`chip ${mode === 'append' ? 'is-active' : ''}`}
            onClick={() => setMode('append')}
            title={tab === 'slides' ? 'Add template as a new slide' : 'Add deck as new slides after the current one'}
          >
            {tab === 'slides' ? '+ Add slide' : '+ Add deck'}
          </button>
          <button
            type="button"
            className={`chip ${mode === 'replace' ? 'is-active' : ''}`}
            onClick={() => setMode('replace')}
            title={tab === 'slides' ? 'Apply template to current slide' : 'Replace entire presentation with this deck'}
          >
            {tab === 'slides' ? 'Replace current' : 'Replace all'}
          </button>
        </div>

        {tab === 'slides' ? (
          <div className="template-grid">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="template-card"
                title={`${tpl.name} — click to insert`}
                onClick={() => insertTemplateSlide(tpl, mode)}
              >
                <div className="template-thumb" style={{ background: templateBackgroundCss(tpl.background) }}>
                  <TemplatePreview elements={tpl.build()} />
                </div>
                <span className="template-name">{tpl.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="template-grid">
            {decks.map((deck) => (
              <button
                key={deck.id}
                type="button"
                className="template-card"
                title={`${deck.name} — ${deck.description}`}
                onClick={() => insertDeck(deck, mode)}
              >
                <div
                  className="template-thumb"
                  style={{ background: templateBackgroundCss(deck.slides[0]?.background ?? { kind: 'solid', color: '#0f172a' }) }}
                >
                  <TemplatePreview elements={deck.slides[0]?.build() ?? []} />
                  <span className="deck-badge">{deck.slides.length} slides</span>
                </div>
                <span className="template-name">{deck.name}</span>
                <span className="deck-desc">{deck.description}</span>
              </button>
            ))}
          </div>
        )}
        {tab === 'slides' && templates.length === 0 ? <p className="panel-empty">No templates match.</p> : null}
        {tab === 'decks' && decks.length === 0 ? <p className="panel-empty">No decks match.</p> : null}
      </div>
    </div>
  );
}

/** Lightweight static preview of a template's elements (no Konva needed). */
function TemplatePreview({ elements }: { elements: ReturnType<SlideTemplate['build']> }) {
  return (
    <>
      {elements.slice(0, 8).map((el) => {
        const left = `${(el.x / 1280) * 100}%`;
        const top = `${(el.y / 720) * 100}%`;
        const width = `${(el.width / 1280) * 100}%`;
        if (el.type === 'text') {
          return (
            <div
              key={el.id}
              className="tpl-el tpl-text"
              style={{ left, top, width, color: el.fill, fontSize: `${Math.max(3, el.fontSize / 12)}px` }}
            >
              {el.text.slice(0, 20)}
            </div>
          );
        }
        if (el.type === 'shape') {
          return (
            <div
              key={el.id}
              className="tpl-el"
              style={{
                left,
                top,
                width,
                height: `${(el.height / 720) * 100}%`,
                background: el.fill,
                borderRadius: el.cornerRadius ? `${el.cornerRadius}px` : undefined,
              }}
            />
          );
        }
        if (el.type === 'chart') {
          return <div key={el.id} className="tpl-el tpl-chart" style={{ left, top, width, height: `${(el.height / 720) * 100}%` }} />;
        }
        if (el.type === 'table') {
          return <div key={el.id} className="tpl-el tpl-table" style={{ left, top, width, height: `${(el.height / 720) * 100}%` }} />;
        }
        return <div key={el.id} className="tpl-el" style={{ left, top, width, height: `${(el.height / 720) * 100}%`, background: '#cbd5e1' }} />;
      })}
    </>
  );
}
