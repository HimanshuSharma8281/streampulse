'use client';

import React from 'react';
import { Radio, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

interface HeroProps {
  liveCount: number;
}

export default function Hero({ liveCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-b border-white/5">
      {/* Dynamic Stadium Lighting / Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Live Matches Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md mb-6 shadow-sm shadow-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              {liveCount > 0 ? `${liveCount} Live Matches Broadcast Now` : 'Live Match Stream Directory'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl">
            Watch Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Live</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
            Discover real-time football broadcasts across top global leagues. Direct verified links with zero delay and instant one-click access.
          </p>

          {/* CTA Group */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#live-matches"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] hover:shadow-emerald-500/35 active:scale-[0.98]"
            >
              <Radio className="h-4 w-4 animate-pulse text-white" />
              <span>View Live Matches</span>
              <ArrowRight className="h-4 w-4 text-emerald-100" />
            </a>
          </div>

          {/* Value Props / Highlights */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Direct Redirection</div>
                <div className="text-[11px] text-slate-400">Instant jump to verified source</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Top Competitions</div>
                <div className="text-[11px] text-slate-400">EPL, UCL, La Liga, Serie A</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">100% Free Access</div>
                <div className="text-[11px] text-slate-400">No payment or login required</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
