// Browser-only — only import from 'use client' files.
// Evaluated server-side during SSR, but getSocket() returns null there.
import type { Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!_socket) {
    // Lazy require keeps socket.io-client out of the SSR bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { io } = require('socket.io-client') as typeof import('socket.io-client');
    _socket = io(API_URL, {
      autoConnect:  false,
      transports:   ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
  }

  return _socket;
}
