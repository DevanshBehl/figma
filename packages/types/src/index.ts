// ─── Canvas primitives ────────────────────────────────────────────────────────

export interface SceneNode {
  id:      string;
  type:    'rect' | 'circle';
  x:       number;
  y:       number;
  width:   number;
  height:  number;
  fill:    string;
  opacity: number;
}

export type ToolType = 'select' | 'rect' | 'circle';

// ─── API ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string;
  name:  string;
  image?: string;
}

export interface SaveProjectPayload {
  name:  string;
  nodes: SceneNode[];
  user:  AuthUser;
}

export interface UpdateProjectPayload {
  nodes: SceneNode[];
}

export interface ProjectResponse {
  id:           string;
  name:         string;
  nodes:        SceneNode[];
  thumbnailUrl: string | null;
  userId:       string | null;
  createdAt:    string;
  updatedAt:    string;
}

// ─── Real-time presence ───────────────────────────────────────────────────────

export interface RemoteCursor {
  userId: string;
  name:   string;
  color:  string;
  x:      number;  // canvas-space coordinate
  y:      number;  // canvas-space coordinate
}

export interface UserJoinPayload {
  userId: string;
  name:   string;
  color:  string;
}
