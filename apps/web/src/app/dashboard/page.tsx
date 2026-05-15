'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, LogOut, ChevronDown } from 'lucide-react';
import type { ProjectResponse } from '@aether/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Deterministic accent color per project
const ACCENTS = ['#0099FF', '#a855f7', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4'];
function projectAccent(id: string): string {
  return ACCENTS[id.charCodeAt(0) % ACCENTS.length];
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-sm border border-[#2C2C2C] bg-[#1A1A1A] overflow-hidden animate-pulse">
      <div className="h-32 bg-[#2C2C2C]" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-2/3 rounded-sm bg-[#2C2C2C]" />
        <div className="h-2 w-1/3 rounded-sm bg-[#2C2C2C]" />
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: ProjectResponse; onClick: () => void }) {
  const accent = projectAccent(project.id);
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-sm border border-[#2C2C2C] bg-[#1A1A1A] overflow-hidden hover:border-[#8A8A8A] transition-colors duration-75"
    >
      {/* Thumbnail */}
      <div className="h-32 relative" style={{ background: `${accent}18`, borderBottom: `1px solid ${accent}22` }}>
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />

        {/* Node count */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-sm text-[10px] text-[#8A8A8A] bg-[#1A1A1A] border border-[#2C2C2C]">
          {(project.nodes as unknown[]).length} layer{(project.nodes as unknown[]).length !== 1 ? 's' : ''}
        </div>

        {/* Open overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-75 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-[#EDEDED] px-3 py-1 bg-[#1A1A1A] border border-[#2C2C2C] rounded-sm">
            Open
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3">
        <p className="text-xs font-semibold text-[#EDEDED] truncate">{project.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5 text-[#8A8A8A]" />
          <p className="text-[10px] text-[#8A8A8A]">Edited {timeAgo(project.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [projects,      setProjects]      = useState<ProjectResponse[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [creating,      setCreating]      = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/projects?userEmail=${encodeURIComponent(session.user.email)}`
      );
      if (res.ok) setProjects(await res.json() as ProjectResponse[]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function handleNewProject() {
    if (!session?.user?.email || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:  'Untitled Project',
          nodes: [],
          user:  { email: session.user.email, name: session.user.name ?? 'Anonymous', image: session.user.image ?? undefined },
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const project = await res.json() as ProjectResponse;
      router.push(`/editor/${project.id}`);
    } catch {
      setCreating(false);
    }
  }

  const user     = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#EDEDED]">

      {/* ── Top nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 h-11 flex items-center bg-[#1A1A1A] border-b border-[#2C2C2C]">
        <div className="max-w-7xl w-full mx-auto px-6 flex items-center justify-between">

          {/* Logo + breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-[#0099FF] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">A</span>
            </div>
            <span className="text-xs font-semibold text-[#EDEDED]">Aether</span>
            <span className="text-[#2C2C2C] text-xs">/</span>
            <span className="text-xs text-[#8A8A8A]">My Projects</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewProject}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold bg-[#0099FF] text-white rounded-sm hover:bg-[#0088EE] disabled:opacity-50 transition-colors duration-75"
            >
              <Plus className="w-3 h-3" />
              {creating ? 'Creating…' : 'New Project'}
            </button>

            {/* Avatar menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-1.5 px-2 h-7 rounded-sm hover:bg-[#2C2C2C] transition-colors duration-75"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name ?? ''} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#0099FF] flex items-center justify-center text-[9px] font-bold text-white">
                    {initials}
                  </div>
                )}
                <span className="text-xs text-[#8A8A8A] hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-[#8A8A8A]" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-sm border border-[#2C2C2C] overflow-hidden z-50 bg-[#1A1A1A]"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-3 py-2.5 border-b border-[#2C2C2C]">
                    <p className="text-xs font-semibold text-[#EDEDED] truncate">{user?.name}</p>
                    <p className="text-[10px] text-[#8A8A8A] truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ef4444] hover:bg-[#2C2C2C] transition-colors duration-75"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-black text-[#EDEDED]">
              {user?.name ? `${user.name.split(' ')[0]}'s workspace` : 'My workspace'}
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              {projects.length > 0
                ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                : 'No projects yet'}
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-12 h-12 rounded-sm bg-[#1A1A1A] border border-[#2C2C2C] flex items-center justify-center mb-5">
              <Plus className="w-5 h-5 text-[#8A8A8A]" />
            </div>
            <h2 className="text-sm font-bold text-[#EDEDED] mb-2">Start your first project</h2>
            <p className="text-xs text-[#8A8A8A] mb-7 max-w-xs leading-relaxed">
              Create a new project and start designing on an infinite canvas.
            </p>
            <button
              onClick={handleNewProject}
              className="px-4 h-8 text-xs font-semibold bg-[#0099FF] text-white rounded-sm hover:bg-[#0088EE] transition-colors duration-75"
            >
              New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* New project card */}
            <button
              onClick={handleNewProject}
              disabled={creating}
              className="group rounded-sm border border-dashed border-[#2C2C2C] hover:border-[#0099FF] bg-[#1A1A1A] transition-colors duration-75 flex flex-col items-center justify-center gap-2.5 disabled:opacity-50"
              style={{ height: 176 }}
            >
              <div className="w-8 h-8 rounded-sm bg-[#111111] border border-[#2C2C2C] group-hover:border-[#0099FF] flex items-center justify-center transition-colors duration-75">
                <Plus className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#0099FF] transition-colors duration-75" />
              </div>
              <span className="text-xs text-[#8A8A8A] group-hover:text-[#EDEDED] transition-colors duration-75">
                {creating ? 'Creating…' : 'New Project'}
              </span>
            </button>

            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/editor/${project.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
