'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasElement } from './CanvasElement';
import type { ToolType } from '@aether/types';

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  type: 'pan' | 'element';
  startMouseX: number;
  startMouseY: number;
  // pan
  startViewportX: number;
  startViewportY: number;
  // element
  elementId: string;
  startElementX: number;
  startElementY: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.001;

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Refs for use inside event listeners without stale closure issues
  const viewportRef = useRef(viewport);
  const isSpaceDownRef = useRef(false);
  const activeToolRef = useRef<ToolType>('select');
  const dragRef = useRef<Partial<DragState> | null>(null);
  const elementsRef = useRef(useCanvasStore.getState().elements);

  const {
    elements,
    activeTool,
    selectedElementId,
    addElement,
    updateElement,
    selectElement,
    setActiveTool,
  } = useCanvasStore();

  // Keep refs in sync with state
  useEffect(() => { viewportRef.current = viewport; }, [viewport]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Screen → canvas coordinate conversion
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const vp = viewportRef.current;
    return {
      x: (screenX - rect.left - vp.x) / vp.scale,
      y: (screenY - rect.top - vp.y) / vp.scale,
    };
  }, []);

  // Global mousemove + mouseup for smooth pan/drag even when cursor leaves canvas
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
        const dx = (e.clientX - drag.startMouseX!) / vp.scale;
        const dy = (e.clientY - drag.startMouseY!) / vp.scale;
        updateElement(drag.elementId, {
          x: drag.startElementX! + dx,
          y: drag.startElementY! + dy,
        });
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateElement]);

  // Spacebar + keyboard shortcuts
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

      if (e.code === 'Escape') {
        setActiveTool('select');
        selectElement(null);
      }

      if ((e.code === 'Backspace' || e.code === 'Delete') && useCanvasStore.getState().selectedElementId) {
        useCanvasStore.getState().removeElement(useCanvasStore.getState().selectedElementId!);
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
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectElement, setActiveTool]);

  // Pinch-to-zoom / cmd+wheel zoom
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

      // Smooth exponential zoom
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const factor = Math.exp(delta * 3);
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vp.scale * factor));

      setViewport({
        scale: newScale,
        x: mouseX - (mouseX - vp.x) * (newScale / vp.scale),
        y: mouseY - (mouseY - vp.y) * (newScale / vp.scale),
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSpaceDownRef.current) {
        dragRef.current = {
          type: 'pan',
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startViewportX: viewportRef.current.x,
          startViewportY: viewportRef.current.y,
        };
        setIsPanning(true);
        return;
      }

      const tool = activeToolRef.current;

      if (tool === 'rect') {
        const pos = screenToCanvas(e.clientX, e.clientY);
        addElement({
          id: crypto.randomUUID(),
          type: 'rect',
          x: pos.x - 50,
          y: pos.y - 50,
          width: 100,
          height: 100,
          fill: '#6366f1',
        });
        setActiveTool('select');
        return;
      }

      // Clicked empty canvas in select mode → deselect
      selectElement(null);
    },
    [screenToCanvas, addElement, selectElement, setActiveTool],
  );

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      // Let pan take over if space is held
      if (isSpaceDownRef.current) return;

      // Let rect tool place on top of elements too — don't intercept
      if (activeToolRef.current === 'rect') return;

      e.stopPropagation();
      selectElement(elementId);

      const element = elementsRef.current.find((el) => el.id === elementId);
      if (!element) return;

      dragRef.current = {
        type: 'element',
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startViewportX: 0,
        startViewportY: 0,
        elementId,
        startElementX: element.x,
        startElementY: element.y,
      };
    },
    [selectElement],
  );

  const cursor = isSpaceDown
    ? isPanning
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : activeTool === 'rect'
      ? 'cursor-crosshair'
      : 'cursor-default';

  // Dot-grid: modulo keeps dots stationary relative to canvas, not screen
  const dotSpacing = Math.max(20, 40 * viewport.scale);
  const dotOffsetX = ((viewport.x % dotSpacing) + dotSpacing) % dotSpacing;
  const dotOffsetY = ((viewport.y % dotSpacing) + dotSpacing) % dotSpacing;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${cursor}`}
      style={{ background: '#030712' }}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Dot grid background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          backgroundPosition: `${dotOffsetX}px ${dotOffsetY}px`,
        }}
      />

      {/* Canvas transform root */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          willChange: 'transform',
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

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <span className="text-xs text-white/30 font-mono tabular-nums">
          {Math.round(viewport.scale * 100)}%
        </span>
      </div>
    </div>
  );
}
