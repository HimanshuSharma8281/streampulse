import { NextRequest, NextResponse } from 'next/server';
import { getMatchById } from '@/lib/matches';
import { hasPaidAccess } from '@/lib/payments';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  const match = await getMatchById(matchId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // 1. FREE matches have instant universal access
  if (match.access_type === 'FREE') {
    return NextResponse.json({
      hasAccess: true,
      accessType: 'FREE',
      watchUrl: match.watch_url,
    });
  }

  // 2. Check paid entitlement
  const guestId = request.cookies.get('sp_guest_id')?.value;
  const accessCookie = request.cookies.get(`sp_match_access_${matchId}`)?.value;

  const hasAccess = await hasPaidAccess(matchId, guestId, accessCookie);

  return NextResponse.json({
    hasAccess,
    accessType: 'PAID',
    priceInr: match.price_inr || 5,
    watchUrl: hasAccess ? match.watch_url : undefined,
  });
}
