'use client';

import type { SceneNode } from '@aether/types';

interface CanvasElementProps {
  element: SceneNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function CanvasElement({ element, isSelected, onMouseDown }: CanvasElementProps) {
  const { x, y, width, height, fill, type } = element;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: fill,
        borderRadius: type === 'circle' ? '50%' : '6px',
        cursor: 'move',
        outline: isSelected ? '2px solid #818cf8' : 'none',
        outlineOffset: '2px',
        boxShadow: isSelected
          ? '0 0 0 1px rgba(129, 140, 248, 0.25), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'outline 80ms ease, box-shadow 80ms ease',
      }}
      onMouseDown={onMouseDown}
    />
  );
}
