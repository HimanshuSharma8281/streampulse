import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Match, MatchFormData } from '@/types/match';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { INITIAL_SAMPLE_MATCHES } from '@/lib/sampleData';
import { sanitizeRedirectUrl } from '@/lib/validation';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Partial<MatchFormData>;
    if (body.watch_url) {
      body.watch_url = sanitizeRedirectUrl(body.watch_url);
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('matches')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ match: data });
    }

    // Local file persistence
    const matches = readLocalData();
    const index = matches.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const updatedMatch: Match = {
      ...matches[index],
      ...body,
      updated_at: new Date().toISOString(),
    };
    matches[index] = updatedMatch;
    writeLocalData(matches);

    return NextResponse.json({ match: updatedMatch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update match';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Local file persistence
    let matches = readLocalData();
    matches = matches.filter((m) => m.id !== id);
    writeLocalData(matches);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete match';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
