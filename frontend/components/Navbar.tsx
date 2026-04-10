'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Panel, PanelContent } from '@/components/ui/panel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Panel className="mx-auto max-w-7xl w-full sticky top-0 z-50 bg-[#f4efe9]/80 backdrop-blur-md border-b border-[#1c1c1c]/10">
      <PanelContent className="py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-7 w-7 relative overflow-hidden rounded-md transition-transform group-hover:scale-110 border border-[#1c1c1c]/10 shadow-sm shrink-0">
            <Image src="/logo.png" alt="AltResume Logo" fill className="object-cover" priority sizes="28px" />
          </div>
          <span className="font-bold text-[#4f0f62] text-base tracking-tight text-balance">AltResume</span>
        </Link>
        
        <nav className="flex items-center gap-6 text-sm font-medium text-[#1c1c1c]/70">
          {pathname === '/' && (
            <>
              <Link href="#features" className="hover:text-[#4f0f62] transition-colors px-1 py-1">Features</Link>
              <Link href="#pricing" className="hover:text-[#4f0f62] transition-colors px-1 py-1">Pricing</Link>
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-6 ml-2">
              <Link href="/dashboard" className="text-[#1c1c1c] hover:text-[#4f0f62] transition-colors font-medium">Dashboard</Link>
              <button onClick={() => logout()} className="hover:text-[#4f0f62] transition-colors flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-200/50" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-2">
              <Link 
                href="/sign" 
                className="inline-flex items-center justify-center px-4 py-2 bg-[#ffc629] text-[#1c1c1c] text-sm font-semibold rounded-md hover:bg-[#e5b022] transition-colors border border-[#1c1c1c]/10 shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </PanelContent>
    </Panel>
  );
}