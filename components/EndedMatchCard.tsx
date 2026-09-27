'use client';

import React from 'react';
import { Match } from '@/types/match';
import { CheckCircle2, Trophy } from 'lucide-react';

interface EndedMatchCardProps {
  match: Match;
}

export default function EndedMatchCard({ match }: EndedMatchCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-5 opacity-80 backdrop-blur-md transition-all duration-300 hover:opacity-100 hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 truncate">
          <Trophy className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{match.competition}</span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          <CheckCircle2 className="h-3 w-3 text-slate-400" />
          FULL TIME / ENDED
        </span>
      </div>

      {/* Main Match Fixture Display */}
      <div className="py-6">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
          {/* Home Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-sm sm:text-base font-semibold text-slate-300 line-clamp-2 leading-snug">
              {match.home_team}
            </span>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0">
            <div className="text-xs font-bold text-slate-500">FT</div>
            <div className="mt-1 text-[10px] text-slate-500">{match.match_date}</div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-sm sm:text-base font-semibold text-slate-300 line-clamp-2 leading-snug">
              {match.away_team}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-center">
        <span className="text-xs text-slate-500">Broadcast Concluded</span>
      </div>
    </div>
  );
}
