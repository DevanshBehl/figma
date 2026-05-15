'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { ArrowRight, Zap, Layers, MousePointer2, Github } from 'lucide-react';

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Feature cards data ───────────────────────────────────────────────────────

const features = [
  {
    icon:  Zap,
    title: 'Real-Time Collaboration',
    desc:  'See teammates’ cursors live. Every change syncs in milliseconds via WebSockets.',
    gradient: 'from-violet-500/20 to-indigo-500/20',
    border:   'border-violet-500/20',
    glow:     'group-hover:shadow-violet-500/20',
  },
  {
    icon:  Layers,
    title: 'Infinite Canvas',
    desc:  'Pan, zoom, and organize your work on an infinite canvas that never runs out of space.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border:   'border-cyan-500/20',
    glow:     'group-hover:shadow-cyan-500/20',
  },
  {
    icon:  MousePointer2,
    title: 'Precision Tools',
    desc:  'Pixel-perfect positioning, resize handles, and an inspector panel for every property.',
    gradient: 'from-rose-500/20 to-pink-500/20',
    border:   'border-rose-500/20',
    glow:     'group-hover:shadow-rose-500/20',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const heroRef  = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY    = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  function handleCTA() {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      signIn('github', { callbackUrl: '/dashboard' });
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">

      {/* ── Ambient gradient orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -top-64 -left-64 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-64 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }}
          animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
        />
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' }}>
            A
          </div>
          <span className="text-sm font-semibold tracking-wide text-white/90">Aether</span>
        </div>

        {/* Glassmorphic pill nav */}
        <div className="hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-white/10 backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['Features', 'Pricing', 'Docs'].map((item) => (
            <button key={item} className="px-4 py-1.5 text-xs text-white/60 hover:text-white rounded-full hover:bg-white/8 transition-all">
              {item}
            </button>
          ))}
        </div>

        <motion.button
          onClick={handleCTA}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Github className="w-3.5 h-3.5" />
          {status === 'authenticated' ? 'Dashboard' : 'Sign in'}
        </motion.button>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border text-xs font-medium tracking-widest uppercase"
            style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.9)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Now in Open Beta
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={stagger} initial="hidden" animate="show"
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8"
          >
            <motion.span variants={fadeUp} className="block text-white">
              Design
            </motion.span>
            <motion.span
              variants={fadeUp}
              className="block"
              style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #67e8f9 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Without Limits
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed mb-12"
          >
            Collaborative, real-time design for teams that move fast.
            An infinite canvas. Live cursors. Auto-sync.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            transition={{ delayChildren: 0.45, staggerChildren: 0.1 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <motion.button
              variants={fadeUp}
              onClick={handleCTA}
              whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-3 px-7 py-3.5 rounded-full text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              Start Designing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              variants={fadeUp}
              className="px-7 py-3.5 rounded-full text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mt-8 text-xs text-white/30"
          >
            No credit card required &nbsp;·&nbsp; Free forever on solo plan
          </motion.p>
        </motion.div>

        {/* ── App preview card ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 w-full max-w-4xl mx-auto"
        >
          {/* Glow */}
          <div className="absolute inset-x-0 top-8 h-32 blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6, #06b6d4)' }} />

          {/* Card */}
          <div className="relative rounded-2xl border overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 40px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)' }}>

            {/* Fake traffic light */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6">
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
              <div className="mx-auto px-24 py-0.5 rounded text-[10px] text-white/20"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                aether.design/editor/abc123
              </div>
            </div>

            {/* Canvas preview */}
            <div className="relative h-64 md:h-96 overflow-hidden"
              style={{ background: 'radial-gradient(ellipse at center, #0f0f1a 0%, #030712 100%)' }}>
              {/* Dot grid */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

              {/* Mock canvas elements */}
              {[
                { x: '12%',  y: '20%', w: 160, h: 100, color: '#6366f1', r: 8,  delay: 0.8 },
                { x: '38%',  y: '32%', w: 220, h: 130, color: '#8b5cf6', r: 12, delay: 0.95 },
                { x: '68%',  y: '18%', w: 140, h: 140, color: '#06b6d4', r: 9999, delay: 1.1 },
                { x: '22%',  y: '58%', w: 180, h: 80,  color: '#f43f5e', r: 8,  delay: 1.2 },
                { x: '58%',  y: '55%', w: 120, h: 120, color: '#10b981', r: 8,  delay: 1.3 },
              ].map((el, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.85, scale: 1 }}
                  transition={{ delay: el.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute"
                  style={{ left: el.x, top: el.y, width: el.w, height: el.h, background: el.color, borderRadius: el.r, opacity: 0.75 }}
                />
              ))}

              {/* Mock cursor */}
              <motion.div
                className="absolute pointer-events-none"
                animate={{ x: [80, 260, 180, 320, 200], y: [60, 140, 90, 200, 120] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 2L16 10L10 11L7 18L4 2Z" fill="#a855f7" stroke="white" strokeWidth="1" />
                </svg>
                <div className="mt-1 px-2 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap"
                  style={{ background: '#a855f7' }}>Nova</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-32">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: 'rgba(129,140,248,0.8)' }}>
              Everything you need
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Built for the way<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                modern teams work
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative rounded-2xl p-7 border transition-all duration-300 ${f.border} ${f.glow} hover:shadow-2xl`}
                style={{ background: `linear-gradient(135deg, ${f.gradient.replace('from-', '').replace(' to-', ', ')})` }}
              >
                {/* Subtle inner glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <f.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA strip ────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-32">
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }} />

        <motion.div
          variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
            Ready to create?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 mb-10 text-lg">
            Join thousands of designers using Aether to ship faster.
          </motion.p>
          <motion.button
            variants={fadeUp}
            onClick={handleCTA}
            whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)' }}
          >
            <Github className="w-4 h-4" />
            Get Started Free
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 border-t border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>A</div>
          <span className="text-xs text-white/40">Aether Design Tool</span>
        </div>
        <p className="text-xs text-white/25">© 2026 Aether</p>
      </footer>
    </div>
  );
}
