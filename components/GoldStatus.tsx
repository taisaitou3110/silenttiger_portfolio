import React from 'react';

/**
 * 【ゴールドシステム共通コンポーネント：GoldStatus】
 * * 共通仕様書（docs/gold_system_spec.md）に準拠したUIコンポーネントです。
 * - 🪙 アイコンと数値をピル型のコンテナに配置
 * - 数値はカンマ区切り形式（Locale String）
 * - 視認性の高い等幅フォント（font-mono）を採用
 */

interface GoldStatusProps {
  /** 表示するゴールドの額 */
  amount: number;
  /** 追加のスタイルクラス（位置調整用など） */
  className?: string;
  /** 獲得時などに使用するアニメーションフラグ */
  animate?: boolean;
}

export const GoldStatus: React.FC<GoldStatusProps> = ({ 
  amount, 
  className = "", 
  animate = false 
}) => {
  // 数値をカンマ区切りにフォーマット
  const formattedAmount = new Intl.NumberFormat('ja-JP').format(amount);

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 
      bg-gray-900/80 border border-gray-700 
      rounded-full
      ${animate ? 'animate-bounce' : ''}
      ${className}
    `}>
      {/* ゴールドシンボル */}
      <span className="text-yellow-500 text-sm drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
        🪙
      </span>
      
      {/* ゴールド数値 */}
      <span className="font-mono font-bold text-yellow-500 text-sm tracking-tight">
        {formattedAmount}
      </span>
    </div>
  );
};

// プレビュー用のデモコンポーネント
export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-10">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-[#0cf] font-mono text-xs tracking-widest uppercase">Component Preview</h2>
        <p className="text-gray-500 text-sm">共通ゴールド表示コンポーネント</p>
      </div>

      <div className="flex flex-col gap-6 items-center">
        {/* 通常表示 */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-600 font-mono">DEFAULT</p>
          <GoldStatus amount={1250} />
        </div>

        {/* 高額表示（カンマ区切り確認） */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-600 font-mono">HIGH_AMOUNT</p>
          <GoldStatus amount={1000000} />
        </div>

        {/* アニメーションあり */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-600 font-mono">WITH_ANIMATION</p>
          <GoldStatus amount={30} animate={true} />
        </div>
      </div>

      <div className="mt-20 p-6 border border-gray-800 rounded-3xl max-w-xs text-center bg-gray-900/20">
        <p className="text-xs text-gray-400 leading-relaxed">
          このコンポーネントは <code className="text-yellow-500 font-mono">GoldStatus</code> をインポートするだけで、一貫したブランドデザインを維持できます。
        </p>
      </div>
    </div>
  );
}