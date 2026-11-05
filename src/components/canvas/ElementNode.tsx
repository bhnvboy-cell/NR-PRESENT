import { useEffect, useRef, useState } from 'react';
import { Arrow, Ellipse, Image as KonvaImage, Line, Rect, Shape, Text } from 'react-konva';
import type Konva from 'konva';
import type {
  CanvasElement,
  ChartElement,
  ImageElement,
  MediaElement,
  PathElement,
  ShapeElement,
  TableElement,
  TextElement,
} from '../../types/editor';
import { POLYGONAL_SHAPES } from '../../types/editor';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import { polygonPoints } from '../../utils/geometry';
import { buildImageFilters } from '../../utils/filters';
import { cropRect } from '../../utils/imageCrop';
import { computeSnap } from '../../utils/snap';
import { drawChart } from '../../utils/chart';
import { drawTable } from '../../utils/table';
import { drawStyledText, hasCustomTextRender } from '../../utils/textEffects';
import { drawMaskedImage, hasImageMask } from '../../utils/imageMask';
import { drawMediaElement } from '../../utils/media';

/** Extract the raw canvas 2D context from a Konva scene context. */
function rawCtx(ctx: unknown): CanvasRenderingContext2D {
  return (ctx as { _context: CanvasRenderingContext2D })._context;
}

interface ElementNodeProps {
  element: CanvasElement;
  selected: boolean;
  interactive: boolean;
  listening: boolean;
}

export function ElementNode({ element, selected, interactive, listening }: ElementNodeProps) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const setSelection = useEditorStore((state) => state.setSelection);
  const toggleSelection = useEditorStore((state) => state.toggleSelection);
  const tool = useEditorStore((state) => state.tool);
  const beginTextEdit = useEditorStore((state) => state.beginTextEdit);
  const editingTextId = useEditorStore((state) => state.editingTextId);
  const nodeRef = useRef<Konva.Node>(null);
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);

  const draggable = interactive && listening && !element.locked && tool === 'select';
  const shadow = element.shadow.enabled
    ? {
        shadowEnabled: true,
        shadowColor: element.shadow.color,
        shadowBlur: element.shadow.blur,
        shadowOffsetX: element.shadow.offsetX,
        shadowOffsetY: element.shadow.offsetY,
        shadowOpacity: element.shadow.opacity,
      }
    : { shadowEnabled: false };

  /** Resolve every element that shares this element's groupId (or just itself). */
  const groupSiblings = (): CanvasElement[] => {
    if (!element.groupId) return [element];
    const slide = useEditorStore.getState().currentSlide();
    return slide.elements.filter((el) => el.groupId === element.groupId);
  };

  const commonProps: CommonNodeProps = {
    id: element.id,
    name: 'editor-element',
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable,
    listening,
    ...shadow,
    onPointerDown: (event: Konva.KonvaEventObject<PointerEvent>) => {
      if (!listening) return;
      event.cancelBubble = true;
      if (tool !== 'select') return;
      const targets = groupSiblings().map((el) => el.id);
      if (event.evt.shiftKey) {
        toggleSelection(element.id);
      } else if (!selected) {
        setSelection(targets);
      }
    },
    onDragStart: () => {
      dragOrigin.current = { x: element.x, y: element.y };
    },
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      const node = event.target;
      const stage = node.getStage();
      if (!stage) return;

      // Live-sync grouped siblings.
      if (element.groupId && dragOrigin.current) {
        const dx = node.x() - dragOrigin.current.x;
        const dy = node.y() - dragOrigin.current.y;
        for (const sibling of groupSiblings()) {
          if (sibling.id === element.id) continue;
          const siblingNode = stage.findOne(`#${sibling.id}`);
          if (siblingNode) siblingNode.position({ x: sibling.x + dx, y: sibling.y + dy });
        }
      }

      // Smart snapping (skip during group drag for stability).
      const storeState = useEditorStore.getState();
      const viewport = storeState.project.viewport;
      if (!element.groupId && (viewport.snapToGuides || viewport.snapToGrid)) {
        const slide = storeState.currentSlide();
        const others = slide.elements
          .filter((el) => el.id !== element.id)
          .map((el) => ({ x: el.x, y: el.y, width: el.width, height: el.height }));
        const raw = {
          x: node.x(),
          y: node.y(),
          width: element.width,
          height: element.height,
        };
        const snap = computeSnap(raw, others, {
          snapToGuides: viewport.snapToGuides,
          snapToGrid: viewport.snapToGrid,
          gridSize: viewport.gridSize,
          slideSize: storeState.project.slideSize,
        });
        if (snap.dx !== 0 || snap.dy !== 0) {
          node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy });
        }
        useCanvasUi.getState().setGuides(snap.guides);
      }
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      useCanvasUi.getState().clearGuides();
      const node = event.target;
      const finalX = node.x();
      const finalY = node.y();
      const origin = dragOrigin.current;
      dragOrigin.current = null;

      if (element.groupId && origin) {
        const dx = finalX - element.x;
        const dy = finalY - element.y;
        const store = useEditorStore.getState();
        store.ensureHistory();
        for (const sibling of groupSiblings()) {
          const delta =
            sibling.id === element.id
              ? { x: finalX - sibling.x, y: finalY - sibling.y }
              : { x: dx, y: dy };
          store.updateElement(
            sibling.id,
            { x: sibling.x + delta.x, y: sibling.y + delta.y },
            { history: false },
          );
        }
        store.endHistory();
        return;
      }

      updateElement(element.id, { x: finalX, y: finalY }, { history: false });
    },
  };

  switch (element.type) {
    case 'text':
      return (
        <TextBlock
          element={element}
          common={commonProps}
          draggable={draggable}
          editing={editingTextId === element.id}
          nodeRef={nodeRef}
          onDoubleClick={() => {
            if (listening && !element.locked) beginTextEdit(element.id);
          }}
        />
      );
    case 'shape':
      return <ShapeBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    case 'image':
      return <ImageBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    case 'chart':
      return <ChartBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    case 'table':
      return <TableBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    case 'path':
      return <PathBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    case 'media':
      return <MediaBlock element={element} common={commonProps} nodeRef={nodeRef} />;
    default:
      return null;
  }
}

