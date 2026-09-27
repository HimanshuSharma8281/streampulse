'use client';

import React from 'react';
import { Match } from '@/types/match';
import { Calendar, Clock, Trophy, Lock } from 'lucide-react';

interface UpcomingMatchCardProps {
  match: Match;
}

export default function UpcomingMatchCard({ match }: UpcomingMatchCardProps) {
  // Format readable date
  const formatMatchDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/80">
      {/* Header: Competition & Upcoming Status Badge */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 truncate">
          <Trophy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{match.competition}</span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
          <Calendar className="h-3 w-3" />
          {formatMatchDate(match.match_date)}
        </span>
      </div>

      {/* Main Match Fixture Display */}
      <div className="py-6">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
          {/* Home Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-base sm:text-lg font-bold text-slate-200 line-clamp-2 leading-snug tracking-tight">
              {match.home_team}
            </span>
          </div>

          {/* Center Info */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0">
            <div className="rounded-full bg-slate-800 border border-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
              VS
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-300">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>{match.match_time}</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-base sm:text-lg font-bold text-slate-200 line-clamp-2 leading-snug tracking-tight">
              {match.away_team}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer: COMING SOON */}
      <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-not-allowed select-none"
        >
          <Lock className="h-3.5 w-3.5 text-slate-500" />
          <span>COMING SOON</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Stream opens at kickoff</span>
          <span className="font-mono text-slate-400">{match.match_time}</span>
        </div>
      </div>
    </div>
  );
}
