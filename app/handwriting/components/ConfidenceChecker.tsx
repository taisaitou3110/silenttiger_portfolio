"use client";

import React, { useState } from 'react';
import { AlertTriangle, Check, RotateCcw } from 'lucide-react';

interface ConfidenceCheckerProps {
  label: string;
  value: string;
  confidence: number;
  imagePatch?: string; // Base64 of the specific word/character
  onCorrect: (newValue: string) => void;
}

export default function ConfidenceChecker({ label, value, confidence, imagePatch, onCorrect }: ConfidenceCheckerProps) {
  const [inputValue, setInputValue] = useState(value);
  const isLowConfidence = confidence < 0.8;
  const [isCorrected, setIsCorrected] = useState(false);

  // モック候補 (実際にはGeminiのn-bestから取得したい)
  const candidates = [value, "高橋", "佐藤", "田中", "渡辺"].filter(c => c !== value).slice(0, 4);

  if (!isLowConfidence && !isCorrected) return (
    <div className="flex items-center justify-between p-4 bg-gray-900/20 border border-white/5 rounded-xl">
      <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );

  return (
    <div className={`p-4 rounded-xl border transition-all duration-500 ${isCorrected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isCorrected ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          <span className={`text-xs font-bold uppercase tracking-widest ${isCorrected ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isCorrected ? 'Corrected' : `Low Confidence (${(confidence * 100).toFixed(0)}%)`}
          </span>
        </div>
        <span className="text-gray-500 text-[10px] font-mono uppercase">{label}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* 画像パッチ (モック) */}
        <div className="w-full md:w-32 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center text-[10px] text-gray-600">
          {imagePatch ? (
            <img src={imagePatch} alt="Handwriting Patch" className="w-full h-full object-contain" />
          ) : (
            <span className="italic">Image Patch</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              if (inputValue !== value) {
                setIsCorrected(true);
                onCorrect(inputValue);
              }
            }}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-lg font-bold focus:border-[#0cf] outline-none transition-colors"
          />
          
          {!isCorrected && (
            <div className="flex flex-wrap gap-2">
              {candidates.map((cand) => (
                <button
                  key={cand}
                  type="button"
                  onClick={() => {
                    setInputValue(cand);
                    setIsCorrected(true);
                    onCorrect(cand);
                  }}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs transition-colors"
                >
                  {cand}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
