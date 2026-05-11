'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';
import type { RemoteCursor } from '@aether/types';

interface Viewport {
  x:     number;
  y:     number;
  scale: number;
}

interface CursorPresenceProps {
  viewport: Viewport;
}

// Cursor arrow path — matches a standard OS pointer shape
const CURSOR_PATH = 'M3 1.5L14.5 9L9 10L6.5 17L3 1.5Z';

export function CursorPresence({ viewport }: CursorPresenceProps) {
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMove = (cursor: RemoteCursor) =>
      setCursors((prev) => ({ ...prev, [cursor.userId]: cursor }));

    const onLeave = (userId: string) =>
      setCursors((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });

    socket.on('cursor-move',  onMove);
    socket.on('cursor-leave', onLeave);

    return () => {
      socket.off('cursor-move',  onMove);
      socket.off('cursor-leave', onLeave);
    };
  }, []);

  return (
    // Fills the canvas container; pointer-events:none so it never blocks interactions
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none', overflow: 'visible', zIndex: 15 }}
    >
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => {
          // Convert canvas-space → screen-space (relative to canvas container)
          const sx = cursor.x * viewport.scale + viewport.x;
          const sy = cursor.y * viewport.scale + viewport.y;

          return (
            <motion.div
              key={cursor.userId}
              className="absolute top-0 left-0"
              // Framer Motion animates x/y with a tight spring for smooth following
              initial={{ opacity: 0, x: sx, y: sy }}
              animate={{ opacity: 1, x: sx, y: sy }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{
                x:       { type: 'spring', stiffness: 800, damping: 50, mass: 0.5 },
                y:       { type: 'spring', stiffness: 800, damping: 50, mass: 0.5 },
                opacity: { duration: 0.15 },
              }}
            >
              {/* Cursor SVG */}
              <svg
                width="18"
                height="20"
                viewBox="0 0 18 20"
                fill="none"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              >
                <path
                  d={CURSOR_PATH}
                  fill={cursor.color}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Name badge */}
              <div
                className="absolute top-[14px] left-[12px] whitespace-nowrap rounded-full px-2 py-0.5 text-white"
                style={{
                  fontSize:        '10px',
                  fontWeight:      600,
                  lineHeight:      '16px',
                  backgroundColor: cursor.color,
                  boxShadow:       `0 2px 8px ${cursor.color}55`,
                }}
              >
                {cursor.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
