'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { SceneNode } from '@aether/types';

// ─── Recursive presenter node ─────────────────────────────────────────────────

interface PreviewNodeProps {
  node:       SceneNode;
  onInteract: (targetId: string) => void;
}

function PreviewNode({ node, onInteract }: PreviewNodeProps) {
  const isCircle = node.type === 'circle';
  const isFrame  = node.type === 'frame';

  return (
    <div
      style={{
        position:      'absolute',
        left:          node.x,
        top:           node.y,
        width:         node.width,
        height:        node.height,
        background:    node.fill,
        opacity:       node.opacity,
        borderRadius:  isCircle ? '50%' : isFrame ? 0 : 3,
        overflow:      isFrame ? 'hidden' : undefined,
        cursor:        node.linkTo ? 'pointer' : 'default',
        outline:       node.linkTo ? '1.5px solid #0099FF' : undefined,
        outlineOffset: node.linkTo ? 2 : undefined,
      }}
      onClick={(e) => {
        if (node.linkTo) { e.stopPropagation(); onInteract(node.linkTo); }
      }}
    >
      {node.children?.map((child) => (
        <PreviewNode key={child.id} node={child} onInteract={onInteract} />
      ))}
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

interface PreviewOverlayProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function PreviewOverlay({ isOpen, onClose }: PreviewOverlayProps) {
  const elements    = useCanvasStore((s) => s.elements);
  const projectName = useCanvasStore((s) => s.projectName);

  const frames = elements.filter((n) => n.type === 'frame');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen)  setActiveId(frames[0]?.id ?? null);
    if (!isOpen) setActiveId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const active = frames.find((f) => f.id === activeId) ?? frames[0] ?? null;

  const handleInteract = useCallback(
    (targetId: string) => {
      if (frames.some((f) => f.id === targetId)) setActiveId(targetId);
    },
    [frames],
  );

  const vw    = typeof window !== 'undefined' ? window.innerWidth  : 1280;
  const vh    = typeof window !== 'undefined' ? window.innerHeight : 800;
  const scale = active
    ? Math.min((vw - 160) / active.width, (vh - 160) / active.height, 1)
    : 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="preview-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.075 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0E0E0E]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-10 flex-shrink-0 bg-[#1A1A1A] border-b border-[#2C2C2C]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#0099FF]/10 border border-[#0099FF]/25">
                <Play size={9} fill="#0099FF" className="text-[#0099FF]" />
                <span className="text-[10px] font-semibold text-[#0099FF]">Preview</span>
              </div>
              {projectName && (
                <span className="text-[11px] text-[#8A8A8A]">{projectName}</span>
              )}
            </div>

            {/* Frame tabs */}
            <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {frames.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setActiveId(f.id)}
                  className="text-[10px] px-2.5 py-1 rounded-sm transition-colors duration-75"
                  style={{
                    background: f.id === activeId ? '#0099FF'    : '#111111',
                    border:     f.id === activeId ? '1px solid #0099FF' : '1px solid #2C2C2C',
                    color:      f.id === activeId ? '#FFFFFF'     : '#8A8A8A',
                  }}
                >
                  Screen {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-sm text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#2C2C2C] transition-colors duration-75"
            >
              <X size={14} />
            </button>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.075 }}
                  style={{
                    width:     active.width  * scale,
                    height:    active.height * scale,
                    overflow:  'hidden',
                    position:  'relative',
                    boxShadow: '0 0 0 1px #2C2C2C, 0 32px 80px rgba(0,0,0,0.6)',
                  }}
                >
                  <div
                    style={{
                      width:           active.width,
                      height:          active.height,
                      transform:       `scale(${scale})`,
                      transformOrigin: '0 0',
                      position:        'relative',
                      background:      active.fill.startsWith('rgba') ? '#111111' : active.fill,
                    }}
                  >
                    {active.children?.map((child) => (
                      <PreviewNode key={child.id} node={child} onInteract={handleInteract} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-[#8A8A8A] text-xs">No frames to preview</p>
                  <p className="text-[#8A8A8A] text-[10px] mt-1 opacity-50">
                    Add frames with the Frame tool (F) to use preview mode.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center h-8 flex-shrink-0 border-t border-[#2C2C2C]">
            <span className="text-[10px] text-[#8A8A8A] opacity-40">
              Blue-outlined elements are interactive · Esc to close
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
