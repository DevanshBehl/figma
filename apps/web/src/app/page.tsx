'use client';

import { InfiniteCanvas } from '@/components/Canvas/InfiniteCanvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { TopBar } from '@/components/TopBar/TopBar';
import { LayersPanel } from '@/components/Layers/LayersPanel';
import { InspectorPanel } from '@/components/Inspector/InspectorPanel';
import { useAutoSave } from '@/hooks/useAutoSave';

export default function Home() {
  // Debounced 2-second auto-save — fires whenever the elements array changes
  useAutoSave();

  return (
    <main className="w-screen h-screen bg-[#030712] overflow-hidden flex flex-col canvas-container">
      <TopBar />

      {/* Three-column workspace */}
      <div className="flex flex-1 overflow-hidden">
        <LayersPanel />

        {/* Canvas area — Toolbar floats inside this */}
        <div className="relative flex-1 overflow-hidden">
          <InfiniteCanvas />
          <Toolbar />
        </div>

        <InspectorPanel />
      </div>
    </main>
  );
}
