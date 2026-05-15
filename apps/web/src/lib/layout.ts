import type { SceneNode } from '@aether/types';

// ─── Tree traversal ───────────────────────────────────────────────────────────

/** Find a node at any depth by ID. */
export function findNode(nodes: SceneNode[], id: string): SceneNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const hit = findNode(node.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** Return a new tree with the matching node replaced by `updater(node)`. */
export function updateNodeInTree(
  nodes: SceneNode[],
  id: string,
  updater: (n: SceneNode) => SceneNode,
): SceneNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children?.length) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
}

/** Return a new tree with the node (and its subtree) removed. */
export function removeNodeFromTree(nodes: SceneNode[], id: string): SceneNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children?.length
        ? { ...n, children: removeNodeFromTree(n.children, id) }
        : n,
    );
}

/** Flatten the entire tree into a single array (depth-first). */
export function flattenTree(nodes: SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];
  function walk(arr: SceneNode[]) {
    for (const n of arr) {
      result.push(n);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/**
 * Walk the tree and sum all ancestor x/y offsets to get the absolute
 * canvas position of a node's top-left corner.
 */
export function getAbsolutePosition(
  nodes: SceneNode[],
  id: string,
): { x: number; y: number } {
  function walk(
    arr: SceneNode[],
    targetId: string,
    offX: number,
    offY: number,
  ): { x: number; y: number } | null {
    for (const n of arr) {
      if (n.id === targetId) return { x: offX + n.x, y: offY + n.y };
      if (n.children?.length) {
        const found = walk(n.children, targetId, offX + n.x, offY + n.y);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(nodes, id, 0, 0) ?? { x: 0, y: 0 };
}

// ─── Reparenting ──────────────────────────────────────────────────────────────

/**
 * Move `nodeId` to a new parent, correcting coordinates so the node
 * stays at the same absolute canvas position.
 * Pass `newParentId = null` to move to the root level.
 */
export function reparentNode(
  nodes: SceneNode[],
  nodeId: string,
  newParentId: string | null,
): SceneNode[] {
  const node = findNode(nodes, nodeId);
  if (!node) return nodes;

  // Guard: prevent reparenting a frame into one of its own descendants
  if (newParentId && findNode(node.children ?? [], newParentId)) return nodes;

  const oldAbs = getAbsolutePosition(nodes, nodeId);
  const newParentAbs = newParentId
    ? getAbsolutePosition(nodes, newParentId)
    : { x: 0, y: 0 };

  const repositioned: SceneNode = {
    ...node,
    x:        oldAbs.x - newParentAbs.x,
    y:        oldAbs.y - newParentAbs.y,
    parentId: newParentId ?? undefined,
  };

  let tree = removeNodeFromTree(nodes, nodeId);

  if (!newParentId) {
    return [...tree, repositioned];
  }

  return updateNodeInTree(tree, newParentId, (parent) => ({
    ...parent,
    children: [...(parent.children ?? []), repositioned],
  }));
}

// ─── Auto-layout ──────────────────────────────────────────────────────────────

/**
 * Recalculate child positions for a frame that has auto-layout enabled.
 * Returns a new frame node with updated child coordinates.
 */
export function calculateAutoLayout(frame: SceneNode): SceneNode {
  if (!frame.children?.length || !frame.layoutMode || frame.layoutMode === 'none') {
    return frame;
  }

  const padding = frame.padding ?? 0;
  const gap     = frame.gap     ?? 0;
  const isRow   = frame.layoutMode === 'flex-row';

  let cursor = padding;
  const updatedChildren = frame.children.map((child) => {
    const placed: SceneNode = {
      ...child,
      x: isRow ? cursor  : padding,
      y: isRow ? padding : cursor,
    };
    cursor += (isRow ? child.width : child.height) + gap;
    return placed;
  });

  return { ...frame, children: updatedChildren };
}
