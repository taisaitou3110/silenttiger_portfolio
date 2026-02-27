"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, FileText, ShoppingCart, Database, GraduationCap, ChevronRight, UserCircle2, Plus, Users, Settings2, Sparkles } from 'lucide-react';
import { getUserProfiles, createUserProfile } from './actions';

export default function HandwritingDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPenType, setNewPenType] = useState("ボールペン");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getUserProfiles();
      setProfiles(res);
      const savedId = localStorage.getItem('handwriting_active_profile_id');
      if (savedId) {
        const active = res.find((p: any) => p.id === savedId);
        if (active) setActiveProfile(active);
      } else if (res.length > 0) {
        setActiveProfile(res[0]);
        localStorage.setItem('handwriting_active_profile_id', res[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async () => {
    if (!newDisplayName) return;
    try {
      const res = await createUserProfile(newDisplayName, newPenType);
      setProfiles([...profiles, res]);
      setActiveProfile(res);
      localStorage.setItem('handwriting_active_profile_id', res.id);
      setShowCreate(false);
      setNewDisplayName("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSwitch = (profile: any) => {
    setActiveProfile(profile);
    localStorage.setItem('handwriting_active_profile_id', profile.id);
  };

  const docTypes = [
    {
      id: 'business',
      title: 'ビジネス電話',
      icon: <FileText className="w-8 h-8" />,
      description: '電話での相談内容や要件をデジタル化',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      id: 'order',
      title: '発注電話',
      icon: <ShoppingCart className="w-8 h-8" />,
      description: '商品名、数量、金額を自動抽出',
      color: 'from-purple-500 to-indigo-400',
    },
    {
      id: 'general',
      title: '一般メモ',
      icon: <Camera className="w-8 h-8" />,
      description: '自由な形式のメモやアイデア記録',
      color: 'from-emerald-500 to-teal-400',
    }
  ];

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-[#0cf] font-mono tracking-[0.5em]">SYSTEM INITIALIZING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-4">
            <Link href="/" className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity">
              ← Back to Gateway
            </Link>
            
            {/* Phase 4: Profile Selector UI */}
            <div className="relative group">
              <button 
                onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0cf] to-blue-600 flex items-center justify-center text-black">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Active Profile</div>
                  <div className="text-sm font-black">{activeProfile?.displayName || "Guest"}</div>
                </div>
                <Users className="w-4 h-4 text-gray-500 ml-2" />
              </button>
              
              {/* Dropdown / Modal for Profile Management */}
              {showCreate && (
                <div className="absolute right-0 mt-4 w-72 bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest">Profiles</h3>
                    <div className="text-[10px] text-gray-500">{profiles.length}/10</div>
                  </div>
                  
                  <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSwitch(p)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${p.id === activeProfile?.id ? 'bg-[#0cf]/10 border-[#0cf]/50' : 'bg-white/5 border-transparent hover:border-white/20'}`}
                      >
                        <span className="text-sm font-bold">{p.displayName}</span>
                        {p.id === activeProfile?.id && <div className="w-2 h-2 rounded-full bg-[#0cf] shadow-[0_0_8px_#0cf]" />}
                      </button>
                    ))}
                  </div>
                  
                  {profiles.length < 10 && (
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <input 
                        placeholder="New Profile Name" 
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs focus:border-[#0cf] outline-none"
                      />
                      <select 
                         value={newPenType}
                         onChange={(e) => setNewPenType(e.target.value)}
                         className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs outline-none"
                      >
                        <option>ボールペン</option>
                        <option>万年筆</option>
                        <option>筆ペン</option>
                        <option>鉛筆</option>
                      </select>
                      <button 
                        onClick={handleCreate}
                        className="w-full py-2 bg-[#0cf] text-black font-black text-xs rounded-xl hover:bg-[#0ef] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3 h-3" /> CREATE PROFILE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Handwriting <span className="text-[#0cf]">Business</span>
          </h1>
          <p className="text-gray-400 text-lg">
            {activeProfile ? `${activeProfile.displayName}さんの筆跡を学習中。` : "書類タイプを選択してスキャンを開始してください。"}
          </p>
        </header>

        {/* Phase 5: Onboarding / Training Callout */}
        {activeProfile && activeProfile.trainingLevel < 5 && (
          <Link 
            href={`/handwriting/onboarding?profileId=${activeProfile.id}`}
            className="block mb-12 p-1 bg-gradient-to-r from-[#0cf] to-purple-500 rounded-3xl hover:scale-[1.01] transition-transform duration-500"
          >
            <div className="bg-black rounded-[22px] p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#0cf]">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Training Mode Active</h2>
                  <p className="text-gray-500 text-sm">ステップ {activeProfile.trainingLevel + 1}/5 を完了して精度を向上させましょう。</p>
                </div>
              </div>
              <ChevronRight className="w-8 h-8 text-[#0cf]" />
            </div>
          </Link>
        )}

        {/* メインアクション: スキャン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {docTypes.map((type, idx) => (
            <Link 
              key={type.id}
              href={`/handwriting/scan?type=${type.id}&profileId=${activeProfile?.id}`}
              className="group relative bg-gray-900/40 border border-white/10 rounded-3xl p-8 hover:border-[#0cf]/50 transition-all duration-500 hover:scale-[1.02] overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${type.color} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
              <div className="relative z-10">
                <div className="mb-6 text-[#0cf] group-hover:scale-110 transition-transform duration-500">
                  {type.icon}
                </div>
                <h2 className="text-xl font-bold mb-2">{type.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{type.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* サブアクション: 管理・学習 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/handwriting/data"
            className="flex items-center justify-between p-6 bg-gray-900/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Database Viewer</h3>
                <p className="text-xs text-gray-500">顧客・要件・発注データの管理</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
          </Link>

          <Link 
            href={`/handwriting/training?profileId=${activeProfile?.id}`}
            className="flex items-center justify-between p-6 bg-gray-900/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Training Status</h3>
                <p className="text-xs text-gray-500">個人筆跡データの蓄積・分析</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
          </Link>
        </div>

        <footer className="mt-24 text-center opacity-20">
          <p className="text-[10px] font-mono tracking-[0.4em] uppercase">
            Multi-User OCR Engine v1.0 • Phase 4 Activated
          </p>
        </footer>
      </div>
    </div>
  );
}
