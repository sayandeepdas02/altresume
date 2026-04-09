'use client';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from "react";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 mr-4 flex items-center gap-3 px-2 py-1 group"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[#0a0a0a] transition-transform group-hover:scale-105 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
      </div>
      <span className="text-[17px] font-bold tracking-tight text-[#0a0a0a] dark:text-white">
        AltResume
      </span>
    </a>
  );
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const navItems = pathname === '/' ? [
    { name: "Features", link: "#features" },
    { name: "Pricing", link: "#pricing" },
  ] : [];

  return (
    <div className="relative w-full">
      <ResizableNavbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-6">
                <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#0a0a0a] dark:hover:text-white transition-colors">
                  Dashboard
                </a>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-none bg-gray-100 border border-gray-200">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-[#0a0a0a] dark:text-white">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <NavbarButton href="/signin" variant="secondary">Sign In</NavbarButton>
                <NavbarButton href="/signin" variant="primary">Get Started</NavbarButton>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            
            <div className="flex w-full flex-col gap-4 mt-4 border-t border-gray-100 pt-4">
              {user ? (
                <>
                  <a href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-600 dark:text-neutral-300">
                    Dashboard ({user.name})
                  </a>
                  <NavbarButton
                    onClick={handleLogout}
                    variant="secondary"
                    className="w-full text-left"
                  >
                    Logout
                  </NavbarButton>
                </>
              ) : (
                <>
                  <NavbarButton
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full"
                  >
                    Sign In
                  </NavbarButton>
                  <NavbarButton
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full"
                  >
                    Get Started
                  </NavbarButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </ResizableNavbar>
    </div>
  );
}