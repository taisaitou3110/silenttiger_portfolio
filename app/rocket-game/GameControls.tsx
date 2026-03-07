// src/components/rocket-game/GameControls.tsx
"use client";
import React from 'react';

interface GameControlsProps {
  pressure: number;
  setPressure: (val: number) => void;
  angle: number;
  setAngle: (val: number) => void;
  onLaunch: () => void;
  isFlying: boolean;
  hasWind?: boolean;
  wind: { x: number; y: number };
  fixedAngle?: number; // 💡 追加
}

export default function GameControls({
  pressure, setPressure, angle, setAngle, onLaunch, isFlying, hasWind, wind, fixedAngle
}: GameControlsProps) {
  return (
    <div className="bg-gray-800/70 p-4 rounded-xl sm:p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center sm:gap-6">
        {/* 圧力コントロール */}
        <div className="max-w-[200px] mx-auto w-full">
          <label className="block text-[#0cf] mb-2 text-sm sm:text-base tracking-tighter">PRESSURE: {pressure.toFixed(2)} MPa</label>
          <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#0cf]" />
        </div>

        {/* 発射ボタン */}
        <button 
          onClick={onLaunch} 
          disabled={isFlying} 
          className={`w-20 h-20 font-bold text-white rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all duration-200 min-h-[44px] shadow-lg ${isFlying ? 'bg-gray-600 opacity-50 scale-95' : 'bg-[#0cf] hover:bg-sky-600 active:bg-sky-700 hover:shadow-[#0cf]/20'}`}
        >
          <span className="text-2xl">🚀</span>
          <span className="text-xs mt-1">LAUNCH</span>
        </button>

        {/* 角度コントロール */}
        <div className="max-w-[200px] mx-auto w-full">
          <label className={`block mb-2 text-sm sm:text-base tracking-tighter ${fixedAngle !== undefined ? 'text-amber-500 font-bold' : 'text-white'}`}>
            ANGLE: {angle}° {fixedAngle !== undefined && "(FIXED)"}
          </label>
          <input 
            type="range" 
            min="0" max="90" 
            value={angle} 
            onChange={e => setAngle(Number(e.target.value))} 
            disabled={fixedAngle !== undefined}
            className={`w-full h-2 rounded-lg appearance-none transition-all ${fixedAngle !== undefined ? 'bg-gray-800 cursor-not-allowed opacity-30' : 'bg-gray-600 cursor-pointer accent-white'}`} 
          />
        </div>
      </div>
    </div>
  );
}
