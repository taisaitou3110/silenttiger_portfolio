'use client';

import React from 'react';
import { MESSAGE_BOX_STYLES } from '@/components/responsive-config';

interface MessageBoxProps {
  status: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  onClose: () => void;
}

export default function MessageBox({ status, title, description, onClose }: MessageBoxProps) {
  // ステータスに応じたアイコンと色の設定
  const statusConfig = {
    success: { icon: '✅', color: 'bg-green-100 text-green-600' },
    error: { icon: '⚠️', color: 'bg-red-100 text-red-600' },
    warning: { icon: '🔸', color: 'bg-yellow-100 text-yellow-600' },
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
          
          <button
            onClick={onClose}
            className={`mt-6 ${MESSAGE_BOX_STYLES.button}`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}