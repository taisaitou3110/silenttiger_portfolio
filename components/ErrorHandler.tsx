'use client';

import React from 'react';
import MessageBox from './MessageBox'; // 既存の共通メッセージボックス
// 他の既存コンポーネントもここでインポート
// import LoadingSpinner from './LoadingSpinner'; 

/**
 * 標準仕様：エラーメッセージ変換ロジック
 */
export const getFriendlyErrorMessage = (error: any): string => {
  const message = error?.message || String(error);

  if (message.includes('timeout') || message.includes('timed out') || message.includes('digest')) {
    return "サーバーとの通信がタイムアウトしました。画像サイズを小さくするか、時間を置いて再度お試しください。";
  }
  if (message.includes('429') || message.includes('quota')) {
    return "AIの利用制限に達しました。しばらくお待ちください。";
  }
  if (message.includes('safety') || message.includes('blocked')) {
    return "画像の解析が制限されました。別の画像でお試しください。";
  }
  
  return "予期せぬエラーが発生しました。トップページに戻るか、やり直してください。";
};

/**
 * 共通エラールーチンコンポーネント
 */
interface ErrorHandlerProps {
  error: any;
  onClose: () => void;
}

export default function ErrorHandler({ error, onClose }: ErrorHandlerProps) {
  if (!error) return null;

  const message = getFriendlyErrorMessage(error);

  return (
    <MessageBox 
      status="error"
      title="実行エラー"
      description={message}
      onClose={onClose}
    />
  );
}