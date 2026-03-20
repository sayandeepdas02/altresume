import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token');

    // Protect dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }

        try {
            // Check if JWT is expired
            const payloadBase64 = token.value.split('.')[1];
            if (payloadBase64) {
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    const response = NextResponse.redirect(new URL('/signin', request.url));
                    response.cookies.delete('access_token');
                    return response;
                }
            }
        } catch (error) {
            const response = NextResponse.redirect(new URL('/signin', request.url));
            response.cookies.delete('access_token');
            return response;
        }
    }

    // Redirect authenticated users away from Auth portal
    if (request.nextUrl.pathname.startsWith('/signin')) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/signin'],
};
