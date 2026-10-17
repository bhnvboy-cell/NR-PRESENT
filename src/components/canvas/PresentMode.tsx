import { useEffect, useCallback, useRef, useState } from 'react';
import { Group, Layer, Rect, Stage } from 'react-konva';
import Konva from 'konva';
import { DEFAULT_SLIDE_SIZE, type AnimationProps, type SlideTransition } from '../../types/editor';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import { backgroundToKonva } from '../../utils/background';
import { ElementNode } from './ElementNode';

const TRANSITION_DURATION = 0.55;

type Attrs = {
  opacity?: number;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
};

export function PresentMode() {
  const isPresenting = useCanvasUi((s) => s.isPresenting);
  const presentIndex = useCanvasUi((s) => s.presentIndex);
  const setPresenting = useCanvasUi((s) => s.setPresenting);
  const setPresentIndex = useCanvasUi((s) => s.setPresentIndex);
  const slides = useEditorStore((s) => s.project.slides);
  const slideSize = useEditorStore((s) => s.project.slideSize ?? DEFAULT_SLIDE_SIZE);

  const [showPresenter, setShowPresenter] = useState(true);
  const [clock, setClock] = useState(0);
  const [laser, setLaser] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const laserRef = useRef<HTMLDivElement>(null);
  const presentStartedAt = useCanvasUi((s) => s.presentStartedAt);
  const resetPresentTimer = useCanvasUi((s) => s.resetPresentTimer);
  const groupRef = useRef<Konva.Group>(null);

  const slide = slides[Math.min(presentIndex, slides.length - 1)];
  const nextSlide = slides[presentIndex + 1];

  const exit = useCallback(() => setPresenting(false), [setPresenting]);
  const next = useCallback(
    () => setPresentIndex(Math.min(presentIndex + 1, slides.length - 1)),
    [presentIndex, slides.length, setPresentIndex],
  );
  const prev = useCallback(
    () => setPresentIndex(Math.max(presentIndex - 1, 0)),
    [presentIndex, setPresentIndex],
  );

  useEffect(() => {
    if (!isPresenting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exit();
      else if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') next();
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') prev();
      else if (event.key.toLowerCase() === 'n') setShowPresenter((v) => !v);
      else if (event.key.toLowerCase() === 't') resetPresentTimer();
      else if (event.key.toLowerCase() === 'l') setLaser((v) => !v);
      else if (event.key.toLowerCase() === 'o') setShowOverview((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    const el = document.documentElement;
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => undefined);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [isPresenting, exit, next, prev, resetPresentTimer]);

  useEffect(() => {
    if (!isPresenting) return;
    const id = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [isPresenting]);

  const elapsed =
    presentStartedAt > 0 && clock > presentStartedAt ? Math.floor((clock - presentStartedAt) / 1000) : 0;

  // Slide transition + per-element entrance animations, run on every slide change.
  useEffect(() => {
    if (!isPresenting || !slide) return;
    const group = groupRef.current;
    if (!group) return;

    // Reset any leftover transform from the previous slide.
    group.setAttrs({ opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 });

    const transition = slide.transition ?? 'none';
    if (transition !== 'none') {
      const from = transitionFrom(transition, slideSize);
      group.setAttrs(from);
      group.to({
        ...transitionTo(transition),
        duration: TRANSITION_DURATION,
        easing: Konva.Easings.EaseInOut,
      });
    }

    slide.elements.forEach((element) => {
      const anim = element.animation;
      if (!anim || anim.kind === 'none') return;
      const node = group.findOne(`#${element.id}`);
      if (!node) return;
      runElementAnimation(node, anim);
    });
  }, [isPresenting, presentIndex, slide, slideSize]);

  if (!isPresenting || !slide) return null;

  // Fit the slide to the viewport while preserving aspect ratio.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / slideSize.width, vh / slideSize.height);
  const offsetX = (vw - slideSize.width * scale) / 2;
  const offsetY = (vh - slideSize.height * scale) / 2;
  const bgProps = backgroundToKonva(slide.backgroundFill, slideSize.width, slideSize.height);

  return (
    <div className="present-overlay">
      <Stage
        width={vw}
        height={vh}
        onPointerDown={() => {
          if (!laser) next();
        }}
        onPointerMove={(event) => {
          const node = laserRef.current;
          if (laser && node) {
            node.style.left = `${event.evt.clientX}px`;
            node.style.top = `${event.evt.clientY}px`;
            node.style.opacity = '1';
          }
        }}
        onPointerLeave={() => {
          const node = laserRef.current;
          if (node) node.style.opacity = '0';
        }}
        style={{ cursor: laser ? 'crosshair' : 'pointer' }}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Group ref={groupRef} listening={false}>
            <Rect width={slideSize.width} height={slideSize.height} {...bgProps} listening={false} />
            {slide.elements
              .filter((element) => !element.hidden)
              .map((element) => (
                <ElementNode
                  key={element.id}
                  element={element}
                  selected={false}
                  interactive={false}
                  listening={false}
                />
              ))}
          </Group>
        </Layer>
      </Stage>

      {laser ? <div ref={laserRef} className="present-laser" style={{ opacity: 0 }} /> : null}

      {showOverview ? (
        <div className="present-overview" onClick={(e) => e.stopPropagation()}>
          <div className="present-overview-head">
            <span>All slides ({slides.length})</span>
            <button type="button" onClick={() => setShowOverview(false)}>
              ×
            </button>
          </div>
          <div className="present-overview-grid">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`present-overview-card ${i === presentIndex ? 'is-current' : ''}`}
                onClick={() => {
                  setPresentIndex(i);
                  setShowOverview(false);
                }}
              >
                <span className="present-overview-num">{i + 1}</span>
                <span className="present-overview-name">{s.name || 'Slide'}</span>
                {s.notes?.trim() ? <span className="present-overview-notes">📝</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="present-hud" onClick={(e) => e.stopPropagation()}>
        <span className="present-timer" title="Elapsed time (T resets)">
          {formatTime(elapsed)}
        </span>
        <span>
          {presentIndex + 1} / {slides.length}
        </span>
        <button type="button" onClick={prev} disabled={presentIndex === 0}>
          ‹
        </button>
        <button type="button" onClick={next} disabled={presentIndex === slides.length - 1}>
          ›
        </button>
        <button
          type="button"
          className={laser ? 'is-on' : ''}
          onClick={() => setLaser((v) => !v)}
          title="Laser pointer (L)"
        >
          ●
        </button>
        <button
          type="button"
          className={showOverview ? 'is-on' : ''}
          onClick={() => setShowOverview((v) => !v)}
          title="Slide overview (O)"
        >
          ▦
        </button>
        <button
          type="button"
          className={showPresenter ? 'is-on' : ''}
          onClick={() => setShowPresenter((v) => !v)}
          title="Toggle presenter view (N)"
        >
          ⧉
        </button>
        <button type="button" onClick={exit}>
          ✕ Exit
        </button>
      </div>

      {showPresenter ? (
        <div className="present-presenter" onClick={(e) => e.stopPropagation()}>
          <div className="present-notes">
            <div className="present-notes-head">Notes · slide {presentIndex + 1}</div>
            <div className="present-notes-body">
              {slide.notes?.trim() ? slide.notes : 'No notes for this slide.'}
            </div>
          </div>
          {nextSlide ? (
            <div className="present-next">
              <div className="present-next-label">Next</div>
              <Stage width={252} height={142}>
                <Layer>
                  <NextSlidePreview slideIndex={presentIndex + 1} />
                </Layer>
              </Stage>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Renders a scaled-down copy of a slide inside the presenter preview stage. */
function NextSlidePreview({ slideIndex }: { slideIndex: number }) {
  const slide = useEditorStore((s) => s.project.slides[slideIndex]);
  const slideSize = useEditorStore((s) => s.project.slideSize ?? DEFAULT_SLIDE_SIZE);
  if (!slide) return null;
  const s = 252 / slideSize.width;
  const bgProps = backgroundToKonva(slide.backgroundFill, slideSize.width, slideSize.height);
  return (
    <Group
      scaleX={s}
      scaleY={s}
      listening={false}
      onMouseDown={() => useCanvasUi.getState().setPresentIndex(slideIndex)}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
      }}
    >
      <Rect width={slideSize.width} height={slideSize.height} {...bgProps} listening={false} />
      {slide.elements
        .filter((element) => !element.hidden)
        .map((element) => (
          <ElementNode
            key={element.id}
            element={element}
            selected={false}
            interactive={false}
            listening={false}
          />
        ))}
    </Group>
  );
}

function transitionFrom(kind: SlideTransition, size: { width: number; height: number }): Attrs {
  switch (kind) {
    case 'slideLeft':
      return { x: size.width * 0.06, opacity: 0 };
    case 'slideRight':
      return { x: -size.width * 0.06, opacity: 0 };
    case 'slideUp':
      return { y: size.height * 0.06, opacity: 0 };
    case 'zoom':
      return { scaleX: 1.06, scaleY: 1.06, opacity: 0 };
    case 'dissolve':
      return { opacity: 0, scaleX: 0.98, scaleY: 0.98 };
    case 'fade':
    default:
      return { opacity: 0 };
  }
}

function transitionTo(kind: SlideTransition): Attrs {
  switch (kind) {
    case 'slideLeft':
    case 'slideRight':
    case 'slideUp':
      return { x: 0, y: 0, opacity: 1 };
    case 'zoom':
    case 'dissolve':
      return { scaleX: 1, scaleY: 1, opacity: 1 };
    default:
      return { opacity: 1 };
  }
}

function runElementAnimation(node: Konva.Node, anim: AnimationProps): void {
  const baseX = node.x();
  const baseY = node.y();
  const w = node.width() || 0;
  const h = node.height() || 0;
  const duration = Math.max(0.1, anim.duration / 1000);
  const delay = Math.max(0, anim.delay / 1000);

  let from: Attrs = { opacity: 0 };
  let to: Attrs = { opacity: node.opacity() || 1, x: baseX, y: baseY, scaleX: 1, scaleY: 1, rotation: node.rotation() };

  switch (anim.kind) {
    case 'fade':
      from = { opacity: 0 };
      to = { opacity: 1 };
      break;
    case 'slideLeft':
      from = { opacity: 0, x: baseX - Math.min(160, w || 120) };
      to = { opacity: 1, x: baseX };
      break;
    case 'slideRight':
      from = { opacity: 0, x: baseX + Math.min(160, w || 120) };
      to = { opacity: 1, x: baseX };
      break;
    case 'slideUp':
      from = { opacity: 0, y: baseY + Math.min(120, h || 80) };
      to = { opacity: 1, y: baseY };
      break;
    case 'slideDown':
      from = { opacity: 0, y: baseY - Math.min(120, h || 80) };
      to = { opacity: 1, y: baseY };
      break;
    case 'zoom':
      from = { opacity: 0, scaleX: 0.6, scaleY: 0.6, x: baseX + w / 2 * 0.4, y: baseY + h / 2 * 0.4 };
      to = { opacity: 1, scaleX: 1, scaleY: 1, x: baseX, y: baseY };
      break;
    case 'spin':
      from = { opacity: 0, rotation: -90, scaleX: 0.7, scaleY: 0.7 };
      to = { opacity: 1, rotation: 0, scaleX: 1, scaleY: 1 };
      break;
    default:
      return;
  }

  node.setAttrs(from);
  node.to({
    ...to,
    duration,
    delay,
    easing: Konva.Easings.EaseOut,
  });
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
