import { create } from 'zustand';
import {
  DEFAULT_CHART,
  DEFAULT_IMAGE,
  DEFAULT_SHADOW,
  DEFAULT_SHAPE,
  DEFAULT_SLIDE_SIZE,
  DEFAULT_TABLE,
  DEFAULT_TEXT,
  DEFAULT_VIEWPORT,
  type CanvasElement,
  type ChartElement,
  type EditorTool,
  type ImageFilters,
  type Project,
  type ShapeElement,
  type ShapeKind,
  type Slide,
  type SlideBackground,
  type SlideSize,
  type SlideTransition,
  type TableElement,
  type TextElement,
  type ViewportSettings,
} from '../types/editor';
import { templateToSlide, type SlideTemplate } from '../data/templates';
import { deckToSlides, type DeckTemplate } from '../data/deckTemplates';
import { deepClone } from '../utils/clone';
import { createId } from '../utils/id';
import type { Bounds } from '../utils/snap';

const HISTORY_LIMIT = 60;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

export function createSlide(index: number): Slide {
  const title: TextElement = {
    ...deepClone(DEFAULT_TEXT),
    id: createId('el'),
    x: 120,
    y: 260,
    width: 1040,
    height: 90,
    text: 'Presentation title',
    fontSize: 64,
    fontWeight: 700,
    align: 'center',
    fill: '#0f172a',
  };
  const subtitle: TextElement = {
    ...deepClone(DEFAULT_TEXT),
    id: createId('el'),
    x: 240,
    y: 370,
    width: 800,
    height: 48,
    text: 'Click to edit this subtitle',
    fontSize: 28,
    fontWeight: 400,
    align: 'center',
    fill: '#475569',
  };
  return {
    id: createId('slide'),
    name: `Slide ${index + 1}`,
    background: '#ffffff',
    backgroundFill: { kind: 'solid', color: '#ffffff' },
    elements: [title, subtitle],
  };
}

export function createProject(name = 'Untitled presentation'): Project {
  const now = new Date().toISOString();
  return {
    id: createId('proj'),
    name,
    createdAt: now,
    updatedAt: now,
    slides: [createSlide(0)],
    viewport: { ...DEFAULT_VIEWPORT },
    slideSize: { ...DEFAULT_SLIDE_SIZE },
  };
}

function sizeOf(state: { project: Project }): SlideSize {
  return state.project.slideSize ?? DEFAULT_SLIDE_SIZE;
}

/** Uniformly scale slide content when the project slide size changes. */
function scaleSlide(slide: Slide, k: number, dx: number, dy: number): Slide {
  return {
    ...slide,
    elements: slide.elements.map((el) => {
      const next: CanvasElement = {
        ...el,
        x: el.x * k + dx,
        y: el.y * k + dy,
        width: el.width * k,
        height: el.height * k,
      };
      if (next.type === 'text') {
        next.fontSize = el.type === 'text' ? Math.max(6, el.fontSize * k) : next.fontSize;
      }
      if (next.type === 'table') {
        const src = el as TableElement;
        next.colWidths = src.colWidths.map((w) => w * k);
        next.rowHeights = src.rowHeights.map((h) => h * k);
      }
      return next;
    }),
  };
}

