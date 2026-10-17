import {
  DEFAULT_CHART,
  DEFAULT_SHAPE,
  DEFAULT_TABLE,
  DEFAULT_TEXT,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type CanvasElement,
  type ChartElement,
  type ShapeElement,
  type Slide,
  type SlideBackground,
  type TableElement,
} from '../types/editor';
import { deepClone } from '../utils/clone';
import { createId } from '../utils/id';

export interface SlideTemplate {
  id: string;
  name: string;
  category: 'title' | 'content' | 'comparison' | 'data' | 'quote' | 'media';
  background: SlideBackground;
  build: () => CanvasElement[];
}

const bg = {
  dark: { kind: 'solid', color: '#0f172a' } as SlideBackground,
  light: { kind: 'solid', color: '#ffffff' } as SlideBackground,
  slate: { kind: 'linear', from: '#1e293b', to: '#0f172a', angle: 90 } as SlideBackground,
  indigo: { kind: 'linear', from: '#6366f1', to: '#8b5cf6', angle: 45 } as SlideBackground,
  ocean: { kind: 'linear', from: '#0ea5e9', to: '#22d3ee', angle: 90 } as SlideBackground,
  sunset: { kind: 'linear', from: '#f43f5e', to: '#fb923c', angle: 45 } as SlideBackground,
};

function text(partial: Partial<CanvasElement> & { text: string; x: number; y: number; width?: number }): CanvasElement {
  return {
    ...deepClone(DEFAULT_TEXT),
    id: createId('el'),
    width: 800,
    ...partial,
  } as CanvasElement;
}

export const tplBg = bg;
export const tplText = text;

export function tplShape(partial: Partial<ShapeElement> & { x: number; y: number; width: number; height: number }): CanvasElement {
  return { ...deepClone(DEFAULT_SHAPE), id: createId('el'), ...partial } as CanvasElement;
}

export function tplChart(partial: Partial<ChartElement> = {}): CanvasElement {
  return { ...deepClone(DEFAULT_CHART), id: createId('el'), ...partial } as CanvasElement;
}

