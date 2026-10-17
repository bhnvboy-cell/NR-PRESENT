export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export interface SlideSize {
  width: number;
  height: number;
}

export const DEFAULT_SLIDE_SIZE: SlideSize = { width: SLIDE_WIDTH, height: SLIDE_HEIGHT };

export const SLIDE_SIZE_PRESETS: { label: string; size: SlideSize }[] = [
  { label: 'Widescreen 16:9', size: { width: 1280, height: 720 } },
  { label: 'Standard 4:3', size: { width: 1024, height: 768 } },
  { label: 'Square 1:1', size: { width: 1080, height: 1080 } },
  { label: 'Story 9:16', size: { width: 720, height: 1280 } },
  { label: 'A4 landscape', size: { width: 1123, height: 794 } },
];

export type EditorTool =
  | 'select'
  | 'text'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'pentagon'
  | 'hexagon'
  | 'image'
  | 'hand';

export interface ShadowProps {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface BaseElement {
  id: string;
  /** Shared id that binds elements into a movable/transformable group. */
  groupId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  shadow: ShadowProps;
  locked: boolean;
  /** Hidden elements stay in the deck/layers but are not rendered. */
  hidden?: boolean;
  /** Enter animation played in present mode. */
  animation?: AnimationProps;
}

export type AnimationKind =
  | 'none'
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoom'
  | 'spin';

export interface AnimationProps {
  kind: AnimationKind;
  /** milliseconds */
  duration: number;
  /** milliseconds delay before start */
  delay: number;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextDecoration = 'none' | 'underline' | 'line-through';
export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  italic: boolean;
  fill: string;
  align: TextAlignment;
  lineHeight: number;
  letterSpacing: number;
  decoration: TextDecoration;
}

export type ShapeKind =
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'pentagon'
  | 'hexagon';

export const POLYGONAL_SHAPES: ShapeKind[] = ['triangle', 'diamond', 'star', 'pentagon', 'hexagon'];

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  /** Optional concavity for star shapes (0..1). */
  innerRadiusRatio?: number;
}

export type ImageFilterPreset =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'warm'
  | 'cool'
  | 'vintage';

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  preset: ImageFilterPreset;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  cornerRadius: number;
  filters: ImageFilters;
  /** Optional source crop in natural-image pixels (Konva `crop` rect). */
  crop?: { x: number; y: number; width: number; height: number };
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartSeries {
  label: string;
  value: number;
  color: string;
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: ChartType;
  series: ChartSeries[];
  title: string;
  showLegend: boolean;
  showValues: boolean;
  showGrid: boolean;
  smooth: boolean;
  background: string;
  textColor: string;
  accent: string;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  /** cells[row][col] */
  cells: string[][];
  colWidths: number[];
  rowHeights: number[];
  headerFill: string;
  headerText: string;
  bodyFill: string;
  bodyText: string;
  altFill: string;
  borderColor: string;
  fontSize: number;
  headerFontSize: number;
}

export type SlideTransition =
  | 'none'
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'zoom'
  | 'dissolve';

export type CanvasElement = TextElement | ShapeElement | ImageElement | ChartElement | TableElement;

export type SlideBackground =
  | { kind: 'solid'; color: string }
  | { kind: 'linear'; from: string; to: string; angle: number }
  | { kind: 'radial'; from: string; to: string };

export interface Slide {
  id: string;
  name: string;
  background: string;
  backgroundFill: SlideBackground;
  elements: CanvasElement[];
  /** Presenter speaker notes (never rendered on the slide itself). */
  notes?: string;
  /** Transition played when advancing TO this slide in present mode. */
  transition?: SlideTransition;
  /** Optional section grouping shown as headers in the slide rail. */
  section?: string;
}

export interface ViewportSettings {
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGuides: boolean;
}

export interface BrandKit {
  colors: string[];
  fontFamilies: string[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  viewport: ViewportSettings;
  slideSize: SlideSize;
  brandKit?: BrandKit;
}

export const DEFAULT_SHADOW: ShadowProps = {
  enabled: false,
  color: '#000000',
  blur: 12,
  offsetX: 4,
  offsetY: 4,
  opacity: 0.35,
};

export const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  preset: 'none',
};

export const DEFAULT_TEXT: Omit<TextElement, 'id' | 'x' | 'y'> = {
  type: 'text',
  width: 420,
  height: 60,
  rotation: 0,
  opacity: 1,
  shadow: { ...DEFAULT_SHADOW },
  locked: false,
  text: 'Double-click to edit',
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: 400,
  italic: false,
  fill: '#111827',
  align: 'left',
  lineHeight: 1.35,
  letterSpacing: 0,
  decoration: 'none',
};

