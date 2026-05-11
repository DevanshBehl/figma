export interface SceneNode {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  opacity: number;
}

export type ToolType = 'select' | 'rect' | 'circle';
