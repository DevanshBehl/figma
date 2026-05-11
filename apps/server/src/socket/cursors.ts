import type { Server } from 'socket.io';
import type { RemoteCursor, UserJoinPayload } from '@aether/types';

export function registerCursorHandlers(io: Server): void {
  // socketId → userId — used to broadcast "cursor-leave" on unexpected disconnect
  const socketToUser = new Map<string, string>();

  io.on('connection', (socket) => {
    // Client announces itself on connect
    socket.on('user-join', (user: UserJoinPayload) => {
      socketToUser.set(socket.id, user.userId);
    });

    // Relay cursor position to every OTHER client in the session
    socket.on('cursor-move', (cursor: RemoteCursor) => {
      socket.broadcast.emit('cursor-move', cursor);
    });

    // Explicit leave (e.g., mouse leaves the canvas window)
    socket.on('cursor-leave', (userId: string) => {
      socket.broadcast.emit('cursor-leave', userId);
    });

    // Handle tab close / network drop
    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        socket.broadcast.emit('cursor-leave', userId);
        socketToUser.delete(socket.id);
      }
    });
  });
}
