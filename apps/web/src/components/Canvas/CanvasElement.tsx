'use client';

import type { SceneNode } from '@aether/types';

interface CanvasElementProps {
  element:     SceneNode;
  isSelected:  boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  children?:   React.ReactNode;
}

export function CanvasElement({ element, isSelected, onMouseDown, children }: CanvasElementProps) {
  const { x, y, width, height, fill, type, opacity } = element;
  const isFrame  = type === 'frame';
  const isCircle = type === 'circle';

  return (
    <div
      style={{
        position:        'absolute',
        left:            x,
        top:             y,
        width,
        height,
        backgroundColor: isFrame ? (fill || 'rgba(255,255,255,0.02)') : fill,
        opacity:         opacity ?? 1,
        borderRadius:    isCircle ? '50%' : '3px',
        overflow:        isFrame ? 'hidden' : 'visible',
        border:          isFrame
          ? `1px dashed ${isSelected ? '#0099FF' : '#3A3A3A'}`
          : 'none',
        cursor:          'move',
        outline:         !isFrame && isSelected ? '1.5px solid #0099FF' : 'none',
        outlineOffset:   '1px',
        boxShadow:       isSelected && !isFrame
          ? '0 0 0 1px rgba(0,153,255,0.15)'
          : 'none',
        transition: 'outline 60ms ease, border-color 60ms ease',
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}
