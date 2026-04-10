import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Support two modes:
        // 1. Normal Google login: { credential: "..." }
        // 2. Direct token injection from onboarding: { access: "...", refresh: "...", user: {...} }
        if (body.access && body.refresh && body.user) {
            // Direct token injection mode (used after onboarding profile PATCH)
            const cookieStore = await cookies();
            cookieStore.set('access_token', body.access, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            cookieStore.set('refresh_token', body.refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return NextResponse.json({ user: body.user });
        }

        // Normal Google credential login
        const { credential } = body;
        if (!credential) {
            return NextResponse.json({ error: 'No credential provided' }, { status: 400 });
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error('Django returned non-JSON:', text.substring(0, 500));
            return NextResponse.json({ error: 'Backend returned invalid response' }, { status: 502 });
        }

        if (res.ok) {
            const cookieStore = await cookies();
            cookieStore.set('access_token', data.access, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            cookieStore.set('refresh_token', data.refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return NextResponse.json({ user: data.user });
        } else {
            return NextResponse.json(data, { status: res.status });
        }
    } catch (error: any) {
        console.error('Login route error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
