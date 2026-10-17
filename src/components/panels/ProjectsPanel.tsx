import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useCanvasUi } from '../../store/canvasUi';
import {
  createShareLink,
  projectApi,
  revokeShareLink,
  setActiveProjectId,
  shareUrl,
  usingRemoteApi,
  type ProjectMeta,
} from '../../persistence/projectApi';
import { createId } from '../../utils/id';
import type { Project } from '../../types/editor';

export function ProjectsPanel() {
  const currentId = useEditorStore((state) => state.project.id);
  const project = useEditorStore((state) => state.project);
  const setProject = useEditorStore((state) => state.setProject);
  const newProject = useEditorStore((state) => state.newProject);
  const setRightPanel = useCanvasUi((s) => s.setRightPanel);

  const [items, setItems] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shareTokens, setShareTokens] = useState<Record<string, string>>({});
  const [expandedShare, setExpandedShare] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await projectApi.listMeta());
    } catch {
      setError('Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleNew = () => {
    newProject();
    window.setTimeout(() => void refresh(), 900);
  };

  const handleOpen = async (id: string) => {
    if (id === currentId) return;
    setBusyId(id);
    try {
      const loaded = await projectApi.get(id);
      if (loaded) {
        setActiveProjectId(id);
        setProject(loaded);
      } else {
        setError('Project not found.');
      }
    } catch {
      setError('Could not open project.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (meta: ProjectMeta) => {
    const ok = window.confirm(`Delete “${meta.name}”? This cannot be undone.`);
    if (!ok) return;
    setBusyId(meta.id);
    try {
      await projectApi.remove(meta.id);
      if (meta.id === currentId) newProject();
      await refresh();
    } catch {
      setError('Could not delete project.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name || 'presentation'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleShare = (meta: ProjectMeta) => {
    if (expandedShare === meta.id) {
      setExpandedShare(null);
      return;
    }
    setShareBusy(meta.id);
    setError(null);
    void (async () => {
      try {
        let token = shareTokens[meta.id];
        if (!token) {
          token = await createShareLink(meta.id);
          const captured = token;
          setShareTokens((prev) => ({ ...prev, [meta.id]: captured }));
          setItems((prev) => prev.map((it) => (it.id === meta.id ? { ...it, shared: true } : it)));
        }
        setExpandedShare(meta.id);
      } catch {
        setError('Could not create a share link.');
      } finally {
        setShareBusy(null);
      }
    })();
  };

  const handleRevokeShare = (meta: ProjectMeta) => {
    setShareBusy(meta.id);
    void (async () => {
      try {
        await revokeShareLink(meta.id);
        setShareTokens((prev) => {
          const next = { ...prev };
          delete next[meta.id];
          return next;
        });
        setItems((prev) => prev.map((it) => (it.id === meta.id ? { ...it, shared: false } : it)));
        setExpandedShare(null);
      } catch {
        setError('Could not revoke the share link.');
      } finally {
        setShareBusy(null);
      }
    })();
  };

  const handleCopyShare = (meta: ProjectMeta) => {
    const token = shareTokens[meta.id];
    if (!token) return;
    void navigator.clipboard.writeText(shareUrl(token)).then(() => {
      setCopiedId(meta.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleImportFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Project;
      if (!data || typeof data !== 'object' || !Array.isArray(data.slides) || data.slides.length === 0) {
        setError('Not a valid NR Presentation file.');
        return;
      }
      const saved = await projectApi.save({
        ...data,
        id: createId('proj'),
        name: typeof data.name === 'string' && data.name.trim() ? data.name : file.name.replace(/\.json$/i, ''),
      });
      setActiveProjectId(saved.id);
      setProject(saved);
      await refresh();
    } catch {
      setError('Could not import file.');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Projects</span>
        <button type="button" className="panel-close" onClick={() => setRightPanel('none')}>
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="button-row">
          <button type="button" className="sidebar-action" onClick={handleNew}>
            ＋ New project
          </button>
          <button type="button" className="sidebar-action" onClick={() => void refresh()} disabled={loading}>
            ⟳ Refresh
          </button>
        </div>
        <div className="button-row">
          <button type="button" className="sidebar-action" onClick={handleExport}>
            ⬇ Export .json
          </button>
          <button type="button" className="sidebar-action" onClick={() => importRef.current?.click()}>
            ⬆ Import .json
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleImportFile(file);
            }}
          />
        </div>

        {error ? <p className="panel-error">{error}</p> : null}
        {loading ? <p className="panel-empty">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="panel-empty">No projects yet.</p> : null}

        <ul className="project-list">
          {items.map((meta) => {
            const isCurrent = meta.id === currentId;
            return (
              <li key={meta.id} className={`project-item ${isCurrent ? 'is-current' : ''}`}>
                <div className="project-row">
                  <button
                    type="button"
                    className="project-main"
                    disabled={busyId === meta.id || isCurrent}
                    onClick={() => void handleOpen(meta.id)}
                    title={isCurrent ? 'Currently open' : 'Open project'}
                  >
                    <span className="project-name">{meta.name || 'Untitled'}</span>
                    <span className="project-meta">
                      {formatWhen(meta.updatedAt)}
                      {usingRemoteApi && meta.shared ? ' · 🔗' : ''}
                    </span>
                  </button>
                  {usingRemoteApi ? (
                    <button
                      type="button"
                      className="layer-icon"
                      disabled={shareBusy === meta.id}
                      onClick={() => handleToggleShare(meta)}
                      title={meta.shared ? 'Manage share link' : 'Create read-only share link'}
                    >
                      🔗
                    </button>
                  ) : null}
                  {isCurrent ? (
                    <span className="project-badge">Open</span>
                  ) : (
                    <button
                      type="button"
                      className="layer-icon"
                      disabled={busyId === meta.id}
                      onClick={() => void handleDelete(meta)}
                      title="Delete project"
                    >
                      🗑
                    </button>
                  )}
                </div>
                {usingRemoteApi && expandedShare === meta.id && shareTokens[meta.id] ? (
                  <div className="project-share-row">
                    <input
                      className="project-share-link"
                      readOnly
                      value={shareUrl(shareTokens[meta.id])}
                      onFocus={(event) => event.target.select()}
                      title="Read-only share link"
                    />
                    <button type="button" className="layer-icon" onClick={() => handleCopyShare(meta)} title="Copy link">
                      {copiedId === meta.id ? '✓' : '⧉'}
                    </button>
                    <button
                      type="button"
                      className="layer-icon"
                      disabled={shareBusy === meta.id}
                      onClick={() => handleRevokeShare(meta)}
                      title="Revoke link"
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
