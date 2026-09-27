'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Shield } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-950/90 py-12 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
                <Radio className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Stream<span className="text-emerald-400">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              StreamPulse is a modern live football schedule directory and external source routing platform. Connecting passionate football fans directly with broadcast destinations worldwide.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Safe &amp; Verified Direct Routing Engine</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="#live-matches" className="hover:text-emerald-400 transition-colors">
                  Live Matches
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Legal &amp; Policy
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <span className="text-slate-400 cursor-default hover:text-slate-300">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-slate-400 cursor-default hover:text-slate-300">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 cursor-default hover:text-slate-300">
                  DMCA &amp; Content Disclaimer
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="max-w-3xl leading-relaxed">
            <strong>Disclaimer:</strong> StreamPulse does not host, upload, record, or transmit any video, media streams, or audio files. StreamPulse merely acts as an indexed directory pointing to external third-party links publicly available on the internet.
          </p>
          <div className="shrink-0 text-slate-400 flex items-center gap-1">
            <span>&copy; {currentYear} StreamPulse. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
