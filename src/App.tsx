import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideCanvas } from './components/canvas/SlideCanvas';
import { PresentMode } from './components/canvas/PresentMode';
import { PropertiesSidebar } from './components/PropertiesSidebar';
import { RightPanel } from './components/panels/RightPanel';
import { SlideRail } from './components/SlideRail';
import { TopToolbar } from './components/TopToolbar';
import { AuthScreen } from './components/AuthScreen';
import { FindOverlay } from './components/FindOverlay';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { useEditorShortcuts } from './hooks/useEditorShortcuts';
import { useRealtimeCollab } from './hooks/useRealtimeCollab';
import { ensureFontsLoaded } from './data/fonts';
import {
  fetchSharedPresentation,
  getActiveProjectId,
  projectApi,
  removeActiveProjectId,
  usingRemoteApi,
} from './persistence/projectApi';
import { fetchMe } from './persistence/authApi';
import { useAuthStore } from './store/authStore';
import { useCanvasUi } from './store/canvasUi';
import { createProject, useEditorStore } from './store/editorStore';
import { createId } from './utils/id';

const AUTOSAVE_DELAY = 700;

export default function App() {
  useEditorShortcuts();
  useRealtimeCollab();
  const hydrated = useRef(false);

  const shareToken = useMemo(() => new URLSearchParams(window.location.search).get('view'), []);
  const checked = useAuthStore((state) => state.checked);
  const user = useAuthStore((state) => state.user);
  const presenting = useCanvasUi((state) => state.isPresenting);
  const sharedName = useEditorStore((state) => state.project.name);

  const [sharedState, setSharedState] = useState<'loading' | 'ready' | 'missing'>('loading');

  const ready = shareToken ? false : !usingRemoteApi || (checked && user !== null);

  const hydrate = useCallback(async () => {
    try {
      const activeId = getActiveProjectId();
      if (activeId) {
        const existing = await projectApi.get(activeId);
        if (existing) {
          useEditorStore.getState().setProject(existing);
          useEditorStore.getState().setSaveStatus('saved');
          hydrated.current = true;
          return;
        }
      }
      const latest = await projectApi.list();
      if (latest[0]) {
        useEditorStore.getState().setProject(latest[0]);
        useEditorStore.getState().setSaveStatus('saved');
      }
    } catch {
      useEditorStore.getState().setSaveStatus('error');
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    ensureFontsLoaded();
    if (shareToken) return;
    if (!usingRemoteApi) {
      useAuthStore.getState().setChecked(true);
      return;
    }
    void fetchMe().then((me) => useAuthStore.getState().setUser(me));
  }, [shareToken]);

  useEffect(() => {
    if (shareToken || !ready) return;
    hydrated.current = false;
    void hydrate();
  }, [shareToken, ready, user?.id, hydrate]);

  useEffect(() => {
    if (!shareToken || !usingRemoteApi) return;
    let cancelled = false;
    void (async () => {
      try {
        const shared = await fetchSharedPresentation(shareToken);
        if (cancelled) return;
        if (!shared) {
          setSharedState('missing');
          return;
        }
        const doc = shared.document;
        useEditorStore.getState().setProject({
          ...doc,
          id: createId('proj'),
          name: shared.name || doc.name || 'Shared presentation',
        });
        useCanvasUi.getState().setPresenting(true, 0);
        setSharedState('ready');
      } catch {
        if (!cancelled) setSharedState('missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  useEffect(() => {
    if (!usingRemoteApi || shareToken) return;
    const onLost = () => {
      hydrated.current = false;
      removeActiveProjectId();
      useEditorStore.getState().setProject(createProject());
      useAuthStore.getState().setUser(null);
    };
    window.addEventListener('nr:auth-lost', onLost);
    return () => window.removeEventListener('nr:auth-lost', onLost);
  }, [shareToken]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (!hydrated.current) return;
      if (state.project === previous.project) return;
      const store = useEditorStore.getState();
      store.setSaveStatus('saving');
      window.clearTimeout(saveTimer.current);
      saveTimer.pending = true;
      saveTimer.current = window.setTimeout(async () => {
        saveTimer.pending = false;
        try {
          await projectApi.save(useEditorStore.getState().project);
          useEditorStore.getState().setSaveStatus('saved');
        } catch {
          useEditorStore.getState().setSaveStatus('error');
        }
      }, AUTOSAVE_DELAY);
    });
    return () => {
      window.clearTimeout(saveTimer.current);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const flush = () => {
      if (!hydrated.current || !saveTimer.pending) return;
      window.clearTimeout(saveTimer.current);
      saveTimer.pending = false;
      const store = useEditorStore.getState();
      void projectApi.save(store.project).catch(() => store.setSaveStatus('error'));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (shareToken) {
    if (sharedState === 'loading') {
      return <ViewerMessage title="Loading presentation…" />;
    }
    if (sharedState === 'missing') {
      return (
        <ViewerMessage
          title="This share link is no longer available"
          subtitle="Ask the owner to create a new link."
        />
      );
    }
    if (!presenting) {
      return (
        <ViewerMessage
          title={sharedName}
          subtitle="View-only shared presentation"
          actions={
            <>
              <button
                type="button"
                className="auth-submit"
                onClick={() => useCanvasUi.getState().setPresenting(true, 0)}
              >
                ▶ Present again
              </button>
              <button
                type="button"
                className="auth-switch"
                onClick={() => {
                  window.location.search = '';
                }}
              >
                Sign in to edit
              </button>
            </>
          }
        />
      );
    }
    return (
      <div className="app-shell">
        <PresentMode />
      </div>
    );
  }

  if (usingRemoteApi && !checked) {
    return (
      <div className="auth-screen">
        <div className="auth-card viewer-card">
          <div className="auth-brand">
            <span className="brand-mark">NR</span> NR Presentation
          </div>
          <h1>Loading…</h1>
        </div>
      </div>
    );
  }

  if (usingRemoteApi && !user) {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <TopToolbar />
      <div className="app-body">
        <SlideRail />
        <main className="workspace">
          <SlideCanvas />
        </main>
        <RightPanel />
        <PropertiesSidebar />
      </div>
      <PresentMode />
      <FindOverlay />
      <ShortcutsOverlay />
    </div>
  );
}

function ViewerMessage({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="auth-screen">
      <div className="auth-card viewer-card">
        <div className="auth-brand">
          <span className="brand-mark">NR</span> NR Presentation
        </div>
        <h1>{title}</h1>
        {subtitle ? <p className="auth-sub">{subtitle}</p> : null}
        {actions ? <div className="viewer-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

const saveTimer = { current: 0 as number, pending: false };
