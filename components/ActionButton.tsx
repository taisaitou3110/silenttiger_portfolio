"use client";

import React from 'react';
import { useFormStatus } from "react-dom";

/**
 * 【開発標準仕様 第9章 準拠】
 * 共通アクションボタンコンポーネント
 * - 二重送信防止 (disabled)
 * - 状態表示 (Spinner / キャプション変更)
 * - React 19 useFormStatus に自動対応
 */

interface ActionButtonProps {
  label: string;            // 通常時のテキスト
  loadingLabel?: string;    // 処理中のテキスト（省略時は "処理中..."）
  pending?: boolean;        // 手動でローディングを制御する場合に使用
  onClick?: () => void;     // クリックイベント
  type?: "button" | "submit";
  className?: string;       // Tailwind等での装飾用
  variant?: "primary" | "danger" | "outline";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  loadingLabel = "処理中...",
  pending: manualPending,
  onClick,
  type = "submit",
  className = "",
  variant = "primary"
}) => {
  // フォーム内で使用されている場合、自動的に送信状態を取得
  const { pending: formPending } = useFormStatus();
  
  // 手動またはフォームのいずれかが処理中なら true
  const isPending = manualPending || formPending;

  // スタイル定義
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-[0.98]";
  const variants = {
    primary: "bg-[#0cf] text-black shadow-[0_0_15px_rgba(0,204,255,0.3)] hover:shadow-[0_0_25px_rgba(0,204,255,0.5)]",
    danger: "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]",
    outline: "border border-gray-700 text-gray-400 hover:border-[#0cf] hover:text-[#0cf]"
  };
  const disabledStyles = "opacity-50 cursor-not-allowed grayscale";

  return (
    <button
      type={type}
      disabled={isPending}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${isPending ? disabledStyles : ""} ${className}`}
    >
      {isPending && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      )}
      <span>
        {isPending ? loadingLabel : label}
      </span>
    </button>
  );
};