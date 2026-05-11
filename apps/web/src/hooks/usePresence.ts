'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useCanvasStore } from '@/store/canvasStore';
import type { RemoteCursor } from '@aether/types';

/** ~30 fps cursor throttle */
const EMIT_THROTTLE_MS = 33;

/**
 * Connects this client to the Socket.IO presence room and returns a
 * stable `emitCursor` function that can be called from mouse handlers.
 *
 * @param screenToCanvas - coordinate conversion from the canvas engine
 */
export function usePresence(
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number },
) {
  const localUser   = useCanvasStore((s) => s.localUser);
  const lastEmitRef = useRef(0);

  // Connect once; disconnect on unmount
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.connect();
    socket.emit('user-join', localUser);

    return () => {
      socket.emit('cursor-leave', localUser.id);
      socket.disconnect();
    };
    // Intentionally empty deps — run once.  localUser is stable (store init value).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Call from onMouseMove on the canvas container.
   * Converts screen → canvas coordinates and emits at ≤30 fps.
   */
  const emitCursor = useCallback(
    (screenX: number, screenY: number) => {
      const now = Date.now();
      if (now - lastEmitRef.current < EMIT_THROTTLE_MS) return;
      lastEmitRef.current = now;

      const socket = getSocket();
      if (!socket?.connected) return;

      const pos = screenToCanvas(screenX, screenY);
      const payload: RemoteCursor = {
        userId: localUser.id,
        name:   localUser.name,
        color:  localUser.color,
        x:      pos.x,
        y:      pos.y,
      };
      socket.emit('cursor-move', payload);
    },
    // screenToCanvas reference changes when viewport changes, which is fine —
    // useCallback re-creates with the fresh closure.
    [localUser, screenToCanvas],
  );

  /** Broadcast that this user's cursor left the canvas (mouse left window). */
  const clearCursor = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) socket.emit('cursor-leave', localUser.id);
  }, [localUser.id]);

  return { emitCursor, clearCursor };
}
