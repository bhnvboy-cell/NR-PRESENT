import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import type { CanvasElement } from '../../types/editor';

const TYPE_LABEL: Record<CanvasElement['type'], string> = {
  text: 'Text',
  shape: 'Shape',
  image: 'Image',
  chart: 'Chart',
  table: 'Table',
};

function elementLabel(el: CanvasElement): string {
  if (el.type === 'text') return el.text.slice(0, 28) || 'Text';
  if (el.type === 'chart') return el.title || 'Chart';
  if (el.type === 'shape') return el.shape;
  if (el.type === 'image') return 'Image';
  return TYPE_LABEL[el.type];
}

export function LayersPanel() {
  const elements = useEditorStore((state) => state.currentSlide().elements);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const setSelection = useEditorStore((state) => state.setSelection);
  const toggleSelection = useEditorStore((state) => state.toggleSelection);
  const setElementHidden = useEditorStore((state) => state.setElementHidden);
  const updateElement = useEditorStore((state) => state.updateElement);
  const reorderSelected = useEditorStore((state) => state.reorderSelected);
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);

  // Display topmost-first (matches visual stacking).
  const ordered = [...elements].reverse();

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Layers</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="layer-actions">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => reorderSelected('front')}
            title="Bring to front"
          >
            ⤒ Front
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => reorderSelected('back')}
            title="Send to back"
          >
            ⤓ Back
          </button>
        </div>

        {ordered.length === 0 ? <p className="panel-empty">No elements yet.</p> : null}

        <ul className="layer-list">
          {ordered.map((el) => {
            const active = selectedIds.includes(el.id);
            return (
              <li key={el.id} className={`layer-item ${active ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="layer-main"
                  onClick={(event) => {
                    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
                    if (additive) toggleSelection(el.id);
                    else setSelection([el.id]);
                  }}
                >
                  <span className="layer-type" data-type={el.type}>
                    {TYPE_LABEL[el.type]}
                  </span>
                  <span className="layer-name">{elementLabel(el)}</span>
                </button>
                <button
                  type="button"
                  className={`layer-icon ${el.hidden ? 'is-off' : ''}`}
                  onClick={() => setElementHidden(el.id, !el.hidden)}
                  title={el.hidden ? 'Show' : 'Hide'}
                >
                  {el.hidden ? '◌' : '●'}
                </button>
                <button
                  type="button"
                  className={`layer-icon ${el.locked ? 'is-on' : ''}`}
                  onClick={() => updateElement(el.id, { locked: !el.locked })}
                  title={el.locked ? 'Unlock' : 'Lock'}
                >
                  {el.locked ? '🔒' : '🔓'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
