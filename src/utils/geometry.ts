import type { ShapeKind } from '../types/editor';

/** Build a closed polygon path in local (0..w, 0..h) space. */
export function polygonPoints(shape: ShapeKind, width: number, height: number): number[] {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  switch (shape) {
    case 'triangle':
      return [cx, 0, width, height, 0, height];
    case 'diamond':
      return [cx, 0, width, cy, cx, height, 0, cy];
    case 'pentagon':
      return regularPolygon(5, cx, cy, rx, ry, -Math.PI / 2);
    case 'hexagon':
      return regularPolygon(6, cx, cy, rx, ry, -Math.PI / 2);
    case 'star':
      return starPoints(5, cx, cy, rx, ry, 0.5, -Math.PI / 2);
    default:
      return [0, 0, width, 0, width, height, 0, height];
  }
}

function regularPolygon(sides: number, cx: number, cy: number, rx: number, ry: number, start: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = start + (i * 2 * Math.PI) / sides;
    points.push(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle));
  }
  return points;
}

function starPoints(
  spikes: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  innerRatio: number,
  start: number,
): number[] {
  const points: number[] = [];
  const total = spikes * 2;
  for (let i = 0; i < total; i += 1) {
    const angle = start + (i * Math.PI) / spikes;
    const ratio = i % 2 === 0 ? 1 : innerRatio;
    points.push(cx + rx * ratio * Math.cos(angle), cy + ry * ratio * Math.sin(angle));
  }
  return points;
}

export function isPolygonal(shape: ShapeKind): boolean {
  return shape !== 'rect' && shape !== 'ellipse' && shape !== 'line' && shape !== 'arrow';
}

export function linePoints(width: number, height: number): number[] {
  return [0, 0, width, height];
}
