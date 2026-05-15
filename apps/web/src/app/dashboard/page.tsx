'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, LogOut, ChevronDown } from 'lucide-react';
import type { ProjectResponse } from '@aether/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Deterministic gradient per project ID
function projectGradient(id: string): string {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
  ];
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/6 animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="h-40" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="p-4 space-y-2">
        <div className="h-3.5 w-2/3 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-2.5 w-1/3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: ProjectResponse; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden border border-white/6 hover:border-white/12 transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 0 transparent' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 transparent';
      }}
    >
      {/* Thumbnail */}
      <div className="h-40 relative overflow-hidden" style={{ background: projectGradient(project.id) }}>
        {/* Node count badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium text-white/70"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
          {(project.nodes as unknown[]).length} layer{(project.nodes as unknown[]).length !== 1 ? 's' : ''}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-white px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            Open
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4">
        <p className="text-sm font-semibold text-white/90 truncate">{project.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5 text-white/30" />
          <p className="text-[11px] text-white/40">Edited {timeAgo(project.updatedAt)}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects]       = useState<ProjectResponse[]>([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/projects?userEmail=${encodeURIComponent(session.user.email)}`
      );
      if (res.ok) {
        const data = await res.json() as ProjectResponse[];
        setProjects(data);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
          user:  {
            email: session.user.email,
            name:  session.user.name  ?? 'Anonymous',
            image: session.user.image ?? undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const project = await res.json() as ProjectResponse;
      router.push(`/editor/${project.id}`);
    } catch {
      setCreating(false);
    }
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-[#030712] text-white">

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/6 backdrop-blur-xl"
        style={{ background: 'rgba(3,7,18,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' }}>
              A
            </div>
            <span className="text-sm font-semibold text-white/80">Aether</span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-sm text-white/60">My Projects</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleNewProject}
              disabled={creating}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              {creating ? 'Creating…' : 'New Project'}
            </motion.button>

            {/* Avatar menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/6 transition-colors"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name ?? ''} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {initials}
                  </div>
                )}
                <span className="text-xs text-white/70 hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-white/30" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 overflow-hidden z-50"
                    style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(20px)' }}
                  >
                    <div className="px-4 py-3 border-b border-white/6">
                      <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {projects.length > 0
                ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                : 'No projects yet — create your first one'}
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Plus className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Start your first project</h2>
            <p className="text-sm text-white/40 mb-8 max-w-xs">
              Create a new project and start designing on an infinite canvas.
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              New Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {/* "New" card at start */}
              <motion.button
                layout
                key="new"
                onClick={handleNewProject}
                disabled={creating}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="group rounded-xl border border-dashed border-white/12 hover:border-indigo-500/40 transition-all duration-200 flex flex-col items-center justify-center gap-3 h-[196px] disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-white/40 group-hover:text-white/60 transition-colors">
                  {creating ? 'Creating…' : 'New Project'}
                </span>
              </motion.button>

              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/editor/${project.id}`)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
