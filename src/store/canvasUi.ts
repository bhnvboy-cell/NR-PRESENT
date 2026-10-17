import { create } from 'zustand';
import type { GuideLine } from '../utils/snap';

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RightPanel = 'none' | 'projects' | 'layers' | 'templates' | 'elements' | 'palette';

interface CanvasUiState {
  guides: GuideLine[];
  marquee: MarqueeRect | null;
  isPresenting: boolean;
  presentIndex: number;
  presentStartedAt: number;
  rightPanel: RightPanel;
  findOpen: boolean;
  shortcutsOpen: boolean;

  setGuides: (guides: GuideLine[]) => void;
  clearGuides: () => void;
  setMarquee: (rect: MarqueeRect | null) => void;
  setPresenting: (presenting: boolean, index?: number) => void;
  setPresentIndex: (index: number) => void;
  resetPresentTimer: () => void;
  setRightPanel: (panel: RightPanel) => void;
  toggleRightPanel: (panel: RightPanel) => void;
  setFindOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;
}

export const useCanvasUi = create<CanvasUiState>((set) => ({
  guides: [],
  marquee: null,
  isPresenting: false,
  presentIndex: 0,
  presentStartedAt: 0,
  rightPanel: 'none',
  findOpen: false,
  shortcutsOpen: false,

  setGuides: (guides) => set({ guides }),
  clearGuides: () => set({ guides: [] }),
  setMarquee: (marquee) => set({ marquee }),
  setPresenting: (isPresenting, index = 0) =>
    set(
      isPresenting
        ? { isPresenting, presentIndex: index, presentStartedAt: Date.now() }
        : { isPresenting: false, presentIndex: 0, presentStartedAt: 0 },
    ),
  setPresentIndex: (presentIndex) => set({ presentIndex }),
  resetPresentTimer: () => set({ presentStartedAt: Date.now() }),
  setRightPanel: (rightPanel) => set({ rightPanel }),
  toggleRightPanel: (panel) =>
    set((state) => ({ rightPanel: state.rightPanel === panel ? 'none' : panel })),
  setFindOpen: (findOpen) => set({ findOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  toggleShortcuts: () => set((state) => ({ shortcutsOpen: !state.shortcutsOpen })),
}));