export const DEFAULT_SHAPE: Omit<ShapeElement, 'id' | 'x' | 'y' | 'shape'> = {
  type: 'shape',
  width: 260,
  height: 180,
  rotation: 0,
  opacity: 1,
  shadow: { ...DEFAULT_SHADOW },
  locked: false,
  fill: '#6366f1',
  stroke: '#4338ca',
  strokeWidth: 2,
  cornerRadius: 12,
  innerRadiusRatio: 0.5,
};

export const DEFAULT_IMAGE: Omit<ImageElement, 'id' | 'x' | 'y' | 'src'> = {
  type: 'image',
  width: 480,
  height: 320,
  rotation: 0,
  opacity: 1,
  shadow: { ...DEFAULT_SHADOW },
  locked: false,
  cornerRadius: 0,
  filters: { ...DEFAULT_IMAGE_FILTERS },
};

export const DEFAULT_VIEWPORT: ViewportSettings = {
  snapToGrid: false,
  gridSize: 20,
  showGrid: false,
  showRulers: false,
  snapToGuides: true,
};

export const BACKGROUND_PRESETS: SlideBackground[] = [
  { kind: 'solid', color: '#ffffff' },
  { kind: 'solid', color: '#f8fafc' },
  { kind: 'solid', color: '#0f172a' },
  { kind: 'solid', color: '#111827' },
  { kind: 'linear', from: '#6366f1', to: '#8b5cf6', angle: 45 },
  { kind: 'linear', from: '#0ea5e9', to: '#22d3ee', angle: 90 },
  { kind: 'linear', from: '#f43f5e', to: '#fb923c', angle: 45 },
  { kind: 'linear', from: '#10b981', to: '#84cc16', angle: 90 },
  { kind: 'radial', from: '#f59e0b', to: '#ef4444' },
  { kind: 'radial', from: '#6366f1', to: '#0f172a' },
  { kind: 'radial', from: '#22d3ee', to: '#3b82f6' },
  { kind: 'linear', from: '#1e293b', to: '#0f172a', angle: 90 },
];

export const CHART_PALETTES: string[][] = [
  ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
  ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'],
  ['#f59e0b', '#f97316', '#ef4444', '#f43f5e', '#e11d48'],
  ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c026d3'],
  ['#111827', '#334155', '#475569', '#64748b', '#94a3b8'],
  ['#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#f43f5e'],
];

export const DEFAULT_CHART: Omit<ChartElement, 'id' | 'x' | 'y'> = {
  type: 'chart',
  chartType: 'bar',
  width: 520,
  height: 340,
  rotation: 0,
  opacity: 1,
  shadow: { ...DEFAULT_SHADOW },
  locked: false,
  series: [
    { label: 'Q1', value: 42, color: '#6366f1' },
    { label: 'Q2', value: 68, color: '#8b5cf6' },
    { label: 'Q3', value: 55, color: '#a855f7' },
    { label: 'Q4', value: 80, color: '#d946ef' },
  ],
  title: 'Revenue by quarter',
  showLegend: true,
  showValues: true,
  showGrid: true,
  smooth: true,
  background: '#ffffff',
  textColor: '#334155',
  accent: '#6366f1',
};

export const DEFAULT_TABLE: Omit<TableElement, 'id' | 'x' | 'y'> = {
  type: 'table',
  width: 520,
  height: 240,
  rotation: 0,
  opacity: 1,
  shadow: { ...DEFAULT_SHADOW },
  locked: false,
  rows: 4,
  cols: 3,
  cells: [
    ['Metric', 'Value', 'Change'],
    ['Revenue', '$128k', '+12%'],
    ['Users', '8,420', '+31%'],
    ['NPS', '62', '+5'],
  ],
  colWidths: [200, 160, 160],
  rowHeights: [48, 48, 48, 48],
  headerFill: '#6366f1',
  headerText: '#ffffff',
  bodyFill: '#ffffff',
  bodyText: '#1f2937',
  altFill: '#f8fafc',
  borderColor: '#e2e8f0',
  fontSize: 15,
  headerFontSize: 15,
};

export const ANIMATION_OPTIONS: { value: AnimationKind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade in' },
  { value: 'slideLeft', label: 'Slide from left' },
  { value: 'slideRight', label: 'Slide from right' },
  { value: 'slideUp', label: 'Slide from bottom' },
  { value: 'slideDown', label: 'Slide from top' },
  { value: 'zoom', label: 'Zoom in' },
  { value: 'spin', label: 'Spin in' },
];

export const TRANSITION_OPTIONS: { value: SlideTransition; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slideLeft', label: 'Slide left' },
  { value: 'slideRight', label: 'Slide right' },
  { value: 'slideUp', label: 'Slide up' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'dissolve', label: 'Dissolve' },
];

export const DEFAULT_ANIMATION: AnimationProps = {
  kind: 'fade',
  duration: 500,
  delay: 0,
};
