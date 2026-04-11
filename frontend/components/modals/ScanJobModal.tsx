'use client';

import { useState } from 'react';
import { X, Search, Loader2, MapPin, Briefcase, GraduationCap } from 'lucide-react';

interface ScanJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (jobs: any[]) => void;
}

export default function ScanJobModal({ isOpen, onClose, onScanComplete }: ScanJobModalProps) {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!role.trim()) {
      setError('Please enter a job role.');
      return;
    }

    setError('');
    setIsScanning(true);

    try {
      const res = await fetch('/api/jobs/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location, experience }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      onScanComplete(data.jobs || []);
      onClose();
      setRole('');
      setLocation('');
      setExperience('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#4f0f62]/10 flex items-center justify-center">
              <Search size={16} className="text-[#4f0f62]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Auto Scan Jobs</h2>
              <p className="text-xs text-gray-500">AI will find and rank jobs for you</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Briefcase size={13} /> Target Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="input-base"
              autoFocus
              disabled={isScanning}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} /> Preferred Location
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Remote, Bangalore"
              className="input-base"
              disabled={isScanning}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={13} /> Experience Level
            </label>
            <select
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="input-base"
              disabled={isScanning}
            >
              <option value="">Any</option>
              <option value="entry">Entry Level (0-2 yrs)</option>
              <option value="mid">Mid Level (2-5 yrs)</option>
              <option value="senior">Senior Level (5+ yrs)</option>
              <option value="lead">Lead / Staff (8+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" disabled={isScanning}>
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn-primary gap-2 h-10 px-5 text-sm"
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Search size={14} /> Scan Jobs
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
