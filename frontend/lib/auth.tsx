'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

type User = {
    id: string;
    email: string;
    name: string;
};

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (credential: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch current user from Next.js server which proxies to Django
        // For simplicity, we assume we check session by calling an endpoint or restoring from local
        // Here, we'll restore user state from localStorage since HttpOnly prevents reading JWT
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (credential: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                throw new Error('Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
                {children}
            </GoogleOAuthProvider>
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
