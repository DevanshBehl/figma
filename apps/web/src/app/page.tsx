'use client';

import { InfiniteCanvas } from '@/components/Canvas/InfiniteCanvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { TopBar } from '@/components/TopBar/TopBar';

export default function Home() {
  return (
    <main className="w-screen h-screen bg-[#030712] overflow-hidden relative canvas-container">
      <TopBar />
      <div className="absolute inset-0 pt-12">
        <InfiniteCanvas />
      </div>
      <Toolbar />
    </main>
  );
}
