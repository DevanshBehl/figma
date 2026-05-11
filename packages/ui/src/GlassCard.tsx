import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
