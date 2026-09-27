import { NextRequest, NextResponse } from 'next/server';
import { getServerMatchById } from '@/lib/serverMatches';
import { getRazorpayInstance, getRazorpayKeyId, isRazorpayConfigured } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required.' }, { status: 400 });
    }

    const match = await getServerMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    // 1. If match is FREE, immediately provide direct access
    if (match.access_type === 'FREE') {
      return NextResponse.json({
        isFree: true,
        watchUrl: match.watch_url,
      });
    }

    // 2. Read price strictly from database record
    const priceInr = match.price_inr && match.price_inr > 0 ? match.price_inr : 5;
    const amountInPaise = Math.round(priceInr * 100);

    const razorpay = getRazorpayInstance();
    const keyId = getRazorpayKeyId();

    console.log(`[PAYMENT] Creating Razorpay order for ${match.home_team} vs ${match.away_team} (₹${priceInr})`);

    // 3. Create real Razorpay order if Razorpay is configured
    if (razorpay && isRazorpayConfigured()) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sp_${matchId.substring(0, 8)}_${Date.now()}`,
        notes: {
          match_id: match.id,
          fixture: `${match.home_team} vs ${match.away_team}`,
          competition: match.competition,
        },
      });

      console.log(`[PAYMENT] Order created successfully: ${order.id}`);

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        amountInr: priceInr,
        currency: order.currency,
        keyId: keyId,
        match: {
          id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          competition: match.competition,
        },
      });
    }

    return NextResponse.json(
      {
        error: 'Razorpay keys not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local',
      },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to initialize payment order.';
    console.error('[PAYMENT] Error creating order:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
