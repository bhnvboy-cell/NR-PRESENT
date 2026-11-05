import { useCanvasUi } from '../../store/canvasUi';
import { ProjectsPanel } from './ProjectsPanel';
import { LayersPanel } from './LayersPanel';
import { TemplateGallery } from './TemplateGallery';
import { ElementsPanel } from './ElementsPanel';
import { PalettePanel } from './PalettePanel';
import { MagicPanel } from './MagicPanel';
import { CommentsPanel } from './CommentsPanel';

export function RightPanel() {
  const panel = useCanvasUi((s) => s.rightPanel);
  if (panel === 'none') return null;
  return (
    <div className="right-panel">
      {panel === 'projects' ? <ProjectsPanel /> : null}
      {panel === 'layers' ? <LayersPanel /> : null}
      {panel === 'templates' ? <TemplateGallery /> : null}
      {panel === 'elements' ? <ElementsPanel /> : null}
      {panel === 'palette' ? <PalettePanel /> : null}
      {panel === 'magic' ? <MagicPanel /> : null}
      {panel === 'comments' ? <CommentsPanel /> : null}
    </div>
  );
}
