import type { Project } from '../types/editor';
import { deepClone } from '../utils/clone';

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
  shared?: boolean;
}

/**
 * Persistence boundary for the editor. The local implementation keeps projects in
 * localStorage; swap in `RestProjectApi` once the .NET 10 backend is online —
 * the rest of the app only ever talks to this interface.
 */
export interface ProjectApi {
  list(): Promise<Project[]>;
  listMeta(): Promise<ProjectMeta[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<Project>;
  remove(id: string): Promise<void>;
}

const STORAGE_KEY = 'nr-presentation:projects';
const ACTIVE_KEY = 'nr-presentation:active-project';

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function removeActiveProjectId(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

function readAll(): Record<string, Project> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Project>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Project>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export class LocalProjectApi implements ProjectApi {
  async list(): Promise<Project[]> {
    const map = readAll();
    return Object.values(map).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listMeta(): Promise<ProjectMeta[]> {
    return (await this.list()).map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }));
  }

  async get(id: string): Promise<Project | null> {
    return deepClone(readAll()[id] ?? null);
  }

  async save(project: Project): Promise<Project> {
    const map = readAll();
    const stored: Project = { ...deepClone(project), updatedAt: new Date().toISOString() };
    map[project.id] = stored;
    writeAll(map);
    setActiveProjectId(project.id);
    return deepClone(stored);
  }

  async remove(id: string): Promise<void> {
    const map = readAll();
    delete map[id];
    writeAll(map);
    if (localStorage.getItem(ACTIVE_KEY) === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }
}

export const localProjectApi: ProjectApi = new LocalProjectApi();

function notifyAuthLost(): void {
  window.dispatchEvent(new CustomEvent('nr:auth-lost'));
}

async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, { credentials: 'include', ...init });
  if (response.status === 401) {
    notifyAuthLost();
    throw new Error('Not signed in');
  }
  return response;
}

/**
 * REST implementation of the same contract, backed by the .NET + PostgreSQL API.
 * Selected automatically when VITE_API_URL is present (e.g. .env.local).
 */
export class RestProjectApi implements ProjectApi {
  private readonly baseUrl: string;
  /** data-url → uploaded asset url, so an image is uploaded once per browser session. */
  private readonly uploadedAssets = new Map<string, string>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}${path}`;
  }

  async list(): Promise<Project[]> {
    const response = await authedFetch(this.url('/projects'), { method: 'GET' });
    if (!response.ok) throw new Error(`GET /projects failed (${response.status})`);
    return (await response.json()) as Project[];
  }

  async listMeta(): Promise<ProjectMeta[]> {
    const response = await authedFetch(this.url('/projects/meta'), { method: 'GET' });
    if (!response.ok) throw new Error(`GET /projects/meta failed (${response.status})`);
    return (await response.json()) as ProjectMeta[];
  }

  async get(id: string): Promise<Project | null> {
    const response = await authedFetch(this.url(`/projects/${encodeURIComponent(id)}`), { method: 'GET' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GET /projects/${id} failed (${response.status})`);
    return (await response.json()) as Project;
  }

  async save(project: Project): Promise<Project> {
    const uploadable = await this.extractAssets(project);
    const response = await authedFetch(this.url('/projects'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadable),
    });
    if (!response.ok) throw new Error(`POST /projects failed (${response.status})`);
    setActiveProjectId(project.id);
    return (await response.json()) as Project;
  }

  async remove(id: string): Promise<void> {
    const response = await authedFetch(this.url(`/projects/${encodeURIComponent(id)}`), { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
      throw new Error(`DELETE /projects/${id} failed (${response.status})`);
    }
  }

  /**
   * Replace inline data: image sources with server-hosted /api/assets/{id} URLs
   * before persisting, so the JSON body stays small and images survive reloads.
   */
  private async extractAssets(project: Project): Promise<Project> {
    const slides = await Promise.all(
      project.slides.map(async (slide) => {
        let slideChanged = false;
        const elements = await Promise.all(
          slide.elements.map(async (el) => {
            if (el.type !== 'image' || !el.src.startsWith('data:')) return el;
            let url = this.uploadedAssets.get(el.src);
            if (!url) {
              url = await this.uploadDataUrlAsset(el.src);
              this.uploadedAssets.set(el.src, url);
            }
            slideChanged = true;
            return { ...el, src: url };
          }),
        );
        return slideChanged ? { ...slide, elements } : slide;
      }),
    );
    return slides.every((s, i) => s === project.slides[i])
      ? project
      : { ...project, slides };
  }

  private async uploadDataUrlAsset(dataUrl: string): Promise<string> {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Malformed data URL');
    const meta = dataUrl.slice(5, comma);
    const mime = meta.split(';')[0] || 'image/png';
    const body = meta.includes(';base64')
      ? Uint8Array.from(atob(dataUrl.slice(comma + 1)), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(dataUrl.slice(comma + 1)));
    const response = await authedFetch(this.url('/assets'), {
      method: 'POST',
      headers: { 'Content-Type': mime },
      body,
    });
    if (!response.ok) throw new Error(`POST /assets failed (${response.status})`);
    return ((await response.json()) as { url: string }).url;
  }
}

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? undefined;

export const usingRemoteApi = Boolean(apiUrl);

export const projectApi: ProjectApi = apiUrl ? new RestProjectApi(apiUrl) : new LocalProjectApi();

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

// ---- share links (REST only) ----

export async function createShareLink(projectId: string): Promise<string> {
  if (!apiUrl) throw new Error('Sharing requires the cloud backend');
  const base = apiUrl.replace(/\/+$/, '');
  const response = await authedFetch(`${base}/projects/${encodeURIComponent(projectId)}/share`, { method: 'POST' });
  if (!response.ok) throw new Error('Could not create share link');
  return ((await response.json()) as { token: string }).token;
}

export async function revokeShareLink(projectId: string): Promise<void> {
  if (!apiUrl) throw new Error('Sharing requires the cloud backend');
  const base = apiUrl.replace(/\/+$/, '');
  const response = await authedFetch(`${base}/projects/${encodeURIComponent(projectId)}/share`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error('Could not revoke share link');
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/?view=${encodeURIComponent(token)}`;
}

/** Public read-only fetch — no auth required. */
export async function fetchSharedPresentation(token: string): Promise<{ name: string; document: Project } | null> {
  if (!apiUrl) return null;
  const base = apiUrl.replace(/\/+$/, '');
  const response = await fetch(`${base}/shared/${encodeURIComponent(token)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET /shared failed (${response.status})`);
  return (await response.json()) as { name: string; document: Project };
}
