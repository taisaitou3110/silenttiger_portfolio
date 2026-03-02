"use client";

import React, { useState } from 'react';
import { UserCircle2, Users, Plus, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  displayName: string;
  [key: string]: any;
}

interface ProfileSelectorProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  onSwitch: (profile: Profile) => void;
  onCreate: (displayName: string, extraData?: any) => Promise<any>;
  maxProfiles?: number;
  extraField?: {
    label: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
  };
}

export default function ProfileSelector({ 
  profiles, 
  activeProfile, 
  onSwitch, 
  onCreate, 
  maxProfiles = 10,
  extraField
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newDisplayName || isCreating) return;
    setIsCreating(true);
    try {
      await onCreate(newDisplayName);
      setNewDisplayName("");
      setIsOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-black">
          <UserCircle2 className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Active Profile</div>
          <div className="text-sm font-black">{activeProfile?.displayName || "Guest"}</div>
        </div>
        <Users className="w-4 h-4 text-gray-500 ml-2" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-4 w-72 bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in duration-200 text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest">Profiles</h3>
            <div className="text-[10px] text-gray-500">{profiles.length}/{maxProfiles}</div>
          </div>
          
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onSwitch(p);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${p.id === activeProfile?.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-transparent hover:border-white/20'}`}
              >
                <span className="text-sm font-bold">{p.displayName}</span>
                {p.id === activeProfile?.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
              </button>
            ))}
          </div>
          
          {profiles.length < maxProfiles && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <input 
                placeholder="New Profile Name" 
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs focus:border-blue-500 outline-none text-white"
              />
              
              {extraField && (
                <select 
                   value={extraField.value}
                   onChange={(e) => extraField.onChange(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs outline-none text-white"
                >
                  {extraField.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-2 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                CREATE PROFILE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
