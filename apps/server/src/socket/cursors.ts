import type { Server } from 'socket.io';
import type { RemoteCursor, UserJoinPayload, NodeUpdate } from '@aether/types';

export function registerCursorHandlers(io: Server): void {
  const socketToUser = new Map<string, string>();

  io.on('connection', (socket) => {
    socket.on('user-join', (user: UserJoinPayload) => {
      socketToUser.set(socket.id, user.userId);
    });

    socket.on('cursor-move', (cursor: RemoteCursor) => {
      socket.broadcast.emit('cursor-move', cursor);
    });

    socket.on('cursor-leave', (userId: string) => {
      socket.broadcast.emit('cursor-leave', userId);
    });

    // Real-time node delta — relay only the changed fields, not the full tree.
    // Receiving clients apply the patch; the REST auto-save is ground truth for persistence.
    socket.on('node-update', (payload: NodeUpdate) => {
      socket.broadcast.emit('node-update', payload);
    });

    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        socket.broadcast.emit('cursor-leave', userId);
        socketToUser.delete(socket.id);
      }
      socketToUser.delete(socket.id);
    });
  });
}
