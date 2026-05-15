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

const spring = { type: 'spring' as const, stiffness: 420, damping: 32 };

// ─── Rotating conic-gradient border ──────────────────────────────────────────

function SpinningBorder() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <motion.div
        className="absolute"
        style={{
          inset: '-100%',
          background:
            'conic-gradient(from 0deg, transparent 0%, #6366f1 20%, #8b5cf6 40%, #06b6d4 60%, transparent 80%)',
          opacity: 0.9,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AICommandBar() {
  const [open, setOpen]     = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addElement = useCanvasStore((s) => s.addElement);

  // ── Keyboard shortcut ────────────────────────────────────────────────────
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

  // ── Focus / reset on open ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      setPrompt('');
      setError(null);
    }
  }, [open]);

  // ── Auto-dismiss error ───────────────────────────────────────────────────
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ── Submit ───────────────────────────────────────────────────────────────
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

      data.nodes.forEach((node) => {
        addElement({ ...node, id: crypto.randomUUID() });
      });

      setPrompt('');
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI generation failed, please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white transition-colors z-20 border border-white/10 hover:border-indigo-500/40"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)' }}
      >
        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
        AI Generate
        <span className="hidden sm:flex items-center gap-0.5 ml-0.5 px-1.5 py-0.5 rounded text-[9px] text-white/25 border border-white/10 font-mono">
          ⌘K
        </span>
      </motion.button>

      {/* ── Overlay + command bar ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-30"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Bar */}
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 18, scale: 0.96 }}
              transition={spring}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[580px] max-w-[92vw] z-40"
            >
              {/* Border wrapper — 1 px padding reveals the spinning gradient */}
              <div
                className="relative rounded-2xl"
                style={{
                  padding: '1px',
                  background: loading ? 'transparent' : 'rgba(255,255,255,0.09)',
                }}
              >
                {loading && <SpinningBorder />}

                {/* Glass card */}
                <div
                  className="relative rounded-2xl overflow-hidden z-10"
                  style={{ background: 'rgba(8,8,20,0.94)', backdropFilter: 'blur(28px)' }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-white/[0.06]">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: loading ? '#6366f1' : 'rgba(99,102,241,0.6)' }}
                      animate={loading ? { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs font-bold text-white/80">
                      {loading ? 'Generating…' : 'AI Architect'}
                    </span>
                    <span className="text-[10px] text-white/25 ml-0.5">Powered by MiniMax</span>
                    <button
                      onClick={() => setOpen(false)}
                      className="ml-auto p-0.5 text-white/25 hover:text-white/60 transition-colors rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Input row */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={loading ? { rotate: [0, 15, -15, 0] } : {}}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Sparkles className={`w-4 h-4 shrink-0 ${loading ? 'text-indigo-400' : 'text-white/25'}`} />
                      </motion.div>

                      <input
                        ref={inputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                        disabled={loading}
                        placeholder='Describe a UI layout… e.g. "a pricing card with 3 tiers"'
                        className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/20 outline-none disabled:opacity-50 min-w-0"
                      />

                      <motion.button
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || loading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        {loading
                          ? <motion.div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full"
                              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                          : <Send className="w-3.5 h-3.5 text-white" />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Loading progress bars */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-4 overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5">
                          {[2, 3, 1.5, 2.5, 1].map((flex, i) => (
                            <motion.div
                              key={i}
                              className="h-[3px] rounded-full"
                              style={{
                                flex,
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
                              }}
                              animate={{ opacity: [0.2, 0.9, 0.2] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-white/25 mt-2">
                          Composing layout…
                        </p>
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
                        className="px-5 pb-4 flex flex-wrap gap-2"
                      >
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setPrompt(s); inputRef.current?.focus(); }}
                            className="px-2.5 py-1 rounded-full text-[10px] text-white/35 hover:text-white/65 border border-white/8 hover:border-white/15 transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
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

      {/* ── Canvas shimmer overlay while loading ──────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-25"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)' }}
          >
            <motion.div
              className="absolute inset-x-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)' }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 8,  scale: 0.97 }}
            transition={spring}
            className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 max-w-[440px]"
            style={{ background: 'rgba(20,4,4,0.92)', backdropFilter: 'blur(16px)', whiteSpace: 'nowrap' }}
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300 truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-1 text-red-400/50 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
