'use client';

import React, { useState } from 'react';
import { Match } from '@/types/match';
import { loadRazorpayScript } from '@/lib/razorpayClient';
import { Radio, ExternalLink, Clock, Trophy, Loader2, Lock, AlertCircle } from 'lucide-react';

interface LiveMatchCardProps {
  match: Match;
}

export default function LiveMatchCard({ match }: LiveMatchCardProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const isPaid = match.access_type === 'PAID';
  const price = match.price_inr && match.price_inr > 0 ? match.price_inr : 5;

  const handleWatchLive = async () => {
    setStatusMessage(null);

    // 1. FREE MATCH FLOW: Instant direct redirection
    if (!isPaid) {
      console.log(`[PAYMENT] Free match clicked: ${match.home_team} vs ${match.away_team}`);
      const targetUrl = match.watch_url?.trim();
      if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(`/redirect/${match.id}`, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 2. PAID MATCH FLOW: Open Razorpay Standard Checkout
    console.log(`[PAYMENT] Paid match clicked: ${match.home_team} vs ${match.away_team} (₹${price})`);
    setLoading(true);

    try {
      // Step A: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not connect to Razorpay gateway. Please check your internet connection.');
      }

      // Step B: Create Razorpay Order on server
      console.log('[PAYMENT] Creating Razorpay order...');
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      console.log(`[PAYMENT] Order created: ${orderData.orderId}`);
      console.log('[PAYMENT] Checkout opened');

      // Step C: Configure Razorpay Standard Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'StreamPulse',
        description: `Live Match: ${match.home_team} vs ${match.away_team}`,
        image: '/favicon.ico',
        order_id: orderData.orderId,
        prefill: {
          name: 'Football Fan',
          email: 'fan@streampulse.com',
          contact: '9876543210',
        },
        theme: {
          color: '#10b981',
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          console.log('[PAYMENT] Razorpay success callback received');
          console.log(`[PAYMENT] Payment ID: ${response.razorpay_payment_id}`);
          console.log(`[PAYMENT] Order ID: ${response.razorpay_order_id}`);
          console.log('[PAYMENT] Sending payment for verification');
          setLoading(true);

          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                matchId: match.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            console.log('[PAYMENT] Verification response received:', verifyData);

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            console.log('[PAYMENT] Payment verified successfully');
            console.log(`[PAYMENT] Retrieving trusted watch URL: ${verifyData.watchUrl}`);
            console.log(`[PAYMENT] Redirecting to watch URL: ${verifyData.watchUrl}`);

            // Unblockable redirection in the current window (never blocked by browser popups)
            window.location.assign(verifyData.watchUrl);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Payment verification failed.';
            console.error('[PAYMENT] Verification error:', msg);
            setStatusMessage({ type: 'error', text: msg });
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log('[PAYMENT] Payment modal closed by user');
            setStatusMessage({
              type: 'info',
              text: 'Payment cancelled. Click WATCH LIVE to retry.',
            });
            setLoading(false);
          },
        },
      };

      // Step D: Open Razorpay modal
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: { error?: { description?: string } }) {
        const errorDesc = response.error?.description || 'Payment failed. Please try again.';
        console.error('[PAYMENT] Payment failed:', errorDesc);
        setStatusMessage({ type: 'error', text: errorDesc });
        setLoading(false);
      });

      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during payment initialization.';
      console.error('[PAYMENT] Error:', msg);
      setStatusMessage({ type: 'error', text: msg });
      setLoading(false);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 p-5 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/30">
      {/* Top accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-80" />

      {/* Header: Competition & Live Status Badge */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 truncate">
          <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{match.competition}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </span>
        </div>
      </div>

      {/* Main Match Fixture Display */}
      <div className="py-6">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
          {/* Home Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug tracking-tight">
              {match.home_team}
            </span>
          </div>

          {/* VS Center Marker */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0">
            <div className="rounded-full bg-slate-800/90 border border-white/10 px-3 py-1 text-[11px] font-black tracking-widest text-emerald-400">
              VS
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{match.match_time}</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug tracking-tight">
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Optional Price Display for PAID Match */}
        {isPaid && (
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <span>Access Fee:</span>
              <span className="text-sm font-extrabold font-mono text-white">₹{price}</span>
            </div>
          </div>
        )}
      </div>

      {/* Status or Error Notification */}
      {statusMessage && (
        <div
          className={`mb-3 rounded-xl p-2.5 text-xs text-center border flex items-center justify-center gap-1.5 animate-in fade-in ${
            statusMessage.type === 'error'
              ? 'bg-red-950/80 border-red-500/40 text-red-200'
              : 'bg-slate-800/90 border-slate-700 text-slate-300'
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Footer: WATCH LIVE */}
      <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleWatchLive}
          className={`relative group/btn flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-wait ${
            isPaid
              ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 shadow-emerald-600/30 hover:from-amber-400 hover:to-teal-500 hover:shadow-emerald-500/40'
              : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-600/30 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/40'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Connecting Razorpay...</span>
            </>
          ) : (
            <>
              {isPaid ? (
                <>
                  <Lock className="h-4 w-4 text-white" />
                  <span>WATCH LIVE</span>
                  <span className="rounded bg-black/30 px-2 py-0.5 text-xs font-mono">₹{price}</span>
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 animate-pulse text-white" />
                  <span>WATCH LIVE</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-100 transition-transform group-hover/btn:translate-x-0.5" />
                </>
              )}
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Direct External Feed
          </span>
          <span className={`font-mono ${isPaid ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
            {isPaid ? `₹${price} (Razorpay)` : '100% Free'}
          </span>
        </div>
      </div>
    </div>
  );
}
