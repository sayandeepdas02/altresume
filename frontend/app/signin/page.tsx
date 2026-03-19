'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, Briefcase, Link as LinkIcon, Building2, User } from 'lucide-react';

export default function SigninPage() {
    const { login } = useAuth();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Onboarding Form State Machine
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        linkedin_url: '',
        job_title: '',
        current_company: ''
    });

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            // Hit the Next.js API route that inherently sets the secure cookies
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Authentication failed');
            
            // Check the seamlessly forwarded Django User Payload
            if (data.user.onboarding_completed) {
                // Happy path: Hydrate context and route instantly
                await login(credentialResponse.credential);
                router.push('/dashboard');
            } else {
                // Intercept the redirect gracefully and flip the UI state without blowing away the Cookies
                setFormData(prev => ({ ...prev, name: data.user.name || '' }));
                setShowOnboarding(true);
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Login failed.');
            setIsLoading(false);
        }
    };

    const submitOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            // Hit our new Secure Proxy which embeds the `access` cookie automatically out of Next.js memory
            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to establish profile.');
            
            // Onboarding successful, securely shift into Dashboard Context.
            // Using window.location forces a hard hydration pulling the fresh user data.
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                    {showOnboarding ? 'Complete Profile' : 'Get Started'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {showOnboarding ? 'Establish your workspace baseline' : 'Sign in to access your AltResume workspace'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-2xl sm:px-10">
                    
                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 p-4 flex items-start gap-3 border border-red-100">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {!showOnboarding ? (
                        /* STATE 1: GOOGLE AUTH */
                        <div className="flex flex-col items-center justify-center space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                    <p className="text-sm font-medium text-gray-500">Checking credentials...</p>
                                </div>
                            ) : (
                                <div className="w-full flex justify-center py-2">
                                    <GoogleLogin
                                        theme="outline"
                                        shape="rectangular"
                                        size="large"
                                        width="320"
                                        text="continue_with"
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google Login was unsuccessful or canceled.')}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STATE 2: ONBOARDING PIPELINE */
                        <form onSubmit={submitOnboarding} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm bg-gray-50 text-gray-900" placeholder="Jane Doe" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">LinkedIn Profile URL <span className="text-red-500">*</span></label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="url" required value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm bg-gray-50 text-gray-900" placeholder="https://linkedin.com/in/..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Job Title <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm text-gray-900" placeholder="Senior AI Engineer" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Company <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" value={formData.current_company} onChange={e => setFormData({...formData, current_company: e.target.value})} className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm text-gray-900" placeholder="Acme Corp" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalize Profile & Enter"}
                                </button>
                            </div>
                        </form>
                    )}

                    {!showOnboarding && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center">
                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                By continuing, you agree to our <a className="underline hover:text-gray-800" href="#">Terms of Service</a> and <a className="underline hover:text-gray-800" href="#">Privacy Policy</a>.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
