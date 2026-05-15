'use client';

import { useState, useEffect } from 'react';
import { Share2, Play, Check, Layers } from 'lucide-react';
import { useCanvasStore, type SaveStatus } from '@/store/canvasStore';
import { flattenTree } from '@/lib/layout';

// ─── Sync indicator ───────────────────────────────────────────────────────────

const DOT_COLORS: Record<SaveStatus, string> = {
  idle:   '#3A3A3A',
  saving: '#0099FF',
  saved:  '#22c55e',
  error:  '#ef4444',
};

const LABELS: Record<SaveStatus, string> = {
  idle:   'Auto-save',
  saving: 'Saving…',
  saved:  'Saved',
  error:  'Error',
};

function formatTimeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10)  return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function SyncIndicator() {
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const lastSaved  = useCanvasStore((s) => s.lastSaved);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (!lastSaved) return;
    const update = () => setTimeStr(formatTimeAgo(lastSaved));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [lastSaved]);

  const dot   = DOT_COLORS[saveStatus];
  const label = saveStatus === 'saved' && timeStr ? `Saved ${timeStr}` : LABELS[saveStatus];

  return (
    <div className="flex items-center gap-1.5 h-6 px-2 border border-[#2C2C2C] rounded-sm bg-[#111111]">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
      <span
        className="text-[10px] tabular-nums"
        style={{
          color: saveStatus === 'idle'   ? '#8A8A8A'
               : saveStatus === 'saving' ? '#0099FF'
               : saveStatus === 'error'  ? '#ef4444'
               : '#22c55e',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar({ onPlay }: { onPlay?: () => void }) {
  const elements     = useCanvasStore((s) => s.elements);
  const projectName  = useCanvasStore((s) => s.projectName);
  const elementCount = flattenTree(elements).length;
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  return (
    <header
      className="h-10 flex-shrink-0 flex items-center justify-between px-3 bg-[#1A1A1A] border-b border-[#2C2C2C]"
      style={{ zIndex: 30 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-sm bg-[#0099FF] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[9px] font-bold">A</span>
        </div>
        <span className="text-xs font-semibold text-[#EDEDED]">Aether</span>
      </div>

      {/* Center: project name + layer count */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Layers size={11} className="text-[#8A8A8A]" />
        <span className="text-xs text-[#8A8A8A]">{projectName || 'Untitled'}</span>
        <span
          className="text-[10px] px-1.5 py-px border border-[#2C2C2C] rounded-sm tabular-nums text-[#8A8A8A]"
        >
          {elementCount} {elementCount === 1 ? 'layer' : 'layers'}
        </span>
      </div>

      {/* Right: sync + play + share */}
      <div className="flex items-center gap-1.5">
        <SyncIndicator />

        {onPlay && (
          <button
            onClick={onPlay}
            title="Preview"
            className="h-6 w-6 flex items-center justify-center rounded-sm bg-[#111111] border border-[#2C2C2C] text-[#8A8A8A] hover:text-[#EDEDED] hover:border-[#0099FF] transition-colors duration-75"
          >
            <Play size={10} fill="currentColor" />
          </button>
        )}

        <button
          onClick={handleShare}
          className="h-6 flex items-center gap-1.5 px-2 rounded-sm bg-[#111111] border border-[#2C2C2C] text-[10px] transition-colors duration-75"
          style={{ color: shareCopied ? '#0099FF' : '#8A8A8A' }}
          onMouseEnter={(e) => { if (!shareCopied) e.currentTarget.style.color = '#EDEDED'; }}
          onMouseLeave={(e) => { if (!shareCopied) e.currentTarget.style.color = '#8A8A8A'; }}
        >
          {shareCopied ? <Check size={10} /> : <Share2 size={10} />}
          {shareCopied ? 'Copied' : 'Share'}
        </button>
      </div>
    </header>
  );
}
