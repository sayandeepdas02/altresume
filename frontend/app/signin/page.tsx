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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      if (data.user.onboarding_completed) {
        await login(credentialResponse.credential);
        router.push('/dashboard');
      } else {
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
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to establish profile.');
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
        
        {/* Logo Header */}
        <div className="flex justify-center mb-8">
          <div className="h-10 w-10 bg-[#0a0a0a] rounded-none flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg>
          </div>
        </div>

        <div className="card-base">
          <h2 className="text-xl font-bold text-center text-[#0a0a0a] mb-2 tracking-tight">
            {showOnboarding ? 'Complete Profile' : 'Welcome to AltResume'}
          </h2>
          <p className="text-sm text-center text-gray-500 mb-8">
            {showOnboarding ? 'Establish your workspace baseline' : 'Log in or sign up to continue'}
          </p>

          {error && (
            <div className="mb-6 rounded-none bg-red-50 p-3 flex items-start gap-2 border border-red-100">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {!showOnboarding ? (
            /* STATE 1: GOOGLE AUTH */
            <div className="flex flex-col items-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Authenticating...</p>
                </div>
              ) : (
                <div className="w-full flex justify-center pb-2">
                  <GoogleLogin
                    theme="outline"
                    shape="rectangular"
                    size="large"
                    width="334"
                    text="continue_with"
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Login was unsuccessful or canceled.')}
                  />
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: ONBOARDING */
            <form onSubmit={submitOnboarding} className="space-y-5 animate-in fade-in duration-300">
              
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-base pl-9" placeholder="Jane Doe" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">LinkedIn URL <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="url" required value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="input-base pl-9" placeholder="linkedin.com/in/jane" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Job Title <span className="text-gray-400 normal-case tracking-normal ml-1">(Optional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="text" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} className="input-base pl-9" placeholder="Software Engineer" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Current Company <span className="text-gray-400 normal-case tracking-normal ml-1">(Optional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="text" value={formData.current_company} onChange={e => setFormData({...formData, current_company: e.target.value})} className="input-base pl-9" placeholder="Acme Corp" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="btn-primary w-full h-10">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Profile"}
                </button>
              </div>
            </form>
          )}

          {!showOnboarding && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                By continuing, you agree to our <a className="text-[#0a0a0a] hover:underline" href="#">Terms of Service</a> and <a className="text-[#0a0a0a] hover:underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
