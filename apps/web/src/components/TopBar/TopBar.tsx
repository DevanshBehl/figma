'use client';

import { motion } from 'framer-motion';
import { Layers, Share2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';

export function TopBar() {
  const elementCount = useCanvasStore((s) => s.elements.length);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute top-0 inset-x-0 h-12 z-30 flex items-center justify-between px-4"
      style={{
        background: 'rgba(3,7,18,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}
        >
          <span className="text-white text-xs font-bold tracking-tight">A</span>
        </div>
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          Aether
        </span>
      </div>

      {/* Center: file name */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Layers size={13} className="text-white/30" />
        <span className="text-xs text-white/40 font-medium">Untitled</span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {elementCount} {elementCount === 1 ? 'layer' : 'layers'}
        </span>
      </div>

      {/* Right: share button */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: 'rgba(99,102,241,0.15)',
          color: '#a5b4fc',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
        }}
      >
        <Share2 size={12} />
        Share
      </button>
    </motion.header>
  );
}
