import { DEFAULT_SLIDE_SIZE, type SlideSize } from '../../types/editor';

interface RulerOverlayProps {
  zoom: number;
  pan: { x: number; y: number };
  width: number;
  height: number;
  slideSize?: SlideSize;
}

const STEP_CANDIDATES = [10, 20, 25, 50, 100, 200, 250, 500, 1000];

function chooseStep(zoom: number): number {
  for (const step of STEP_CANDIDATES) {
    if (step * zoom >= 60) return step;
  }
  return STEP_CANDIDATES[STEP_CANDIDATES.length - 1];
}

export function RulerOverlay({ zoom, pan, width, height, slideSize }: RulerOverlayProps) {
  if (width === 0 || height === 0) return null;
  const size = slideSize ?? DEFAULT_SLIDE_SIZE;
  const step = chooseStep(zoom);

  const ticksX: React.ReactNode[] = [];
  for (let value = 0; value <= size.width; value += step) {
    const x = pan.x + value * zoom;
    if (x < 24 || x > width) continue;
    ticksX.push(
      <div key={`x${value}`} className="ruler-tick" style={{ left: x }}>
        <span>{value}</span>
      </div>,
    );
  }

  const ticksY: React.ReactNode[] = [];
  for (let value = 0; value <= size.height; value += step) {
    const y = pan.y + value * zoom;
    if (y < 24 || y > height) continue;
    ticksY.push(
      <div key={`y${value}`} className="ruler-tick horizontal" style={{ top: y }}>
        <span>{value}</span>
      </div>,
    );
  }

  return (
    <div className="ruler-overlay" style={{ width, height }} aria-hidden>
      <div className="ruler ruler-top">{ticksX}</div>
      <div className="ruler ruler-left">{ticksY}</div>
    </div>
  );
}
