import { create } from 'zustand';
import type { GuideLine } from '../utils/snap';
import type { BrushKind } from '../types/editor';

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollaboratorPresence {
  peerId: string;
  name: string;
  color: string;
  slideIndex: number;
  x?: number;
  y?: number;
  updatedAt: number;
}

export type RightPanel =
  | 'none'
  | 'projects'
  | 'layers'
  | 'templates'
  | 'elements'
  | 'palette'
  | 'magic'
  | 'comments';

interface CanvasUiState {
  guides: GuideLine[];
  marquee: MarqueeRect | null;
  isPresenting: boolean;
  presentIndex: number;
  presentStartedAt: number;
  rightPanel: RightPanel;
  findOpen: boolean;
  shortcutsOpen: boolean;
  penBrush: BrushKind;
  penColor: string;
  penWidth: number;
  collaborators: CollaboratorPresence[];

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
  setPenBrush: (brush: BrushKind) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setCollaborators: (peers: CollaboratorPresence[]) => void;
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
  penBrush: 'pen',
  penColor: '#4f46e5',
  penWidth: 4,
  collaborators: [],

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
  setPenBrush: (penBrush) =>
    set((state) => ({
      penBrush,
      penWidth: penBrush === 'highlighter' ? 18 : penBrush === 'marker' ? 9 : state.penWidth > 8 ? 4 : state.penWidth,
    })),
  setPenColor: (penColor) => set({ penColor }),
  setPenWidth: (penWidth) => set({ penWidth }),
  setCollaborators: (collaborators) => set({ collaborators }),
}));