type CommonNodeProps = Konva.NodeConfig & {
  onPointerDown?: (event: Konva.KonvaEventObject<PointerEvent>) => void;
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: Konva.KonvaEventObject<DragEvent>) => void;
};

interface BlockProps<T extends CanvasElement> {
  element: T;
  common: CommonNodeProps;
  nodeRef: React.RefObject<Konva.Node | null>;
  onDoubleClick?: () => void;
}

function commitScale(
  node: Konva.Node,
  element: CanvasElement,
  update: (patch: Partial<CanvasElement>) => void,
): void {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  node.scaleX(1);
  node.scaleY(1);

  if (element.type === 'text') {
    update({
      width: Math.max(20, element.width * scaleX),
      fontSize: Math.max(6, Math.round(element.fontSize * scaleY)),
      x: node.x(),
      y: node.y(),
    });
    return;
  }

  if (element.type === 'path') {
    update({
      width: Math.max(4, element.width * scaleX),
      height: Math.max(4, element.height * scaleY),
      points: element.points.map((v, i) => (i % 2 === 0 ? v * scaleX : v * scaleY)),
      x: node.x(),
      y: node.y(),
    } as Partial<PathElement>);
    return;
  }

  const minHeight =
    element.type === 'shape' && (element.shape === 'line' || element.shape === 'arrow') ? 0 : 4;
  update({
    width: Math.max(4, element.width * scaleX),
    height: Math.max(minHeight, element.height * scaleY),
    x: node.x(),
    y: node.y(),
  });
}

