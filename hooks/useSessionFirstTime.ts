"use client";

import { useState, useEffect } from 'react';

export const useSessionFirstTime = (key: string) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // セッション中に「既読」の記録がなければ表示
    const hasSeen = sessionStorage.getItem(key);
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [key]);

  // ✅ 既読として記録し、閉じる
  const markAsSeen = () => {
    sessionStorage.setItem(key, 'true');
    setIsOpen(false);
  };

  // ✅ 強制的に再表示する（既読記録は消さない）
  const showAgain = () => {
    setIsOpen(true);
  };

  return { isOpen, markAsSeen, showAgain };
};