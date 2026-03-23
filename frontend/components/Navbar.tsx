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

  // Keep it simple and minimal
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#0a0a0a] transition-transform group-hover:scale-105 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-[#0a0a0a]">
            AltResume
          </span>
        </Link>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#0a0a0a] transition-colors">
                Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-none bg-gray-100 border border-gray-200">
                  <User className="h-3 w-3 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-[#0a0a0a]">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-[#0a0a0a] transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {pathname === '/' && (
                <>
                  <a href="#features" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-[#0a0a0a] transition-colors">Features</a>
                  <a href="#pricing" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-[#0a0a0a] transition-colors">Pricing</a>
                  <div className="hidden sm:block h-4 w-px bg-gray-200 mx-2" />
                </>
              )}
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-500 hover:text-[#0a0a0a] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signin"
                className="btn-primary py-1.5 px-3"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
