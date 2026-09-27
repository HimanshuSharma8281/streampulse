'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '@/types/match';
import LiveMatchCard from './LiveMatchCard';
import { Search, Filter, Radio, Sparkles } from 'lucide-react';

interface MatchDirectoryProps {
  initialMatches: Match[];
  isMock: boolean;
}

export default function MatchDirectory({ initialMatches, isMock }: MatchDirectoryProps) {
  const [matchesList, setMatchesList] = useState<Match[]>(initialMatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('ALL');

  useEffect(() => {
    let isMounted = true;

    const fetchLatest = () => {
      fetch('/api/matches', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.matches && Array.isArray(data.matches)) {
            setMatchesList(data.matches);
          }
        })
        .catch(() => {});
    };

    fetchLatest();

    window.addEventListener('focus', fetchLatest);
    window.addEventListener('visibilitychange', fetchLatest);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', fetchLatest);
      window.removeEventListener('visibilitychange', fetchLatest);
    };
  }, []);

  // Filter only LIVE matches for the platform
  const allLiveMatches = useMemo(() => {
    return matchesList.filter((m) => m.status === 'LIVE');
  }, [matchesList]);

  // Extract unique competitions from live matches
  const competitions = useMemo(() => {
    const set = new Set<string>();
    allLiveMatches.forEach((m) => {
      if (m.competition) set.add(m.competition);
    });
    return Array.from(set);
  }, [allLiveMatches]);

  // Filter matches based on search & competition
  const liveMatches = useMemo(() => {
    return allLiveMatches.filter((m) => {
      const matchesSearch =
        m.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.away_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.competition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompetition =
        selectedCompetition === 'ALL' || m.competition === selectedCompetition;

      return matchesSearch && matchesCompetition;
    });
  }, [allLiveMatches, searchQuery, selectedCompetition]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Fallback/Mock notice when Supabase credentials aren't set yet */}
      {isMock && (
        <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 text-xs text-cyan-200 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Live Synchronization Active:</strong> Changes saved in the Admin panel will automatically update here in real-time.
            </span>
          </div>
          <a
            href="/admin"
            className="shrink-0 rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            Admin Panel &rarr;
          </a>
        </div>
      )}

      {/* Header, Search & Competition Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Live Now
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                {liveMatches.length} Streams Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Click &ldquo;WATCH LIVE&rdquo; on any card to instantly open the live broadcast.
            </p>
          </div>
        </div>

        {/* Search & Competition Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team or league..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Competition Selector */}
          {competitions.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 pr-8 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Competitions ({allLiveMatches.length})</option>
                {competitions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* LIVE MATCHES GRID */}
      <section id="live-matches" className="scroll-mt-24">
        {liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500 mb-4">
              <Radio className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No live matches match your filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCompetition !== 'ALL'
                ? 'Try clearing the search or switching the competition filter.'
                : 'No matches are currently marked as LIVE. Add or update match status in the Admin panel.'}
            </p>
            {(searchQuery || selectedCompetition !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCompetition('ALL');
                }}
                className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
