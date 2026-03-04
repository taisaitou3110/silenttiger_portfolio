"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Activity, Brain, Zap, Hash, Terminal } from 'lucide-react';

export interface AIMetrics {
  input_tokens: number;
  thought_seconds: number;
  current_tps: number;
  total_latency: number;
  status: 'transfer' | 'thinking' | 'generating' | 'completed' | 'idle' | 'error';
  debug_log: string;
}

interface Props {
  metrics: AIMetrics;
  thoughtText?: string;
}

export const AIMetricsDisplay: React.FC<Props> = ({ metrics, thoughtText }) => {
  const [showThoughts, setShowThoughts] = useState(false);

  // ステータスに応じたラベルと色の設定
  const statusConfig = {
    idle: { label: '待機中', color: 'text-gray-500', icon: <Loader2 className="w-4 h-4 opacity-20" /> },
    transfer: { label: 'プロンプト解析中...', color: 'text-blue-400', icon: <Activity className="w-4 h-4 animate-pulse" /> },
    thinking: { label: '思考中 (Thinking)...', color: 'text-purple-400', icon: <Brain className="w-4 h-4 animate-bounce" /> },
    generating: { label: '記事生成中...', color: 'text-emerald-400', icon: <Zap className="w-4 h-4 animate-spin" /> },
    completed: { label: '生成完了', color: 'text-white', icon: <Hash className="w-4 h-4" /> },
    error: { label: 'エラーが発生しました', color: 'text-red-500', icon: <Terminal className="w-4 h-4" /> },
  };

  const config = statusConfig[metrics.status];

  if (metrics.status === 'idle') return null;

  return (
    <div className="bg-black/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* メインステータスバー */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`${config.color}`}>
            {config.icon}
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="text-[10px] font-mono text-gray-500">
          {metrics.debug_log}
        </div>
      </div>

      {/* メトリクスグリッド */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 bg-white/[0.02]">
        <div className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Input Latency</div>
          <div className="text-sm font-mono text-blue-400">
            {metrics.total_latency.toFixed(2)}s
          </div>
        </div>
        <div className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Thinking Time</div>
          <div className="text-sm font-mono text-purple-400">
            {metrics.thought_seconds.toFixed(2)}s
          </div>
        </div>
        <div className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Generation Speed</div>
          <div className="text-sm font-mono text-emerald-400">
            {metrics.current_tps.toFixed(1)} <span className="text-[10px]">TPS</span>
          </div>
        </div>
        <div className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Total Payload</div>
          <div className="text-sm font-mono text-gray-300">
            {metrics.input_tokens} <span className="text-[10px]">Tokens</span>
          </div>
        </div>
      </div>

      {/* 思考プロセス（Thought）表示エリア */}
      {thoughtText && (
        <div className="border-t border-white/5">
          <button 
            onClick={() => setShowThoughts(!showThoughts)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors group"
          >
            <span className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest">Thought Process (Live)</span>
            <span className="text-[10px] text-gray-600 group-hover:text-gray-400">
              {showThoughts ? '▲ HIDE' : '▼ SHOW'}
            </span>
          </button>
          
          {showThoughts && (
            <div className="px-4 pb-4 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="bg-black/40 rounded-lg p-3 text-[12px] font-mono text-purple-300/80 leading-relaxed italic whitespace-pre-wrap">
                {thoughtText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
