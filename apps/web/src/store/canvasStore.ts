import { create } from 'zustand';
import type { SceneNode, ToolType } from '@aether/types';

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
  // Short UUID prefix — readable in the cursor badge
  const id    = typeof crypto !== 'undefined'
    ? crypto.randomUUID().slice(0, 8)
    : String(Math.random()).slice(2, 10);
  return { id, color, name };
}

// ─── Store types ──────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CanvasState {
  // Canvas scene
  elements:          SceneNode[];
  selectedElementId: string | null;
  activeTool:        ToolType;

  // Persistence
  projectId:  string | null;
  saveStatus: SaveStatus;
  lastSaved:  Date | null;

  // Presence
  localUser:  LocalUser;

  // Actions
  addElement:    (element: SceneNode) => void;
  updateElement: (id: string, update: Partial<SceneNode>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;

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
  saveStatus:        'idle',
  lastSaved:         null,
  localUser:         makeLocalUser(),

  // ── Scene mutations ──────────────────────────────────────────────────────

  addElement: (element) =>
    set((s) => ({ elements: [...s.elements, element] })),

  updateElement: (id, update) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...update } : el)),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements:          s.elements.filter((el) => el.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    })),

  selectElement: (id) => set({ selectedElementId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Persistence ──────────────────────────────────────────────────────────

  save: async () => {
    const { elements, projectId } = get();
    if (elements.length === 0) return;

    set({ saveStatus: 'saving' });

    try {
      let id = projectId;

      if (id) {
        // Update existing project
        const res = await fetch(`${API_URL}/api/projects/${id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ nodes: elements }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        // Create new project
        const res = await fetch(`${API_URL}/api/projects`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name: 'Untitled', nodes: elements }),
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
      const data = (await res.json()) as { nodes: SceneNode[] };
      set({ projectId: id, elements: data.nodes });
    } catch (err) {
      console.error('[aether] failed to load project:', err);
    }
  },
}));
