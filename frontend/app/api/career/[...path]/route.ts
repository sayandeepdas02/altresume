import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Catch-all proxy for /api/career/* → Django /api/career/*
 *
 * Supports GET, POST, PATCH methods.
 * Forwards httpOnly auth cookie as Bearer token.
 */

async function proxyRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await params;
        const subPath = path.join('/');
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const queryString = url.search;
        const djangoUrl = `${API_BASE}/api/career/${subPath}${queryString}`;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        const fetchOptions: RequestInit = {
            method: request.method,
            headers,
        };

        // Forward body for POST/PATCH/PUT methods
        if (['POST', 'PATCH', 'PUT'].includes(request.method)) {
            try {
                const body = await request.json();
                fetchOptions.body = JSON.stringify(body);
            } catch {
                // Request may have no body (e.g., empty POST)
            }
        }

        const res = await fetch(djangoUrl, fetchOptions);
        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('[Career Proxy Error]', error);
        return NextResponse.json(
            { error: 'Internal server error in career proxy' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
    return proxyRequest(request, context);
}
