import type { ChartElement, ChartSeries } from '../types/editor';

const PAD = { top: 44, right: 20, bottom: 34, left: 46 };

function niceMax(values: number[]): number {
  const max = Math.max(1, ...values);
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function seriesMax(series: ChartSeries[], stacked: boolean): number {
  if (stacked) {
    const totals = series.map((s) => s.value);
    return niceMax([totals.reduce((a, b) => a + b, 0)]);
  }
  return niceMax(series.map((s) => s.value));
}

/**
 * Draw a full chart into a Konva SceneContext. Used by both the live canvas node
 * and the offline PNG/PDF export renderer, so what you see is what you export.
 */
export function drawChart(ctx: CanvasRenderingContext2D, chart: ChartElement): void {
  ctx.save();

  // Background
  if (chart.background && chart.background !== 'transparent') {
    ctx.fillStyle = chart.background;
    ctx.fillRect(0, 0, chart.width, chart.height);
  }

  // Title
  if (chart.title) {
    ctx.fillStyle = chart.textColor;
    ctx.font = '600 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(chart.title, 14, 12);
  }

  if (chart.chartType === 'pie' || chart.chartType === 'donut') {
    drawPie(ctx, chart);
    ctx.restore();
    return;
  }

  drawCartesian(ctx, chart);
  ctx.restore();
}

function drawPie(ctx: CanvasRenderingContext2D, chart: ChartElement): void {
  const total = chart.series.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  const legendHeight = chart.showLegend ? 28 : 0;
  const cx = chartW(chart) / 2;
  const topOffset = chart.title ? 40 : 16;
  const cy = topOffset + (chartH(chart) - topOffset - legendHeight) / 2;
  const radius = Math.min(chartW(chart), chartH(chart) - topOffset - legendHeight) / 2 - 16;
  const inner = chart.chartType === 'donut' ? radius * 0.55 : 0;

  let angle = -Math.PI / 2;
  chart.series.forEach((slice) => {
    const portion = Math.max(0, slice.value) / total;
    const sliceAngle = portion * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    if (chart.chartType === 'donut') {
      ctx.beginPath();
      ctx.arc(cx, cy, inner, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = chart.background || '#fff';
      ctx.fill();
    }

    // Value label on slice
    if (chart.showValues && portion > 0.05) {
      const mid = angle + sliceAngle / 2;
      const lr = (radius + inner) / 2 || radius * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(portion * 100)}%`, cx + Math.cos(mid) * lr, cy + Math.sin(mid) * lr);
    }
    angle += sliceAngle;
  });

  if (chart.showLegend) drawLegend(ctx, chart, cy);
}

function drawCartesian(ctx: CanvasRenderingContext2D, chart: ChartElement): void {
  const w = chartW(chart);
  const h = chartH(chart);
  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;
  const max = seriesMax(chart.series, false);
  const count = chart.series.length;
  const textColor = chart.textColor;

  // Grid + Y axis
  if (chart.showGrid) {
    ctx.strokeStyle = 'rgba(100,116,139,0.18)';
    ctx.fillStyle = textColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      const y = PAD.top + (plotH * i) / steps;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + plotW, y);
      ctx.stroke();
      const val = Math.round(max - (max * i) / steps);
      ctx.fillText(String(val), PAD.left - 8, y);
    }
  }

  // X labels
  ctx.fillStyle = textColor;
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const slot = plotW / count;
  chart.series.forEach((s, i) => {
    const x = PAD.left + slot * i + slot / 2;
    ctx.fillText(s.label, x, PAD.top + plotH + 8);
  });

  if (chart.chartType === 'bar') {
    const barW = Math.min(48, slot * 0.6);
    chart.series.forEach((s, i) => {
      const bh = (Math.max(0, s.value) / max) * plotH;
      const x = PAD.left + slot * i + (slot - barW) / 2;
      const y = PAD.top + plotH - bh;
      ctx.fillStyle = s.color;
      roundRect(ctx, x, y, barW, bh, 6);
      ctx.fill();
      if (chart.showValues) {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(String(s.value), x + barW / 2, y - 4);
      }
    });
  } else if (chart.chartType === 'line' || chart.chartType === 'area') {
    const points = chart.series.map((s, i) => ({
      x: PAD.left + slot * i + slot / 2,
      y: PAD.top + plotH - (Math.max(0, s.value) / max) * plotH,
    }));

    if (chart.chartType === 'area') {
      const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
      gradient.addColorStop(0, hexAlpha(chart.accent, 0.45));
      gradient.addColorStop(1, hexAlpha(chart.accent, 0.02));
      ctx.beginPath();
      ctx.moveTo(points[0].x, PAD.top + plotH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, PAD.top + plotH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    if (chart.smooth) {
      drawSmoothLine(ctx, points);
    } else {
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
    }
    ctx.strokeStyle = chart.accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = chart.series[i].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      if (chart.showValues) {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(String(chart.series[i].value), p.x, p.y - 8);
      }
    });
  }

  if (chart.showLegend && (chart.chartType === 'line' || chart.chartType === 'area')) {
    drawLegend(ctx, chart, PAD.top + plotH / 2);
  }
}

function drawSmoothLine(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]): void {
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    ctx.bezierCurveTo(midX, current.y, midX, next.y, next.x, next.y);
  }
}

function drawLegend(ctx: CanvasRenderingContext2D, chart: ChartElement, centerY: number): void {
  const items = chart.series;
  const boxW = 12;
  const gap = 16;
  ctx.font = '11px Inter, sans-serif';
  const widths = items.map((s) => ctx.measureText(s.label).width);
  const totalW =
    items.reduce((sum, _s, i) => sum + boxW + 6 + widths[i], 0) + gap * (items.length - 1);
  let x = Math.max(PAD.left, (chartW(chart) - totalW) / 2);
  const y = chart.chartType === 'pie' || chart.chartType === 'donut' ? chartH(chart) - 20 : centerY;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  items.forEach((s, i) => {
    ctx.fillStyle = s.color;
    roundRect(ctx, x, y - boxW / 2, boxW, boxW, 3);
    ctx.fill();
    x += boxW + 6;
    ctx.fillStyle = chart.textColor;
    ctx.fillText(s.label, x, y);
    x += widths[i] + gap;
  });
}

function hexAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Local accessors so drawChart reads cleanly.
function chartW(chart: ChartElement): number {
  return chart.width;
}
function chartH(chart: ChartElement): number {
  return chart.height;
}
