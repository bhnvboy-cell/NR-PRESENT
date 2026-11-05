import { useEffect, useRef, useState } from 'react';
import { useEditorStore, type AlignMode } from '../store/editorStore';
import { useCanvasUi } from '../store/canvasUi';
import type { EditorTool } from '../types/editor';
import { exportAllSlidesPng, exportDeckPdf, exportDeckPdfWithNotes, exportDeckPptx, exportSlidePng } from '../utils/export';
import { createShareLink, shareUrl, usingRemoteApi } from '../persistence/projectApi';
import { logout } from '../persistence/authApi';
import { useAuthStore } from '../store/authStore';

interface ToolButton {
  id: EditorTool;
  label: string;
  hint: string;
}

const TOOLS: ToolButton[] = [
  { id: 'select', label: '⬚', hint: 'Select (V)' },
  { id: 'text', label: 'T', hint: 'Text (T)' },
  { id: 'pen', label: '✏️', hint: 'Draw / Pen (B)' },
  { id: 'rect', label: '▭', hint: 'Rectangle (R)' },
  { id: 'ellipse', label: '◯', hint: 'Ellipse (O)' },
  { id: 'triangle', label: '▲', hint: 'Triangle' },
  { id: 'diamond', label: '◆', hint: 'Diamond' },
  { id: 'star', label: '★', hint: 'Star' },
  { id: 'pentagon', label: '⬠', hint: 'Pentagon' },
  { id: 'hexagon', label: '⬡', hint: 'Hexagon' },
  { id: 'line', label: '╱', hint: 'Line (L)' },
  { id: 'arrow', label: '→', hint: 'Arrow (A)' },
  { id: 'image', label: '🖼', hint: 'Image (I)' },
  { id: 'hand', label: '✋', hint: 'Hand / pan (H or Space)' },
];

const ALIGN_OPTIONS: { mode: AlignMode; label: string; icon: string }[] = [
  { mode: 'left', label: 'Align left', icon: '⇤' },
  { mode: 'centerX', label: 'Center horizontally', icon: '⇔' },
  { mode: 'right', label: 'Align right', icon: '⇥' },
  { mode: 'top', label: 'Align top', icon: '⤒' },
  { mode: 'centerY', label: 'Center vertically', icon: '⇕' },
  { mode: 'bottom', label: 'Align bottom', icon: '⤓' },
  { mode: 'centerBoth', label: 'Center on slide', icon: '◈' },
];

