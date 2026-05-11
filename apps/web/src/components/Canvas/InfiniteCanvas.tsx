'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasElement } from './CanvasElement';
import { Transformer } from './Transformer';
import { CursorPresence } from '@/components/Cursors/CursorPresence';
import { usePresence } from '@/hooks/usePresence';
import type { ToolType } from '@aether/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  type: 'pan' | 'element';
  startMouseX: number;
  startMouseY: number;
  startViewportX: number;
  startViewportY: number;
  elementId: string;
  startElementX: number;
  startElementY: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.001;

// ─── Component ────────────────────────────────────────────────────────────────

export function InfiniteCanvas() {
  // containerRef = the overflow:hidden canvas div (mouse events, wheel, getBCR for coord math)
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Refs for event handlers — avoid stale closures without re-registering listeners
  const viewportRef     = useRef(viewport);
  const isSpaceDownRef  = useRef(false);
  const activeToolRef   = useRef<ToolType>('select');
  const dragRef         = useRef<Partial<DragState> | null>(null);
  const elementsRef     = useRef(useCanvasStore.getState().elements);

  const {
    elements,
    activeTool,
    selectedElementId,
    addElement,
    updateElement,
    selectElement,
    setActiveTool,
  } = useCanvasStore();

  // Sync refs
  useEffect(() => { viewportRef.current    = viewport;  }, [viewport]);
  useEffect(() => { elementsRef.current    = elements;  }, [elements]);
  useEffect(() => { activeToolRef.current  = activeTool; }, [activeTool]);

  // Derived: selected element object (re-computed each render, always fresh)
  const selectedElement = selectedElementId
    ? elements.find((el) => el.id === selectedElementId) ?? null
    : null;

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const vp = viewportRef.current;
    return {
      x: (screenX - rect.left  - vp.x) / vp.scale,
      y: (screenY - rect.top - vp.y) / vp.scale,
    };
  }, []);

  // ── Global mouse events (smooth drag even when cursor leaves canvas) ────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag?.type) return;

      if (drag.type === 'pan') {
        setViewport({
          scale: viewportRef.current.scale,
          x: drag.startViewportX! + (e.clientX - drag.startMouseX!),
          y: drag.startViewportY! + (e.clientY - drag.startMouseY!),
        });
      } else if (drag.type === 'element' && drag.elementId) {
        const vp = viewportRef.current;
        updateElement(drag.elementId, {
          x: drag.startElementX! + (e.clientX - drag.startMouseX!) / vp.scale,
          y: drag.startElementY! + (e.clientY - drag.startMouseY!) / vp.scale,
        });
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [updateElement]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
        isSpaceDownRef.current = true;
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

      if (e.code === 'KeyV') setActiveTool('select');
      if (e.code === 'KeyR') setActiveTool('rect');
      if (e.code === 'KeyC') setActiveTool('circle');

      if (e.code === 'Escape') {
        setActiveTool('select');
        selectElement(null);
      }

      if (e.code === 'Backspace' || e.code === 'Delete') {
        const id = useCanvasStore.getState().selectedElementId;
        if (id) useCanvasStore.getState().removeElement(id);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        isSpaceDownRef.current = false;
        if (dragRef.current?.type === 'pan') {
          dragRef.current = null;
          setIsPanning(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, [selectElement, setActiveTool]);

  // ── Cmd+scroll zoom ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const vp = viewportRef.current;

      const factor    = Math.exp(-e.deltaY * ZOOM_SENSITIVITY * 3);
      const newScale  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vp.scale * factor));

      setViewport({
        scale: newScale,
        x: mouseX - (mouseX - vp.x) * (newScale / vp.scale),
        y: mouseY - (mouseY - vp.y) * (newScale / vp.scale),
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Canvas mouse down (pan / place shape / deselect) ───────────────────────
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSpaceDownRef.current) {
        dragRef.current = {
          type: 'pan',
          startMouseX:    e.clientX,
          startMouseY:    e.clientY,
          startViewportX: viewportRef.current.x,
          startViewportY: viewportRef.current.y,
        } as Partial<DragState>;
        setIsPanning(true);
        return;
      }

      const tool = activeToolRef.current;

      if (tool === 'rect' || tool === 'circle') {
        const pos = screenToCanvas(e.clientX, e.clientY);
        addElement({
          id:      crypto.randomUUID(),
          type:    tool,
          x:       pos.x - 50,
          y:       pos.y - 50,
          width:   100,
          height:  100,
          fill:    tool === 'rect' ? '#6366f1' : '#ec4899',
          opacity: 1,
        });
        setActiveTool('select');
        return;
      }

      selectElement(null);
    },
    [screenToCanvas, addElement, selectElement, setActiveTool],
  );

  // ── Element mouse down (select + drag) ──────────────────────────────────────
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (isSpaceDownRef.current) return;
      const tool = activeToolRef.current;
      if (tool === 'rect' || tool === 'circle') return; // let canvas place shape

      e.stopPropagation();
      selectElement(elementId);

      const element = elementsRef.current.find((el) => el.id === elementId);
      if (!element) return;

      dragRef.current = {
        type:           'element',
        startMouseX:    e.clientX,
        startMouseY:    e.clientY,
        startViewportX: 0,
        startViewportY: 0,
        elementId,
        startElementX:  element.x,
        startElementY:  element.y,
      };
    },
    [selectElement],
  );

  // ── Real-time presence ──────────────────────────────────────────────────────
  const { emitCursor, clearCursor } = usePresence(screenToCanvas);

  // ── Cursor ──────────────────────────────────────────────────────────────────
  const cursor =
    isSpaceDown
      ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
      : activeTool === 'rect' || activeTool === 'circle'
        ? 'cursor-crosshair'
        : 'cursor-default';

  // ── Dot grid (modulo keeps dots fixed in canvas space) ─────────────────────
  const dotSpacing = Math.max(20, 40 * viewport.scale);
  const dotOffX    = ((viewport.x % dotSpacing) + dotSpacing) % dotSpacing;
  const dotOffY    = ((viewport.y % dotSpacing) + dotSpacing) % dotSpacing;

  return (
    // Outer wrapper: no overflow restriction — Transformer SVG can overflow edge
    <div className="relative w-full h-full">

      {/* ── Inner canvas: clips elements, owns mouse/wheel events ── */}
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden select-none ${cursor}`}
        style={{ background: '#030712' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => emitCursor(e.clientX, e.clientY)}
        onMouseLeave={clearCursor}
      >
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:  `radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)`,
            backgroundSize:   `${dotSpacing}px ${dotSpacing}px`,
            backgroundPosition: `${dotOffX}px ${dotOffY}px`,
          }}
        />

        {/* Canvas transform root */}
        <div
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            transformOrigin: '0 0',
            transform:       `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            willChange:      'transform',
          }}
        >
          {elements.map((el) => (
            <CanvasElement
              key={el.id}
              element={el}
              isSelected={el.id === selectedElementId}
              onMouseDown={(e) => handleElementMouseDown(e, el.id)}
            />
          ))}
        </div>

        {/* Zoom % badge */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <span className="text-xs text-white/25 font-mono tabular-nums">
            {Math.round(viewport.scale * 100)}%
          </span>
        </div>
      </div>

      {/* ── Transformer: outside overflow:hidden so handles never clip ── */}
      <AnimatePresence>
        {selectedElement && (
          <Transformer
            key={selectedElement.id}
            element={selectedElement}
            viewport={viewport}
            isSpaceDown={isSpaceDown}
            onResize={(id, update) => updateElement(id, update)}
          />
        )}
      </AnimatePresence>

      {/* ── Remote cursors (canvas-space → screen-space, pointer-events:none) ── */}
      <CursorPresence viewport={viewport} />
    </div>
  );
}
