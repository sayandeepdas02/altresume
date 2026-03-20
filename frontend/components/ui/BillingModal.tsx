'use client';

import { X, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingModal({ isOpen, onClose }: BillingModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <Zap className="w-6 h-6" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            You've run out of tokens
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Upgrade your plan to continue optimizing resumes and bypassing the ATS with our AI Copilot.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"><span className="font-bold text-gray-900">$9</span></div>
              <p className="text-sm text-gray-600"><strong>Basic</strong> – 100 Resumes optimizations.</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"><span className="font-bold text-gray-900">$29</span></div>
              <p className="text-sm text-gray-600"><strong>Pro</strong> – 300 Resumes + Cover Letters.</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg tracking-wider">Most Popular</div>
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"><span className="font-bold text-gray-900">$49</span></div>
              <p className="text-sm text-gray-600"><strong>Premium</strong> – 1000 Resumes + Cold Emails.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/pricing"
              className="w-full bg-black text-white hover:bg-gray-800 font-medium py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              onClick={onClose}
            >
              View Pricing Plans
            </Link>
            <button 
              onClick={onClose}
              className="w-full bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent font-medium py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
