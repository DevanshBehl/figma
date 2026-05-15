'use client';

import { MousePointer2, Square, Circle, Frame } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { ToolType } from '@aether/types';

interface Tool {
  id:       ToolType;
  icon:     React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label:    string;
  shortcut: string;
}

const TOOLS: Tool[] = [
  { id: 'select', icon: MousePointer2, label: 'Select',    shortcut: 'V' },
  { id: 'frame',  icon: Frame,         label: 'Frame',     shortcut: 'F' },
  { id: 'rect',   icon: Square,        label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle,        label: 'Circle',    shortcut: 'C' },
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-px p-1 rounded-sm bg-[#1A1A1A] border border-[#2C2C2C]">
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            title={`${label}  ${shortcut}`}
            className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors duration-75"
            style={{
              background: isActive ? '#0099FF' : 'transparent',
              color:      isActive ? '#FFFFFF'  : '#8A8A8A',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#2C2C2C';
                e.currentTarget.style.color = '#EDEDED';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#8A8A8A';
              }
            }}
          >
            <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
          </button>
        );
      })}
    </div>
  );
}
