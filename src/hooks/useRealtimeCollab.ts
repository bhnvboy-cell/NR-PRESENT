import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvasUi, type CollaboratorPresence } from '../store/canvasUi';
import { useAuthStore } from '../store/authStore';
import type { Project } from '../types/editor';
import { createId } from '../utils/id';

const PEER_COLORS = ['#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];
const SESSION_PEER_ID = createId('peer');
const SESSION_COLOR = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];

type CollabMessage =
  | {
      kind: 'presence';
      peerId: string;
      name: string;
      color: string;
      slideIndex: number;
      x?: number;
      y?: number;
    }
  | {
      kind: 'project-sync';
      peerId: string;
      project: Project;
    }
  | {
      kind: 'leave';
      peerId: string;
    };

export function useRealtimeCollab(): void {
  const peerIdRef = useRef<string>(SESSION_PEER_ID);
  const colorRef = useRef<string>(SESSION_COLOR);
  const applyingRemoteRef = useRef<boolean>(false);
  const peersRef = useRef<Map<string, CollaboratorPresence>>(new Map());
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('nr-presentation-collab');
    const peerId = peerIdRef.current;
    const color = colorRef.current;
    const getName = () => {
      const email = useAuthStore.getState().user?.email;
      const base = email ? email.split('@')[0] : 'Collaborator';
      return `${base} #${peerId.slice(-3)}`;
    };

    const flushPeers = () => {
      const now = Date.now();
      const active: CollaboratorPresence[] = [];
      for (const [id, p] of peersRef.current.entries()) {
        if (now - p.updatedAt > 12000) {
          peersRef.current.delete(id);
        } else {
          active.push(p);
        }
      }
      useCanvasUi.getState().setCollaborators(active);
    };

    const sendPresence = (cursor?: { x: number; y: number }) => {
      const state = useEditorStore.getState();
      const msg: CollabMessage = {
        kind: 'presence',
        peerId,
        name: getName(),
        color,
        slideIndex: state.currentSlideIndex,
        x: cursor?.x,
        y: cursor?.y,
      };
      channel.postMessage(msg);
    };

    channel.onmessage = (event: MessageEvent<CollabMessage>) => {
      const msg = event.data;
      if (!msg || msg.peerId === peerId) return;

      if (msg.kind === 'presence') {
        const existing = peersRef.current.get(msg.peerId);
        peersRef.current.set(msg.peerId, {
          peerId: msg.peerId,
          name: msg.name,
          color: msg.color,
          slideIndex: msg.slideIndex,
          x: msg.x ?? existing?.x,
          y: msg.y ?? existing?.y,
          updatedAt: Date.now(),
        });
        flushPeers();
      } else if (msg.kind === 'leave') {
        peersRef.current.delete(msg.peerId);
        flushPeers();
      } else if (msg.kind === 'project-sync') {
        const currentId = useEditorStore.getState().project.id;
        if (msg.project.id === currentId) {
          applyingRemoteRef.current = true;
          useEditorStore.setState({ project: msg.project });
          applyingRemoteRef.current = false;
        }
      }
    };

    const onCursor = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (detail) sendPresence(detail);
    };
    window.addEventListener('nr:cursor-move', onCursor);

    const unsub = useEditorStore.subscribe((state, prev) => {
      if (state.currentSlideIndex !== prev.currentSlideIndex) {
        sendPresence();
      }
      if (state.project !== prev.project && !applyingRemoteRef.current) {
        const msg: CollabMessage = {
          kind: 'project-sync',
          peerId,
          project: state.project,
        };
        channel.postMessage(msg);
      }
    });

    sendPresence();
    const heartbeat = window.setInterval(() => {
      sendPresence();
      flushPeers();
    }, 3000);

    const onUnload = () => {
      channel.postMessage({ kind: 'leave', peerId } satisfies CollabMessage);
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener('nr:cursor-move', onCursor);
      window.removeEventListener('beforeunload', onUnload);
      unsub();
      channel.postMessage({ kind: 'leave', peerId } satisfies CollabMessage);
      channel.close();
    };
  }, [user?.email]);
}
