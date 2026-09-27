import fs from 'fs';
import path from 'path';
import { Match } from '@/types/match';
import { getSupabaseServerClient } from './supabase/server';
import { INITIAL_SAMPLE_MATCHES } from './sampleData';

const dataFilePath = path.join(process.cwd(), 'data', 'matches.json');

export function readLocalMatches(): Match[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(content) as Match[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading matches.json on server:', err);
  }
  return [...INITIAL_SAMPLE_MATCHES];
}

export async function getServerMatchById(id: string): Promise<Match | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as Match;
      }
    } catch (err) {
      console.error('Supabase fetch match error:', err);
    }
  }

  const localMatches = readLocalMatches();
  return localMatches.find((m) => m.id === id) || null;
}