/** Fit a slide authored at `from` dimensions into `to` dimensions (templates are 1280×720). */
function fitSlideToSize(slide: Slide, to: SlideSize): Slide {
  const from = DEFAULT_SLIDE_SIZE;
  const k = Math.min(to.width / from.width, to.height / from.height);
  const dx = (to.width - from.width * k) / 2;
  const dy = (to.height - from.height * k) / 2;
  if (k === 1 && dx === 0 && dy === 0) return slide;
  return scaleSlide(slide, k, dx, dy);
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface HistorySnapshot {
  slides: Slide[];
  currentSlideIndex: number;
  name: string;
}

/**
 * Cheap structural snapshot: clones slide objects and element arrays but shares
 * element objects (the store updates elements immutably, replacing them).
 * This keeps history affordable even with base64 images while making
 * slide-level operations (add/delete/reorder/deck insert) undoable.
 */
function snapshotSlides(slides: Slide[]): Slide[] {
  return slides.map((slide) => ({ ...slide, elements: [...slide.elements] }));
}

/** In-memory element clipboard (survives slide switches; also mirrored to the system clipboard best-effort). */
let elementClipboard: CanvasElement[] | null = null;

interface PatchOptions {
  /** When false the change is applied without opening an undo batch (live drag/typing). */
  history?: boolean;
}

interface EditorState {
  project: Project;
  currentSlideIndex: number;
  selectedIds: string[];
  tool: EditorTool;
  zoom: number;
  pan: { x: number; y: number };
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  historyOpen: boolean;
  editingTextId: string | null;
  saveStatus: SaveStatus;

  currentSlide: () => Slide;
  selectedElements: () => CanvasElement[];

  setProject: (project: Project) => void;
  newProject: () => void;
  setProjectName: (name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setSlideSize: (size: SlideSize) => void;

  ensureHistory: () => void;
  endHistory: () => void;
  undo: () => void;
  redo: () => void;

  setTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  zoomAt: (factor: number, origin: { x: number; y: number }) => void;

  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  selectSlide: (index: number) => void;
  addSlide: () => void;
  duplicateSlide: () => void;
  deleteSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;

  addElement: (element: CanvasElement) => void;
  addShape: (shape: ShapeKind, at: { x: number; y: number }) => void;
  addTextBox: (at: { x: number; y: number }) => void;
  addImage: (src: string, natural: { width: number; height: number }, at?: { x: number; y: number }) => void;
  addChart: (at?: { x: number; y: number }) => void;
  addTable: (at?: { x: number; y: number }) => void;
  insertIcon: (src: string, color: string, at?: { x: number; y: number }) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>, options?: PatchOptions) => void;
  updateSelected: (patch: Partial<CanvasElement>, options?: PatchOptions) => void;
  updateImageFilters: (id: string, patch: Partial<ImageFilters>) => void;
  updateChart: (id: string, patch: Partial<ChartElement>) => void;
  updateTable: (id: string, patch: Partial<TableElement>) => void;
  setElementHidden: (id: string, hidden: boolean) => void;
  setSlideNotes: (notes: string) => void;
  setSlideTransition: (transition: SlideTransition) => void;
  setSlideSection: (index: number, section: string | undefined, untilNext?: boolean) => void;
  renameSection: (oldName: string, newName: string) => void;
  addBrandColor: (color: string) => void;
  removeBrandColor: (color: string) => void;
  addBrandFont: (family: string) => void;
  removeBrandFont: (family: string) => void;
  insertTemplateSlide: (template: SlideTemplate, mode: 'replace' | 'append') => void;
  insertDeck: (deck: DeckTemplate, mode: 'replace' | 'append') => void;
  addEmoji: (emoji: string) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => Promise<void>;
  nudgeSelected: (dx: number, dy: number) => void;
  reorderSelected: (direction: 'front' | 'forward' | 'backward' | 'back') => void;
  toggleLockSelected: () => void;

  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Alignment & distribution
  alignSelected: (mode: AlignMode) => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  // Background & viewport
  setBackground: (fill: SlideBackground) => void;
  setViewport: (patch: Partial<ViewportSettings>) => void;

  // Marquee selection
  selectWithinBounds: (bounds: Bounds, mode: 'replace' | 'add') => void;

  beginTextEdit: (id: string) => void;
  endTextEdit: () => void;
}

export type AlignMode =
  | 'left'
  | 'centerX'
  | 'right'
  | 'top'
  | 'centerY'
  | 'bottom'
  | 'centerBoth';

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom.toFixed(4))));
}

