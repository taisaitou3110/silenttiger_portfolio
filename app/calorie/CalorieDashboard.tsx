"use client";

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  HelpCircle, 
  Camera, 
  Mic, 
  History, 
  ChevronRight, 
  Target, 
  Activity, 
  Flame,
  Plus,
  Zap
} from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import { addQuickLog } from '@/app/calorie/actions';
import ErrorHandler from '@/components/ErrorHandler';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';

// Wrapper component for the QuickLog form to manage its own state
function QuickLogForm({ meal }: { meal: { foodName: string; calories: number } }) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    try {
      await addQuickLog(meal.foodName, meal.calories);
      return { error: null, success: true };
    } catch (error) {
      return { error: error, success: false };
    }
  }, { error: null, success: false });

  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="w-full">
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#0cf]/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0cf]/10 flex items-center justify-center text-[#0cf]">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">{meal.foodName}</div>
            <div className="text-[10px] text-gray-500 font-mono">{meal.calories} KCAL</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
      </button>
      {state?.error && <ErrorHandler error={state.error} />}
    </form>
  );
}

export default function CalorieDashboard({
  version,
  todaysCalories,
  targetCalories,
  remainingCalories,
  sevenDayAverage,
  todaysCaloriesLogs,
  frequentMeals,
}: {
  version: string;
  todaysCalories: number;
  targetCalories: number;
  remainingCalories: number;
  sevenDayAverage: number;
  todaysCaloriesLogs: any[];
  frequentMeals: any[];
}) {
  // ガイド表示の管理
  const { isOpen: isGuideOpen, markAsSeen, showAgain } = useSessionFirstTime('has_seen_calorie_guide');

  const actionTypes = [
    {
      id: 'scan',
      title: 'スキャン登録',
      subtitle: 'Photo Scan',
      icon: <Camera className="w-8 h-8" />,
      description: '画像アップロードによるAI解析',
      href: '/calorie/scan',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      id: 'smart',
      title: 'スマート入力',
      subtitle: 'Voice/Text',
      icon: <Mic className="w-8 h-8" />,
      description: '自然言語および音声による解析',
      href: '/calorie/text',
      color: 'from-purple-500 to-indigo-400',
    },
    {
      id: 'quick',
      title: 'クイック再利用',
      subtitle: 'Favorites/History',
      icon: <History className="w-8 h-8" />,
      description: '登録済みリストから選択',
      href: '#quick-list',
      color: 'from-emerald-500 to-teal-400',
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <Image
          src="/images/toppage_wheel_labo.png"
          alt=""
          fill
          className="object-cover opacity-5"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-6">
            <Link href="/" className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Gateway
            </Link>
            <button 
              onClick={showAgain}
              className="p-2 bg-white/5 text-gray-500 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Calorie <span className="text-[#0cf]">Scan</span>
          </h1>
          <p className="text-gray-400 text-lg">
            AIが食事バランスを最適化。健康なライフスタイルをサポートします。
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-top duration-700 delay-100">
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
            <Flame className="w-8 h-8 text-blue-500 mb-4" />
            <div className="text-3xl font-black mb-1">{todaysCalories} <span className="text-xs text-gray-500 font-mono">KCAL</span></div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Today's Intake</div>
          </div>
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden">
            <Target className="w-8 h-8 text-[#0cf] mb-4" />
            <div className="text-3xl font-black mb-1">{remainingCalories} <span className="text-xs text-gray-500 font-mono">KCAL</span></div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Remaining to Target ({targetCalories})</div>
            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0cf] transition-all duration-1000" 
                style={{ width: `${Math.min(100, (todaysCalories / targetCalories) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden">
            <Activity className="w-8 h-8 text-emerald-500 mb-4" />
            <div className="text-3xl font-black mb-1">{sevenDayAverage.toFixed(0)} <span className="text-xs text-gray-500 font-mono">KCAL</span></div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">7-Day Average</div>
          </div>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {actionTypes.map((type, idx) => (
            <Link 
              key={type.id}
              href={type.href}
              className="group relative bg-gray-900/40 border border-white/10 rounded-3xl p-8 hover:border-[#0cf]/50 transition-all duration-500 hover:scale-[1.02] overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${type.color} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
              <div className="relative z-10">
                <div className="mb-6 text-[#0cf] group-hover:scale-110 transition-transform duration-500">
                  {type.icon}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-xl font-bold">{type.title}</h2>
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">{type.subtitle}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{type.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Recent Logs */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0cf]" /> Recent Intake
              </h3>
              <Link href="/calorie/log" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest">View Full Log →</Link>
            </div>
            
            <div className="space-y-3">
              {todaysCaloriesLogs.length === 0 ? (
                <div className="py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-gray-500 text-sm italic">No intake recorded today.</p>
                </div>
              ) : (
                todaysCaloriesLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <div className="font-bold text-sm">{log.foodName}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-mono">{log.inputSource}</div>
                    </div>
                    <div className="text-[#0cf] font-black">{log.calories} <span className="text-[8px]">KCAL</span></div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Reuse (Frequent Meals) */}
          <section id="quick-list" className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" /> Frequent Meals
            </h3>
            
            <div className="space-y-3">
              {frequentMeals.length === 0 ? (
                <div className="py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                  <p className="text-gray-500 text-sm italic">Frequent meals will appear here.</p>
                </div>
              ) : (
                frequentMeals.map((meal) => (
                  <QuickLogForm key={meal.foodName} meal={meal} />
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="mt-24 text-center opacity-20">
          <p className="text-[10px] font-mono tracking-[0.4em] uppercase">
            CALORIE OPTIMIZER ENGINE v{version} • SF MINIMALISM ADOPTED
          </p>
        </footer>
      </main>

      <WelcomeGuide 
        isOpen={isGuideOpen} 
        onClose={markAsSeen} 
        content={GUIDE_CONTENTS.CALORIE_APP} 
      />
    </div>
  );
}
