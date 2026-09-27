import { Match, MatchFormData } from '@/types/match';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { INITIAL_SAMPLE_MATCHES } from './sampleData';
import { sanitizeRedirectUrl, validateMatchInput } from './validation';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Fetch all matches
 */
export async function getAllMatches(): Promise<{ matches: Match[]; isMock: boolean; error?: string }> {
  if (isBrowser()) {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          matches: data.matches || [],
          isMock: Boolean(data.isMock),
        };
      }
    } catch (err) {
      console.error('Client fetch /api/matches error:', err);
    }
  }

  // Server-side: check Supabase
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const sorted = (data as Match[]).sort((a, b) => {
          const order = { LIVE: 0, UPCOMING: 1, ENDED: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });
        return { matches: sorted, isMock: false };
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  return { matches: INITIAL_SAMPLE_MATCHES, isMock: true };
}

/**
 * Fetch a single match by ID
 */
export async function getMatchById(id: string): Promise<Match | null> {
  const { matches } = await getAllMatches();
  return matches.find((m) => m.id === id) || null;
}

/**
 * Create a new match
 */
export async function createMatch(formData: MatchFormData): Promise<{ success: boolean; data?: Match; error?: string }> {
  const validation = validateMatchInput(formData);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  if (isBrowser()) {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to create match' };
      }
      return { success: true, data: data.match };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  return { success: false, error: 'Cannot create match in server context directly without API' };
}

/**
 * Update an existing match
 */
export async function updateMatch(id: string, formData: Partial<MatchFormData>): Promise<{ success: boolean; data?: Match; error?: string }> {
  if (formData.watch_url) {
    formData.watch_url = sanitizeRedirectUrl(formData.watch_url);
  }

  if (isBrowser()) {
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update match' };
      }
      return { success: true, data: data.match };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  return { success: false, error: 'Cannot update match in server context directly without API' };
}

/**
 * Delete a match
 */
export async function deleteMatch(id: string): Promise<{ success: boolean; error?: string }> {
  if (isBrowser()) {
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete match' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  return { success: false, error: 'Cannot delete match in server context directly without API' };
}
