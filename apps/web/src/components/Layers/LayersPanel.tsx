'use client';

import { useState, useCallback } from 'react';
import { Square, Circle, Frame, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { flattenTree } from '@/lib/layout';
import type { SceneNode } from '@aether/types';

// ─── Layer row (recursive) ────────────────────────────────────────────────────

interface LayerRowProps {
  node:         SceneNode;
  depth:        number;
  selectedId:   string | null;
  collapsed:    Set<string>;
  draggingId:   string | null;
  dropTargetId: string | null;
  onSelect:     (id: string | null) => void;
  onDelete:     (id: string) => void;
  onToggle:     (id: string) => void;
  onDragStart:  (id: string) => void;
  onDragEnd:    () => void;
  onDragOver:   (e: React.DragEvent, id: string) => void;
  onDrop:       (e: React.DragEvent, targetNode: SceneNode) => void;
}

function LayerRow({
  node, depth, selectedId, collapsed,
  draggingId, dropTargetId,
  onSelect, onDelete, onToggle,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: LayerRowProps) {
  const isSelected  = node.id === selectedId;
  const isFrame     = node.type === 'frame';
  const isCollapsed = collapsed.has(node.id);
  const isDragOver  = dropTargetId === node.id;
  const hasChildren = isFrame && (node.children?.length ?? 0) > 0;

  const Icon  = isFrame ? Frame : node.type === 'circle' ? Circle : Square;
  const label = isFrame ? 'Frame' : node.type === 'circle' ? 'Circle' : 'Rectangle';

  const childProps = {
    selectedId, collapsed, draggingId, dropTargetId,
    onSelect, onDelete, onToggle, onDragStart, onDragEnd, onDragOver, onDrop,
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(node.id); }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDrop={(e) => onDrop(e, node)}
        className="group relative flex items-center gap-1 cursor-pointer select-none"
        style={{
          height:      24,
          paddingLeft:  depth * 12 + 6,
          paddingRight: 6,
          background:  isSelected  ? 'rgba(0,153,255,0.12)'
                     : isDragOver  ? 'rgba(0,153,255,0.06)'
                     : 'transparent',
          borderLeft:  isSelected ? '2px solid #0099FF' : '2px solid transparent',
          opacity:     draggingId === node.id ? 0.3 : 1,
        }}
        onClick={() => onSelect(isSelected ? null : node.id)}
        onContextMenu={(e) => { e.preventDefault(); onDelete(node.id); }}
      >
        {/* Chevron for frames */}
        {isFrame ? (
          <button
            className="flex-shrink-0 w-3 h-3 flex items-center justify-center"
            style={{ color: '#8A8A8A' }}
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
            <ChevronRight
              size={9}
              strokeWidth={2}
              style={{
                transform:  hasChildren && !isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 75ms ease',
                color:      isSelected ? '#EDEDED' : '#8A8A8A',
              }}
            />
          </button>
        ) : (
          <span className="flex-shrink-0 w-3" />
        )}

        {/* Color swatch */}
        <span
          className="w-2 h-2 flex-shrink-0"
          style={{
            backgroundColor: node.type === 'frame' ? 'transparent' : node.fill,
            border:          node.type === 'frame' ? '1px solid #3A3A3A' : 'none',
            opacity:         node.opacity,
            borderRadius:    node.type === 'circle' ? '50%' : 1,
          }}
        />

        {/* Icon */}
        <Icon
          size={10}
          strokeWidth={1.5}
          className="flex-shrink-0"
          style={{ color: isSelected ? '#0099FF' : '#8A8A8A' }}
        />

        {/* Label */}
        <span
          className="flex-1 text-[11px] truncate ml-1"
          style={{ color: isSelected ? '#EDEDED' : '#8A8A8A' }}
        >
          {label}
        </span>

        {/* Collapsed child count */}
        {isFrame && isCollapsed && (node.children?.length ?? 0) > 0 && (
          <span className="text-[9px] px-1 text-[#8A8A8A] flex-shrink-0">
            {node.children!.length}
          </span>
        )}

        {/* Delete hint */}
        <span className="opacity-0 group-hover:opacity-100 text-[9px] text-[#8A8A8A] flex-shrink-0 transition-opacity duration-75">
          ⌫
        </span>
      </div>

      {/* Children (frame, not collapsed) */}
      {hasChildren && !isCollapsed && (
        <div>
          {node.children!.map((child) => (
            <LayerRow key={child.id} node={child} depth={depth + 1} {...childProps} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function LayersPanel() {
  const elements        = useCanvasStore((s) => s.elements);
  const selectedId      = useCanvasStore((s) => s.selectedElementId);
  const selectElement   = useCanvasStore((s) => s.selectElement);
  const removeElement   = useCanvasStore((s) => s.removeElement);
  const reparentElement = useCanvasStore((s) => s.reparentElement);

  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const [draggingId,   setDraggingId]   = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const totalCount = flattenTree(elements).length;
  const displayed  = [...elements].reverse();

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetNode: SceneNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === targetNode.id) return;
    reparentElement(draggingId, targetNode.type === 'frame' ? targetNode.id : null);
    setDraggingId(null);
    setDropTargetId(null);
  }, [draggingId, reparentElement]);

  const handleRootDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId) {
      reparentElement(draggingId, null);
      setDraggingId(null);
      setDropTargetId(null);
    }
  }, [draggingId, reparentElement]);

  const rowProps = {
    selectedId, collapsed, draggingId, dropTargetId,
    onSelect:    selectElement,
    onDelete:    removeElement,
    onToggle:    toggleCollapse,
    onDragStart: setDraggingId,
    onDragEnd:   () => { setDraggingId(null); setDropTargetId(null); },
    onDragOver:  handleDragOver,
    onDrop:      handleDrop,
  };

  return (
    <aside className="w-52 h-full flex-shrink-0 flex flex-col bg-[#1A1A1A] border-r border-[#2C2C2C]">
      {/* Header */}
      <div className="h-8 flex items-center px-3 gap-2 flex-shrink-0 border-b border-[#2C2C2C]">
        <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-widest">Layers</span>
        {totalCount > 0 && (
          <span className="ml-auto text-[10px] tabular-nums text-[#8A8A8A]">{totalCount}</span>
        )}
      </div>

      {/* Layer tree */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain py-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleRootDrop}
      >
        {displayed.length === 0 ? (
          <p className="text-center text-[11px] text-[#8A8A8A] py-8 opacity-40">No layers</p>
        ) : (
          displayed.map((el) => (
            <LayerRow key={el.id} node={el} depth={0} {...rowProps} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex-shrink-0 border-t border-[#2C2C2C]">
        <p className="text-[10px] text-[#8A8A8A] opacity-40">Right-click to delete · Drag to reparent</p>
      </div>
    </aside>
  );
}
