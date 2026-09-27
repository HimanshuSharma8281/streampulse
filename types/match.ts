export type MatchStatus = 'LIVE' | 'UPCOMING' | 'ENDED';
export type AccessType = 'FREE' | 'PAID';

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_logo?: string | null;
  away_logo?: string | null;
  competition: string;
  match_date: string; // YYYY-MM-DD
  match_time: string; // e.g. "20:00 GMT" or "01:30 IST"
  status: MatchStatus;
  watch_url: string;
  access_type: AccessType;
  price_inr?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MatchFormData {
  home_team: string;
  away_team: string;
  home_logo?: string;
  away_logo?: string;
  competition: string;
  match_date: string;
  match_time: string;
  status: MatchStatus;
  watch_url: string;
  access_type: AccessType;
  price_inr?: number;
}
