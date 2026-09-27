import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MatchDirectory from '@/components/MatchDirectory';
import Footer from '@/components/Footer';
import { getAllMatches } from '@/lib/matches';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'StreamPulse | Live Football Directory & Direct Match Streams',
  description: 'Discover and watch live football matches across Premier League, UEFA Champions League, La Liga, Serie A, and more with instant external broadcast redirection.',
  openGraph: {
    title: 'StreamPulse | Live Football Matches Directory',
    description: 'Instant direct routing to live football broadcasts worldwide.',
    type: 'website',
  },
};

export default async function HomePage() {
  const { matches, isMock } = await getAllMatches();
  const liveCount = matches.filter((m) => m.status === 'LIVE').length;

  return (
    <div className="flex min-h-screen flex-col bg-[#080b11] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <Navbar liveCount={liveCount} />
      <main className="flex-1">
        <Hero liveCount={liveCount} />
        <MatchDirectory initialMatches={matches} isMock={isMock} />
      </main>
      <Footer />
    </div>
  );
}
