import type { SlideSize } from '../types/editor';
import { DEFAULT_SLIDE_SIZE } from '../types/editor';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: GuideLine[];
}

const THRESHOLD = 6;

interface Target {
  value: number;
  kind: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';
}

function edgesOf(b: Bounds): Target[] {
  return [
    { value: b.x, kind: 'left' },
    { value: b.x + b.width / 2, kind: 'centerX' },
    { value: b.x + b.width, kind: 'right' },
    { value: b.y, kind: 'top' },
    { value: b.y + b.height / 2, kind: 'centerY' },
    { value: b.y + b.height, kind: 'bottom' },
  ];
}

function slideTargets(size: SlideSize): Target[] {
  return [
    { value: 0, kind: 'left' },
    { value: size.width / 2, kind: 'centerX' },
    { value: size.width, kind: 'right' },
    { value: 0, kind: 'top' },
    { value: size.height / 2, kind: 'centerY' },
    { value: size.height, kind: 'bottom' },
  ];
}

function guideSpan(
  orientation: 'vertical' | 'horizontal',
  moving: Bounds,
  targetPos: number,
  size: SlideSize,
): GuideLine {
  if (orientation === 'vertical') {
    const start = Math.min(moving.y, 0);
    const end = Math.max(moving.y + moving.height, size.height);
    return { orientation, position: targetPos, start, end };
  }
  const start = Math.min(moving.x, 0);
  const end = Math.max(moving.x + moving.width, size.width);
  return { orientation, position: targetPos, start, end };
}

/**
 * Compute snapped delta + smart guides for a moving bounds against the slide
 * centerlines/edges and a set of static peer bounds.
 */
export function computeSnap(
  raw: Bounds,
  others: Bounds[],
  options: { snapToGuides: boolean; snapToGrid: boolean; gridSize: number; slideSize?: SlideSize },
): SnapResult {
  const size = options.slideSize ?? DEFAULT_SLIDE_SIZE;
  let dx = 0;
  let dy = 0;
  const guides: GuideLine[] = [];

  if (options.snapToGrid && options.gridSize > 0) {
    const g = options.gridSize;
    dx = Math.round(raw.x / g) * g - raw.x;
    dy = Math.round(raw.y / g) * g - raw.y;
  }

  if (!options.snapToGuides) {
    return { dx, dy, guides };
  }

  const movingEdges = edgesOf({ ...raw, x: raw.x + dx, y: raw.y + dy });
  const targets = [...slideTargets(size)];
  for (const other of others) {
    targets.push(...edgesOf(other));
  }

  let bestX: { delta: number; target: number; kind: string } | null = null;
  let bestY: { delta: number; target: number; kind: string } | null = null;

  for (const moving of movingEdges) {
    const horizontal = moving.kind === 'left' || moving.kind === 'centerX' || moving.kind === 'right';
    for (const target of targets) {
      const targetHorizontal = target.kind === 'left' || target.kind === 'centerX' || target.kind === 'right';
      if (horizontal !== targetHorizontal) continue;
      // Only align like-with-like where meaningful, but allow center-to-center & edge-to-edge freely.
      const delta = target.value - moving.value;
      if (Math.abs(delta) > THRESHOLD) continue;
      if (horizontal) {
        if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
          bestX = { delta, target: target.value, kind: target.kind };
        }
      } else {
        if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
          bestY = { delta, target: target.value, kind: target.kind };
        }
      }
    }
  }

  if (bestX) {
    dx += bestX.delta;
    const movingAfter = { ...raw, x: raw.x + dx, y: raw.y + dy };
    guides.push(guideSpan('vertical', movingAfter, bestX.target, size));
  }
  if (bestY) {
    dy += bestY.delta;
    const movingAfter = { ...raw, x: raw.x + dx, y: raw.y + dy };
    guides.push(guideSpan('horizontal', movingAfter, bestY.target, size));
  }

  return { dx, dy, guides };
}
