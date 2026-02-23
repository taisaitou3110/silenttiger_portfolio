'use client';

import React from 'react';
import MessageBox from '@/components/MessageBox'; // 既存の共通メッセージボックス
import { MESSAGE_MASTER } from '@/components/MessageMst';
// 他の既存コンポーネントもここでインポート
// import LoadingSpinner from './LoadingSpinner'; 

/**
 * 標準仕様：エラーメッセージ変換ロジック
 */
export const getFriendlyErrorMessage = (error: any): string => {
    console.log("Captured Error:", error); // これで中身がブラウザのコンソールに見えます
  const message = error?.message || String(error);

  if (message.includes('timeout') || message.includes('timed out') || message.includes('digest')) {
    return MESSAGE_MASTER.ERROR.TIMEOUT;
  }
  if (message.includes('429') || message.includes('quota')) {
    return MESSAGE_MASTER.ERROR.QUOTA_EXCEEDED;
  }
  if (message.includes('safety') || message.includes('blocked')) {
    return MESSAGE_MASTER.ERROR.IMAGE_SAFETY;
  }
  
  return MESSAGE_MASTER.ERROR.DEFAULT;
};

/**
 * 共通エラールーチンコンポーネント
 */
interface ErrorHandlerProps {
  error: any;
  onClose?: () => void;
}

export default function ErrorHandler({ error, onClose }: ErrorHandlerProps) {
  if (!error) return null;

  const message = getFriendlyErrorMessage(error);

  return (
    <MessageBox 
      status="error"
      title={MESSAGE_MASTER.ERROR.EXECUTION_ERROR_TITLE}
      description={message}
      onClose={onClose}
    />
  );
}