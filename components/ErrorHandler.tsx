'use client';

import React from 'react';
import MessageBox from '@/components/MessageBox';
import { MESSAGE_MASTER } from '@/components/MessageMst';
import { ERROR_MESSAGES } from '@/constants/errorMsgs';

/**
 * 標準仕様：エラーメッセージ変換ロジック
 */
export const getFriendlyErrorMessage = (error: any): string => {
  console.log("Captured Error:", error);
  
  // エラーオブジェクトからメッセージ文字列を抽出
  const message = error?.message || (typeof error === 'string' ? error : '');

  // 1. 画像サイズエラー
  if (message === 'VALIDATION_IMAGE_SIZE' || message.includes('too large') || message.includes('Payload Too Large')) {
    return ERROR_MESSAGES.VALIDATION_IMAGE_SIZE.description;
  }

  // 2. AIからの直接の日本語エラーメッセージ（食べ物判定など）がある場合はそのまま返す
  // 日本語が含まれているか判定する正規表現
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(message);
  if (hasJapanese && !message.includes('Error')) {
    return message;
  }

  // 3. インフラ・システムエラー
  if (message.includes('timeout') || message.includes('timed out') || message.includes('digest')) {
    return MESSAGE_MASTER.ERROR.TIMEOUT;
  }

  // 4. AI利用制限 (Rate Limit)
  if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) {
    return MESSAGE_MASTER.ERROR.QUOTA_EXCEEDED;
  }

  // 5. 画像安全フィルター
  if (message.includes('safety') || message.includes('blocked')) {
    return MESSAGE_MASTER.ERROR.IMAGE_SAFETY;
  }
  
  // デフォルト（特定できない場合）
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