function TextBlock({
  element,
  common,
  draggable,
  editing,
  nodeRef,
  onDoubleClick,
}: BlockProps<TextElement> & { editing: boolean; draggable: boolean }) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const fontStyle = element.italic ? 'italic' : 'normal';

  if (hasCustomTextRender(element)) {
    return (
      <Shape
        {...(common as Konva.ShapeConfig)}
        ref={nodeRef as React.RefObject<Konva.Shape>}
        width={element.width}
        height={Math.max(element.height, element.fontSize * 2.2)}
        visible={!editing}
        onDblClick={onDoubleClick}
        sceneFunc={(ctx, shape) => {
          drawStyledText(rawCtx(ctx), element);
          ctx.beginPath();
          ctx.rect(0, 0, element.width, Math.max(element.height, element.fontSize * 2.2));
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill="rgba(0,0,0,0)"
        onTransformEnd={(event) => {
          const node = event.target;
          commitScale(node, element, (patch) =>
            updateElement(element.id, patch, { history: false }),
          );
          updateElement(element.id, { x: node.x(), y: node.y() });
        }}
        draggable={draggable}
      />
    );
  }

  return (
    <Text
      {...(common as Konva.TextConfig)}
      ref={nodeRef as React.RefObject<Konva.Text>}
      text={element.text}
      width={element.width}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontWeight={element.fontWeight}
      fontStyle={fontStyle}
      fill={element.fill}
      align={element.align}
      lineHeight={element.lineHeight}
      letterSpacing={element.letterSpacing}
      textDecoration={element.decoration === 'none' ? undefined : element.decoration}
      visible={!editing}
      onDblClick={onDoubleClick}
      onTransformEnd={(event) => {
        const node = event.target;
        commitScale(node, element, (patch) =>
          updateElement(element.id, patch, { history: false }),
        );
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
      draggable={draggable}
    />
  );
}

function ShapeBlock({ element, common, nodeRef }: BlockProps<ShapeElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const strokeProps = {
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    lineJoin: 'round' as const,
    hitStrokeWidth: Math.max(element.strokeWidth, 12),
  };
  const onTransformEnd = (event: Konva.KonvaEventObject<Event>) => {
    const node = event.target;
    commitScale(node, element, (patch) => updateElement(element.id, patch, { history: false }));
    updateElement(element.id, { x: node.x(), y: node.y() });
  };

  if (element.shape === 'rect') {
    return (
      <Rect
        {...(common as Konva.RectConfig)}
        ref={nodeRef as React.RefObject<Konva.Rect>}
        width={element.width}
        height={element.height}
        fill={element.fill}
        cornerRadius={element.cornerRadius}
        {...strokeProps}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  if (element.shape === 'ellipse') {
    return (
      <Ellipse
        {...(common as Konva.EllipseConfig)}
        ref={nodeRef as React.RefObject<Konva.Ellipse>}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        fill={element.fill}
        {...strokeProps}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  const points = [0, 0, element.width, element.height];
  if (element.shape === 'arrow') {
    return (
      <Arrow
        {...(common as Konva.ArrowConfig)}
        ref={nodeRef as React.RefObject<Konva.Arrow>}
        points={points}
        fill={element.stroke}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        pointerAtBeginning={false}
        hitStrokeWidth={Math.max(element.strokeWidth * 2, 16)}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  if (element.shape === 'line') {
    return (
      <Line
        {...(common as Konva.LineConfig)}
        ref={nodeRef as React.RefObject<Konva.Line>}
        points={points}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        lineCap="round"
        hitStrokeWidth={Math.max(element.strokeWidth * 2, 16)}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  if (POLYGONAL_SHAPES.includes(element.shape)) {
    const pts = polygonPoints(element.shape, element.width, element.height);
    return (
      <Shape
        {...(common as Konva.ShapeConfig)}
        ref={nodeRef as React.RefObject<Konva.Shape>}
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) {
            ctx.lineTo(pts[i], pts[i + 1]);
          }
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill={element.fill}
        {...strokeProps}
        onTransformEnd={onTransformEnd}
      />
    );
  }

  return null;
}

function ImageBlock({ element, common, nodeRef }: BlockProps<ImageElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = element.src;
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    return () => {
      cancelled = true;
    };
  }, [element.src]);

  const { filter, config } = buildImageFilters(element.filters);
  const crop =
    image ? cropRect(element, { width: image.naturalWidth, height: image.naturalHeight }) : undefined;

  // Konva applies filters via a cache pass; re-cache whenever filters/geometry change.
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || filter.length === 0) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [nodeRef, filter, element.filters, element.width, element.height, element.crop, image]);

  if (hasImageMask(element)) {
    return (
      <Shape
        {...(common as Konva.ShapeConfig)}
        ref={nodeRef as React.RefObject<Konva.Shape>}
        width={element.width}
        height={element.height}
        sceneFunc={(ctx, shape) => {
          drawMaskedImage(rawCtx(ctx), image, element);
          ctx.beginPath();
          ctx.rect(0, 0, element.width, element.height);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill="rgba(0,0,0,0)"
        onTransformEnd={(event) => {
          const node = event.target;
          commitScale(node, element, (patch) =>
            updateElement(element.id, patch, { history: false }),
          );
          updateElement(element.id, { x: node.x(), y: node.y() });
        }}
      />
    );
  }

  return (
    <KonvaImage
      {...(common as Konva.ImageConfig)}
      ref={nodeRef as React.RefObject<Konva.Image>}
      image={image ?? undefined}
      width={element.width}
      height={element.height}
      cornerRadius={element.cornerRadius}
      crop={crop}
      {...config}
      filters={filter.length > 0 ? filter : undefined}
      onTransformEnd={(event) => {
        const node = event.target;
        commitScale(node, element, (patch) =>
          updateElement(element.id, patch, { history: false }),
        );
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}

function ChartBlock({ element, common, nodeRef }: BlockProps<ChartElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  return (
    <Shape
      {...(common as Konva.ShapeConfig)}
      ref={nodeRef as React.RefObject<Konva.Shape>}
      width={element.width}
      height={element.height}
      sceneFunc={(ctx) => {
        drawChart(rawCtx(ctx), element);
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        commitScale(node, element, (patch) =>
          updateElement(element.id, patch, { history: false }),
        );
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}

function TableBlock({ element, common, nodeRef }: BlockProps<TableElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  // Tables keep their intrinsic size from colWidths/rowHeights; resize via sidebar.
  const totalW = element.colWidths.reduce((a, b) => a + b, 0);
  const totalH = element.rowHeights.reduce((a, b) => a + b, 0);
  return (
    <Shape
      {...(common as Konva.ShapeConfig)}
      ref={nodeRef as React.RefObject<Konva.Shape>}
      width={totalW}
      height={totalH}
      sceneFunc={(ctx) => {
        drawTable(rawCtx(ctx), element);
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        node.scaleX(1);
        node.scaleY(1);
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}

function PathBlock({ element, common, nodeRef }: BlockProps<PathElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const isHighlighter = element.brush === 'highlighter';
  return (
    <Line
      {...(common as Konva.LineConfig)}
      ref={nodeRef as React.RefObject<Konva.Line>}
      points={element.points}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={isHighlighter ? element.opacity * 0.45 : element.opacity}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={Math.max(element.strokeWidth * 2, 18)}
      onTransformEnd={(event) => {
        const node = event.target;
        commitScale(node, element, (patch) =>
          updateElement(element.id, patch, { history: false }),
        );
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}

function MediaBlock({ element, common, nodeRef }: BlockProps<MediaElement>) {
  const updateElement = useEditorStore((state) => state.updateElement);
  return (
    <Shape
      {...(common as Konva.ShapeConfig)}
      ref={nodeRef as React.RefObject<Konva.Shape>}
      width={element.width}
      height={element.height}
      sceneFunc={(ctx, shape) => {
        drawMediaElement(rawCtx(ctx), element);
        ctx.beginPath();
        ctx.rect(0, 0, element.width, element.height);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
      fill="rgba(0,0,0,0)"
      onTransformEnd={(event) => {
        const node = event.target;
        commitScale(node, element, (patch) =>
          updateElement(element.id, patch, { history: false }),
        );
        updateElement(element.id, { x: node.x(), y: node.y() });
      }}
    />
  );
}
