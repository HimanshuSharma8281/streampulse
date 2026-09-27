/**
 * Validates whether a provided string is a safe external HTTP or HTTPS URL.
 * Strictly blocks malicious schemes such as javascript:, data:, file:, vbscript:, etc.
 */
export function isValidRedirectUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  const trimmed = urlStr.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    // Only allow http: and https: protocols
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    // Hostname must be present and valid
    if (!parsed.hostname || parsed.hostname.includes(' ')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes URL ensuring it is trimmed and safe.
 */
export function sanitizeRedirectUrl(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!isValidRedirectUrl(trimmed)) {
    throw new Error('Invalid or dangerous redirect URL. Only HTTP and HTTPS URLs are permitted.');
  }
  return trimmed;
}

/**
 * Validates match form input data before database operations.
 */
export function validateMatchInput(data: {
  home_team: string;
  away_team: string;
  competition: string;
  match_date: string;
  match_time: string;
  status: string;
  watch_url: string;
  access_type?: string;
  price_inr?: number | null;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.home_team || !data.home_team.trim()) {
    errors.push('Home team name is required.');
  }

  if (!data.away_team || !data.away_team.trim()) {
    errors.push('Away team name is required.');
  }

  if (!data.competition || !data.competition.trim()) {
    errors.push('Competition name is required.');
  }

  if (!data.match_date || !data.match_date.trim()) {
    errors.push('Match date is required.');
  }

  if (!data.match_time || !data.match_time.trim()) {
    errors.push('Match time is required.');
  }

  const validStatuses = ['LIVE', 'UPCOMING', 'ENDED'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  if (!data.watch_url || !data.watch_url.trim()) {
    errors.push('Watch URL is required.');
  } else if (!isValidRedirectUrl(data.watch_url)) {
    errors.push('Watch URL must be a valid HTTP or HTTPS web address.');
  }

  const validAccessTypes = ['FREE', 'PAID'];
  if (data.access_type && !validAccessTypes.includes(data.access_type)) {
    errors.push(`Access type must be one of: ${validAccessTypes.join(', ')}`);
  }

  if (data.access_type === 'PAID' && (data.price_inr === undefined || data.price_inr === null || data.price_inr < 0)) {
    errors.push('For PAID matches, a valid non-negative price in INR is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
