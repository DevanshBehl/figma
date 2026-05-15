'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Layers, MousePointer2, Github, Cpu } from 'lucide-react';

const features = [
  {
    icon:  Zap,
    title: 'Real-Time Collaboration',
    desc:  'Live cursors and delta sync via WebSockets. Every change propagates in milliseconds.',
  },
  {
    icon:  Layers,
    title: 'Infinite Canvas',
    desc:  'Pan and zoom freely. Frames, groups, and auto-layout keep your work organized at any scale.',
  },
  {
    icon:  MousePointer2,
    title: 'Precision Controls',
    desc:  'Pixel-perfect transforms, resize handles, and a full-featured inspector for every property.',
  },
  {
    icon:  Cpu,
    title: 'AI Architect',
    desc:  'Describe a layout in plain English. The AI generates production-ready layers in seconds.',
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  function handleCTA() {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      signIn('github', { callbackUrl: '/dashboard' });
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#EDEDED]">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-11 flex items-center justify-between px-6 bg-[#1A1A1A] border-b border-[#2C2C2C]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#0099FF] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">A</span>
          </div>
          <span className="text-xs font-semibold text-[#EDEDED]">Aether</span>
        </div>

        <div className="hidden md:flex items-center gap-0.5">
          {['Features', 'Pricing', 'Docs'].map((item) => (
            <button
              key={item}
              className="px-3 h-7 text-xs text-[#8A8A8A] hover:text-[#EDEDED] hover:bg-[#2C2C2C] rounded-sm transition-colors duration-75"
            >
              {item}
            </button>
          ))}
        </div>

        <button
          onClick={handleCTA}
          className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold bg-[#0099FF] text-white rounded-sm hover:bg-[#0088EE] transition-colors duration-75"
        >
          <Github className="w-3 h-3" />
          {status === 'authenticated' ? 'Dashboard' : 'Sign in'}
        </button>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold text-[#0099FF] uppercase tracking-widest mb-5">
            Open-source design tool
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.93] mb-6 text-[#EDEDED]">
            Design tool<br />
            for engineers.
          </h1>
          <p className="text-sm text-[#8A8A8A] max-w-lg leading-relaxed mb-10">
            Infinite canvas. Real-time collaboration. AI-powered layout generation.
            Built with the same tools your stack already uses.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCTA}
              className="flex items-center gap-2 px-4 h-8 text-xs font-semibold bg-[#0099FF] text-white rounded-sm hover:bg-[#0088EE] transition-colors duration-75"
            >
              Start Designing
              <ArrowRight className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-4 h-8 text-xs text-[#8A8A8A] border border-[#2C2C2C] rounded-sm hover:text-[#EDEDED] hover:border-[#8A8A8A] transition-colors duration-75">
              <Github className="w-3 h-3" />
              View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* ── App preview ───────────────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto mb-24">
        <div className="rounded-sm border border-[#2C2C2C] overflow-hidden">
          {/* Mock top bar */}
          <div className="h-9 bg-[#1A1A1A] border-b border-[#2C2C2C] flex items-center px-4 gap-3">
            <div className="w-4 h-4 rounded-sm bg-[#0099FF] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-bold">A</span>
            </div>
            <span className="text-[11px] font-semibold text-[#EDEDED]">Aether</span>
            <div className="h-3 w-px bg-[#2C2C2C]" />
            <span className="text-[10px] text-[#8A8A8A]">My Project</span>
            <span className="text-[10px] text-[#8A8A8A] border border-[#2C2C2C] px-1 py-px rounded-sm tabular-nums ml-1">5 layers</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-6 px-2 flex items-center gap-1.5 bg-[#111111] border border-[#2C2C2C] rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-[10px] text-[#22c55e]">Saved</span>
              </div>
              <div className="h-6 px-2 flex items-center text-[10px] text-[#8A8A8A] bg-[#111111] border border-[#2C2C2C] rounded-sm gap-1">
                Share
              </div>
            </div>
          </div>

          {/* Mock editor body */}
          <div className="flex" style={{ height: 340 }}>
            {/* Left panel mock */}
            <div className="w-40 bg-[#1A1A1A] border-r border-[#2C2C2C] flex flex-col">
              <div className="h-7 border-b border-[#2C2C2C] px-3 flex items-center">
                <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-widest">Layers</span>
              </div>
              <div className="py-1">
                {['Frame 1', 'Rectangle', 'Circle', 'Rectangle', 'Circle'].map((l, i) => (
                  <div
                    key={i}
                    className="h-6 flex items-center px-3 gap-1.5 text-[10px]"
                    style={{
                      paddingLeft: i === 0 ? 12 : 24,
                      background:  i === 0 ? 'rgba(0,153,255,0.10)' : 'transparent',
                      borderLeft:  i === 0 ? '2px solid #0099FF' : '2px solid transparent',
                      color:       i === 0 ? '#EDEDED' : '#8A8A8A',
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-[#0E0E0E] relative overflow-hidden">
              {/* Dot grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:    'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize:     '28px 28px',
                }}
              />
              {/* Mock elements */}
              <div className="absolute" style={{ left: 80,  top: 50,  width: 200, height: 150, border: '1px dashed #3A3A3A', background: 'rgba(255,255,255,0.02)' }} />
              <div className="absolute" style={{ left: 100, top: 70,  width: 80,  height: 50,  background: '#0099FF',  borderRadius: 3, opacity: 0.85 }} />
              <div className="absolute" style={{ left: 100, top: 130, width: 50,  height: 50,  background: '#a855f7', borderRadius: '50%', opacity: 0.85 }} />
              <div className="absolute" style={{ left: 160, top: 130, width: 80,  height: 50,  background: '#22c55e', borderRadius: 3, opacity: 0.85 }} />
              {/* Selection box */}
              <div className="absolute" style={{ left: 99, top: 69, width: 82, height: 52, border: '1px solid #0099FF' }} />
              <div className="absolute w-1.5 h-1.5 bg-[#1A1A1A] border border-[#0099FF]" style={{ left: 95,  top: 65 }} />
              <div className="absolute w-1.5 h-1.5 bg-[#1A1A1A] border border-[#0099FF]" style={{ left: 177, top: 65 }} />
              <div className="absolute w-1.5 h-1.5 bg-[#1A1A1A] border border-[#0099FF]" style={{ left: 95,  top: 116 }} />
              <div className="absolute w-1.5 h-1.5 bg-[#1A1A1A] border border-[#0099FF]" style={{ left: 177, top: 116 }} />
              {/* Mock cursor */}
              <div className="absolute pointer-events-none" style={{ left: 320, top: 110 }}>
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                  <path d="M3 1L12 8L7.5 9L5.5 15L3 1Z" fill="#a855f7" stroke="white" strokeWidth="1" />
                </svg>
                <div className="mt-0.5 px-1.5 py-px rounded-sm text-[9px] font-semibold text-white whitespace-nowrap" style={{ background: '#a855f7' }}>Nova</div>
              </div>
            </div>

            {/* Right inspector mock */}
            <div className="w-52 bg-[#1A1A1A] border-l border-[#2C2C2C] flex flex-col">
              <div className="h-7 border-b border-[#2C2C2C] px-3 flex items-center">
                <span className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-widest">Inspect</span>
              </div>
              <div className="p-3 flex flex-col gap-2.5">
                {[['X', '100'], ['Y', '70'], ['W', '80'], ['H', '50']].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-[#8A8A8A] uppercase tracking-widest">{l}</span>
                    <div className="h-6 bg-[#111111] rounded-sm px-2 flex items-center text-[11px] text-[#EDEDED]">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-widest mb-6">Features</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-sm border border-[#2C2C2C] bg-[#1A1A1A] hover:border-[#8A8A8A] transition-colors duration-75"
            >
              <div className="w-7 h-7 rounded-sm bg-[#111111] border border-[#2C2C2C] flex items-center justify-center mb-4">
                <Icon className="w-3.5 h-3.5 text-[#8A8A8A]" />
              </div>
              <h3 className="text-xs font-bold text-[#EDEDED] mb-2">{title}</h3>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────────────── */}
      <section className="border-t border-[#2C2C2C] px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#EDEDED] mb-3">
            Ready to start designing?
          </h2>
          <p className="text-sm text-[#8A8A8A] mb-8">
            Free to use. Open source. No credit card required.
          </p>
          <button
            onClick={handleCTA}
            className="flex items-center gap-2 px-5 h-9 text-xs font-semibold bg-[#0099FF] text-white rounded-sm hover:bg-[#0088EE] transition-colors duration-75"
          >
            <Github className="w-3.5 h-3.5" />
            Get Started Free
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2C2C2C] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[#0099FF] flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">A</span>
          </div>
          <span className="text-[11px] text-[#8A8A8A]">Aether Design Tool</span>
        </div>
        <p className="text-[11px] text-[#8A8A8A]">© 2026 Aether</p>
      </footer>
    </div>
  );
}
