import { useCallback, useEffect, useRef, useState } from 'react';
import { Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import { DEFAULT_SHADOW, DEFAULT_SLIDE_SIZE, type ShapeKind } from '../../types/editor';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import { backgroundToKonva } from '../../utils/background';
import { computeSnap } from '../../utils/snap';
import { createId } from '../../utils/id';
import { ElementNode } from './ElementNode';
import { TextEditorOverlay } from './TextEditorOverlay';
import { RulerOverlay } from './RulerOverlay';

const SHAPE_TOOLS: Record<string, ShapeKind> = {
  rect: 'rect',
  ellipse: 'ellipse',
  line: 'line',
  arrow: 'arrow',
  triangle: 'triangle',
  diamond: 'diamond',
  star: 'star',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
};

export function SlideCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const slide = useEditorStore((state) => state.currentSlide());
  const tool = useEditorStore((state) => state.tool);
  const zoom = useEditorStore((state) => state.zoom);
  const pan = useEditorStore((state) => state.pan);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const editingTextId = useEditorStore((state) => state.editingTextId);
  const viewport = useEditorStore((state) => state.project.viewport);
  const slideSize = useEditorStore((state) => state.project.slideSize ?? DEFAULT_SLIDE_SIZE);
  const setSelection = useEditorStore((state) => state.setSelection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setTool = useEditorStore((state) => state.setTool);
  const setPan = useEditorStore((state) => state.setPan);
  const zoomAt = useEditorStore((state) => state.zoomAt);
  const setZoom = useEditorStore((state) => state.setZoom);
  const ensureHistory = useEditorStore((state) => state.ensureHistory);
  const endHistory = useEditorStore((state) => state.endHistory);
  const addTextBox = useEditorStore((state) => state.addTextBox);
  const addImage = useEditorStore((state) => state.addImage);
  const updateElement = useEditorStore((state) => state.updateElement);
  const endTextEdit = useEditorStore((state) => state.endTextEdit);
  const selectWithinBounds = useEditorStore((state) => state.selectWithinBounds);

  const guides = useCanvasUi((state) => state.guides);
  const marquee = useCanvasUi((state) => state.marquee);
  const setMarquee = useCanvasUi((state) => state.setMarquee);
  const clearGuides = useCanvasUi((state) => state.clearGuides);

  const [spaceHeld, setSpaceHeld] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const panSession = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const drawSession = useRef<{ id: string; startX: number; startY: number; kind: ShapeKind } | null>(null);
  const marqueeSession = useRef<{ startX: number; startY: number } | null>(null);

  const interactive = tool === 'select';
  const panning = tool === 'hand' || spaceHeld;

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const padding = 64;
    const nextZoom = Math.min(
      (container.clientWidth - padding) / slideSize.width,
      (container.clientHeight - padding) / slideSize.height,
      1,
    );
    const clamped = Math.max(0.1, nextZoom);
    setZoom(clamped);
    setPan({
      x: (container.clientWidth - slideSize.width * clamped) / 2,
      y: (container.clientHeight - slideSize.height * clamped) / 2,
    });
  }, [setPan, setZoom, slideSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewportSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    const handleFit = () => fitToScreen();
    window.addEventListener('nr:fit-canvas', handleFit);
    return () => window.removeEventListener('nr:fit-canvas', handleFit);
  }, [fitToScreen]);

  useEffect(() => {
    const handleMouseUp = () => endHistory();
    window.addEventListener('pointerup', handleMouseUp);
    return () => window.removeEventListener('pointerup', handleMouseUp);
  }, [endHistory]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isEditableTarget(event.target)) {
        event.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => Boolean(node));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, slide.id, slide.elements.length, editingTextId]);

  const screenToSlide = useCallback(
    (point: { x: number; y: number }) => ({
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    }),
    [pan.x, pan.y, zoom],
  );

  const openImagePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        setTool('select');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const probe = new window.Image();
        probe.onload = () => {
          addImage(src, { width: probe.width, height: probe.height });
          setTool('select');
        };
        probe.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addImage, setTool]);

  const handleStagePointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const isBackground =
      event.target === stage || (event.target as Konva.Node).name() === 'slide-bg';

    if (panning || event.evt.button === 1) {
      panSession.current = { x: pointer.x, y: pointer.y, panX: pan.x, panY: pan.y };
      return;
    }

    if (tool === 'text' && isBackground) {
      addTextBox(screenToSlide(pointer));
      return;
    }

    const shapeKind = SHAPE_TOOLS[tool];
    if (shapeKind && isBackground) {
      const at = screenToSlide(pointer);
      ensureHistory();
      const tempId = createId('drawing');
      drawSession.current = { id: tempId, startX: at.x, startY: at.y, kind: shapeKind };
      addDrawingPreview(shapeKind, at.x, at.y, tempId);
      return;
    }

    if (tool === 'image' && isBackground) {
      openImagePicker();
      return;
    }

    if (tool === 'select' && isBackground) {
      if (!event.evt.shiftKey) clearSelection();
      marqueeSession.current = { startX: pointer.x, startY: pointer.y };
      setMarquee({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
    }
  };

  const addDrawingPreview = (kind: ShapeKind, x: number, y: number, id: string) => {
    const isLine = kind === 'line' || kind === 'arrow';
    const template = {
      id,
      type: 'shape' as const,
      shape: kind,
      x,
      y,
      width: 0,
      height: 0,
      rotation: 0,
      opacity: 1,
      shadow: { ...DEFAULT_SHADOW },
      locked: false,
      fill: isLine ? 'transparent' : '#6366f1',
      stroke: '#4f46e5',
      strokeWidth: 3,
      cornerRadius: kind === 'rect' ? 12 : 0,
      innerRadiusRatio: 0.5,
    };
    useEditorStore.setState((state) => {
      const slides = state.project.slides.slice();
      const current = { ...slides[state.currentSlideIndex] };
      current.elements = [...current.elements, template];
      slides[state.currentSlideIndex] = current;
      return { project: { ...state.project, slides }, selectedIds: [] };
    });
  };

  const handleStagePointerMove = (event: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    if (panSession.current) {
      const session = panSession.current;
      setPan({ x: session.panX + (pointer.x - session.x), y: session.panY + (pointer.y - session.y) });
      return;
    }

    if (marqueeSession.current) {
      const start = marqueeSession.current;
      setMarquee({
        x: Math.min(start.startX, pointer.x),
        y: Math.min(start.startY, pointer.y),
        width: Math.abs(pointer.x - start.startX),
        height: Math.abs(pointer.y - start.startY),
      });
      return;
    }

    const draw = drawSession.current;
    if (draw) {
      const at = screenToSlide(pointer);
      const width = at.x - draw.startX;
      const height = at.y - draw.startY;
      const raw = {
        x: width < 0 ? at.x : draw.startX,
        y: height < 0 ? at.y : draw.startY,
        width: Math.abs(width),
        height: Math.abs(height),
      };
      const others = useEditorStore
        .getState()
        .currentSlide()
        .elements.filter((el) => el.id !== draw.id)
        .map((el) => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
      const snap = computeSnap(raw, others, {
        snapToGuides: viewport.snapToGuides,
        snapToGrid: viewport.snapToGrid,
        gridSize: viewport.gridSize,
        slideSize,
      });
      useCanvasUi.getState().setGuides(snap.guides);
      updateElement(
        draw.id,
        { x: raw.x + snap.dx, y: raw.y + snap.dy, width: raw.width, height: raw.height },
        { history: false },
      );
    }
  };

  const handleStagePointerUp = (event: Konva.KonvaEventObject<PointerEvent>) => {
    panSession.current = null;
    clearGuides();

    if (marqueeSession.current) {
      const stage = event.target.getStage();
      const pointer = stage?.getPointerPosition();
      const start = marqueeSession.current;
      marqueeSession.current = null;
      if (pointer) {
        const bounds = {
          x: Math.min(start.startX, pointer.x),
          y: Math.min(start.startY, pointer.y),
          width: Math.abs(pointer.x - start.startX),
          height: Math.abs(pointer.y - start.startY),
        };
        // Ignore tiny accidental drags (treated as a click on empty space).
        if (bounds.width > 4 || bounds.height > 4) {
          const slideBounds = {
            x: (bounds.x - pan.x) / zoom,
            y: (bounds.y - pan.y) / zoom,
            width: bounds.width / zoom,
            height: bounds.height / zoom,
          };
          selectWithinBounds(slideBounds, event.evt.shiftKey ? 'add' : 'replace');
        }
      }
      setMarquee(null);
    }

    const draw = drawSession.current;
    if (!draw) return;
    drawSession.current = null;

    const store = useEditorStore.getState();
    const created = store.currentSlide().elements.find((el) => el.id === draw.id);
    if (created && created.width < 6 && created.height < 6) {
      if (draw.kind === 'line' || draw.kind === 'arrow') {
        updateElement(draw.id, { width: 240, height: 0 });
      } else {
        updateElement(draw.id, { width: 260, height: 180, x: draw.startX - 130, y: draw.startY - 90 });
      }
    }
    setSelection([draw.id]);
    setTool('select');
    endHistory();
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    if (event.evt.ctrlKey || event.evt.metaKey) {
      zoomAt(event.evt.deltaY > 0 ? 0.92 : 1.08, pointer);
    } else {
      setPan({ x: pan.x - event.evt.deltaX, y: pan.y - event.evt.deltaY });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const at = screenToSlide({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const probe = new window.Image();
      probe.onload = () => addImage(src, { width: probe.width, height: probe.height }, at);
      probe.src = src;
    };
    reader.readAsDataURL(file);
  };

  const editingElement = editingTextId != null ? slide.elements.find((el) => el.id === editingTextId) : null;
  const bgProps = backgroundToKonva(slide.backgroundFill, slideSize.width, slideSize.height);

  return (
    <div
      className={`canvas-viewport ${panning ? 'is-panning' : ''}`}
      ref={containerRef}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={viewportSize.width}
        height={viewportSize.height}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onWheel={handleWheel}
        style={{ cursor: panning ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
      >
        <Layer x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
          <Rect
            name="slide-bg"
            width={slideSize.width}
            height={slideSize.height}
            {...bgProps}
            shadowColor="rgba(15, 23, 42, 0.35)"
            shadowBlur={28}
            shadowOffsetY={10}
          />

          {viewport.showGrid ? (
            <GridOverlay gridSize={viewport.gridSize} zoom={zoom} size={slideSize} />
          ) : null}

          {slide.elements
            .filter((element) => !element.hidden)
            .map((element) => (
              <ElementNode
                key={element.id}
                element={element}
                selected={selectedIds.includes(element.id)}
                interactive={interactive}
                listening={tool !== 'hand'}
              />
            ))}

          <GuideOverlay guides={guides} zoom={zoom} />

          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={false}
            anchorSize={10}
            anchorCornerRadius={2}
            anchorStroke="#4f46e5"
            anchorFill="#ffffff"
            borderStroke="#4f46e5"
            borderStrokeWidth={1.5}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 6 || newBox.height < 6 ? oldBox : newBox)}
            enabledAnchors={editingTextId != null ? ['middle-left', 'middle-right'] : undefined}
          />
        </Layer>
      </Stage>

      {viewport.showRulers ? (
        <RulerOverlay
          zoom={zoom}
          pan={pan}
          width={viewportSize.width}
          height={viewportSize.height}
          slideSize={slideSize}
        />
      ) : null}

      {marquee ? (
        <div
          className="marquee"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      ) : null}

      {editingElement && editingElement.type === 'text' ? (
        <TextEditorOverlay
          key={editingElement.id}
          element={editingElement}
          zoom={zoom}
          pan={pan}
          onCommit={(text) => updateElement(editingElement.id, { text }, { history: false })}
          onClose={endTextEdit}
        />
      ) : null}

      <div className="canvas-hud">
        <span>
          {Math.round(zoom * 100)}% · {slideSize.width}×{slideSize.height}
        </span>
        <button type="button" className="hud-button" onClick={fitToScreen}>
          Fit
        </button>
      </div>
    </div>
  );
}

function GridOverlay({
  gridSize,
  zoom,
  size,
}: {
  gridSize: number;
  zoom: number;
  size: { width: number; height: number };
}) {
  const strokeW = 1 / zoom;
  const lines: React.ReactNode[] = [];
  for (let x = gridSize; x < size.width; x += gridSize) {
    lines.push(
      <Line key={`v${x}`} points={[x, 0, x, size.height]} stroke="rgba(99,102,241,0.2)" strokeWidth={strokeW} listening={false} />,
    );
  }
  for (let y = gridSize; y < size.height; y += gridSize) {
    lines.push(
      <Line key={`h${y}`} points={[0, y, size.width, y]} stroke="rgba(99,102,241,0.2)" strokeWidth={strokeW} listening={false} />,
    );
  }
  return <>{lines}</>;
}

function GuideOverlay({
  guides,
  zoom,
}: {
  guides: { orientation: 'vertical' | 'horizontal'; position: number; start: number; end: number }[];
  zoom: number;
}) {
  if (guides.length === 0) return null;
  const strokeW = 1.5 / zoom;
  return (
    <>
      {guides.map((guide, index) =>
        guide.orientation === 'vertical' ? (
          <Line
            key={`g${index}`}
            points={[guide.position, guide.start, guide.position, guide.end]}
            stroke="#f43f5e"
            strokeWidth={strokeW}
            dash={[4 / zoom, 4 / zoom]}
            listening={false}
          />
        ) : (
          <Line
            key={`g${index}`}
            points={[guide.start, guide.position, guide.end, guide.position]}
            stroke="#f43f5e"
            strokeWidth={strokeW}
            dash={[4 / zoom, 4 / zoom]}
            listening={false}
          />
        ),
      )}
    </>
  );
}
