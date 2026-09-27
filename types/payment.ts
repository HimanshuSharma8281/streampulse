export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  match_id: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount_inr: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // in paise
  amountInr: number;
  currency: string;
  keyId: string;
  match: {
    id: string;
    home_team: string;
    away_team: string;
    competition: string;
  };
}

export interface VerifyPaymentPayload {
  matchId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  watchUrl?: string;
  error?: string;
}
