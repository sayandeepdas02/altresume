import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/export/templates/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error fetching templates' }, { status: 500 });
    }
}
