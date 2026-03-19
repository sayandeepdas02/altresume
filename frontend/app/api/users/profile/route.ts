import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok) {
            return NextResponse.json(data);
        } else {
            return NextResponse.json(data, { status: res.status });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
