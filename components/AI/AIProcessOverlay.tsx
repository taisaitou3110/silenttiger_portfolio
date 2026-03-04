"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Activity, Brain, Zap, Hash, Terminal, Cpu, ChevronDown, ChevronUp, X } from 'lucide-react';

export type AIProcessStatus = 'transfer' | 'thinking' | 'generating' | 'completed' | 'idle' | 'error';

export interface AIMetrics {
  input_tokens: number;
  thought_seconds: number;
  current_tps: number;
  total_latency: number;
  status: AIProcessStatus;
  debug_log: string;
}

interface Props {
  metrics: AIMetrics;
  thoughtText?: string;
  title?: string;
}

/**
 * 数値を滑らかにカウントアップするフック
 */
function useCountUp(end: number, duration: number = 300) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);

  useEffect(() => {
    startTime.current = null;
    startValue.current = count;
  }, [end]);

  useEffect(() => {
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = startValue.current + (end - startValue.current) * easeOutQuad(progress);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export const AIProcessOverlay: React.FC<Props> = ({ 
  metrics, 
  thoughtText, 
  title = "Neural Link Processor" 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // カウントアップ演出用 (durationを短くして機敏に)
  const displayTPS = useCountUp(metrics.current_tps, 200);
  const displayTokens = useCountUp(metrics.input_tokens, 400);
  const displayLatency = useCountUp(metrics.total_latency, 400);
  const displayThinking = useCountUp(metrics.thought_seconds, 400);

  useEffect(() => {
    if (metrics.status !== 'idle') {
      setIsVisible(true);
      setIsMinimized(false);
    }

    // 完了またはエラー時、5秒後に自動で隠す
    if (metrics.status === 'completed' || metrics.status === 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [metrics.status]);

  if (!isVisible && metrics.status === 'idle') return null;

  const statusConfig = {
    idle: { label: 'STANDBY', color: 'text-gray-500', glow: 'shadow-none', icon: <Cpu className="w-4 h-4" /> },
    transfer: { label: 'UPLINKING', color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]', icon: <Activity className="w-4 h-4 animate-pulse" /> },
    thinking: { label: 'COGNITION', color: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]', icon: <Brain className="w-4 h-4 animate-bounce" /> },
    generating: { label: 'SYNTHESIZING', color: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]', icon: <Zap className="w-4 h-4 animate-spin" /> },
    completed: { label: 'SYNCED', color: 'text-white', glow: 'shadow-[0_0_15px_rgba(255,255,255,0.3)]', icon: <Hash className="w-4 h-4" /> },
    error: { label: 'DISCONNECTED', color: 'text-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]', icon: <Terminal className="w-4 h-4" /> },
  };

  const config = statusConfig[metrics.status];

  return (
    <div className={`fixed bottom-6 right-6 z-[200] w-80 md:w-96 transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
      <div className={`bg-black/90 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl ${config.glow}`}>
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b border-white/10 ${config.color} bg-white/5`}>
          <div className="flex items-center gap-2">
            {config.icon}
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono opacity-50 truncate max-w-[100px]">{metrics.debug_log}</span>
            <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/10 p-1 rounded-md transition-colors">
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsVisible(false)} className="hover:bg-white/10 p-1 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Main Status */}
            <div className="px-6 py-4 flex items-baseline justify-between">
              <span className={`text-2xl font-black italic tracking-tighter ${config.color}`}>
                {config.label}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Process Flow</span>
                <div className="h-1 w-24 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${config.color.replace('text', 'bg')}`}
                    style={{ width: metrics.status === 'completed' ? '100%' : metrics.status === 'generating' ? '70%' : metrics.status === 'thinking' ? '40%' : '10%' }}
                  />
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 divide-x divide-y divide-white/5 border-t border-white/5">
              <div className="p-4 space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Input Latency</span>
                <div className="text-lg font-mono text-blue-400 leading-none">
                  {displayLatency.toFixed(2)}<span className="text-[10px] ml-1 opacity-50">s</span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cognition Time</span>
                <div className="text-lg font-mono text-purple-400 leading-none">
                  {displayThinking.toFixed(2)}<span className="text-[10px] ml-1 opacity-50">s</span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sync Speed</span>
                <div className="text-lg font-mono text-emerald-400 leading-none">
                  {displayTPS.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">TPS</span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total Data</span>
                <div className="text-lg font-mono text-gray-300 leading-none">
                  {Math.floor(displayTokens)}<span className="text-[10px] ml-1 opacity-50">TKNS</span>
                </div>
              </div>
            </div>

            {/* Thought Streaming Area */}
            {thoughtText && (
              <div className="p-4 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-2 mb-2 text-purple-400/50">
                  <Brain className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-purple-400/50 font-mono">Neural Thinking Stream...</span>
                </div>
                <div className="h-24 overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-[11px] font-mono text-purple-300/70 leading-relaxed italic animate-in fade-in duration-1000">
                    {thoughtText}
                    {metrics.status === 'thinking' && <span className="inline-block w-1.5 h-3 bg-purple-500 ml-1 animate-pulse" />}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
