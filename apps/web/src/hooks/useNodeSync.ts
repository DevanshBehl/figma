'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useCanvasStore } from '@/store/canvasStore';
import type { NodeUpdate, SceneNode } from '@aether/types';

const EMIT_THROTTLE_MS = 50; // ~20 fps for element updates

/**
 * Wires up real-time node delta sync over Socket.IO.
 *
 * Incoming `node-update` events from other clients are applied directly to the
 * store via `updateElement`.  Outgoing updates are throttled per-node and
 * include only the changed fields — never the full tree.
 */
export function useNodeSync() {
  const localUser     = useCanvasStore((s) => s.localUser);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const lastEmitRef   = useRef(new Map<string, number>());

  // Apply incoming deltas from other clients
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = ({ nodeId, changes, senderId }: NodeUpdate) => {
      if (senderId === localUser.id) return; // ignore own echoes
      updateElement(nodeId, changes as Partial<SceneNode>);
    };

    socket.on('node-update', handler);
    return () => { socket.off('node-update', handler); };
  }, [localUser.id, updateElement]);

  /** Throttled emit — call after `updateElement` for drag/resize paths. */
  const emitNodeUpdate = useCallback(
    (nodeId: string, changes: Partial<Omit<SceneNode, 'id' | 'children'>>) => {
      const now  = Date.now();
      const last = lastEmitRef.current.get(nodeId) ?? 0;
      if (now - last < EMIT_THROTTLE_MS) return;
      lastEmitRef.current.set(nodeId, now);

      const socket = getSocket();
      if (!socket?.connected) return;

      const payload: NodeUpdate = { nodeId, changes, senderId: localUser.id };
      socket.emit('node-update', payload);
    },
    [localUser.id],
  );

  return { emitNodeUpdate };
}