export function tplTable(partial: Partial<TableElement> = {}): CanvasElement {
  return { ...deepClone(DEFAULT_TABLE), id: createId('el'), ...partial } as CanvasElement;
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'tpl-title',
    name: 'Title slide',
    category: 'title',
    background: bg.slate,
    build: () => [
      text({
        x: 140,
        y: 280,
        width: 1000,
        text: 'Presentation title',
        fontSize: 72,
        fontWeight: 800,
        align: 'center',
        fill: '#ffffff',
      }),
      text({
        x: 240,
        y: 390,
        width: 800,
        text: 'A compelling subtitle goes here',
        fontSize: 28,
        align: 'center',
        fill: '#94a3b8',
      }),
    ],
  },
  {
    id: 'tpl-section',
    name: 'Section header',
    category: 'title',
    background: bg.indigo,
    build: () => [
      text({
        x: 100,
        y: 300,
        width: 600,
        text: '01',
        fontSize: 120,
        fontWeight: 800,
        fill: 'rgba(255,255,255,0.35)',
      }),
      text({
        x: 100,
        y: 420,
        width: 900,
        text: 'Section title',
        fontSize: 56,
        fontWeight: 700,
        fill: '#ffffff',
      }),
    ],
  },
  {
    id: 'tpl-bullets',
    name: 'Bullet list',
    category: 'content',
    background: bg.light,
    build: () => [
      text({ x: 90, y: 80, width: 1000, text: 'Key points', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      {
        ...deepClone(DEFAULT_SHAPE),
        id: createId('el'),
        shape: 'rect',
        x: 90,
        y: 165,
        width: 90,
        height: 6,
        cornerRadius: 3,
        fill: '#6366f1',
        stroke: 'transparent',
        strokeWidth: 0,
      },
      text({
        x: 90,
        y: 230,
        width: 1000,
        text: '•  First supporting insight\n•  Second supporting insight\n•  Third supporting insight\n•  Closing takeaway',
        fontSize: 26,
        lineHeight: 1.9,
        fill: '#334155',
      }),
    ],
  },
  {
    id: 'tpl-two-col',
    name: 'Two columns',
    category: 'comparison',
    background: bg.light,
    build: () => [
      text({ x: 90, y: 70, width: 1000, text: 'Comparison', fontSize: 40, fontWeight: 700, fill: '#0f172a' }),
      {
        ...deepClone(DEFAULT_SHAPE),
        id: createId('el'),
        shape: 'rect',
        x: 90,
        y: 170,
        width: 520,
        height: 420,
        cornerRadius: 16,
        fill: '#eef2ff',
        stroke: '#c7d2fe',
        strokeWidth: 1,
      },
      {
        ...deepClone(DEFAULT_SHAPE),
        id: createId('el'),
        shape: 'rect',
        x: 670,
        y: 170,
        width: 520,
        height: 420,
        cornerRadius: 16,
        fill: '#f0fdfa',
        stroke: '#99f6e4',
        strokeWidth: 1,
      },
      text({ x: 110, y: 200, width: 480, text: 'Option A', fontSize: 30, fontWeight: 700, fill: '#4338ca' }),
      text({ x: 690, y: 200, width: 480, text: 'Option B', fontSize: 30, fontWeight: 700, fill: '#0f766e' }),
      text({ x: 110, y: 270, width: 480, text: '• Advantage one\n• Advantage two\n• Trade-off', fontSize: 22, lineHeight: 1.8, fill: '#334155' }),
      text({ x: 690, y: 270, width: 480, text: '• Advantage one\n• Advantage two\n• Trade-off', fontSize: 22, lineHeight: 1.8, fill: '#334155' }),
    ],
  },
  {
    id: 'tpl-quote',
    name: 'Big quote',
    category: 'quote',
    background: bg.dark,
    build: () => [
      text({
        x: 120,
        y: 200,
        width: 1040,
        text: '“Design is not just what it looks like. Design is how it works.”',
        fontSize: 44,
        fontWeight: 600,
        italic: true,
        align: 'center',
        lineHeight: 1.4,
        fill: '#ffffff',
      }),
      text({ x: 340, y: 480, width: 600, text: '— Steve Jobs', fontSize: 24, align: 'center', fill: '#94a3b8' }),
    ],
  },
  {
    id: 'tpl-chart',
    name: 'Chart + insight',
    category: 'data',
    background: bg.light,
    build: () => [
      text({ x: 60, y: 40, width: 700, text: 'Performance', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
      {
        ...deepClone(DEFAULT_CHART),
        id: createId('el'),
        x: 40,
        y: 110,
        width: 760,
        height: 540,
        background: 'transparent',
      },
      text({ x: 840, y: 180, width: 380, text: 'The takeaway', fontSize: 28, fontWeight: 700, fill: '#0f172a' }),
      text({
        x: 840,
        y: 250,
        width: 380,
        text: 'Growth accelerated through Q4, driven by stronger retention and expansion revenue.',
        fontSize: 20,
        lineHeight: 1.6,
        fill: '#475569',
      }),
    ],
  },
  {
    id: 'tpl-table',
    name: 'Metrics table',
    category: 'data',
    background: bg.light,
    build: () => [
      text({ x: 60, y: 40, width: 700, text: 'Key metrics', fontSize: 36, fontWeight: 700, fill: '#0f172a' }),
      { ...deepClone(DEFAULT_TABLE), id: createId('el'), x: 60, y: 130 },
    ],
  },
  {
    id: 'tpl-image-text',
    name: 'Image + text',
    category: 'media',
    background: bg.light,
    build: () => [
      {
        ...deepClone(DEFAULT_SHAPE),
        id: createId('el'),
        shape: 'rect',
        x: 80,
        y: 120,
        width: 560,
        height: 480,
        cornerRadius: 16,
        fill: '#e2e8f0',
        stroke: '#cbd5e1',
        strokeWidth: 1,
      },
      text({ x: 120, y: 320, width: 480, text: 'Drop an image here', fontSize: 22, align: 'center', fill: '#64748b' }),
      text({ x: 700, y: 180, width: 500, text: 'Headline', fontSize: 40, fontWeight: 700, fill: '#0f172a' }),
      text({
        x: 700,
        y: 270,
        width: 500,
        text: 'Pair a striking visual with a concise narrative. Keep copy short and let the imagery carry the story.',
        fontSize: 22,
        lineHeight: 1.6,
        fill: '#475569',
      }),
    ],
  },
  {
    id: 'tpl-stats',
    name: 'Three stats',
    category: 'content',
    background: bg.slate,
    build: () => {
      const stats = ['3.2×', '98%', '24k'];
      const labels = ['Faster delivery', 'Uptime reliability', 'Active users'];
      const colors = ['#818cf8', '#34d399', '#fbbf24'];
      const els: CanvasElement[] = [
        text({ x: 90, y: 90, width: 1000, text: 'By the numbers', fontSize: 40, fontWeight: 700, fill: '#ffffff' }),
      ];
      for (let i = 0; i < 3; i += 1) {
        els.push(
          text({
            x: 90 + i * 380,
            y: 280,
            width: 340,
            text: stats[i],
            fontSize: 84,
            fontWeight: 800,
            align: 'center',
            fill: colors[i],
          }),
          text({
            x: 90 + i * 380,
            y: 400,
            width: 340,
            text: labels[i],
            fontSize: 22,
            align: 'center',
            fill: '#cbd5e1',
          }),
        );
      }
      return els;
    },
  },
  {
    id: 'tpl-agenda',
    name: 'Agenda',
    category: 'content',
    background: bg.light,
    build: () => [
      text({ x: 90, y: 70, width: 1000, text: 'Agenda', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      tplShape({ x: 90, y: 160, width: 90, height: 6, cornerRadius: 3, fill: '#f59e0b', stroke: 'transparent', strokeWidth: 0 }),
      ...['01  Introduction', '02  Main topic', '03  Deep dive', '04  Q&A'].map((label, i) =>
        text({
          x: 140,
          y: 240 + i * 88,
          width: 900,
          text: label,
          fontSize: 30,
          fontWeight: 600,
          fill: i % 2 === 0 ? '#0f172a' : '#334155',
        }),
      ),
      ...[0, 1, 2, 3].map((i) =>
        tplShape({ x: 90, y: 248 + i * 88, width: 28, height: 28, cornerRadius: 14, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2 }),
      ),
    ],
  },
  {
    id: 'tpl-timeline',
    name: 'Timeline',
    category: 'content',
    background: bg.light,
    build: () => {
      const els: CanvasElement[] = [
        text({ x: 90, y: 70, width: 1000, text: 'Timeline', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
        tplShape({ x: 120, y: 360, width: 1040, height: 4, cornerRadius: 2, fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 0 }),
      ];
      const steps = ['Q1', 'Q2', 'Q3', 'Q4'];
      const notes = ['Research', 'Build', 'Launch', 'Scale'];
      steps.forEach((step, i) => {
        const x = 140 + i * 300;
        els.push(
          tplShape({ x, y: 330, width: 64, height: 64, cornerRadius: 32, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 4 }),
          text({ x: x - 60, y: 250, width: 184, text: step, fontSize: 26, fontWeight: 700, align: 'center', fill: '#4f46e5' }),
          text({ x: x - 60, y: 420, width: 184, text: notes[i], fontSize: 20, align: 'center', fill: '#475569' }),
        );
      });
      return els;
    },
  },
  {
    id: 'tpl-process',
    name: 'Process flow',
    category: 'comparison',
    background: bg.light,
    build: () => {
      const els: CanvasElement[] = [
        text({ x: 90, y: 70, width: 1000, text: 'How it works', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      ];
      const labels = ['Discover', 'Design', 'Deliver', 'Iterate'];
      const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];
      labels.forEach((label, i) => {
        const x = 80 + i * 300;
        els.push(
          tplShape({ x, y: 280, width: 240, height: 140, cornerRadius: 16, fill: colors[i], stroke: 'transparent', strokeWidth: 0 }),
          text({ x, y: 322, width: 240, text: label, fontSize: 26, fontWeight: 700, align: 'center', fill: '#ffffff' }),
        );
        if (i < 3) {
          els.push(
            text({ x: x + 244, y: 322, width: 56, text: '→', fontSize: 34, fontWeight: 700, align: 'center', fill: '#94a3b8' }),
          );
        }
      });
      return els;
    },
  },
  {
    id: 'tpl-team',
    name: 'Team',
    category: 'media',
    background: bg.light,
    build: () => {
      const els: CanvasElement[] = [
        text({ x: 90, y: 70, width: 1000, text: 'Meet the team', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      ];
      const names = ['Alex Rivera', 'Sam Chen', 'Jordan Lee'];
      const roles = ['Design', 'Engineering', 'Product'];
      const colors = ['#6366f1', '#10b981', '#f59e0b'];
      names.forEach((name, i) => {
        const x = 170 + i * 360;
        els.push(
          tplShape({ x, y: 230, width: 140, height: 140, cornerRadius: 70, fill: colors[i], stroke: 'transparent', strokeWidth: 0 }),
          text({ x: x - 80, y: 400, width: 300, text: name, fontSize: 24, fontWeight: 700, align: 'center', fill: '#0f172a' }),
          text({ x: x - 80, y: 442, width: 300, text: roles[i], fontSize: 18, align: 'center', fill: '#64748b' }),
        );
      });
      return els;
    },
  },
  {
    id: 'tpl-kpi',
    name: 'Big number',
    category: 'data',
    background: bg.slate,
    build: () => [
      text({ x: 240, y: 200, width: 800, text: '87%', fontSize: 140, fontWeight: 800, align: 'center', fill: '#34d399' }),
      text({ x: 240, y: 400, width: 800, text: 'of customers report measurable results in the first 30 days', fontSize: 26, align: 'center', lineHeight: 1.5, fill: '#cbd5e1' }),
    ],
  },
  {
    id: 'tpl-swot',
    name: 'SWOT grid',
    category: 'comparison',
    background: bg.light,
    build: () => {
      const cells: [string, string, number, number][] = [
        ['Strengths', '#dcfce7', 90, 170],
        ['Weaknesses', '#fee2e2', 670, 170],
        ['Opportunities', '#dbeafe', 90, 400],
        ['Threats', '#fef3c7', 670, 400],
      ];
      const els: CanvasElement[] = [
        text({ x: 90, y: 70, width: 1000, text: 'SWOT analysis', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      ];
      for (const [label, fill, x, y] of cells) {
        els.push(
          tplShape({ x, y, width: 520, height: 200, cornerRadius: 16, fill, stroke: 'transparent', strokeWidth: 0 }),
          text({ x: x + 24, y: y + 24, width: 460, text: label, fontSize: 26, fontWeight: 700, fill: '#0f172a' }),
          text({ x: x + 24, y: y + 70, width: 460, text: '• Point one\n• Point two', fontSize: 20, lineHeight: 1.7, fill: '#334155' }),
        );
      }
      return els;
    },
  },
  {
    id: 'tpl-pricing',
    name: 'Pricing tiers',
    category: 'comparison',
    background: bg.light,
    build: () => {
      const els: CanvasElement[] = [
        text({ x: 90, y: 60, width: 1000, text: 'Simple pricing', fontSize: 44, fontWeight: 700, align: 'center', fill: '#0f172a' }),
      ];
      const tiers = [
        ['Starter', '$0', '#f8fafc', '#e2e8f0'],
        ['Pro', '$29', '#eef2ff', '#6366f1'],
        ['Business', '$99', '#f8fafc', '#e2e8f0'],
      ];
      tiers.forEach(([name, price, fill, stroke], i) => {
        const x = 120 + i * 380;
        els.push(
          tplShape({ x, y: 170, width: 320, height: 420, cornerRadius: 20, fill, stroke, strokeWidth: 2 }),
          text({ x, y: 210, width: 320, text: name, fontSize: 26, fontWeight: 600, align: 'center', fill: '#64748b' }),
          text({ x, y: 270, width: 320, text: price, fontSize: 64, fontWeight: 800, align: 'center', fill: i === 1 ? '#4f46e5' : '#0f172a' }),
          text({ x: x + 40, y: 380, width: 240, text: '• Feature one\n• Feature two\n• Feature three', fontSize: 20, lineHeight: 1.8, fill: '#334155' }),
        );
      });
      return els;
    },
  },
  {
    id: 'tpl-checklist',
    name: 'Checklist',
    category: 'content',
    background: bg.light,
    build: () => [
      text({ x: 90, y: 70, width: 1000, text: 'Launch checklist', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      ...['Finalize design specs', 'Complete QA pass', 'Prepare launch assets', 'Schedule announcement'].flatMap(
        (label, i) => [
          tplShape({ x: 100, y: 200 + i * 84, width: 36, height: 36, cornerRadius: 10, fill: '#ecfdf5', stroke: '#10b981', strokeWidth: 2 }),
          text({ x: 160, y: 204 + i * 84, width: 900, text: `✓  ${label}`, fontSize: 26, fontWeight: 500, fill: '#0f172a' }),
        ],
      ),
    ],
  },
  {
    id: 'tpl-statement',
    name: 'Full-bleed statement',
    category: 'quote',
    background: bg.indigo,
    build: () => [
      text({
        x: 140,
        y: 260,
        width: 1000,
        text: 'One idea can change everything.',
        fontSize: 56,
        fontWeight: 800,
        align: 'center',
        lineHeight: 1.3,
        fill: '#ffffff',
      }),
    ],
  },
  {
    id: 'tpl-thank-you',
    name: 'Thank you',
    category: 'title',
    background: bg.dark,
    build: () => [
      text({ x: 240, y: 260, width: 800, text: 'Thank you', fontSize: 80, fontWeight: 800, align: 'center', fill: '#ffffff' }),
      text({ x: 240, y: 390, width: 800, text: 'hello@example.com   ·   @yourhandle', fontSize: 24, align: 'center', fill: '#94a3b8' }),
    ],
  },
  {
    id: 'tpl-goals',
    name: 'Three goals',
    category: 'content',
    background: bg.light,
    build: () => {
      const els: CanvasElement[] = [
        text({ x: 90, y: 70, width: 1000, text: 'Our goals', fontSize: 44, fontWeight: 700, fill: '#0f172a' }),
      ];
      const goals = ['Grow', 'Simplify', 'Delight'];
      const colors = ['#6366f1', '#10b981', '#f59e0b'];
      goals.forEach((goal, i) => {
        const x = 150 + i * 370;
        els.push(
          tplShape({ x, y: 240, width: 180, height: 180, cornerRadius: 90, fill: 'transparent', stroke: colors[i], strokeWidth: 6 }),
          text({ x, y: 300, width: 180, text: goal, fontSize: 28, fontWeight: 700, align: 'center', fill: colors[i] }),
          text({ x: x - 60, y: 460, width: 300, text: 'Supporting detail goes here.', fontSize: 20, align: 'center', fill: '#64748b' }),
        );
      });
      return els;
    },
  },
  {
    id: 'tpl-blank',
    name: 'Blank canvas',
    category: 'content',
    background: bg.light,
    build: () => [],
  },
];

export const TEMPLATE_CATEGORIES: { value: SlideTemplate['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'title', label: 'Title' },
  { value: 'content', label: 'Content' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'data', label: 'Data' },
  { value: 'quote', label: 'Quote' },
  { value: 'media', label: 'Media' },
];

export function templateToSlide(template: SlideTemplate): Slide {
  return {
    id: createId('slide'),
    name: template.name,
    background: template.background.kind === 'solid' ? template.background.color : template.background.from,
    backgroundFill: deepClone(template.background),
    elements: template.build().map((el) => ({ ...el, id: createId('el') })),
    transition: 'fade',
  };
}

export const TEMPLATE_PREVIEW_SIZE = { width: SLIDE_WIDTH, height: SLIDE_HEIGHT };
