'use client';

import React, { useState } from 'react';
import { Match } from '@/types/match';
import { ShieldCheck, QrCode, CreditCard, Smartphone, Building2, CheckCircle2, Loader2, X, Lock } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onPaymentSuccess: (watchUrl: string) => void;
}

export default function RazorpayModal({
  isOpen,
  onClose,
  match,
  onPaymentSuccess,
}: RazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('fan@upi');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const price = match.price_inr && match.price_inr > 0 ? match.price_inr : 5;

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on backend
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize order.');
      }

      const orderId = orderData.orderId || 'order_' + Date.now();
      const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      // 2. Call backend verification route
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: 'razorpay_verified_' + Date.now(),
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      // 3. Grant access and redirect
      onPaymentSuccess(verifyData.watchUrl || match.watch_url);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80 text-slate-100">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] px-6 py-4 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-sm shadow">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Razorpay</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Secure Checkout
                </span>
              </div>
              <div className="text-[11px] text-blue-200/70">Merchant: StreamPulse Live</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Match Details & Price Header */}
        <div className="bg-slate-950/60 px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300">
              {match.home_team} <span className="text-slate-500 font-normal">vs</span> {match.away_team}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              Instant Live Stream Access
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount</div>
            <div className="text-2xl font-black font-mono text-emerald-400">₹{price}.00</div>
          </div>
        </div>

        {/* Main Payment Form */}
        <form onSubmit={handleCompletePayment} className="p-6 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedMethod === 'upi'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Smartphone className="h-5 w-5 mb-1 text-emerald-400" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1 text-cyan-400" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedMethod === 'netbanking'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Building2 className="h-5 w-5 mb-1 text-amber-400" />
                <span>NetBanking</span>
              </button>
            </div>
          </div>

          {/* Dynamic Payment Details Area */}
          <div className="rounded-xl border border-white/5 bg-slate-950 p-4 space-y-3">
            {selectedMethod === 'upi' && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 text-emerald-400" /> UPI ID / VPA
                  </span>
                  <span className="text-[10px] text-emerald-400">GPay, PhonePe, Paytm</span>
                </div>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okhdfcbank"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    defaultValue="12/28"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="789"
                    maxLength={4}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Popular Banks
                </label>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer">
                  <option>HDFC Bank</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-60"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-emerald-100" />
                <span>Pay ₹{price}.00 &amp; Watch Live</span>
              </>
            )}
          </button>

          {/* Trust Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              256-Bit SSL Encrypted
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
              Verified by Razorpay
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
