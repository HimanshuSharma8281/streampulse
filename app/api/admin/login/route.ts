import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const envAdminEmail = (process.env.ADMIN_EMAIL || 'delhincr8281@gmail.com').trim().toLowerCase();
    const envAdminPassword = (process.env.ADMIN_PASSWORD || '828118').trim();

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    // 1. Check environment variable credentials
    if (inputEmail === envAdminEmail && inputPassword === envAdminPassword) {
      const response = NextResponse.json({ success: true, email: inputEmail });
      
      // Set secure HTTP-only cookie for session
      response.cookies.set('streampulse_admin_session', 'authenticated_' + Date.now(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. Check Supabase Auth if configured
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      });

      if (!error && data?.session) {
        const response = NextResponse.json({ success: true, email: inputEmail });
        response.cookies.set('streampulse_admin_session', 'authenticated_' + Date.now(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    }

    return NextResponse.json(
      { error: 'Invalid admin email or password.' },
      { status: 401 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
