'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SceneNode } from '@aether/types';

type HandlePos = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l';

interface HandleConfig {
  xFactor: number;
  yFactor: number;
  wFactor: number;
  hFactor: number;
  cursor:  string;
}

const HANDLE_CONFIGS: Record<HandlePos, HandleConfig> = {
  tl: { xFactor: 1, yFactor: 1, wFactor: -1, hFactor: -1, cursor: 'nwse-resize' },
  t:  { xFactor: 0, yFactor: 1, wFactor:  0, hFactor: -1, cursor: 'ns-resize'   },
  tr: { xFactor: 0, yFactor: 1, wFactor:  1, hFactor: -1, cursor: 'nesw-resize' },
  r:  { xFactor: 0, yFactor: 0, wFactor:  1, hFactor:  0, cursor: 'ew-resize'   },
  br: { xFactor: 0, yFactor: 0, wFactor:  1, hFactor:  1, cursor: 'nwse-resize' },
  b:  { xFactor: 0, yFactor: 0, wFactor:  0, hFactor:  1, cursor: 'ns-resize'   },
  bl: { xFactor: 1, yFactor: 0, wFactor: -1, hFactor:  1, cursor: 'nesw-resize' },
  l:  { xFactor: 1, yFactor: 0, wFactor: -1, hFactor:  0, cursor: 'ew-resize'   },
};

const HANDLE_ORDER: HandlePos[] = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];
const HANDLE_SIZE = 6;
const MIN_DIM     = 10;

interface Viewport { x: number; y: number; scale: number; }

interface ResizeDrag {
  handle:      HandlePos;
  startMouseX: number;
  startMouseY: number;
  startX:      number;
  startY:      number;
  startW:      number;
  startH:      number;
}

interface TransformerProps {
  element:     SceneNode;
  viewport:    Viewport;
  isSpaceDown: boolean;
  absX:        number;
  absY:        number;
  onResize:    (id: string, update: Partial<Pick<SceneNode, 'x' | 'y' | 'width' | 'height'>>) => void;
}

export function Transformer({ element, viewport, isSpaceDown, absX, absY, onResize }: TransformerProps) {
  const resizeDragRef = useRef<ResizeDrag | null>(null);
  const viewportRef   = useRef(viewport);
  const onResizeRef   = useRef(onResize);
  const elementIdRef  = useRef(element.id);
  useEffect(() => { viewportRef.current  = viewport;    }, [viewport]);
  useEffect(() => { onResizeRef.current  = onResize;    }, [onResize]);
  useEffect(() => { elementIdRef.current = element.id;  }, [element.id]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const state = resizeDragRef.current;
      if (!state) return;
      const vp  = viewportRef.current;
      const cfg = HANDLE_CONFIGS[state.handle];
      const dx  = (e.clientX - state.startMouseX) / vp.scale;
      const dy  = (e.clientY - state.startMouseY) / vp.scale;
      let newX = state.startX + cfg.xFactor * dx;
      let newY = state.startY + cfg.yFactor * dy;
      let newW = state.startW + cfg.wFactor * dx;
      let newH = state.startH + cfg.hFactor * dy;
      if (newW < MIN_DIM) { if (cfg.xFactor !== 0) newX = state.startX + state.startW - MIN_DIM; newW = MIN_DIM; }
      if (newH < MIN_DIM) { if (cfg.yFactor !== 0) newY = state.startY + state.startH - MIN_DIM; newH = MIN_DIM; }
      onResizeRef.current(elementIdRef.current, { x: newX, y: newY, width: newW, height: newH });
    };
    const onMouseUp = () => { resizeDragRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  const sx = absX * viewport.scale + viewport.x;
  const sy = absY * viewport.scale + viewport.y;
  const sw = Math.max(1, element.width  * viewport.scale);
  const sh = Math.max(1, element.height * viewport.scale);

  const handleCenter = (pos: HandlePos): { x: number; y: number } => {
    const mx = sx + sw / 2;
    const my = sy + sh / 2;
    switch (pos) {
      case 'tl': return { x: sx,      y: sy      };
      case 't':  return { x: mx,      y: sy      };
      case 'tr': return { x: sx + sw, y: sy      };
      case 'r':  return { x: sx + sw, y: my      };
      case 'br': return { x: sx + sw, y: sy + sh };
      case 'b':  return { x: mx,      y: sy + sh };
      case 'bl': return { x: sx,      y: sy + sh };
      case 'l':  return { x: sx,      y: my      };
    }
  };

  const startResize = (e: React.MouseEvent, handle: HandlePos) => {
    if (isSpaceDown) return;
    e.stopPropagation();
    e.preventDefault();
    resizeDragRef.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: element.x,
      startY: element.y,
      startW: element.width,
      startH: element.height,
    };
  };

  return (
    <motion.svg
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.06 }}
    >
      {/* Selection bounding box */}
      <rect
        x={sx + 0.5}
        y={sy + 0.5}
        width={Math.max(0, sw - 1)}
        height={Math.max(0, sh - 1)}
        fill="none"
        stroke="#0099FF"
        strokeWidth={1}
      />

      {/* Corner + edge handles */}
      {HANDLE_ORDER.map((pos) => {
        const { x, y } = handleCenter(pos);
        const cfg = HANDLE_CONFIGS[pos];
        return (
          <rect
            key={pos}
            x={x - HANDLE_SIZE / 2}
            y={y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            rx={1}
            fill="#1A1A1A"
            stroke="#0099FF"
            strokeWidth={1}
            style={{
              cursor:        isSpaceDown ? 'grab' : cfg.cursor,
              pointerEvents: isSpaceDown ? 'none' : 'all',
            }}
            onMouseDown={(e) => startResize(e, pos)}
          />
        );
      })}
    </motion.svg>
  );
}
