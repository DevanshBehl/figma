import { create } from 'zustand';
import type { SceneNode, ToolType, AuthUser } from '@aether/types';
import {
  findNode,
  updateNodeInTree,
  removeNodeFromTree,
  reparentNode,
  calculateAutoLayout,
} from '@/lib/layout';

// ─── Local-user helpers ───────────────────────────────────────────────────────

const CURSOR_COLORS = [
  '#f43f5e', '#a855f7', '#6366f1', '#3b82f6',
  '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
];

const GUEST_NAMES = [
  'Wave', 'Zephyr', 'Nova', 'Pixel',
  'Flux', 'Pulse', 'Drift', 'Echo',
];

interface LocalUser {
  id:    string;
  color: string;
  name:  string;
}

function makeLocalUser(): LocalUser {
  const color = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  const name  = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
  const id    = typeof crypto !== 'undefined'
    ? crypto.randomUUID().slice(0, 8)
    : String(Math.random()).slice(2, 10);
  return { id, color, name };
}

// ─── Store types ──────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CanvasState {
  // Canvas scene — root-level nodes; children are embedded in SceneNode.children
  elements:          SceneNode[];
  selectedElementId: string | null;
  activeTool:        ToolType;

  // Persistence
  projectId:   string | null;
  projectName: string;
  saveStatus:  SaveStatus;
  lastSaved:   Date | null;

  // Auth
  authUser:  AuthUser | null;

  // Presence
  localUser: LocalUser;

  // ── Scene mutations (all tree-aware, no direct mutation) ──────────────────
  addElement:       (element: SceneNode) => void;
  updateElement:    (id: string, update: Partial<SceneNode>) => void;
  removeElement:    (id: string) => void;
  selectElement:    (id: string | null) => void;
  setActiveTool:    (tool: ToolType) => void;
  setAuthUser:      (user: AuthUser | null) => void;
  setProjectName:   (name: string) => void;

  // ── Tree operations ───────────────────────────────────────────────────────
  reparentElement:  (nodeId: string, newParentId: string | null) => void;
  applyAutoLayout:  (frameId: string) => void;

  // ── Persistence ───────────────────────────────────────────────────────────
  save:        () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const API_URL =
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    : 'http://localhost:3001';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements:          [],
  selectedElementId: null,
  activeTool:        'select',
  projectId:         null,
  projectName:       'Untitled Project',
  saveStatus:        'idle',
  lastSaved:         null,
  authUser:          null,
  localUser:         makeLocalUser(),

  // ── Scene mutations ──────────────────────────────────────────────────────

  addElement: (element) =>
    set((s) => ({ elements: [...s.elements, element] })),

  updateElement: (id, update) =>
    set((s) => ({
      elements: updateNodeInTree(s.elements, id, (n) => ({ ...n, ...update })),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements:          removeNodeFromTree(s.elements, id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    })),

  selectElement:  (id)   => set({ selectedElementId: id }),
  setActiveTool:  (tool) => set({ activeTool: tool }),
  setAuthUser:    (user) => set({ authUser: user }),
  setProjectName: (name) => set({ projectName: name }),

  // ── Tree operations ──────────────────────────────────────────────────────

  reparentElement: (nodeId, newParentId) =>
    set((s) => ({ elements: reparentNode(s.elements, nodeId, newParentId) })),

  applyAutoLayout: (frameId) =>
    set((s) => ({
      elements: updateNodeInTree(s.elements, frameId, calculateAutoLayout),
    })),

  // ── Persistence ──────────────────────────────────────────────────────────

  save: async () => {
    const { elements, projectId, projectName, authUser } = get();
    if (elements.length === 0) return;

    set({ saveStatus: 'saving' });

    try {
      let id = projectId;

      if (id) {
        const res = await fetch(`${API_URL}/api/projects/${id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ nodes: elements }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const res = await fetch(`${API_URL}/api/projects`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:  projectName,
            nodes: elements,
            user:  authUser ?? undefined,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { id: string };
        id = data.id;
        set({ projectId: id });
      }

      set({ saveStatus: 'saved', lastSaved: new Date() });
    } catch (err) {
      console.error('[aether] auto-save failed:', err);
      set({ saveStatus: 'error' });
    }
  },

  loadProject: async (id: string) => {
    try {
      const res  = await fetch(`${API_URL}/api/projects/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { nodes: SceneNode[]; name: string };
      set({ projectId: id, elements: data.nodes, projectName: data.name });
    } catch (err) {
      console.error('[aether] failed to load project:', err);
    }
  },
}));

// ─── Stable selectors (use these to avoid re-renders) ────────────────────────

export const selectFindNode = (id: string | null) =>
  (s: CanvasState): SceneNode | null =>
    id ? findNode(s.elements, id) ?? null : null;
