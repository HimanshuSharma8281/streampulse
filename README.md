# StreamPulse ⚡ Live Football Directory & Redirection Platform

StreamPulse is a high-performance football live-match directory platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

> **Note:** StreamPulse is a directory and external redirection system. It **does NOT** host or process video streams (no OBS, RTMP, MediaMTX, HLS hosting, or VPS encoding). When a user clicks **"WATCH LIVE"**, StreamPulse validates the destination and safely redirects the user to the configured external broadcast source.

---

## 🌟 Core Features

- **Live Football Directory:** Real-time display of active (`LIVE`), scheduled (`UPCOMING`), and concluded (`ENDED`) matches.
- **Instant "WATCH LIVE" Redirection:** One-click redirection to external feeds via a secure route handler (`/redirect/[id]`).
- **Safe URL Routing:** Strict protocol filtering (`http:` / `https:` only) blocking `javascript:`, `data:`, `file:`, and arbitrary open redirects.
- **Admin Management Portal (`/admin`):** Full CRUD capability (Add, Edit, Delete, Toggle Status) with live form validation.
- **Future-Ready Paid Access Architecture:** Pre-structured database schema with `access_type` (`FREE` | `PAID`) and `price_inr`. (Currently 100% Free with zero paywalls).
- **Responsive & Modern Sports Aesthetic:** Dark theme, glassmorphism cards, pulsating live indicators, and rapid search & competition filtering.

---

## 🏗️ Project Architecture

```
pirated/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin management dashboard & login
│   ├── redirect/
│   │   └── [id]/
│   │       └── route.ts          # Safe server-side 307 match redirection handler
│   ├── globals.css               # Theme styling, glassmorphism & live glow effects
│   ├── layout.tsx                # Root layout with fonts & global dark theme
│   └── page.tsx                  # Public homepage with live matches & schedule
├── components/
│   ├── Navbar.tsx                # Responsive top navigation with live match counter
│   ├── Hero.tsx                  # Hero section with CTAs and live badges
│   ├── MatchDirectory.tsx        # Search, competition filters & categorized tab lists
│   ├── LiveMatchCard.tsx         # Live fixture card with glowing "WATCH LIVE" CTA
│   ├── UpcomingMatchCard.tsx     # Upcoming fixture card with "COMING SOON" locked state
│   ├── EndedMatchCard.tsx        # Concluded match score card
│   ├── TeamBadge.tsx             # Team logo loader with dynamic fallback shield crests
│   └── Footer.tsx                # Footer with navigation, policies, and DMCA disclaimer
├── lib/
│   ├── matches.ts                # Match CRUD services (Supabase & memory fallback)
│   ├── validation.ts             # Strict URL safety and match form input validator
│   ├── sampleData.ts             # Initial sample fixtures dataset
│   └── supabase/
│       ├── client.ts             # Browser Supabase client helper
│       └── server.ts             # Server-side Supabase client helper
├── supabase/
│   └── schema.sql                # Complete SQL schema, RLS policies, and seed data
├── types/
│   └── match.ts                  # TypeScript definitions for Match & FormData
├── .env.example                  # Environment variables template
└── README.md                     # Comprehensive setup and deployment documentation
```

---

## 🚀 Quick Local Setup Instructions

### 1. Prerequisites
- **Node.js** 18+ or 20+
- **npm** / **yarn** / **pnpm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local` with your credentials:
```env
# Admin Authentication (Protected on server, NEVER exposed to client)
ADMIN_EMAIL=delhincr8281@gmail.com
ADMIN_PASSWORD=your_password_here

# Optional: Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Note: `.env.local` is ignored by git and will never be pushed to GitHub. When deploying on Vercel, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the Vercel Environment Variables).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase Database Setup & SQL Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** tab.
3. Paste and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql):

```sql
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

-- Enable Row Level Security (RLS)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy
CREATE POLICY "Public can view all matches"
    ON matches FOR SELECT
    USING (true);

-- 2. Admin Write Policy (Authenticated Users)
CREATE POLICY "Admins can insert matches"
    ON matches FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update matches"
    ON matches FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete matches"
    ON matches FOR DELETE TO authenticated
    USING (true);
```

4. Go to **Authentication > Users** in Supabase and click **Add User** (e.g. `admin@streampulse.com` with a secure password).

---

## 🔐 Admin Setup & How to Add Your First Match

1. Navigate to `/admin` in your browser.
2. Sign in with your admin credentials.
3. Click the **"Add Match"** button.
4. Fill in:
   - **Home Team:** e.g. `Manchester City`
   - **Away Team:** e.g. `Liverpool`
   - **Competition:** e.g. `Premier League`
   - **Match Date & Time:** e.g. Today, `20:00 GMT`
   - **Status:** Set to `LIVE`
   - **External Watch Live URL:** e.g. `https://external-stream-source.com/match-feed-123`
   - **Access Type:** `FREE`
5. Click **"SAVE MATCH"**.
6. The match will immediately appear in the **Live Now** section of the StreamPulse homepage.

---

## ⚡ How "WATCH LIVE" Redirection Works

When a user visits StreamPulse and clicks **"WATCH LIVE"**:

1. The client opens `/redirect/[match_id]`.
2. The server-side route handler in [`app/redirect/[id]/route.ts`](./app/redirect/[id]/route.ts):
   - Fetches the match details from Supabase.
   - Verifies the match is valid and active.
   - Validates the `watch_url` using `isValidRedirectUrl` (ensures `https:` or `http:`, strictly rejects `javascript:`, `data:`, `file:`, etc.).
   - Issues a safe HTTP `307 Temporary Redirect` to the external URL with strict referrer security headers.
3. The user arrives directly at the external stream provider with zero delay.

---

## 💳 Future Paid Access Architecture

StreamPulse is built ready for future micropayments (e.g. ₹2, ₹3, ₹5):
- The `matches` table includes `access_type` (`FREE` | `PAID`) and `price_inr`.
- When monetization is turned on in the future, the `/redirect/[id]` route will check if the user has an active access token before issuing the 307 redirect.
- All current matches default to `access_type = 'FREE'`.

---

## ☁️ Vercel Deployment Instructions

1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"New Project"**.
3. Import your repository.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.
6. Your live StreamPulse directory will be deployed on Vercel's edge network.

---

## 📄 License & Disclaimer

StreamPulse does not stream, host, record, or rebroadcast video streams. All stream links point to external third-party hosts.
