'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (pathname === '/') {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-gray-900 group-hover:text-black transition-colors">
                        AltResume
                    </span>
                </Link>
                
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Dashboard
                            </Link>
                            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 shadow-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                aria-label="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/signin"
                            className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            Get Started
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
