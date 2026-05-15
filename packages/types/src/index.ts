// ─── Canvas primitives ────────────────────────────────────────────────────────

export interface SceneNode {
  id:      string;
  type:    'rect' | 'circle' | 'frame';
  x:       number;
  y:       number;
  width:   number;
  height:  number;
  fill:    string;
  opacity: number;
  // Tree structure
  parentId?: string;
  children?: SceneNode[];
  // Auto-layout (applicable when type === 'frame')
  layoutMode?: 'none' | 'flex-row' | 'flex-col';
  gap?:        number;
  padding?:    number;
  // Prototyping — click interaction links this node to a target frame id
  linkTo?: string;
}

export type ToolType = 'select' | 'rect' | 'circle' | 'frame';

// Real-time node delta (WebSocket optimization — send only what changed)
export interface NodeUpdate {
  nodeId:   string;
  changes:  Partial<Omit<SceneNode, 'id' | 'children'>>;
  senderId: string;
}

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
