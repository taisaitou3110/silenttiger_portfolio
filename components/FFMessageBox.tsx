// components/FFMessageBox.tsx
"use client";

import { useState, useEffect } from 'react';

interface FFMessageBoxProps {
  message: string;
}

const FFMessageBox = ({ message }: FFMessageBoxProps) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedMessage('');
    setIsTyping(true);
    let index = 0;
    const intervalId = setInterval(() => {
      if (index < message.length) {
        setDisplayedMessage((prev) => prev + message.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 50); // 50msごとに1文字表示

    return () => clearInterval(intervalId);
  }, [message]);

  return (
    <div className="w-full max-w-md p-4 rounded-lg border-2 border-white bg-gradient-to-b from-blue-700 to-blue-900 shadow-lg" style={{ boxShadow: '0 0 0 2px #fff, 0 0 0 4px #000' }}>
      <p className="text-white font-mono text-lg">
        {displayedMessage}
        {isTyping && <span className="animate-ping">_</span>}
      </p>
    </div>
  );
};

export default FFMessageBox;
