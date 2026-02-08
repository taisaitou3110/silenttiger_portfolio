"use client";

import { useState, useEffect, useRef } from "react";
import { getQuizWords, updateWordMastery, addGold } from "../actions";
import { getSimilarity } from "./utils";
import { useSpeech } from "./useSpeech";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [similarityResult, setSimilarityResult] = useState<number | null>(null); // 一致率用
  const [timeLeft, setTimeLeft] = useState(300);
  const [goldEarned, setGoldEarned] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 音声認識の設定
  const { isListening, startListening } = useSpeech((text) => {
    setUserInput(text);
    // 音声が入ったら、そのまま自動で判定へ（ハンズフリー対応）
    handleFinalSubmit(text);
  });

  useEffect(() => {
    getQuizWords(20).then(setWords);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || currentIndex >= words.length) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentIndex, words.length]);

  // マイクの自動再起動（問題が切り替わった時に実行）
  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length && !isCorrect) {
      // 少し遅延させて、前の問題の判定が終わってから起動
      const timer = setTimeout(() => startListening(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, words.length]);

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (goldEarned > 0) await addGold(goldEarned);
      router.push("/wordbook");
      router.refresh();
    } catch (error) {
      router.push("/wordbook");
    }
  };

  const handleFinalSubmit = async (forcedInput?: string) => {
    const inputToVerify = forcedInput ?? userInput;
    if (isCorrect !== null || !inputToVerify || !words[currentIndex]) return;

    const currentWord = words[currentIndex];
    const similarity = getSimilarity(inputToVerify, currentWord.term);
    const correct = similarity >= 0.6;

    setSimilarityResult(similarity); // 一致率をセット
    setIsCorrect(correct);
    
    if (correct) {
      const gain = similarity === 1 ? 30 : 10;
      setGoldEarned(prev => prev + gain);
      await updateWordMastery(currentWord.id, true);
    } else {
      await updateWordMastery(currentWord.id, false);
    }

    // 次へ
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setUserInput("");
      setIsCorrect(null);
      setSimilarityResult(null);
    }, 1500); // 一致率を見せるために少し長めに待機
  };

  // ... (ガード処理などは前回同様)
  const currentWord = words[currentIndex];
  if (!currentWord && words.length > 0) { /* 終了画面へ */ }

  return (
    <div className="h-screen bg-black text-white p-6 flex flex-col overflow-hidden touch-none">
      <header className="flex justify-between items-center mb-6">
        {/* 中断ボタン */}
        <button 
          onClick={handleFinish}
          className="px-4 py-1 bg-gray-900 border border-gray-800 rounded-full text-gray-500 font-mono text-xs hover:text-white transition-colors"
        >
          QUIT
        </button>
        
        <div className="px-4 py-1 bg-red-900/20 border border-red-500/50 rounded-full text-red-500 font-mono font-bold text-sm">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        
        <div className="text-yellow-500 font-mono font-bold text-lg">
          🪙 {goldEarned}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between py-2">
        <div className="text-center space-y-2">
          <p className="text-[#0cf] text-[10px] font-mono tracking-[0.2em] uppercase opacity-70">
            {isListening ? "📡 Listening..." : "Waiting..."}
          </p>
          <p className="text-gray-400 text-xs">テキストまたは音声で解答</p>
        </div>

        {/* 問題エリアと一致率表示 */}
        <div className="text-center relative">
          <h2 className="text-3xl font-bold max-w-sm px-4 leading-tight mb-4">
            {currentWord?.meaning}
          </h2>
          
          {similarityResult !== null && (
            <div className={`text-xl font-mono font-bold animate-bounce ${similarityResult >= 0.6 ? "text-green-500" : "text-red-500"}`}>
              MATCH: {Math.floor(similarityResult * 100)}%
            </div>
          )}
        </div>

        <div className="w-full max-w-md px-4 flex flex-col items-center gap-6">
          <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="w-full">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode="url"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className={`w-full bg-transparent border-b-2 text-center text-4xl outline-none transition-all duration-500 pb-2 ${
                isCorrect === true ? "border-green-500 text-green-500" : 
                isCorrect === false ? "border-red-500 text-red-500" : "border-gray-800 focus:border-[#0cf]"
              }`}
              placeholder="..."
              autoComplete="off"
            />
          </form>

          <div className="flex items-center justify-center gap-8 w-full pb-8">
            {/* マイクは常時起動中なら赤く光り続ける */}
            <div className={`p-6 rounded-full transition-all duration-300 ${isListening ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110" : "bg-gray-900 text-gray-400"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>

            <button
              onClick={() => handleFinalSubmit()}
              disabled={!userInput || isCorrect !== null}
              className={`flex-1 py-5 rounded-2xl font-black text-lg tracking-widest transition-all ${
                userInput && isCorrect === null ? "bg-[#0cf] text-black shadow-[0_0_20px_rgba(0,204,255,0.4)]" : "bg-gray-900 text-gray-700"
              }`}
            >
              SUBMIT
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}