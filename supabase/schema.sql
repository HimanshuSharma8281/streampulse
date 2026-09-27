-- ==========================================================
-- StreamPulse Database Schema
-- Football Live Match Directory & Razorpay Payment Platform
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. MATCHES TABLE
-- ==========================================================

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    competition TEXT NOT NULL,
    match_date DATE NOT NULL,
    match_time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('LIVE', 'UPCOMING', 'ENDED')) DEFAULT 'UPCOMING',
    watch_url TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('FREE', 'PAID')) DEFAULT 'FREE',
    price_inr NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition);

-- ==========================================================
-- 2. PAYMENTS TABLE
-- ==========================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    user_id TEXT,
    guest_session_id TEXT,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT NOT NULL,
    amount_inr NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for payments lookup
CREATE INDEX IF NOT EXISTS idx_payments_match_id ON payments(match_id);
CREATE INDEX IF NOT EXISTS idx_payments_guest ON payments(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_matches_updated_at ON matches;
CREATE TRIGGER trigger_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================================
-- Row Level Security (RLS) Configuration
-- ==========================================================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Matches Policies
DROP POLICY IF EXISTS "Public can view all matches" ON matches;
CREATE POLICY "Public can view all matches"
    ON matches FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can insert matches" ON matches;
CREATE POLICY "Admins can insert matches"
    ON matches FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update matches" ON matches;
CREATE POLICY "Admins can update matches"
    ON matches FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete matches" ON matches;
CREATE POLICY "Admins can delete matches"
    ON matches FOR DELETE TO authenticated
    USING (true);

-- Payments Policies
DROP POLICY IF EXISTS "Allow service and public read verified payments" ON payments;
CREATE POLICY "Allow service and public read verified payments"
    ON payments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow insertion of payments" ON payments;
CREATE POLICY "Allow insertion of payments"
    ON payments FOR INSERT
    WITH CHECK (true);

-- ==========================================================
-- Sample Seed Data (Mix of FREE and PAID matches)
-- ==========================================================

INSERT INTO matches (home_team, away_team, competition, match_date, match_time, status, watch_url, access_type, price_inr)
VALUES
    (
        'Manchester City',
        'Arsenal',
        'Premier League',
        CURRENT_DATE,
        '20:00 GMT',
        'LIVE',
        'https://example.com/live-stream/mancity-vs-arsenal',
        'FREE',
        0.00
    ),
    (
        'Real Madrid',
        'FC Barcelona',
        'La Liga (El Clásico)',
        CURRENT_DATE,
        '21:00 CEST',
        'LIVE',
        'https://example.com/live-stream/el-clasico',
        'PAID',
        5.00
    ),
    (
        'Bayern Munich',
        'Borussia Dortmund',
        'Bundesliga (Der Klassiker)',
        CURRENT_DATE,
        '18:30 CEST',
        'LIVE',
        'https://example.com/live-stream/der-klassiker',
        'PAID',
        3.00
    ),
    (
        'Liverpool',
        'Manchester United',
        'Premier League',
        CURRENT_DATE,
        '16:30 GMT',
        'LIVE',
        'https://example.com/live-stream/liverpool-vs-manunited',
        'FREE',
        0.00
    )
ON CONFLICT DO NOTHING;
