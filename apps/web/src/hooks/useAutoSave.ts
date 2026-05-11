'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';

const DEBOUNCE_MS = 2000;

/**
 * Watches the canvas element array and debounces saves to the backend.
 * Call once at the top of the component tree (e.g. page.tsx).
 */
export function useAutoSave(): void {
  const elements = useCanvasStore((s) => s.elements);
  const save     = useCanvasStore((s) => s.save);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't waste a round-trip on an empty canvas
    if (elements.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void save();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // `save` is stable (Zustand action references never change)
  }, [elements, save]);
}
