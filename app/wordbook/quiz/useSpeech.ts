import { useState, useEffect, useRef } from "react";

export function useSpeech(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // ブラウザが音声認識に対応しているか確認
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US"; // 英語の学習なのでUS
      recognition.continuous = false; // 一言ごとに区切る
      recognition.interimResults = false; // 確定結果のみ取得

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript); // 認識結果を親に渡す
      };

      recognitionRef.current = recognition;
    }
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  return { isListening, startListening };
}