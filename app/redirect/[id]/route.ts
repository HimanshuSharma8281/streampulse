import { NextRequest, NextResponse } from 'next/server';
import { getServerMatchById } from '@/lib/serverMatches';
import { isValidRedirectUrl } from '@/lib/validation';
import { hasPaidAccess } from '@/lib/payments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
  }

  const match = await getServerMatchById(id);

  if (!match) {
    return NextResponse.json(
      { error: 'Match not found in StreamPulse directory.' },
      { status: 404 }
    );
  }

  // Check paid entitlement for PAID matches
  if (match.access_type === 'PAID') {
    const guestId = request.cookies.get('sp_guest_id')?.value;
    const accessCookie = request.cookies.get(`sp_match_access_${id}`)?.value;

    const accessGranted = await hasPaidAccess(id, guestId, accessCookie);
    if (!accessGranted) {
      // Redirect to homepage with notification that payment is required
      const url = new URL('/#live-matches', request.url);
      url.searchParams.set('pay_required', id);
      return NextResponse.redirect(url, 307);
    }
  }

  // Safety check on watch_url
  if (!match.watch_url || !isValidRedirectUrl(match.watch_url)) {
    return NextResponse.json(
      { error: 'Invalid or unsafe external stream destination configured for this match.' },
      { status: 400 }
    );
  }

  // Perform safe 307 temporary redirect to the configured external broadcast URL
  const response = NextResponse.redirect(match.watch_url, 307);

  // Security Headers
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}