export function TopToolbar() {
  const projectName = useEditorStore((state) => state.project.name);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);
  const updateSelected = useEditorStore((state) => state.updateSelected);
  const reorderSelected = useEditorStore((state) => state.reorderSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const toggleLockSelected = useEditorStore((state) => state.toggleLockSelected);
  const groupSelected = useEditorStore((state) => state.groupSelected);
  const ungroupSelected = useEditorStore((state) => state.ungroupSelected);
  const alignSelected = useEditorStore((state) => state.alignSelected);
  const distributeSelected = useEditorStore((state) => state.distributeSelected);
  const viewport = useEditorStore((state) => state.project.viewport);
  const setViewport = useEditorStore((state) => state.setViewport);
  const addChart = useEditorStore((state) => state.addChart);
  const addTable = useEditorStore((state) => state.addTable);
  const addMedia = useEditorStore((state) => state.addMedia);
  const addFrameImage = useEditorStore((state) => state.addFrameImage);
  const toggleRightPanel = useCanvasUi((s) => s.toggleRightPanel);
  const rightPanel = useCanvasUi((s) => s.rightPanel);
  const collaborators = useCanvasUi((s) => s.collaborators);
  const commentCount = useEditorStore((s) => (s.project.comments ?? []).filter((c) => !c.resolved).length);

  const slideCount = useEditorStore((state) => state.project.slides.length);
  const currentIndex = useEditorStore((state) => state.currentSlideIndex);
  const project = useEditorStore((state) => state.project);
  const setPresenting = useCanvasUi((s) => s.setPresenting);
  const user = useAuthStore((state) => state.user);
  const findOpen = useCanvasUi((state) => state.findOpen);
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'copied'>('idle');

  const handleShare = () => {
    setShareState('busy');
    void (async () => {
      try {
        const token = await createShareLink(project.id);
        await navigator.clipboard.writeText(shareUrl(token));
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 2000);
      } catch {
        setShareState('idle');
      }
    })();
  };

  const handleLogout = () => {
    void logout().finally(() => {
      window.dispatchEvent(new Event('nr:auth-lost'));
    });
  };

  const hasSelection = selectedIds.length > 0;
  const firstSelectedOpacity = useEditorStore((state) => {
    const firstId = state.selectedIds[0];
    if (!firstId) return 1;
    return state.currentSlide().elements.find((el) => el.id === firstId)?.opacity ?? 1;
  });
  const hasGroupSelected = useEditorStore((state) =>
    state.currentSlide().elements.some((el) => state.selectedIds.includes(el.id) && el.groupId),
  );

  return (
    <header className="top-toolbar">
      <div className="toolbar-section brand">
        <span className="brand-mark">NR</span>
        <input
          className="project-name-input"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          aria-label="Project name"
        />
      </div>

      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'projects' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('projects')}
          title="Projects"
        >
          📁
        </button>
      </div>

      <div className="toolbar-section">
        <button type="button" className="toolbar-button" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
          ↶
        </button>
        <button type="button" className="toolbar-button" disabled={!canRedo} onClick={redo} title="Redo (Ctrl+Y)">
          ↷
        </button>
      </div>

      <div className="toolbar-section tool-group">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`toolbar-button tool ${tool === item.id ? 'is-active' : ''}`}
            title={item.hint}
            onClick={() => setTool(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="toolbar-section">
        <Dropdown label="Insert" icon="＋" title="Insert">
          <MenuItem icon="📊" onClick={() => addChart()} title="Insert chart">
            Chart
          </MenuItem>
          <MenuItem icon="▦" onClick={() => addTable()} title="Insert table">
            Table
          </MenuItem>
          <MenuItem icon="🎬" onClick={() => addMedia('video')} title="Insert video clip">
            Video clip
          </MenuItem>
          <MenuItem icon="🎵" onClick={() => addMedia('audio')} title="Insert audio track">
            Audio track
          </MenuItem>
          <MenuItem icon="💻" onClick={() => addFrameImage('laptop', 'Laptop Mockup')} title="Insert device frame">
            Device frame
          </MenuItem>
          <MenuDivider />
          <MenuItem icon="✨" onClick={() => toggleRightPanel('magic')} title="AI Magic Design & Magic Write">
            Magic Studio (AI)
          </MenuItem>
          <MenuItem icon="🌟" onClick={() => toggleRightPanel('elements')} title="Browse shapes, frames, media, icons, graphics and emoji">
            Elements
          </MenuItem>
          <MenuItem icon="🗂" onClick={() => toggleRightPanel('templates')} title="Slide & deck templates">
            Templates
          </MenuItem>
          <MenuItem icon="🎨" onClick={() => toggleRightPanel('palette')} title="Color palette generator">
            Palettes
          </MenuItem>
          <MenuDivider />
          <MenuItem icon="💬" onClick={() => toggleRightPanel('comments')} title="Slide comments & collaboration">
            Comments
          </MenuItem>
          <MenuItem icon="⧉" onClick={() => toggleRightPanel('layers')} title="Layers panel">
            Layers
          </MenuItem>
        </Dropdown>

        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'magic' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('magic')}
          title="AI Magic Studio (Generate Slides & Magic Write)"
        >
          ✨
        </button>
        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'comments' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('comments')}
          title="Comments & Real-Time Collaboration"
        >
          💬{commentCount > 0 || collaborators.length > 0 ? ` ${commentCount || collaborators.length + 1}` : ''}
        </button>

        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'layers' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('layers')}
          title="Layers panel"
        >
          ☰
        </button>
        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'templates' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('templates')}
          title="Templates"
        >
          🗂
        </button>
        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'elements' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('elements')}
          title="Elements"
        >
          🌟
        </button>
        <button
          type="button"
          className={`toolbar-button ${rightPanel === 'palette' ? 'is-active' : ''}`}
          onClick={() => toggleRightPanel('palette')}
          title="Palette generator"
        >
          🎨
        </button>
      </div>

      <div className="toolbar-section">
        <Dropdown label="Align" icon="⧉" disabled={!hasSelection} title="Align objects">
          {ALIGN_OPTIONS.map((opt) => (
            <MenuItem key={opt.mode} icon={opt.icon} onClick={() => alignSelected(opt.mode)}>
              {opt.label}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem icon="↔" onClick={() => distributeSelected('horizontal')} disabled={selectedIds.length < 3}>
            Distribute horizontally
          </MenuItem>
          <MenuItem icon="↕" onClick={() => distributeSelected('vertical')} disabled={selectedIds.length < 3}>
            Distribute vertically
          </MenuItem>
        </Dropdown>

        <button
          type="button"
          className="toolbar-button"
          disabled={selectedIds.length < 2 || hasGroupSelected}
          onClick={groupSelected}
          title="Group (Ctrl+G)"
        >
          ⊞
        </button>
        <button
          type="button"
          className="toolbar-button"
          disabled={!hasGroupSelected}
          onClick={ungroupSelected}
          title="Ungroup (Ctrl+Shift+G)"
        >
          ⊟
        </button>
      </div>

      <div className="toolbar-section">
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={() => reorderSelected('front')} title="Bring to front">
          ⤒
        </button>
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={() => reorderSelected('forward')} title="Bring forward">
          ↑
        </button>
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={() => reorderSelected('backward')} title="Send backward">
          ↓
        </button>
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={() => reorderSelected('back')} title="Send to back">
          ⤓
        </button>
      </div>

      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-button"
          disabled={!hasSelection}
          onClick={() =>
            updateSelected({ opacity: Math.max(0.1, Math.round((firstSelectedOpacity - 0.1) * 100) / 100) })
          }
          title="Decrease opacity"
        >
          ◐
        </button>
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={duplicateSelected} title="Duplicate (Ctrl+D)">
          ⧉
        </button>
        <button type="button" className="toolbar-button" disabled={!hasSelection} onClick={toggleLockSelected} title="Lock / unlock">
          🔒
        </button>
        <button type="button" className="toolbar-button danger" disabled={!hasSelection} onClick={removeSelected} title="Delete (Del)">
          🗑
        </button>
      </div>

      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-button ${viewport.showGrid ? 'is-active' : ''}`}
          onClick={() => setViewport({ showGrid: !viewport.showGrid })}
          title="Toggle grid"
        >
          ▦
        </button>
        <button
          type="button"
          className={`toolbar-button ${viewport.showRulers ? 'is-active' : ''}`}
          onClick={() => setViewport({ showRulers: !viewport.showRulers })}
          title="Toggle rulers"
        >
          ▤
        </button>
        <button
          type="button"
          className={`toolbar-button ${viewport.snapToGuides ? 'is-active' : ''}`}
          onClick={() => setViewport({ snapToGuides: !viewport.snapToGuides })}
          title="Snap to guides"
        >
          🧲
        </button>
        <button
          type="button"
          className={`toolbar-button ${viewport.snapToGrid ? 'is-active' : ''}`}
          onClick={() => setViewport({ snapToGrid: !viewport.snapToGrid })}
          title="Snap to grid"
        >
          ▦+
        </button>
      </div>

      <div className="toolbar-section zoom-group">
        <button type="button" className="toolbar-button" onClick={() => setZoom(zoom - 0.1)} title="Zoom out">
          −
        </button>
        <button
          type="button"
          className="toolbar-button zoom-label"
          onClick={() => window.dispatchEvent(new Event('nr:fit-canvas'))}
          title="Zoom to fit"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="toolbar-button" onClick={() => setZoom(zoom + 0.1)} title="Zoom in">
          +
        </button>
      </div>

      <div className="toolbar-section">
        <button
          type="button"
          className={`toolbar-button ${findOpen ? 'is-active' : ''}`}
          onClick={() => useCanvasUi.getState().setFindOpen(!findOpen)}
          title="Find in presentation (Ctrl+F)"
        >
          🔍
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={() => useCanvasUi.getState().toggleShortcuts()}
          title="Keyboard shortcuts (F1)"
        >
          ❓
        </button>
      </div>

      <div className="toolbar-section">
        <Dropdown label="Export" icon="⤓" title="Export">
          <MenuItem icon="🖼" onClick={() => exportSlidePng(project.slides[currentIndex], project.name, currentIndex, project.slideSize)}>
            Export current slide (PNG)
          </MenuItem>
          <MenuItem icon="🗂" onClick={() => exportAllSlidesPng(project.slides, project.name, project.slideSize)}>
            Export all slides (PNG)
          </MenuItem>
          <MenuDivider />
          <MenuItem icon="📄" onClick={() => exportDeckPdf(project.slides, project.name, project.slideSize)}>
            Export deck (PDF — {slideCount} pages)
          </MenuItem>
          <MenuItem icon="📑" onClick={() => exportDeckPdfWithNotes(project.slides, project.name, project.slideSize)} title="Slides plus a notes page after each">
            Export deck (PDF + speaker notes)
          </MenuItem>
          <MenuDivider />
          <MenuItem icon="📽" onClick={() => exportDeckPptx(project.slides, project.name, project.slideSize)} title="PowerPoint (.pptx)">
            Export deck (PowerPoint)
          </MenuItem>
        </Dropdown>

        {usingRemoteApi && user ? (
          <button
            type="button"
            className="toolbar-button"
            disabled={shareState === 'busy'}
            onClick={handleShare}
            title="Copy a read-only share link"
          >
            {shareState === 'copied' ? '✓ Link copied' : shareState === 'busy' ? 'Sharing…' : '🔗 Share'}
          </button>
        ) : null}

        <button
          type="button"
          className="toolbar-button present"
          onClick={() => setPresenting(true, currentIndex)}
          title="Present (F5)"
        >
          ▶ Present
        </button>
      </div>

      <div className="toolbar-section save-status" data-status={saveStatus} title={usingRemoteApi ? 'Synced to PostgreSQL' : 'Stored in this browser'}>
        {saveStatus === 'saving'
          ? 'Saving…'
          : saveStatus === 'saved'
            ? 'Saved'
            : saveStatus === 'error'
              ? 'Save failed'
              : usingRemoteApi
                ? 'Cloud draft'
                : 'Local draft'}
      </div>

      {usingRemoteApi && user ? (
        <div className="toolbar-section user-chip" title={user.email}>
          <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="user-name">{user.name}</span>
          <button type="button" className="toolbar-button" onClick={handleLogout} title="Sign out">
            ⎋
          </button>
        </div>
      ) : null}
    </header>
  );
}

function Dropdown({
  label,
  icon,
  disabled,
  title,
  children,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={`dropdown ${open ? 'is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`toolbar-button ${open ? 'is-active' : ''}`}
        disabled={disabled}
        title={title ?? label}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
      </button>
      {open ? <div className="dropdown-menu">{children}</div> : null}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  disabled,
  title,
  children,
}: {
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="menu-item"
      disabled={disabled}
      title={title}
      onClick={() => {
        onClick();
      }}
    >
      <span className="menu-icon">{icon}</span>
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="menu-divider" />;
}
