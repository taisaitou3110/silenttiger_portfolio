// components/MessageBox.tsx
'use client';

import React from 'react';
import { MESSAGE_BOX_STYLES } from '@/components/responsive-config';

interface MessageBoxProps {
  status: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  onClose?: () => void;
  // ✅ オプションの追加ボタン（ラベルと実行する関数）
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function MessageBox({ status, title, description, onClose, actionButton }: MessageBoxProps) {
  const statusConfig = {
    success: { icon: '✅', color: 'bg-green-100 text-green-600' },
    error: { icon: '⚠️', color: 'bg-red-100 text-red-700' },
    warning: { icon: '💡', color: 'bg-yellow-100 text-yellow-600' },
    info: { icon: '🔹', color: 'bg-blue-100 text-blue-600' },
  };

  const config = statusConfig[status];

  // インタラクティブな要素（閉じボタンやアクションボタン）がある場合はオーバーレイ（全画面）表示
  // ない場合は、メッセージ表示用のインライン表示
  const isInteractive = !!onClose || !!actionButton;
  
  const containerClass = isInteractive 
    ? MESSAGE_BOX_STYLES.overlay 
    : "w-full max-w-md mx-auto my-4";

  return (
    <div className={containerClass}>
      <div className={`${MESSAGE_BOX_STYLES.container} ${!isInteractive ? "border border-gray-200 shadow-sm" : ""}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <h3 className={MESSAGE_BOX_STYLES.title}>{title}</h3>
              <p className={`mt-2 ${MESSAGE_BOX_STYLES.description}`}>
                {description}
              </p>
            </div>
          </div>
          
          {(onClose || actionButton) && (
            <div className="flex flex-col gap-2 mt-6">
              {/* ✅ アクションボタンがある場合のみ表示 */}
              {actionButton && (
                <button
                  onClick={actionButton.onClick}
                  className={`${MESSAGE_BOX_STYLES.button} bg-yellow-500 hover:bg-yellow-400 text-white border-none`}
                >
                  {actionButton.label}
                </button>
              )}
              
              {onClose && (
                <button
                  onClick={onClose}
                  className={MESSAGE_BOX_STYLES.button}
                >
                  閉じる
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}