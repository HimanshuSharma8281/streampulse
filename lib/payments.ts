import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PaymentRecord, PaymentStatus } from '@/types/payment';
import { getSupabaseServerClient } from './supabase/server';

const paymentsFilePath = path.join(process.cwd(), 'data', 'payments.json');
const ACCESS_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.ADMIN_PASSWORD || 'streampulse_secure_access_secret_key';

function readLocalPayments(): PaymentRecord[] {
  try {
    if (fs.existsSync(paymentsFilePath)) {
      const content = fs.readFileSync(paymentsFilePath, 'utf8');
      return JSON.parse(content) as PaymentRecord[];
    }
  } catch (err) {
    console.error('Error reading payments.json:', err);
  }
  return [];
}

function writeLocalPayments(payments: PaymentRecord[]) {
  try {
    const dir = path.dirname(paymentsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(paymentsFilePath, JSON.stringify(payments, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing payments.json:', err);
  }
}

/**
 * Record a payment in database and local storage
 */
export async function recordPayment(payment: {
  match_id: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount_inr: number;
  currency?: string;
  status: PaymentStatus;
}): Promise<PaymentRecord> {
  const newRecord: PaymentRecord = {
    id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    match_id: payment.match_id,
    user_id: payment.user_id || null,
    guest_session_id: payment.guest_session_id || null,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    amount_inr: payment.amount_inr,
    currency: payment.currency || 'INR',
    status: payment.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('payments').insert([newRecord]);
    } catch (err) {
      console.error('Supabase record payment error:', err);
    }
  }

  // Always persist to local file as well
  const payments = readLocalPayments();
  payments.unshift(newRecord);
  writeLocalPayments(payments);

  return newRecord;
}

/**
 * Check if a guest/user has already purchased access to a match
 */
export async function hasPaidAccess(
  matchId: string,
  guestSessionId?: string | null,
  accessToken?: string | null
): Promise<boolean> {
  // 1. Check signed access token if provided
  if (accessToken && verifyAccessToken(matchId, accessToken)) {
    return true;
  }

  // 2. Check by guest session ID
  if (guestSessionId) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id')
          .eq('match_id', matchId)
          .eq('guest_session_id', guestSessionId)
          .eq('status', 'SUCCESS')
          .limit(1);

        if (!error && data && data.length > 0) {
          return true;
        }
      } catch (err) {
        console.error('Supabase check payment access error:', err);
      }
    }

    // Check local storage
    const payments = readLocalPayments();
    const found = payments.some(
      (p) =>
        p.match_id === matchId &&
        p.guest_session_id === guestSessionId &&
        p.status === 'SUCCESS'
    );
    if (found) return true;
  }

  return false;
}

/**
 * Generate a cryptographically signed access token for a match
 */
export function generateAccessToken(matchId: string, guestSessionId: string): string {
  const payload = `${matchId}:${guestSessionId}:${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', ACCESS_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Verify a signed access token
 */
export function verifyAccessToken(matchId: string, token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;

    const [tokenMatchId, guestSessionId, timestamp, signature] = parts;
    if (tokenMatchId !== matchId) return false;

    const payload = `${tokenMatchId}:${guestSessionId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', ACCESS_SECRET)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch {
    return false;
  }
}
