'use client';

import { use, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { InfiniteCanvas } from '@/components/Canvas/InfiniteCanvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { TopBar } from '@/components/TopBar/TopBar';
import { LayersPanel } from '@/components/Layers/LayersPanel';
import { InspectorPanel } from '@/components/Inspector/InspectorPanel';
import { AICommandBar } from '@/components/AI/AICommandBar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCanvasStore } from '@/store/canvasStore';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { loadProject, setAuthUser } = useCanvasStore();

  useAutoSave();

  useEffect(() => {
    loadProject(id);
  }, [id, loadProject]);

  useEffect(() => {
    if (session?.user?.email) {
      setAuthUser({
        email: session.user.email,
        name:  session.user.name  ?? 'Anonymous',
        image: session.user.image ?? undefined,
      });
    }
  }, [session, setAuthUser]);

  return (
    <main className="w-screen h-screen bg-[#030712] overflow-hidden flex flex-col canvas-container">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LayersPanel />
        <div className="relative flex-1 overflow-hidden">
          <InfiniteCanvas />
          <Toolbar />
          <AICommandBar />
        </div>
        <InspectorPanel />
      </div>
    </main>
  );
}
