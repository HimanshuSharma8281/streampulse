import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Match, MatchFormData } from '@/types/match';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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
    if (!id) {
      return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
    }

    const body = (await request.json()) as Partial<MatchFormData>;
    if (body.watch_url) {
      body.watch_url = sanitizeRedirectUrl(body.watch_url);
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
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
        console.error(`[DATABASE] Supabase update error for match ${id}:`, error.message);
        return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Match not found in database.' }, { status: 404 });
      }

      return NextResponse.json({ match: data, success: true });
    }

    // Local file persistence (development fallback)
    if (process.env.NODE_ENV === 'development') {
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

      return NextResponse.json({ match: updatedMatch, success: true });
    }

    return NextResponse.json(
      { error: 'Supabase database configuration missing in production.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update match';
    console.error(`[DATABASE] Match update exception:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
    }

    console.log(`[DATABASE] Executing DELETE for match id: "${id}"`);

    const supabase = getSupabaseServerClient();
    if (supabase) {
      // Equivalent to: supabase.from('matches').delete().eq('id', id)
      const { error, count } = await supabase
        .from('matches')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        console.error(`[DATABASE] Supabase deletion failed for match ${id}:`, error.message);
        return NextResponse.json(
          { error: `Supabase deletion failed: ${error.message}` },
          { status: 500 }
        );
      }

      console.log(`[DATABASE] Supabase match ${id} deleted successfully. Count:`, count);
      return NextResponse.json({ success: true, count });
    }

    // Local file persistence (development fallback)
    if (process.env.NODE_ENV === 'development') {
      let matches = readLocalData();
      const initialCount = matches.length;
      matches = matches.filter((m) => m.id !== id);
      writeLocalData(matches);

      console.log(`[DATABASE] Local file match ${id} deleted. (Remaining: ${matches.length})`);
      return NextResponse.json({ success: true, count: initialCount - matches.length });
    }

    return NextResponse.json(
      { error: 'Supabase database configuration missing in production.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete match';
    console.error(`[DATABASE] Match deletion exception:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
