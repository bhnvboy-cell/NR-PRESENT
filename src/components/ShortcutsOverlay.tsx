import { useCanvasUi } from '../store/canvasUi';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Tools',
    items: [
      ['V', 'Select'],
      ['T', 'Text'],
      ['R', 'Rectangle'],
      ['O', 'Ellipse'],
      ['L', 'Line'],
      ['A', 'Arrow'],
      ['I', 'Image'],
      ['H', 'Hand / pan (hold Space too)'],
    ],
  },
  {
    title: 'Editing',
    items: [
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Y', 'Redo'],
      ['Ctrl+C / X / V', 'Copy / cut / paste'],
      ['Ctrl+D', 'Duplicate selection'],
      ['Ctrl+A', 'Select all'],
      ['Ctrl+G', 'Group'],
      ['Ctrl+Shift+G', 'Ungroup'],
      ['Delete', 'Remove selection'],
      ['Arrows / Shift+Arrows', 'Nudge 1px / 10px'],
    ],
  },
  {
    title: 'File & view',
    items: [
      ['Ctrl+S', 'Save now'],
      ['Ctrl+F', 'Find in presentation'],
      ['Ctrl + / − / 0', 'Zoom in / out / reset'],
      ['F5', 'Present from current slide'],
      ['Esc', 'Clear selection / stop editing'],
      ['F1', 'This cheat sheet'],
    ],
  },
  {
    title: 'Present mode',
    items: [
      ['→ / Space / PageDown', 'Next slide'],
      ['← / PageUp', 'Previous slide'],
      ['L', 'Laser pointer'],
      ['O', 'Overview grid'],
      ['N', 'Speaker notes'],
      ['T', 'Reset timer'],
      ['Esc', 'Exit presentation'],
    ],
  },
];

export function ShortcutsOverlay() {
  const open = useCanvasUi((s) => s.shortcutsOpen);
  const close = () => useCanvasUi.getState().setShortcutsOpen(false);

  if (!open) return null;

  return (
    <div className="shortcuts-overlay" role="dialog" aria-label="Keyboard shortcuts" onClick={close}>
      <div className="shortcuts-card" onClick={(event) => event.stopPropagation()}>
        <div className="shortcuts-head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="find-close" onClick={close} title="Close (Esc or F1)">
            ×
          </button>
        </div>
        <div className="shortcuts-grid">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <dl>
                {group.items.map(([keys, label]) => (
                  <div key={keys} className="shortcut-row">
                    <dt>
                      {keys.split(' / ').map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </dt>
                    <dd>{label}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
