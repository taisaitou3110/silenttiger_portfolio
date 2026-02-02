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
    <div style={{ background: 'rgba(34, 34, 34, 0.7)', padding: '15px', borderRadius: '12px' }}>
      {/* グリッドレイアウトのコンテナで、各要素を中央揃えで配置します */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center' }}>
        {/* 圧力コントロールのコンテナです */}
        <div style={{ maxWidth: '200px', margin: '0 auto', width: '100%' }}>
          {/* 圧力のラベルです */}
          <label style={{ display: 'block', color: '#0cf', marginBottom: '10px' }}>PRESSURE: {pressure.toFixed(2)} MPa</label>
          {/* 圧力の入力スライダーです */}
          <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {/* 発射ボタンです */}
        <button 
          // クリック時にonLaunch関数を呼び出します
          onClick={onLaunch} 
          // 飛行中は無効になります
          disabled={isFlying} 
          // ボタンのスタイルです
          style={{ 
            width: '80px', 
            height: '80px', 
            fontWeight: 'bold', 
            background: isFlying ? '#444' : '#0cf', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* ロケットの絵文字です */}
          <span style={{ fontSize: '24px' }}>🚀</span>
          {/* "LAUNCH"のテキストです */}
          <span style={{ fontSize: '12px', marginTop: '5px' }}>LAUNCH</span>
        </button>

        {/* 角度コントロールのコンテナです */}
        <div style={{ maxWidth: '200px', margin: '0 auto', width: '100%' }}>
          {/* 角度のラベルです */}
          <label style={{ display: 'block', color: 'white', marginBottom: '10px' }}>ANGLE: {angle}°</label>
          {/* 角度の入力スライダーです */}
          <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}