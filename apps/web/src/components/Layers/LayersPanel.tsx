'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Square, Circle, Layers } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

export function LayersPanel() {
  const elements         = useCanvasStore((s) => s.elements);
  const selectedId       = useCanvasStore((s) => s.selectedElementId);
  const selectElement    = useCanvasStore((s) => s.selectElement);
  const removeElement    = useCanvasStore((s) => s.removeElement);

  // Top layer (last in array) displayed first
  const displayed = [...elements].reverse();

  return (
    <aside
      className="w-52 h-full flex-shrink-0 flex flex-col"
      style={{
        background:           'rgba(10, 10, 20, 0.7)',
        backdropFilter:       'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight:          '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="h-9 flex items-center px-3 gap-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Layers size={12} className="text-white/30" />
        <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Layers</span>
        {elements.length > 0 && (
          <span
            className="ml-auto text-[10px] tabular-nums px-1.5 py-px rounded"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color:      'rgba(255,255,255,0.25)',
              border:     '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {elements.length}
          </span>
        )}
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-1.5">
        <AnimatePresence initial={false}>
          {displayed.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-[11px] text-white/15 py-10"
            >
              No layers
            </motion.p>
          )}

          {displayed.map((el, i) => {
            const isSelected  = el.id === selectedId;
            const Icon        = el.type === 'rect' ? Square : Circle;
            const label       = el.type === 'rect' ? 'Rectangle' : 'Circle';
            const layerNumber = i + 1; // 1 = topmost

            return (
              <motion.div
                key={el.id}
                layout
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 32 }}
                exit={{ opacity: 0, x: -10, height: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="group relative flex items-center gap-2 px-2 mx-1.5 rounded-lg cursor-pointer overflow-hidden"
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.14)' : 'transparent',
                  border:     isSelected ? '1px solid rgba(99,102,241,0.22)' : '1px solid transparent',
                }}
                onClick={() => selectElement(isSelected ? null : el.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  removeElement(el.id);
                }}
              >
                {/* Color dot */}
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor: el.fill,
                    opacity: el.opacity,
                  }}
                />

                {/* Type icon */}
                <Icon
                  size={11}
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.3)' }}
                />

                {/* Label */}
                <span
                  className="flex-1 text-[11px] truncate transition-colors"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}
                >
                  {label} {layerNumber}
                </span>

                {/* Hover delete hint */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white/20 flex-shrink-0">
                  ⌫
                </span>

                {/* Selected accent line */}
                {isSelected && (
                  <motion.span
                    layoutId="layer-accent"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                    style={{ background: '#818cf8' }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div
        className="px-3 py-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-[9px] text-white/15">Right-click a layer to delete</p>
      </div>
    </aside>
  );
}
