// このファイルは、ロケットゲームの操作パネルのコンポーネントです
// src/components/rocket-game/GameControls.tsx
// "use client" は、このコンポーネントがクライアントサイドで実行されることを示します
"use client";
// Reactライブラリをインポートします
import React from 'react';

// GameControlsコンポーネントが受け取るプロパティの型を定義します
interface GameControlsProps {
  // 圧力の値
  pressure: number;
  // 圧力を設定する関数
  setPressure: (val: number) => void;
  // 角度の値
  angle: number;
  // 角度を設定する関数
  setAngle: (val: number) => void;
  // 発射時に呼ばれる関数
  onLaunch: () => void;
  // 飛行中かどうかを示すブール値
  isFlying: boolean;
  // 風があるかどうかを示すブール値（オプショナル）
  hasWind?: boolean;
  // 風のベクトル
  wind: { x: number; y: number };
}

// GameControlsコンポーネントをエクスポートします
export default function GameControls({
  // プロパティを分割代入で受け取ります
  pressure, setPressure, angle, setAngle, onLaunch, isFlying, hasWind, wind
// GameControlsProps 型のプロパティを受け取ります
}: GameControlsProps) {
  // コンポーネントのJSXを返します
  return (
    <div className="bg-gray-800/70 p-4 rounded-xl sm:p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center sm:gap-6">
        {/* 圧力コントロールのコンテナです */}
        <div className="max-w-[200px] mx-auto w-full">
          <label className="block text-[#0cf] mb-2 text-sm sm:text-base">PRESSURE: {pressure.toFixed(2)} MPa</label>
          <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#0cf]" />
        </div>

        {/* 発射ボタンです */}
        <button 
          onClick={onLaunch} 
          disabled={isFlying} 
          className={`w-20 h-20 font-bold text-white rounded-xl cursor-pointer flex flex-col items-center justify-center transition-colors duration-200 min-h-[44px] ${isFlying ? 'bg-gray-600' : 'bg-[#0cf] hover:bg-sky-600 active:bg-sky-700'}`}
        >
          <span className="text-2xl">🚀</span>
          <span className="text-xs mt-1">LAUNCH</span>
        </button>

        {/* 角度コントロールのコンテナです */}
        <div className="max-w-[200px] mx-auto w-full">
          <label className="block text-white mb-2 text-sm sm:text-base">ANGLE: {angle}°</label>
          <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white" />
        </div>
      </div>
    </div>
  );
}