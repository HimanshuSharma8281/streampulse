import { NextRequest, NextResponse } from 'next/server';
import { getServerMatchById } from '@/lib/serverMatches';
import { verifyRazorpaySignature, isRazorpayConfigured } from '@/lib/razorpay';
import { recordPayment, generateAccessToken } from '@/lib/payments';
import { isValidRedirectUrl } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const matchId = body.matchId || body.match_id;
    const razorpayOrderId = body.razorpayOrderId || body.razorpay_order_id;
    const razorpayPaymentId = body.razorpayPaymentId || body.razorpay_payment_id;
    const razorpaySignature = body.razorpaySignature || body.razorpay_signature;

    console.log(`[PAYMENT] Verifying payment for match ${matchId}:`, {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });

    if (!matchId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required payment verification details.' },
        { status: 400 }
      );
    }

    // 1. Fetch match from database (source of truth)
    const match = await getServerMatchById(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found in database.' }, { status: 404 });
    }

    // 2. Server-side HMAC SHA256 Signature Verification
    if (isRazorpayConfigured()) {
      const isValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        console.error('[PAYMENT] Signature verification failed!');
        return NextResponse.json(
          { error: 'Invalid payment signature. Verification failed.' },
          { status: 400 }
        );
      }
      console.log('[PAYMENT] Signature verified successfully.');
    }

    // 3. Identify or generate guest session ID
    let guestId = request.cookies.get('sp_guest_id')?.value;
    if (!guestId) {
      guestId = 'gst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    // 4. Record successful payment in database
    const priceInr = match.price_inr && match.price_inr > 0 ? match.price_inr : 5;
    await recordPayment({
      match_id: matchId,
      guest_session_id: guestId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      amount_inr: priceInr,
      currency: 'INR',
      status: 'SUCCESS',
    });

    // 5. Generate signed access token
    const accessToken = generateAccessToken(matchId, guestId);

    // 6. Validate watch URL before returning
    if (!isValidRedirectUrl(match.watch_url)) {
      return NextResponse.json(
        { error: 'Invalid destination URL configured for this match.' },
        { status: 500 }
      );
    }

    console.log(`[PAYMENT] Access granted. Redirecting to ${match.watch_url}`);

    const response = NextResponse.json({
      success: true,
      watchUrl: match.watch_url,
    });

    // Set persistent access cookies
    response.cookies.set(`sp_match_access_${matchId}`, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 48,
    });

    response.cookies.set('sp_guest_id', guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment verification failed.';
    console.error('[PAYMENT] Verification error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
