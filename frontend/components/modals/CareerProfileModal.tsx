'use client';

import { useState, useEffect } from 'react';
import { X, User, Plus, Trash2, Loader2, Briefcase, MapPin, DollarSign, Shield } from 'lucide-react';
import { getCareerProfile, saveCareerProfile, type CareerProfile } from '@/services/careerApi';

interface CareerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (profile: CareerProfile) => void;
}

export default function CareerProfileModal({ isOpen, onClose, onSaved }: CareerProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [targetRoles, setTargetRoles] = useState<string[]>(['']);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [remotePreferred, setRemotePreferred] = useState(true);
  const [cities, setCities] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('INR');

  // Load existing profile
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      const result = await getCareerProfile();
      if (result.success && result.data) {
        const p = result.data;
        setTargetRoles(p.target_roles.length > 0 ? p.target_roles : ['']);
        setExcludedKeywords(p.excluded_keywords || []);
        setRemotePreferred(p.location_preferences?.remote ?? true);
        setCities((p.location_preferences?.cities || []).join(', '));
        setSalaryMin(p.salary_range?.min?.toString() || '');
        setSalaryMax(p.salary_range?.max?.toString() || '');
        setCurrency(p.salary_range?.currency || 'INR');
      }
      setLoading(false);
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const validRoles = targetRoles.filter(r => r.trim());
    if (validRoles.length === 0) {
      setError('Add at least one target role.');
      return;
    }

    setError('');
    setSaving(true);

    const profile: Partial<CareerProfile> = {
      target_roles: validRoles,
      excluded_keywords: excludedKeywords,
      location_preferences: {
        remote: remotePreferred,
        cities: cities.split(',').map(c => c.trim()).filter(Boolean),
      },
      salary_range: {
        min: salaryMin ? parseInt(salaryMin) : undefined,
        max: salaryMax ? parseInt(salaryMax) : undefined,
        currency,
      },
      target_companies: [],
    };

    const result = await saveCareerProfile(profile);

    if (result.success && result.data) {
      onSaved(result.data);
      onClose();
    } else {
      setError(result.error || 'Failed to save profile');
    }

    setSaving(false);
  };

  const addRole = () => setTargetRoles([...targetRoles, '']);
  const removeRole = (i: number) => setTargetRoles(targetRoles.filter((_, idx) => idx !== i));
  const updateRole = (i: number, value: string) => {
    const copy = [...targetRoles];
    copy[i] = value;
    setTargetRoles(copy);
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !excludedKeywords.includes(newExclusion.trim())) {
      setExcludedKeywords([...excludedKeywords, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#4f0f62]/10 flex items-center justify-center">
              <User size={16} className="text-[#4f0f62]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1c1c]">Career Profile</h2>
              <p className="text-xs text-gray-500">Configure your job targeting preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              {/* Target Roles */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Briefcase size={13} /> Target Roles <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {targetRoles.map((role, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={role}
                        onChange={e => updateRole(i, e.target.value)}
                        placeholder="e.g. Frontend Developer"
                        className="input-base flex-1"
                      />
                      {targetRoles.length > 1 && (
                        <button onClick={() => removeRole(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addRole} className="text-xs font-medium text-[#4f0f62] hover:underline flex items-center gap-1 self-start">
                    <Plus size={12} /> Add another role
                  </button>
                </div>
              </div>

              {/* Excluded Keywords */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Shield size={13} /> Exclude Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={e => setNewExclusion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
                    placeholder="e.g. intern, junior"
                    className="input-base flex-1"
                  />
                  <button onClick={addExclusion} className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors">
                    Add
                  </button>
                </div>
                {excludedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {excludedKeywords.map(kw => (
                      <span key={kw} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        {kw}
                        <button onClick={() => setExcludedKeywords(excludedKeywords.filter(k => k !== kw))} className="hover:text-red-800">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin size={13} /> Location Preferences
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remotePreferred}
                      onChange={e => setRemotePreferred(e.target.checked)}
                      className="rounded border-gray-300 text-[#4f0f62] focus:ring-[#4f0f62]"
                    />
                    Open to remote
                  </label>
                </div>
                <input
                  type="text"
                  value={cities}
                  onChange={e => setCities(e.target.value)}
                  placeholder="Preferred cities (comma-separated)"
                  className="input-base"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <DollarSign size={13} /> Salary Range
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    placeholder="Min"
                    className="input-base"
                  />
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={e => setSalaryMax(e.target.value)}
                    placeholder="Max"
                    className="input-base"
                  />
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-base">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary gap-2 h-10 px-5 text-sm">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
