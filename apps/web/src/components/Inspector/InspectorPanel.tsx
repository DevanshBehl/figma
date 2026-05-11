'use client';

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { SceneNode } from '@aether/types';

// ─── NumberInput ──────────────────────────────────────────────────────────────
// Local state tracks the raw string while editing; syncs from store while
// not focused so canvas drag updates are reflected instantly.

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  onChange: (v: number) => void;
}

function NumberInput({ label, value, min, max, step = 1, precision = 1, onChange }: NumberInputProps) {
  const [local, setLocal] = useState(value.toFixed(precision));
  const [focused, setFocused] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!focused) setLocal(value.toFixed(precision));
  }, [value, focused, precision]);

  const commit = (raw: string) => {
    let n = parseFloat(raw);
    if (isNaN(n)) return;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(n);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        value={local}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/80
                   focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-colors
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                   [&::-webkit-inner-spin-button]:appearance-none"
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setLocal(e.target.value);
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) {
            let clamped = n;
            if (min !== undefined) clamped = Math.max(min, clamped);
            if (max !== undefined) clamped = Math.min(max, clamped);
            onChange(clamped);
          }
        }}
        onBlur={() => { setFocused(false); commit(local); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter')  commit(local);
          if (e.key === 'Escape') { setFocused(false); setLocal(value.toFixed(precision)); }
        }}
      />
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3">
      <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px mx-3" style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

// ─── Element inspector ────────────────────────────────────────────────────────

function ElementInspector({ element }: { element: SceneNode }) {
  const updateElement = useCanvasStore((s) => s.updateElement);
  const [hexLocal, setHexLocal] = useState(element.fill);

  useEffect(() => { setHexLocal(element.fill); }, [element.fill]);

  const update = (partial: Partial<SceneNode>) => updateElement(element.id, partial);

  return (
    <div>
      {/* Position */}
      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" value={element.x}      onChange={(v) => update({ x: v })}      precision={1} />
          <NumberInput label="Y" value={element.y}      onChange={(v) => update({ y: v })}      precision={1} />
        </div>
      </Section>

      <Divider />

      {/* Size */}
      <Section title="Size">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="W" value={element.width}  onChange={(v) => update({ width: v })}  precision={1} min={1} />
          <NumberInput label="H" value={element.height} onChange={(v) => update({ height: v })} precision={1} min={1} />
        </div>
      </Section>

      <Divider />

      {/* Fill */}
      <Section title="Fill">
        <div className="flex items-center gap-2">
          {/* Swatch / native color picker */}
          <label className="relative flex-shrink-0 cursor-pointer group">
            <div
              className="w-8 h-8 rounded-lg border border-white/15 shadow-inner ring-1 ring-inset ring-white/5"
              style={{ backgroundColor: element.fill }}
            />
            <input
              type="color"
              value={element.fill}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => { setHexLocal(e.target.value); update({ fill: e.target.value }); }}
            />
          </label>

          {/* Hex text input */}
          <input
            type="text"
            value={hexLocal}
            maxLength={7}
            placeholder="#000000"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/80
                       font-mono uppercase focus:outline-none focus:border-indigo-500/50 transition-colors"
            onChange={(e) => {
              setHexLocal(e.target.value);
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) update({ fill: e.target.value });
            }}
            onBlur={() => setHexLocal(element.fill)}
          />
        </div>
      </Section>

      <Divider />

      {/* Opacity */}
      <Section title="Opacity">
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(element.opacity * 100)}
            onChange={(e) => update({ opacity: parseInt(e.target.value) / 100 })}
            className="flex-1 h-1 accent-indigo-500 cursor-pointer"
          />
          <div className="relative w-14 flex-shrink-0">
            <NumberInput
              label=""
              value={Math.round(element.opacity * 100)}
              onChange={(v) => update({ opacity: Math.min(100, Math.max(0, v)) / 100 })}
              min={0}
              max={100}
              precision={0}
            />
            <span className="absolute right-2 top-1/2 translate-y-px text-[9px] text-white/30 pointer-events-none">%</span>
          </div>
        </div>
      </Section>

      <Divider />

      {/* Type badge */}
      <div className="px-3 py-3 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Type</span>
        <span
          className="text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize"
          style={{
            background: element.type === 'rect'
              ? 'rgba(99,102,241,0.15)'
              : 'rgba(236,72,153,0.15)',
            color: element.type === 'rect' ? '#a5b4fc' : '#f9a8d4',
            border: `1px solid ${element.type === 'rect' ? 'rgba(99,102,241,0.3)' : 'rgba(236,72,153,0.3)'}`,
          }}
        >
          {element.type}
        </span>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function InspectorPanel() {
  const selectedElementId = useCanvasStore((s) => s.selectedElementId);
  const elements          = useCanvasStore((s) => s.elements);
  const selected          = elements.find((el) => el.id === selectedElementId) ?? null;

  return (
    <aside
      className="w-60 h-full flex-shrink-0 flex flex-col"
      style={{
        background:           'rgba(10, 10, 20, 0.7)',
        backdropFilter:       'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft:           '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="h-9 flex items-center px-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Inspect</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              <ElementInspector element={selected} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col items-center justify-center gap-3 py-16"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <MousePointer size={16} className="text-white/20" />
              </div>
              <p className="text-[11px] text-white/20 text-center leading-relaxed px-4">
                Select an element<br />to inspect its properties
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
