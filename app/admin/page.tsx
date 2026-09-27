'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match, MatchFormData, MatchStatus } from '@/types/match';
import { getAllMatches, createMatch, updateMatch, deleteMatch } from '@/lib/matches';
import { isValidRedirectUrl } from '@/lib/validation';
import {
  Shield,
  Radio,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  LogIn,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Trophy,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Create / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MatchFormData>({
    home_team: '',
    away_team: '',
    home_logo: '',
    away_logo: '',
    competition: '',
    match_date: new Date().toISOString().split('T')[0],
    match_time: '20:00 GMT',
    status: 'LIVE',
    watch_url: '',
    access_type: 'FREE',
    price_inr: 0,
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Check auth status on load
  useEffect(() => {
    async function checkAuth() {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(Boolean(data.authenticated));
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Fetch matches helper for manual refresh / CRUD updates
  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const result = await getAllMatches();
      setMatches(result.matches);
      setIsMockData(result.isMock);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (isAuthenticated) {
      getAllMatches().then((result) => {
        if (!isCancelled) {
          setMatches(result.matches);
          setIsMockData(result.isMock);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Invalid credentials');
        return;
      }

      setIsAuthenticated(true);
      showToast('Admin logged in successfully.');
    } catch {
      setAuthError('Connection error. Please try again.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    showToast('Signed out of Admin.');
  };

  // Open Form for New Match
  const handleOpenCreateForm = () => {
    setEditingMatchId(null);
    setFormData({
      home_team: '',
      away_team: '',
      home_logo: '',
      away_logo: '',
      competition: 'Premier League',
      match_date: new Date().toISOString().split('T')[0],
      match_time: '20:00 GMT',
      status: 'LIVE',
      watch_url: 'https://',
      access_type: 'FREE',
      price_inr: 0,
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing Match
  const handleOpenEditForm = (match: Match) => {
    setEditingMatchId(match.id);
    setFormData({
      home_team: match.home_team,
      away_team: match.away_team,
      home_logo: match.home_logo || '',
      away_logo: match.away_logo || '',
      competition: match.competition,
      match_date: match.match_date,
      match_time: match.match_time,
      status: match.status,
      watch_url: match.watch_url,
      access_type: match.access_type || 'FREE',
      price_inr: match.price_inr || 0,
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit (Save / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidRedirectUrl(formData.watch_url)) {
      showToast('Watch URL must be a valid HTTP or HTTPS address.', 'error');
      return;
    }

    if (editingMatchId) {
      // Update
      const res = await updateMatch(editingMatchId, formData);
      if (res.success) {
        showToast(`Match "${formData.home_team} vs ${formData.away_team}" updated successfully.`);
        setIsFormOpen(false);
        loadMatches();
      } else {
        showToast(res.error || 'Failed to update match.', 'error');
      }
    } else {
      // Create
      const res = await createMatch(formData);
      if (res.success) {
        showToast(`Match "${formData.home_team} vs ${formData.away_team}" created successfully.`);
        setIsFormOpen(false);
        loadMatches();
      } else {
        showToast(res.error || 'Failed to create match.', 'error');
      }
    }
  };

  // Handle Delete Match
  const handleDeleteMatch = async (id: string, teams: string) => {
    if (window.confirm(`Are you sure you want to delete match "${teams}"?`)) {
      const res = await deleteMatch(id);
      if (res.success) {
        showToast(`Match "${teams}" deleted.`);
        loadMatches();
      } else {
        showToast(res.error || 'Failed to delete match.', 'error');
      }
    }
  };

  // Quick Status Toggle (LIVE / UPCOMING / ENDED)
  const handleQuickStatusChange = async (match: Match, newStatus: MatchStatus) => {
    const res = await updateMatch(match.id, { status: newStatus });
    if (res.success) {
      showToast(`Status updated to ${newStatus} for ${match.home_team} vs ${match.away_team}.`);
      loadMatches();
    } else {
      showToast('Failed to update status.', 'error');
    }
  };

  // Filtered matches for the admin table
  const displayedMatches = matches.filter((m) => {
    const matchesSearch =
      m.home_team.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.away_team.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.competition.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b11] text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Authenticating Admin Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Public Site</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white text-sm sm:text-base">
              StreamPulse <span className="text-emerald-400">Admin Control</span>
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateForm}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Match</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl p-4 shadow-2xl backdrop-blur-md border text-sm font-medium animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* LOGIN CARD */
          <div className="mx-auto max-w-md mt-16">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/30">
                  <Shield className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-white">StreamPulse Admin Login</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage match feeds, change watch URLs, and control status.
                </p>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@streampulse.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-400 hover:to-emerald-500 transition-all cursor-pointer mt-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In as Admin</span>
                </button>
              </form>

              <div className="mt-6 border-t border-white/5 pt-4 text-center">
                <p className="text-[11px] text-slate-500">
                  Secured with Supabase Authentication. Service role keys are never exposed.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-slate-400">Total Directory Matches</div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">{matches.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Configured in StreamPulse</div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  <span>Currently LIVE</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                  {matches.filter((m) => m.status === 'LIVE').length}
                </div>
                <div className="text-[11px] text-emerald-300/70 mt-1">Active external redirects</div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Upcoming Fixtures</span>
                </div>
                <div className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
                  {matches.filter((m) => m.status === 'UPCOMING').length}
                </div>
                <div className="text-[11px] text-cyan-300/70 mt-1">Locked until kickoff</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-slate-400">Access Mode</div>
                <div className="text-2xl font-bold text-emerald-400 mt-2">100% FREE</div>
                <div className="text-[11px] text-slate-500 mt-1">Ready for future monetization</div>
              </div>
            </div>

            {/* Notification / Database Status */}
            {isMockData && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200 flex items-center justify-between gap-4">
                <span>
                  <strong>Supabase Notice:</strong> Changes in preview mode persist in current memory. Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to persist to PostgreSQL.
                </span>
                <button
                  onClick={loadMatches}
                  className="shrink-0 flex items-center gap-1 rounded bg-amber-500/20 px-2.5 py-1 text-amber-300 hover:bg-amber-500/30"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
            )}

            {/* Filter and Table Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by team or competition..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-9 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 pr-8 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="LIVE">LIVE Only</option>
                    <option value="UPCOMING">UPCOMING Only</option>
                    <option value="ENDED">ENDED Only</option>
                  </select>
                  <Filter className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={loadMatches}
                  disabled={loadingMatches}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingMatches ? 'animate-spin' : ''}`} />
                  <span>Reload</span>
                </button>
                <button
                  onClick={handleOpenCreateForm}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Match</span>
                </button>
              </div>
            </div>

            {/* Matches Management Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 bg-slate-950/80 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Competition &amp; Fixture</th>
                      <th className="px-5 py-4">Date &amp; Time</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Access Type</th>
                      <th className="px-5 py-4">Configured Watch URL</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayedMatches.length > 0 ? (
                      displayedMatches.map((match) => (
                        <tr
                          key={match.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Fixture Column */}
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white text-sm flex items-center gap-2">
                              <span>{match.home_team}</span>
                              <span className="text-slate-500 font-normal">vs</span>
                              <span>{match.away_team}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Trophy className="h-3 w-3 text-amber-400" />
                              <span>{match.competition}</span>
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="px-5 py-4">
                            <div className="text-slate-200 font-medium">{match.match_date}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>{match.match_time}</span>
                            </div>
                          </td>

                          {/* Status & Quick Switcher */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {match.status === 'LIVE' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  LIVE
                                </span>
                              )}
                              {match.status === 'UPCOMING' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                                  UPCOMING
                                </span>
                              )}
                              {match.status === 'ENDED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                                  ENDED
                                </span>
                              )}

                              {/* Quick Switch Dropdown */}
                              <select
                                value={match.status}
                                onChange={(e) =>
                                  handleQuickStatusChange(match, e.target.value as MatchStatus)
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
                              >
                                <option value="LIVE">Set LIVE</option>
                                <option value="UPCOMING">Set UPCOMING</option>
                                <option value="ENDED">Set ENDED</option>
                              </select>
                            </div>
                          </td>

                          {/* Access Type */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-lg bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-white/5">
                              {match.access_type || 'FREE'}
                            </span>
                            {match.access_type === 'PAID' && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                ₹{match.price_inr}
                              </div>
                            )}
                          </td>

                          {/* Watch URL */}
                          <td className="px-5 py-4 max-w-xs truncate">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-[11px] text-slate-400 max-w-[180px]">
                                {match.watch_url}
                              </span>
                              <a
                                href={match.watch_url || `/redirect/${match.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open Watch Live Destination"
                                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditForm(match)}
                                className="p-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                                title="Edit Match"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteMatch(
                                    match.id,
                                    `${match.home_team} vs ${match.away_team}`
                                  )
                                }
                                className="p-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors"
                                title="Delete Match"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                          No matches found matching the criteria. Click &ldquo;Create Match&rdquo; to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT MATCH FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingMatchId ? 'Edit Match Fixture' : 'Add New Match to Directory'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure match details, status, and the external Watch Live redirect destination.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Team Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Home Team *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.home_team}
                      onChange={(e) =>
                        setFormData({ ...formData, home_team: e.target.value })
                      }
                      placeholder="e.g. Manchester City"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Away Team *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.away_team}
                      onChange={(e) =>
                        setFormData({ ...formData, away_team: e.target.value })
                      }
                      placeholder="e.g. Arsenal"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Team Logos (Optional URLs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Home Team Logo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.home_logo || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, home_logo: e.target.value })
                      }
                      placeholder="https://... /home-logo.png"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Away Team Logo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.away_logo || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, away_logo: e.target.value })
                      }
                      placeholder="https://... /away-logo.png"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Competition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Competition / Tournament *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.competition}
                    onChange={(e) =>
                      setFormData({ ...formData, competition: e.target.value })
                    }
                    placeholder="e.g. Premier League, UEFA Champions League, La Liga"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Match Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.match_date}
                      onChange={(e) =>
                        setFormData({ ...formData, match_date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Match Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.match_time}
                      onChange={(e) =>
                        setFormData({ ...formData, match_time: e.target.value })
                      }
                      placeholder="e.g. 20:00 GMT or 01:30 IST"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status & Access Type Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Match Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as MatchStatus,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="LIVE">LIVE (Watch Live button active)</option>
                      <option value="UPCOMING">UPCOMING (Locked / Upcoming)</option>
                      <option value="ENDED">ENDED (Match Concluded)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Access Type *
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="access_type"
                          value="FREE"
                          checked={formData.access_type === 'FREE'}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              access_type: 'FREE',
                              price_inr: 0,
                            })
                          }
                          className="text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-slate-950 border-slate-700"
                        />
                        <span>FREE</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="access_type"
                          value="PAID"
                          checked={formData.access_type === 'PAID'}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              access_type: 'PAID',
                              price_inr: formData.price_inr && formData.price_inr > 0 ? formData.price_inr : 5,
                            })
                          }
                          className="text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-950 border-slate-700"
                        />
                        <span className="text-amber-400 font-semibold">PAID (Razorpay)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Conditional Price in INR Field */}
                {formData.access_type === 'PAID' && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      Price in INR (₹) *
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formData.price_inr || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price_inr: Math.max(1, Number(e.target.value) || 0),
                          })
                        }
                        placeholder="5"
                        className="w-full rounded-xl border border-amber-500/50 bg-slate-950 pl-8 pr-4 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-amber-200/70 mt-1.5">
                      Users must pay this exact amount via Razorpay before being redirected to the watch URL.
                    </p>
                  </div>
                )}

                {/* External Watch URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    External Watch Live URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.watch_url}
                    onChange={(e) =>
                      setFormData({ ...formData, watch_url: e.target.value })
                    }
                    placeholder="https://example.com/external-stream-feed"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Users will be redirected to this verified external URL when they click &ldquo;WATCH LIVE&rdquo;. Only HTTP/HTTPS protocols allowed.
                  </p>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-400 hover:to-emerald-500"
                  >
                    {editingMatchId ? 'UPDATE MATCH' : 'SAVE MATCH'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
