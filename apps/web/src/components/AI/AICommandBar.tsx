'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, AlertCircle, Wand2 } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { SceneNode } from '@aether/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SUGGESTIONS = [
  'dashboard layout',
  'hero section',
  'pricing card',
  'mobile login form',
  'data visualisation',
  'onboarding screen',
];

// ─── Spinning accent border (branding) ───────────────────────────────────────

function SpinningBorder() {
  return (
    <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none">
      <motion.div
        className="absolute"
        style={{
          inset:      '-100%',
          background: 'conic-gradient(from 0deg, transparent 0%, #0099FF 20%, #06b6d4 40%, #6366f1 60%, transparent 80%)',
          opacity:    0.8,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AICommandBar() {
  const [open,    setOpen]    = useState(false);
  const [prompt,  setPrompt]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addElement = useCanvasStore((s) => s.addElement);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'j')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    } else {
      setPrompt('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/ai/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json() as { nodes?: Omit<SceneNode, 'id'>[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      if (!data.nodes?.length) throw new Error('AI returned no elements');
      data.nodes.forEach((node) => addElement({ ...node, id: crypto.randomUUID() }));
      setPrompt('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Trigger button ───────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-medium z-20 border border-[#2C2C2C] bg-[#1A1A1A] text-[#8A8A8A] hover:text-[#EDEDED] hover:border-[#0099FF] transition-colors duration-75"
      >
        <Wand2 className="w-3 h-3 text-[#0099FF]" />
        AI Generate
        <span className="hidden sm:inline text-[9px] text-[#8A8A8A] border border-[#2C2C2C] px-1 py-px rounded-sm font-mono ml-0.5">
          ⌘K
        </span>
      </button>

      {/* ── Overlay + command bar ────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.075 }}
              className="absolute inset-0 z-30 bg-[#0E0E0E]/60"
              onClick={() => setOpen(false)}
            />

            {/* Bar */}
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.075, ease: 'easeOut' }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[560px] max-w-[92vw] z-40"
            >
              {/* 1px border wrapper (spinning gradient when loading) */}
              <div className="relative rounded-sm" style={{ padding: '1px', background: loading ? 'transparent' : '#2C2C2C' }}>
                {loading && <SpinningBorder />}

                <div className="relative rounded-sm overflow-hidden z-10 bg-[#1A1A1A]">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 pt-3.5 pb-3 border-b border-[#2C2C2C]">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: loading ? '#0099FF' : '#2C2C2C' }}
                    />
                    <span className="text-[11px] font-semibold text-[#EDEDED]">
                      {loading ? 'Generating…' : 'AI Architect'}
                    </span>
                    <span className="text-[10px] text-[#8A8A8A] ml-0.5">Powered by MiniMax</span>
                    <button
                      onClick={() => setOpen(false)}
                      className="ml-auto text-[#8A8A8A] hover:text-[#EDEDED] transition-colors duration-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Input row */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${loading ? 'text-[#0099FF]' : 'text-[#8A8A8A]'}`} />
                    <input
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                      disabled={loading}
                      placeholder='Describe a UI layout… e.g. "a pricing card with 3 tiers"'
                      className="flex-1 bg-transparent text-xs text-[#EDEDED] placeholder-[#8A8A8A] outline-none disabled:opacity-50 min-w-0"
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || loading}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm bg-[#0099FF] text-white hover:bg-[#0088EE] disabled:opacity-30 transition-colors duration-75"
                    >
                      {loading
                        ? <motion.div
                            className="w-3 h-3 border border-white/60 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          />
                        : <Send className="w-3 h-3" />
                      }
                    </button>
                  </div>

                  {/* Loading progress */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-1">
                          {[2, 3, 1.5, 2.5, 1].map((flex, i) => (
                            <motion.div
                              key={i}
                              className="h-0.5 rounded-full bg-[#0099FF]"
                              style={{ flex }}
                              animate={{ opacity: [0.2, 0.9, 0.2] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-[#8A8A8A] mt-2">Composing layout…</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Suggestion chips */}
                  <AnimatePresence>
                    {!loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.075 }}
                        className="px-4 pb-3 flex flex-wrap gap-1.5"
                      >
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setPrompt(s); inputRef.current?.focus(); }}
                            className="px-2 py-0.5 rounded-sm text-[10px] text-[#8A8A8A] hover:text-[#EDEDED] border border-[#2C2C2C] hover:border-[#8A8A8A] bg-[#111111] transition-colors duration-75"
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Error toast ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.075, ease: 'easeOut' }}
            className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3 py-2 rounded-sm border border-[#ef4444]/30 bg-[#1A1A1A] max-w-[440px]"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
            <span className="text-[11px] text-[#ef4444] truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-1 text-[#ef4444]/50 hover:text-[#ef4444] transition-colors duration-75">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
