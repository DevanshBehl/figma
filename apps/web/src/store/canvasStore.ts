import { create } from 'zustand';
import type { SceneNode, ToolType } from '@aether/types';

interface CanvasState {
  elements: SceneNode[];
  selectedElementId: string | null;
  activeTool: ToolType;

  addElement: (element: SceneNode) => void;
  updateElement: (id: string, update: Partial<SceneNode>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: [],
  selectedElementId: null,
  activeTool: 'select',

  addElement: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),

  updateElement: (id, update) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...update } : el,
      ),
    })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId:
        state.selectedElementId === id ? null : state.selectedElementId,
    })),

  selectElement: (id) => set({ selectedElementId: id }),

  setActiveTool: (tool) => set({ activeTool: tool }),
}));
