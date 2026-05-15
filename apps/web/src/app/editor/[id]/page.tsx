'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { InfiniteCanvas } from '@/components/Canvas/InfiniteCanvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { TopBar } from '@/components/TopBar/TopBar';
import { LayersPanel } from '@/components/Layers/LayersPanel';
import { InspectorPanel } from '@/components/Inspector/InspectorPanel';
import { AICommandBar } from '@/components/AI/AICommandBar';
import { PreviewOverlay } from '@/components/Preview/PreviewOverlay';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useNodeSync } from '@/hooks/useNodeSync';
import { useCanvasStore } from '@/store/canvasStore';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { loadProject, setAuthUser } = useCanvasStore();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const openPreview  = useCallback(() => setIsPreviewOpen(true),  []);
  const closePreview = useCallback(() => setIsPreviewOpen(false), []);

  useAutoSave();
  useNodeSync(); // real-time node delta sync over socket

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
    <main className="w-screen h-screen bg-[#0E0E0E] overflow-hidden flex flex-col canvas-container">
      <TopBar onPlay={openPreview} />
      <div className="flex flex-1 overflow-hidden">
        <LayersPanel />
        <div className="relative flex-1 overflow-hidden">
          <InfiniteCanvas />
          <Toolbar />
          <AICommandBar />
        </div>
        <InspectorPanel />
      </div>

      <PreviewOverlay isOpen={isPreviewOpen} onClose={closePreview} />
    </main>
  );
}
