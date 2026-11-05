import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvasUi } from '../store/canvasUi';
import { projectApi } from '../persistence/projectApi';
import type { EditorTool } from '../types/editor';

const TOOL_SHORTCUTS: Record<string, EditorTool> = {
  v: 'select',
  t: 'text',
  b: 'pen',
  p: 'pen',
  r: 'rect',
  o: 'ellipse',
  l: 'line',
  a: 'arrow',
  i: 'image',
  h: 'hand',
};

export function useEditorShortcuts(): void {
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const store = useEditorStore.getState();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        store.undo();
        return;
      }
      if ((mod && event.key.toLowerCase() === 'y') || (mod && event.shiftKey && event.key.toLowerCase() === 'z')) {
        event.preventDefault();
        store.redo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        store.selectAll();
        return;
      }
      if (mod && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        store.copySelected();
        return;
      }
      if (mod && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        store.cutSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void store.pasteClipboard();
        return;
      }
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        store.setSaveStatus('saving');
        void projectApi
          .save(useEditorStore.getState().project)
          .then(() => useEditorStore.getState().setSaveStatus('saved'))
          .catch(() => useEditorStore.getState().setSaveStatus('error'));
        return;
      }
      if (mod && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        store.setZoom(Math.min(3, store.zoom + 0.1));
        return;
      }
      if (mod && event.key === '-') {
        event.preventDefault();
        store.setZoom(Math.max(0.1, store.zoom - 0.1));
        return;
      }
      if (mod && event.key === '0') {
        event.preventDefault();
        store.setZoom(1);
        return;
      }
      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        store.duplicateSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === 'g' && !event.shiftKey) {
        event.preventDefault();
        store.groupSelected();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        store.ungroupSelected();
        return;
      }
      if (event.key === 'F5') {
        event.preventDefault();
        useCanvasUi.getState().setPresenting(true, useEditorStore.getState().currentSlideIndex);
        return;
      }
      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        useCanvasUi.getState().setFindOpen(true);
        return;
      }
      if (event.key === 'F1') {
        event.preventDefault();
        useCanvasUi.getState().toggleShortcuts();
        return;
      }
      if (mod) return;

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          store.removeSelected();
          return;
        case 'Escape':
          store.clearSelection();
          store.endTextEdit();
          useCanvasUi.getState().setFindOpen(false);
          useCanvasUi.getState().setShortcutsOpen(false);
          return;
        case 'ArrowLeft':
          event.preventDefault();
          store.nudgeSelected(event.shiftKey ? -10 : -1, 0);
          return;
        case 'ArrowRight':
          event.preventDefault();
          store.nudgeSelected(event.shiftKey ? 10 : 1, 0);
          return;
        case 'ArrowUp':
          event.preventDefault();
          store.nudgeSelected(0, event.shiftKey ? -10 : -1);
          return;
        case 'ArrowDown':
          event.preventDefault();
          store.nudgeSelected(0, event.shiftKey ? 10 : 1);
          return;
        default:
          break;
      }

      const tool = TOOL_SHORTCUTS[event.key.toLowerCase()];
      if (tool) {
        store.setTool(tool);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
