'use client';

import { MousePointer2, Square, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import type { ToolType } from '@aether/types';

interface Tool {
  id: ToolType;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  shortcut: string;
}

const TOOLS: Tool[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-1.5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => {
        const isActive = activeTool === id;
        return (
          <motion.button
            key={id}
            onClick={() => setActiveTool(id)}
            title={`${label} (${shortcut})`}
            whileTap={{ scale: 0.92 }}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-100"
            style={{
              background: isActive
                ? 'rgba(99, 102, 241, 0.25)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(99, 102, 241, 0.5)'
                : '1px solid transparent',
              color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              }
            }}
          >
            <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />

            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="toolbar-active-dot"
                className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400"
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
