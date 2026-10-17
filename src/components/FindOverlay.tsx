import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvasUi } from '../store/canvasUi';

interface FindHit {
  slideIndex: number;
  elementId: string;
  snippet: string;
}

export function FindOverlay() {
  const open = useCanvasUi((s) => s.findOpen);
  const slides = useEditorStore((s) => s.project.slides);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as FindHit[];
    const out: FindHit[] = [];
    slides.forEach((slide, slideIndex) => {
      slide.elements.forEach((el) => {
        if (el.type !== 'text') return;
        const text = el.text ?? '';
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return;
        const start = Math.max(0, idx - 24);
        const raw = text.slice(start, idx + q.length + 36).replace(/\s+/g, ' ');
        const snippet = `${start > 0 ? '…' : ''}${raw}${idx + q.length + 36 < text.length ? '…' : ''}`;
        out.push({ slideIndex, elementId: el.id, snippet });
      });
    });
    return out;
  }, [query, slides]);

  const close = () => useCanvasUi.getState().setFindOpen(false);

  const goTo = (hit: FindHit) => {
    const store = useEditorStore.getState();
    store.selectSlide(hit.slideIndex);
    store.setSelection([hit.elementId]);
    close();
  };

  if (!open) return null;

  return (
    <div className="find-overlay" role="dialog" aria-label="Find in presentation">
      <div className="find-box">
        <input
          ref={inputRef}
          value={query}
          placeholder="Find in presentation…"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            } else if (event.key === 'Enter' && hits[0]) {
              goTo(hits[0]);
            } else if (event.key === 'Enter' && event.shiftKey && hits.length > 1) {
              goTo(hits[hits.length - 1]);
            }
          }}
        />
        <span className="find-count">
          {query.trim() ? `${hits.length} match${hits.length === 1 ? '' : 'es'}` : ''}
        </span>
        <button type="button" className="find-close" onClick={close} title="Close (Esc)">
          ×
        </button>
      </div>
      {hits.length > 0 ? (
        <ul className="find-results">
          {hits.map((hit, index) => (
            <li key={`${hit.slideIndex}-${hit.elementId}-${index}`}>
              <button type="button" onClick={() => goTo(hit)}>
                <span className="find-slide-num">Slide {hit.slideIndex + 1}</span>
                <span className="find-snippet">{hit.snippet}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim() ? (
        <div className="find-empty">No matches.</div>
      ) : null}
    </div>
  );
}