function moveElementInArray<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  currentSlideIndex: 0,
  selectedIds: [],
  tool: 'select',
  zoom: 0.62,
  pan: { x: 80, y: 60 },
  past: [],
  future: [],
  historyOpen: false,
  editingTextId: null,
  saveStatus: 'idle',

  currentSlide: () => {
    const { project, currentSlideIndex } = get();
    return project.slides[Math.min(currentSlideIndex, project.slides.length - 1)];
  },

  selectedElements: () => {
    const slide = get().currentSlide();
    const ids = new Set(get().selectedIds);
    return slide.elements.filter((el) => ids.has(el.id));
  },

  setProject: (project) => {
    const migrated: Project = {
      ...project,
      viewport: project.viewport ?? { ...DEFAULT_VIEWPORT },
      slideSize: project.slideSize ?? { ...DEFAULT_SLIDE_SIZE },
      slides: project.slides.map((slide) => ({
        ...slide,
        backgroundFill: slide.backgroundFill ?? { kind: 'solid', color: slide.background ?? '#ffffff' },
      })),
    };
    set({
      project: deepClone(migrated),
      currentSlideIndex: 0,
      selectedIds: [],
      past: [],
      future: [],
      historyOpen: false,
      editingTextId: null,
    });
  },

  newProject: () => {
    get().setProject(createProject());
  },

  setSlideSize: (size) => {
    const width = Math.round(Math.min(4000, Math.max(200, size.width)));
    const height = Math.round(Math.min(4000, Math.max(200, size.height)));
    get().ensureHistory();
    set((state) => {
      const old = sizeOf(state);
      if (old.width === width && old.height === height) return state;
      const k = Math.min(width / old.width, height / old.height);
      const dx = (width - old.width * k) / 2;
      const dy = (height - old.height * k) / 2;
      const slides =
        k === 1 && dx === 0 && dy === 0
          ? state.project.slides
          : state.project.slides.map((slide) => scaleSlide(slide, k, dx, dy));
      return { project: { ...state.project, slideSize: { width, height }, slides } };
    });
    get().endHistory();
  },

  setProjectName: (name) => {
    get().ensureHistory();
    set((state) => ({ project: { ...state.project, name } }));
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  ensureHistory: () => {
    const { historyOpen, project, currentSlideIndex } = get();
    if (historyOpen) return;
    const snapshot: HistorySnapshot = {
      slides: snapshotSlides(project.slides),
      currentSlideIndex,
      name: project.name,
    };
    set((state) => ({
      past: [...state.past.slice(-HISTORY_LIMIT + 1), snapshot],
      future: [],
      historyOpen: true,
    }));
  },

  endHistory: () => set({ historyOpen: false }),

  undo: () => {
    const { past, future, project, currentSlideIndex } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      project: { ...project, slides: previous.slides, name: previous.name },
      past: past.slice(0, -1),
      future: [
        ...future.slice(-HISTORY_LIMIT + 1),
        { slides: snapshotSlides(project.slides), currentSlideIndex, name: project.name },
      ],
      historyOpen: false,
      selectedIds: [],
      editingTextId: null,
      currentSlideIndex: Math.max(0, Math.min(previous.currentSlideIndex, previous.slides.length - 1)),
    });
  },

  redo: () => {
    const { past, future, project, currentSlideIndex } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      project: { ...project, slides: next.slides, name: next.name },
      future: future.slice(0, -1),
      past: [
        ...past.slice(-HISTORY_LIMIT + 1),
        { slides: snapshotSlides(project.slides), currentSlideIndex, name: project.name },
      ],
      historyOpen: false,
      selectedIds: [],
      editingTextId: null,
      currentSlideIndex: Math.max(0, Math.min(next.currentSlideIndex, next.slides.length - 1)),
    });
  },

  setTool: (tool) => {
    get().endHistory();
    set({ tool, selectedIds: tool === 'hand' ? [] : get().selectedIds });
  },

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),

  setPan: (pan) => set({ pan }),

  zoomAt: (factor, origin) => {
    const { zoom, pan } = get();
    const nextZoom = clampZoom(zoom * factor);
    if (nextZoom === zoom) return;
    const ratio = nextZoom / zoom;
    set({
      zoom: nextZoom,
      pan: {
        x: origin.x - (origin.x - pan.x) * ratio,
        y: origin.y - (origin.y - pan.y) * ratio,
      },
    });
  },

  setSelection: (ids) => {
    get().endHistory();
    set({ selectedIds: ids });
  },

  toggleSelection: (id) => {
    get().endHistory();
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((existing) => existing !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelection: () => {
    get().endHistory();
    set({ selectedIds: [], editingTextId: null });
  },

  selectAll: () => {
    const slide = get().currentSlide();
    set({ selectedIds: slide.elements.map((el) => el.id) });
  },

  selectSlide: (index) => {
    get().endHistory();
    set({ currentSlideIndex: index, selectedIds: [], editingTextId: null });
  },

  addSlide: () => {
    get().ensureHistory();
    set((state) => {
      const slide = createSlide(state.project.slides.length);
      return {
        project: {
          ...state.project,
          slides: [...state.project.slides, slide],
        },
        currentSlideIndex: state.project.slides.length,
        selectedIds: [],
      };
    });
    get().endHistory();
  },

  duplicateSlide: () => {
    get().ensureHistory();
    set((state) => {
      const source = state.project.slides[state.currentSlideIndex];
      const copy: Slide = {
        ...deepClone(source),
        id: createId('slide'),
        name: `${source.name} copy`,
        elements: source.elements.map((el) => ({ ...deepClone(el), id: createId('el') })),
      };
      const slides = moveElementInArray(
        [...state.project.slides.slice(0, state.currentSlideIndex + 1), copy, ...state.project.slides.slice(state.currentSlideIndex + 1)],
        state.currentSlideIndex + 1,
        state.currentSlideIndex + 1,
      );
      return {
        project: { ...state.project, slides },
        currentSlideIndex: state.currentSlideIndex + 1,
        selectedIds: [],
      };
    });
    get().endHistory();
  },

  deleteSlide: (index) => {
    const { project } = get();
    if (project.slides.length <= 1) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.filter((_, i) => i !== index);
      return {
        project: { ...state.project, slides },
        currentSlideIndex: Math.max(0, Math.min(state.currentSlideIndex >= index ? state.currentSlideIndex - 1 : state.currentSlideIndex, slides.length - 1)),
        selectedIds: [],
      };
    });
    get().endHistory();
  },

  moveSlide: (from, to) => {
    if (from === to || to < 0 || to >= get().project.slides.length) return;
    get().ensureHistory();
    set((state) => ({
      project: { ...state.project, slides: moveElementInArray(state.project.slides, from, to) },
      currentSlideIndex: to,
    }));
    get().endHistory();
  },

  addElement: (element) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = [...slide.elements, element];
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides }, selectedIds: [element.id] };
    });
    get().endHistory();
  },

  addShape: (shape, at) => {
    const base: ShapeElement = {
      ...deepClone(DEFAULT_SHAPE),
      id: createId('el'),
      shape,
      x: Math.round(at.x - DEFAULT_SHAPE.width / 2),
      y: Math.round(at.y - DEFAULT_SHAPE.height / 2),
    };
    if (shape === 'line' || shape === 'arrow') {
      base.fill = 'transparent';
      base.stroke = '#6366f1';
      base.height = 0;
      base.cornerRadius = 0;
    }
    get().addElement(base);
  },

  addTextBox: (at) => {
    const text: TextElement = {
      ...deepClone(DEFAULT_TEXT),
      id: createId('el'),
      x: Math.round(at.x - DEFAULT_TEXT.width / 2),
      y: Math.round(at.y - DEFAULT_TEXT.height / 2),
    };
    get().addElement(text);
    get().beginTextEdit(text.id);
  },

  addImage: (src, natural, at) => {
    const size = sizeOf(get());
    const maxWidth = size.width * 0.6;
    const maxHeight = size.height * 0.6;
    const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height, 1);
    const width = Math.max(40, Math.round(natural.width * scale));
    const height = Math.max(40, Math.round(natural.height * scale));
    const center = at ?? { x: size.width / 2, y: size.height / 2 };
    const image = {
      ...deepClone(DEFAULT_SHADOW),
    };
    const element: CanvasElement = {
      id: createId('el'),
      type: 'image',
      src,
      width,
      height,
      x: Math.round(center.x - width / 2),
      y: Math.round(center.y - height / 2),
      rotation: 0,
      opacity: 1,
      shadow: image,
      locked: false,
      cornerRadius: 0,
      filters: deepClone(DEFAULT_IMAGE.filters),
    };
    get().addElement(element);
  },

  addChart: (at) => {
    const size = sizeOf(get());
    const center = at ?? { x: size.width / 2, y: size.height / 2 };
    const chart: ChartElement = {
      ...deepClone(DEFAULT_CHART),
      id: createId('el'),
      x: Math.round(center.x - DEFAULT_CHART.width / 2),
      y: Math.round(center.y - DEFAULT_CHART.height / 2),
    };
    get().addElement(chart);
  },

  addTable: (at) => {
    const size = sizeOf(get());
    const center = at ?? { x: size.width / 2, y: size.height / 2 };
    const table: TableElement = {
      ...deepClone(DEFAULT_TABLE),
      id: createId('el'),
      x: Math.round(center.x - DEFAULT_TABLE.width / 2),
      y: Math.round(center.y - DEFAULT_TABLE.height / 2),
    };
    get().addElement(table);
  },

  insertIcon: (src, color, at) => {
    const slideSz = sizeOf(get());
    const center = at ?? { x: slideSz.width / 2, y: slideSz.height / 2 };
    const size = 200;
    const element: CanvasElement = {
      id: createId('el'),
      type: 'image',
      src,
      width: size,
      height: size,
      x: Math.round(center.x - size / 2),
      y: Math.round(center.y - size / 2),
      rotation: 0,
      opacity: 1,
      shadow: { ...DEFAULT_SHADOW },
      locked: false,
      cornerRadius: 0,
      filters: deepClone(DEFAULT_IMAGE.filters),
    };
    void color;
    get().addElement(element);
  },

  updateChart: (id, patch) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) =>
        el.id === id && el.type === 'chart' ? { ...el, ...patch } : el,
      );
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  updateTable: (id, patch) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) => {
        if (el.id !== id || el.type !== 'table') return el;
        const next = { ...el, ...patch };
        // Keep cells/widths/heights arrays in sync with row/col counts.
        const rows = next.rows;
        const cols = next.cols;
        const cells = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => next.cells[r]?.[c] ?? ''),
        );
        const colWidths = Array.from({ length: cols }, (_, c) => next.colWidths[c] ?? 150);
        const rowHeights = Array.from({ length: rows }, (_, r) => next.rowHeights[r] ?? 48);
        return { ...next, cells, colWidths, rowHeights };
      });
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  setElementHidden: (id, hidden) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) => (el.id === id ? { ...el, hidden } : el));
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  setSlideNotes: (notes) => {
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex], notes };
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  setSlideTransition: (transition) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex], transition };
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  setSlideSection: (index, section, untilNext = false) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      if (!slides[index]) return state;
      const name = section?.trim() ? section.trim() : undefined;
      if (untilNext) {
        for (let i = index; i < slides.length; i += 1) {
          if (i > index && slides[i].section) break;
          slides[i] = { ...slides[i], section: name };
        }
      } else {
        slides[index] = { ...slides[index], section: name };
      }
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  renameSection: (oldName, newName) => {
    const trimmed = newName.trim();
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.map((slide) =>
        slide.section === oldName ? { ...slide, section: trimmed || undefined } : slide,
      );
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  addBrandColor: (color) => {
    get().ensureHistory();
    set((state) => {
      const kit = state.project.brandKit ?? { colors: [], fontFamilies: [] };
      if (kit.colors.some((c) => c.toLowerCase() === color.toLowerCase())) return state;
      return {
        project: {
          ...state.project,
          brandKit: { ...kit, colors: [...kit.colors, color].slice(0, 24) },
        },
      };
    });
    get().endHistory();
  },

  removeBrandColor: (color) => {
    get().ensureHistory();
    set((state) => {
      const kit = state.project.brandKit;
      if (!kit) return state;
      return {
        project: {
          ...state.project,
          brandKit: { ...kit, colors: kit.colors.filter((c) => c !== color) },
        },
      };
    });
    get().endHistory();
  },

  addBrandFont: (family) => {
    get().ensureHistory();
    set((state) => {
      const kit = state.project.brandKit ?? { colors: [], fontFamilies: [] };
      if (kit.fontFamilies.includes(family)) return state;
      return {
        project: {
          ...state.project,
          brandKit: { ...kit, fontFamilies: [...kit.fontFamilies, family].slice(0, 12) },
        },
      };
    });
    get().endHistory();
  },

  removeBrandFont: (family) => {
    get().ensureHistory();
    set((state) => {
      const kit = state.project.brandKit;
      if (!kit) return state;
      return {
        project: {
          ...state.project,
          brandKit: { ...kit, fontFamilies: kit.fontFamilies.filter((f) => f !== family) },
        },
      };
    });
    get().endHistory();
  },

  insertTemplateSlide: (template, mode) => {
    get().ensureHistory();
    set((state) => {
      const newSlide = fitSlideToSize(templateToSlide(template), sizeOf(state));
      const slides = state.project.slides.slice();
      if (mode === 'replace') {
        slides[state.currentSlideIndex] = newSlide;
        return {
          project: { ...state.project, slides },
          selectedIds: [],
        };
      }
      slides.splice(state.currentSlideIndex + 1, 0, newSlide);
      return {
        project: { ...state.project, slides },
        currentSlideIndex: state.currentSlideIndex + 1,
        selectedIds: [],
      };
    });
    get().endHistory();
  },

  insertDeck: (deck, mode) => {
    get().ensureHistory();
    set((state) => {
      const size = sizeOf(state);
      const newSlides = deckToSlides(deck).map((slide) => fitSlideToSize(slide, size));
      if (mode === 'replace') {
        return {
          project: { ...state.project, slides: newSlides },
          currentSlideIndex: 0,
          selectedIds: [],
          editingTextId: null,
        };
      }
      return {
        project: { ...state.project, slides: [...state.project.slides, ...newSlides] },
        currentSlideIndex: state.project.slides.length,
        selectedIds: [],
      };
    });
    get().endHistory();
  },

  addEmoji: (emoji) => {
    const size = sizeOf(get());
    const text: TextElement = {
      ...deepClone(DEFAULT_TEXT),
      id: createId('el'),
      text: emoji,
      fontSize: 120,
      width: 220,
      height: 160,
      x: Math.round(size.width / 2 - 110),
      y: Math.round(size.height / 2 - 80),
    };
    get().addElement(text);
  },

  updateElement: (id, patch, options) => {
    if (options?.history !== false) get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      const elements = slide.elements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as CanvasElement) : el,
      );
      slide.elements = elements;
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  updateSelected: (patch, options) => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    if (options?.history !== false) get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) =>
        ids.has(el.id) ? ({ ...el, ...patch } as CanvasElement) : el,
      );
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  removeSelected: () => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.filter((el) => !ids.has(el.id) || el.locked);
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides }, selectedIds: [], editingTextId: null };
    });
    get().endHistory();
  },

  duplicateSelected: () => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      // Map old groupId -> new groupId so duplicated groups stay self-contained.
      const groupMap = new Map<string, string>();
      const clones = slide.elements
        .filter((el) => ids.has(el.id))
        .map((el) => {
          const clone: CanvasElement = {
            ...deepClone(el),
            id: createId('el'),
            x: el.x + 24,
            y: el.y + 24,
          };
          if (clone.groupId) {
            let mapped = groupMap.get(clone.groupId);
            if (!mapped) {
              mapped = createId('grp');
              groupMap.set(clone.groupId, mapped);
            }
            clone.groupId = mapped;
          }
          return clone;
        });
      slide.elements = [...slide.elements, ...clones];
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides }, selectedIds: clones.map((c) => c.id) };
    });
    get().endHistory();
  },

  copySelected: () => {
    const { selectedIds, project, currentSlideIndex } = get();
    const ids = new Set(selectedIds);
    const slide = project.slides[currentSlideIndex];
    const elements = slide.elements.filter((el) => ids.has(el.id)).map((el) => deepClone(el));
    if (elements.length === 0) return;
    elementClipboard = elements;
    void navigator.clipboard
      ?.writeText(JSON.stringify({ type: 'nr-presentation-elements', elements }))
      .catch(() => undefined);
  },

  cutSelected: () => {
    get().copySelected();
    get().removeSelected();
  },

  pasteClipboard: async () => {
    if (!elementClipboard || elementClipboard.length === 0) {
      try {
        const text = await navigator.clipboard?.readText();
        if (!text) return;
        const data = JSON.parse(text) as { type?: string; elements?: CanvasElement[] };
        if (data.type !== 'nr-presentation-elements' || !Array.isArray(data.elements) || data.elements.length === 0) return;
        elementClipboard = data.elements;
      } catch {
        return;
      }
    }
    const source = elementClipboard;
    if (!source || source.length === 0) return;
    get().ensureHistory();
    const groupMap = new Map<string, string>();
    const clones = source.map((el) => {
      const clone: CanvasElement = {
        ...deepClone(el),
        id: createId('el'),
        x: el.x + 24,
        y: el.y + 24,
      };
      if (clone.groupId) {
        let mapped = groupMap.get(clone.groupId);
        if (!mapped) {
          mapped = createId('grp');
          groupMap.set(clone.groupId, mapped);
        }
        clone.groupId = mapped;
      }
      return clone;
    });
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = [...slide.elements, ...clones];
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides }, selectedIds: clones.map((c) => c.id) };
    });
    get().endHistory();
  },

  nudgeSelected: (dx, dy) => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) =>
        ids.has(el.id) && !el.locked ? { ...el, x: el.x + dx, y: el.y + dy } : el,
      );
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  reorderSelected: (direction) => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      const elements = slide.elements.slice();
      const apply = () => {
        switch (direction) {
          case 'front':
            return [...elements.filter((el) => ids.has(el.id)), ...elements.filter((el) => !ids.has(el.id))];
          case 'back':
            return [...elements.filter((el) => !ids.has(el.id)), ...elements.filter((el) => ids.has(el.id))];
          case 'forward': {
            const next = elements.slice();
            for (let i = next.length - 2; i >= 0; i -= 1) {
              if (ids.has(next[i].id) && !ids.has(next[i + 1].id)) {
                [next[i], next[i + 1]] = [next[i + 1], next[i]];
              }
            }
            return next;
          }
          case 'backward': {
            const next = elements.slice();
            for (let i = 1; i < next.length; i += 1) {
              if (ids.has(next[i].id) && !ids.has(next[i - 1].id)) {
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
              }
            }
            return next;
          }
        }
      };
      slide.elements = apply();
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  toggleLockSelected: () => {
    const selected = get().selectedElements();
    if (selected.length === 0) return;
    const shouldLock = selected.some((el) => !el.locked);
    get().updateSelected({ locked: shouldLock });
    get().endHistory();
  },

  updateImageFilters: (id, patch) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) => {
        if (el.id !== id || el.type !== 'image') return el;
        return { ...el, filters: { ...el.filters, ...patch } };
      });
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
  },

  groupSelected: () => {
    const ids = new Set(get().selectedIds);
    if (ids.size < 2) return;
    get().ensureHistory();
    const groupId = createId('grp');
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) =>
        ids.has(el.id) ? { ...el, groupId } : el,
      );
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  ungroupSelected: () => {
    const { selectedIds } = get();
    const slide = get().currentSlide();
    const groupIds = new Set(
      slide.elements
        .filter((el) => selectedIds.includes(el.id) && el.groupId)
        .map((el) => el.groupId as string),
    );
    if (groupIds.size === 0) return;
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const current = { ...slides[state.currentSlideIndex] };
      current.elements = current.elements.map((el) => {
        if (el.groupId && groupIds.has(el.groupId)) {
          const { groupId: _drop, ...rest } = el;
          return rest as CanvasElement;
        }
        return el;
      });
      slides[state.currentSlideIndex] = current;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  alignSelected: (mode) => {
    const selected = get().selectedElements().filter((el) => !el.locked);
    if (selected.length === 0) return;
    get().ensureHistory();
    const size = sizeOf(get());

    const bounds = selected.map((el) => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    }));

    // Union bounding box of the current selection.
    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));

    // If a single element, align relative to the slide; otherwise to the selection box.
    const useSlide = selected.length === 1;
    const targetLeft = useSlide ? 0 : minX;
    const targetTop = useSlide ? 0 : minY;
    const targetRight = useSlide ? size.width : maxX;
    const targetBottom = useSlide ? size.height : maxY;
    const targetCenterX = (targetLeft + targetRight) / 2;
    const targetCenterY = (targetTop + targetBottom) / 2;

    const deltas = new Map<string, { dx: number; dy: number }>();
    for (const b of bounds) {
      let dx = 0;
      let dy = 0;
      switch (mode) {
        case 'left':
          dx = targetLeft - b.x;
          break;
        case 'centerX':
          dx = targetCenterX - (b.x + b.width / 2);
          break;
        case 'right':
          dx = targetRight - (b.x + b.width);
          break;
        case 'top':
          dy = targetTop - b.y;
          break;
        case 'centerY':
          dy = targetCenterY - (b.y + b.height / 2);
          break;
        case 'bottom':
          dy = targetBottom - (b.y + b.height);
          break;
        case 'centerBoth':
          dx = size.width / 2 - (b.x + b.width / 2);
          dy = size.height / 2 - (b.y + b.height / 2);
          break;
      }
      deltas.set(b.id, { dx, dy });
    }

    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) => {
        const delta = deltas.get(el.id);
        if (!delta) return el;
        return { ...el, x: el.x + delta.dx, y: el.y + delta.dy };
      });
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  distributeSelected: (axis) => {
    const selected = get().selectedElements().filter((el) => !el.locked);
    if (selected.length < 3) return;
    get().ensureHistory();

    const sorted = selected
      .slice()
      .sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan =
      axis === 'horizontal'
        ? last.x + last.width - first.x
        : last.y + last.height - first.y;
    const sumSizes = sorted.reduce(
      (acc, el) => acc + (axis === 'horizontal' ? el.width : el.height),
      0,
    );
    const gap = (totalSpan - sumSizes) / (sorted.length - 1);

    const positions = new Map<string, number>();
    let cursor = axis === 'horizontal' ? first.x : first.y;
    for (const el of sorted) {
      positions.set(el.id, cursor);
      cursor += (axis === 'horizontal' ? el.width : el.height) + gap;
    }

    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.elements = slide.elements.map((el) => {
        const pos = positions.get(el.id);
        if (pos === undefined) return el;
        return axis === 'horizontal' ? { ...el, x: pos } : { ...el, y: pos };
      });
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  setBackground: (fill) => {
    get().ensureHistory();
    set((state) => {
      const slides = state.project.slides.slice();
      const slide = { ...slides[state.currentSlideIndex] };
      slide.backgroundFill = fill;
      slide.background = fill.kind === 'solid' ? fill.color : fill.from;
      slides[state.currentSlideIndex] = slide;
      return { project: { ...state.project, slides } };
    });
    get().endHistory();
  },

  setViewport: (patch) => {
    set((state) => ({
      project: { ...state.project, viewport: { ...state.project.viewport, ...patch } },
    }));
  },

  selectWithinBounds: (bounds, mode) => {
    const slide = get().currentSlide();
    const hits = slide.elements
      .filter(
        (el) =>
          el.x < bounds.x + bounds.width &&
          el.x + el.width > bounds.x &&
          el.y < bounds.y + bounds.height &&
          el.y + el.height > bounds.y,
      )
      .map((el) => el.id);

    if (mode === 'add') {
      const merged = new Set([...get().selectedIds, ...hits]);
      set({ selectedIds: [...merged] });
    } else {
      set({ selectedIds: hits });
    }
  },

  beginTextEdit: (id) => {
    get().ensureHistory();
    set({ editingTextId: id, selectedIds: [id], tool: 'select' });
  },

  endTextEdit: () => {
    set({ editingTextId: null });
    get().endHistory();
  },
}));
