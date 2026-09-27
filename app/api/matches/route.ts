import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Match, MatchFormData } from '@/types/match';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
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
  const supabase = getSupabaseClient();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (!error && data) {
        return NextResponse.json({ matches: data, isMock: false });
      }
    } catch (err) {
      console.error('Supabase query error:', err);
    }
  }

  const matches = readLocalData();
  return NextResponse.json({ matches, isMock: true });
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
      price_inr: body.price_inr || 0,
    };

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('matches')
        .insert([newMatchPayload])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ match: data });
    }

    // Local file persistence
    const matches = readLocalData();
    const newMatch: Match = {
      ...newMatchPayload,
      id: 'm-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    matches.unshift(newMatch);
    writeLocalData(matches);

    return NextResponse.json({ match: newMatch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create match';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
