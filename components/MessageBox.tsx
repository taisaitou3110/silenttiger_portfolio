// MessageBox.tsx の修正案
'use client';

import React from 'react';
import { MESSAGE_BOX_STYLES } from '@/components/responsive-config';

interface MessageBoxProps {
  status: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  onClose: () => void;
  // ✅ オプションの追加ボタン（ラベルと実行する関数）
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function MessageBox({ status, title, description, onClose, actionButton }: MessageBoxProps) {
  const statusConfig = {
    success: { icon: '✅', color: 'bg-green-100 text-green-600' },
    error: { icon: '⚠️', color: 'bg-red-100 text-red-600' },
    warning: { icon: '💡', color: 'bg-yellow-100 text-yellow-600' }, // ヒント用にアイコン変更
    info: { icon: '🔹', color: 'bg-blue-100 text-blue-600' },
  };

  const config = statusConfig[status];

  return (
    <div className={MESSAGE_BOX_STYLES.overlay}>
      <div className={MESSAGE_BOX_STYLES.container}>
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
          
          <div className="flex flex-col gap-2 mt-6">
            {/* ✅ おすすめセットボタンがある場合のみ表示 */}
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`${MESSAGE_BOX_STYLES.button} bg-yellow-500 hover:bg-yellow-400 text-white border-none`}
              >
                {actionButton.label}
              </button>
            )}
            
            <button
              onClick={onClose}
              className={MESSAGE_BOX_STYLES.button}
            >
              自分で考える（閉じる）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}