import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Match, MatchFormData } from '@/types/match';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { INITIAL_SAMPLE_MATCHES } from '@/lib/sampleData';
import { sanitizeRedirectUrl, validateMatchInput } from '@/lib/validation';

const dataFilePath = path.join(process.cwd(), 'data', 'matches.json');

function readLocalData(): Match[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(content) as Match[];
    }
  } catch (err) {
    console.error('Error reading matches.json:', err);
  }
  return [...INITIAL_SAMPLE_MATCHES];
}

function writeLocalData(matches: Match[]) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(matches, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing matches.json:', err);
  }
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (error) {
        console.error('[DATABASE] Supabase GET /api/matches error:', error.message);
        return NextResponse.json({ error: error.message, matches: [] }, { status: 500 });
      }

      const sorted = (data as Match[]).sort((a, b) => {
        const order = { LIVE: 0, UPCOMING: 1, ENDED: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });

      return NextResponse.json({ matches: sorted, isMock: false });
    } catch (err) {
      console.error('[DATABASE] Supabase fetch exception:', err);
      return NextResponse.json({ error: 'Database connection failed', matches: [] }, { status: 500 });
    }
  }

  // Development fallback when Supabase is not configured
  if (process.env.NODE_ENV === 'development') {
    const matches = readLocalData();
    return NextResponse.json({ matches, isMock: true });
  }

  return NextResponse.json(
    {
      error: 'Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.',
      matches: [],
      isMock: false,
    },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MatchFormData;
    const validation = validateMatchInput(body);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const sanitizedWatchUrl = sanitizeRedirectUrl(body.watch_url);
    const newMatchPayload = {
      home_team: body.home_team.trim(),
      away_team: body.away_team.trim(),
      home_logo: body.home_logo?.trim() || null,
      away_logo: body.away_logo?.trim() || null,
      competition: body.competition.trim(),
      match_date: body.match_date,
      match_time: body.match_time.trim(),
      status: body.status,
      watch_url: sanitizedWatchUrl,
      access_type: body.access_type || 'FREE',
      price_inr: body.access_type === 'PAID' ? (Number(body.price_inr) || 5) : 0,
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('matches')
        .insert([newMatchPayload])
        .select()
        .single();

      if (error) {
        console.error('[DATABASE] Supabase create match error:', error.message);
        return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json({ match: data, success: true });
    }

    // Local file persistence (development fallback)
    if (process.env.NODE_ENV === 'development') {
      const matches = readLocalData();
      const newMatch: Match = {
        ...newMatchPayload,
        id: 'm-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      matches.unshift(newMatch);
      writeLocalData(matches);

      return NextResponse.json({ match: newMatch, success: true });
    }

    return NextResponse.json(
      { error: 'Supabase database configuration missing in production.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create match';
    console.error('[DATABASE] Match creation exception:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
