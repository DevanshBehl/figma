'use client';

import { useState, useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MousePointer, Copy, Download, Link2, Check } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { findNode, flattenTree } from '@/lib/layout';
import { exportNodeAsSvg, nodeToTailwind } from '@/lib/export';
import type { SceneNode } from '@aether/types';

// ─── NumberInput ──────────────────────────────────────────────────────────────

interface NumberInputProps {
  label:     string;
  value:     number;
  min?:      number;
  max?:      number;
  step?:     number;
  precision?: number;
  onChange:  (v: number) => void;
}

function NumberInput({ label, value, min, max, step = 1, precision = 1, onChange }: NumberInputProps) {
  const [local,   setLocal]   = useState(value.toFixed(precision));
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
      {label && (
        <label htmlFor={id} className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        step={step}
        value={local}
        className="w-full bg-[#111111] rounded-sm px-2 py-1 text-[11px] text-[#EDEDED]
                   border border-transparent focus:outline-none focus:border-[#0099FF] transition-colors duration-75
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

// ─── Section & Divider ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5">
      {title && (
        <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-widest mb-2">{title}</p>
      )}
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#2C2C2C]" />;
}

// ─── Export actions ───────────────────────────────────────────────────────────

function ActionsSection({ element }: { element: SceneNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopyTailwind = () => {
    navigator.clipboard.writeText(nodeToTailwind(element)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Section title="Export">
      <div className="flex gap-1.5">
        <button
          onClick={handleCopyTailwind}
          className="flex-1 flex items-center justify-center gap-1 h-6 rounded-sm text-[10px] font-medium border transition-colors duration-75"
          style={{
            background: copied ? 'rgba(34,197,94,0.08)' : '#111111',
            border:     copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid #2C2C2C',
            color:      copied ? '#22c55e' : '#8A8A8A',
          }}
        >
          {copied ? <Check size={9} /> : <Copy size={9} />}
          {copied ? 'Copied' : 'Tailwind'}
        </button>
        <button
          onClick={() => exportNodeAsSvg(element)}
          className="flex-1 flex items-center justify-center gap-1 h-6 rounded-sm text-[10px] font-medium bg-[#111111] border border-[#2C2C2C] text-[#8A8A8A] hover:text-[#EDEDED] hover:border-[#8A8A8A] transition-colors duration-75"
        >
          <Download size={9} />
          SVG
        </button>
      </div>
    </Section>
  );
}

// ─── Prototype / interactions ─────────────────────────────────────────────────

function PrototypeSection({ element }: { element: SceneNode }) {
  const elements      = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const frames = flattenTree(elements).filter(
    (n) => n.type === 'frame' && n.id !== element.id,
  );

  return (
    <Section title="Prototype">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <Link2 size={9} className="text-[#8A8A8A] flex-shrink-0" />
          <span className="text-[10px] text-[#8A8A8A]">On click → Navigate to</span>
        </div>
        <select
          value={element.linkTo ?? ''}
          onChange={(e) => updateElement(element.id, { linkTo: e.target.value || undefined })}
          className="w-full bg-[#111111] border border-transparent focus:border-[#0099FF] rounded-sm px-2 py-1 text-[11px] text-[#EDEDED] outline-none transition-colors duration-75 cursor-pointer"
        >
          <option value="">No interaction</option>
          {frames.map((f, i) => (
            <option key={f.id} value={f.id}>Screen {i + 1}</option>
          ))}
        </select>
        {element.linkTo && (
          <p className="text-[10px] text-[#0099FF]">Linked — click Play to preview</p>
        )}
      </div>
    </Section>
  );
}

// ─── Frame auto-layout section ────────────────────────────────────────────────

const LAYOUT_MODES = [
  { value: 'none',     label: 'None' },
  { value: 'flex-row', label: 'Row'  },
  { value: 'flex-col', label: 'Col'  },
] as const;

function FrameLayoutSection({ element, onChange }: {
  element:  SceneNode;
  onChange: (partial: Partial<SceneNode>) => void;
}) {
  const applyAutoLayout = useCanvasStore((s) => s.applyAutoLayout);
  const mode = element.layoutMode ?? 'none';

  const setMode = (m: SceneNode['layoutMode']) => {
    onChange({ layoutMode: m });
    if (m !== 'none') setTimeout(() => applyAutoLayout(element.id), 0);
  };

  return (
    <Section title="Auto Layout">
      <div className="flex gap-1 mb-2">
        {LAYOUT_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className="flex-1 py-1 text-[10px] font-medium rounded-sm transition-colors duration-75"
            style={{
              background: mode === value ? '#0099FF'  : '#111111',
              border:     mode === value ? '1px solid #0099FF' : '1px solid #2C2C2C',
              color:      mode === value ? '#FFFFFF'   : '#8A8A8A',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== 'none' && (
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput
            label="Gap"
            value={element.gap ?? 8}
            min={0}
            precision={0}
            onChange={(v) => { onChange({ gap: v }); applyAutoLayout(element.id); }}
          />
          <NumberInput
            label="Padding"
            value={element.padding ?? 12}
            min={0}
            precision={0}
            onChange={(v) => { onChange({ padding: v }); applyAutoLayout(element.id); }}
          />
        </div>
      )}

      {(element.children?.length ?? 0) > 0 && (
        <p className="text-[10px] text-[#8A8A8A] mt-1.5">
          {element.children!.length} child{element.children!.length !== 1 ? 'ren' : ''}
          {mode !== 'none' ? ' · auto-positioned' : ''}
        </p>
      )}
    </Section>
  );
}

// ─── Element inspector ────────────────────────────────────────────────────────

function ElementInspector({ element }: { element: SceneNode }) {
  const updateElement = useCanvasStore((s) => s.updateElement);
  const [hexLocal, setHexLocal] = useState(element.fill);

  useEffect(() => { setHexLocal(element.fill); }, [element.fill]);

  const update = (partial: Partial<SceneNode>) => updateElement(element.id, partial);

  const typeColor = {
    rect:   '#0099FF',
    circle: '#a855f7',
    frame:  '#06b6d4',
  }[element.type];

  return (
    <div>
      {/* Position */}
      <Section title="Position">
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput label="X" value={element.x}      onChange={(v) => update({ x: v })}      precision={1} />
          <NumberInput label="Y" value={element.y}      onChange={(v) => update({ y: v })}      precision={1} />
        </div>
      </Section>

      <Divider />

      {/* Size */}
      <Section title="Size">
        <div className="grid grid-cols-2 gap-1.5">
          <NumberInput label="W" value={element.width}  onChange={(v) => update({ width: v })}  precision={1} min={1} />
          <NumberInput label="H" value={element.height} onChange={(v) => update({ height: v })} precision={1} min={1} />
        </div>
      </Section>

      <Divider />

      {/* Fill */}
      <Section title="Fill">
        <div className="flex items-center gap-2">
          <label className="relative flex-shrink-0 cursor-pointer">
            <div
              className="w-7 h-7 rounded-sm border border-[#2C2C2C]"
              style={{ backgroundColor: element.fill }}
            />
            <input
              type="color"
              value={element.fill.startsWith('#') ? element.fill : '#6366f1'}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => { setHexLocal(e.target.value); update({ fill: e.target.value }); }}
            />
          </label>
          <input
            type="text"
            value={hexLocal}
            maxLength={7}
            placeholder="#000000"
            className="flex-1 bg-[#111111] border border-transparent focus:border-[#0099FF] rounded-sm px-2 py-1 text-[11px] text-[#EDEDED] font-mono uppercase focus:outline-none transition-colors duration-75"
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
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0} max={100} step={1}
            value={Math.round(element.opacity * 100)}
            onChange={(e) => update({ opacity: parseInt(e.target.value) / 100 })}
            className="flex-1 cursor-pointer"
          />
          <div className="relative w-12 flex-shrink-0">
            <NumberInput
              label=""
              value={Math.round(element.opacity * 100)}
              onChange={(v) => update({ opacity: Math.min(100, Math.max(0, v)) / 100 })}
              min={0} max={100} precision={0}
            />
            <span className="absolute right-2 top-1/2 translate-y-px text-[9px] text-[#8A8A8A] pointer-events-none">%</span>
          </div>
        </div>
      </Section>

      {/* Frame auto-layout */}
      {element.type === 'frame' && (
        <>
          <Divider />
          <FrameLayoutSection element={element} onChange={update} />
        </>
      )}

      <Divider />

      {/* Type badge */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-widest">Type</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-sm font-medium capitalize"
          style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30` }}
        >
          {element.type}
        </span>
      </div>

      <Divider />
      <ActionsSection element={element} />

      <Divider />
      <PrototypeSection element={element} />
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function InspectorPanel() {
  const selectedElementId = useCanvasStore((s) => s.selectedElementId);
  const elements          = useCanvasStore((s) => s.elements);
  const selected = selectedElementId ? findNode(elements, selectedElementId) ?? null : null;

  return (
    <aside className="w-60 h-full flex-shrink-0 flex flex-col bg-[#1A1A1A] border-l border-[#2C2C2C]">
      {/* Header */}
      <div className="h-8 flex items-center px-3 flex-shrink-0 border-b border-[#2C2C2C]">
        <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-widest">Inspect</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.07 }}
            >
              <ElementInspector element={selected} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.07 }}
              className="flex flex-col items-center justify-center gap-3 py-16"
            >
              <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-[#111111] border border-[#2C2C2C]">
                <MousePointer size={14} className="text-[#8A8A8A]" />
              </div>
              <p className="text-[11px] text-[#8A8A8A] text-center leading-relaxed px-4 opacity-60">
                Select an element<br />to inspect properties
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
