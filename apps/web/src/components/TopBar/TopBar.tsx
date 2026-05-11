'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Share2 } from 'lucide-react';
import { useCanvasStore, type SaveStatus } from '@/store/canvasStore';

// ─── Sync indicator ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SaveStatus,
  { dotColor: string; glow: string; label: string }
> = {
  idle:   { dotColor: 'rgba(255,255,255,0.18)', glow: 'none',              label: 'Auto-save'    },
  saving: { dotColor: '#60a5fa',                glow: '0 0 6px #60a5fa99', label: 'Saving…'      },
  saved:  { dotColor: '#34d399',                glow: '0 0 6px #34d39966', label: 'Saved'        },
  error:  { dotColor: '#f87171',                glow: '0 0 6px #f8717166', label: 'Sync error'   },
};

function formatTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function SyncIndicator() {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const lastSaved  = useCanvasStore((s) => s.lastSaved);
  const [timeStr, setTimeStr] = useState('');

  // Tick the relative time every 10 s
  useEffect(() => {
    if (!lastSaved) return;
    const update = () => setTimeStr(formatTimeAgo(lastSaved));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [lastSaved]);

  const { dotColor, glow, label } = STATUS_CONFIG[saveStatus];
  const displayLabel =
    saveStatus === 'saved' && timeStr ? `Saved ${timeStr}` : label;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full select-none"
      style={{
        background:           'rgba(255,255,255,0.05)',
        border:               '1px solid rgba(255,255,255,0.09)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Animated status dot */}
      <motion.span
        className="rounded-full flex-shrink-0"
        style={{ width: 6, height: 6, backgroundColor: dotColor, boxShadow: glow }}
        animate={
          saveStatus === 'saving'
            ? { opacity: [1, 0.35, 1], scale: [1, 1.2, 1] }
            : { opacity: 1, scale: 1 }
        }
        transition={
          saveStatus === 'saving'
            ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      />

      <span
        className="text-[10px] font-medium tabular-nums"
        style={{
          color:
            saveStatus === 'saving' ? '#93c5fd' :
            saveStatus === 'saved'  ? '#6ee7b7' :
            saveStatus === 'error'  ? '#fca5a5' :
            'rgba(255,255,255,0.28)',
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const elementCount = useCanvasStore((s) => s.elements.length);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute top-0 inset-x-0 h-12 z-30 flex items-center justify-between px-4"
      style={{
        background:           'rgba(3,7,18,0.85)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:         '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            boxShadow:  '0 0 12px rgba(99,102,241,0.4)',
          }}
        >
          <span className="text-white text-xs font-bold tracking-tight">A</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white/85">
          Aether
        </span>
      </div>

      {/* Center: file name + layer count */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Layers size={13} className="text-white/30" />
        <span className="text-xs text-white/40 font-medium">Untitled</span>
        <span
          className="text-xs px-1.5 py-0.5 rounded tabular-nums"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color:      'rgba(255,255,255,0.3)',
            border:     '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {elementCount} {elementCount === 1 ? 'layer' : 'layers'}
        </span>
      </div>

      {/* Right: sync pill + share button */}
      <div className="flex items-center gap-2">
        <SyncIndicator />

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'rgba(99,102,241,0.15)',
            color:      '#a5b4fc',
            border:     '1px solid rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
        >
          <Share2 size={12} />
          Share
        </button>
      </div>
    </motion.header>
  );
}
