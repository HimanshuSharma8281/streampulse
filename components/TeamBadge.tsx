'use client';

import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface TeamBadgeProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function TeamBadge({ name, logoUrl, size = 'md' }: TeamBadgeProps) {
  const [imageError, setImageError] = useState(false);

  // Generate a consistent color based on team name
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (logoUrl && !imageError) {
    return (
      <div className={`relative flex shrink-0 items-center justify-center rounded-xl bg-slate-800/80 p-1 border border-white/10 overflow-hidden shadow-inner ${sizeClasses[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-contain rounded-lg"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 font-bold text-slate-200 shadow-inner group-hover:border-emerald-500/40 transition-colors ${sizeClasses[size]}`}
      title={name}
    >
      <Shield className={`absolute text-slate-700/60 ${iconSizes[size]}`} />
      <span className="relative z-10 font-mono tracking-tight">{getInitials(name)}</span>
    </div>
  );
}
