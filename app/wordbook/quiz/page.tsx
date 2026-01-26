"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getRandomWordsWithExamples } from "./actions";

interface QuizWord {
  id: string;
  term: string;
  mainDefinition: string;
  example: string;
  incorrectTerms: string[];
}

export default function QuizPage() {
  const [quizWords, setQuizWords] = useState<QuizWord[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUIZ_COUNT = 5; // クイズの問題数

  const fetchQuizWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const words = await getRandomWordsWithExamples(QUIZ_COUNT);
      if (words.length === 0) {
        setError("クイズを作成できる単語がありません。例文付きの単語を登録してください。");
        setQuizStarted(false); // クイズ開始を強制的にリセット
        return;
      }
      setQuizWords(words);
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizFinished(false);
    } catch (err: any) {
      console.error("Failed to fetch quiz words:", err);
      setError("クイズの読み込み中にエラーが発生しました。" + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // コンポーネントがマウントされたときに自動的にクイズデータを取得しない
    // Startボタンで明示的に開始
  }, [fetchQuizWords]);

  const startQuiz = () => {
    fetchQuizWords();
  };

  const currentQuestion = quizWords[currentQuestionIndex];
  const options = currentQuestion 
    ? [...currentQuestion.incorrectTerms, currentQuestion.term].sort(() => Math.random() - 0.5)
    : [];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return; // 二重回答防止

    setSelectedAnswer(answer);
    const correct = (answer === currentQuestion.term);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const goToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    if (currentQuestionIndex < quizWords.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setQuizWords([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setQuizStarted(false);
    setQuizFinished(false);
    setError(null);
    // fetchQuizWords(); // 自動で再開しない
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl relative">
        <Link href="/wordbook" className="absolute top-4 left-4 text-blue-600 hover:underline">← 単語帳へ戻る</Link>
        <h1 className="text-3xl font-bold text-center mb-8">単語クイズ</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        {!quizStarted && !isLoading && !error && (
          <div className="text-center space-y-4">
            <p className="text-lg">登録された単語の例文から単語を当てるクイズです。</p>
            <p className="text-lg">全{QUIZ_COUNT}問！頑張ってください！</p>
            <button
              onClick={startQuiz}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg text-xl hover:bg-blue-700 transition"
            >
              クイズを開始する
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-xl text-gray-700">クイズを準備中...</div>
        )}

        {quizStarted && !quizFinished && currentQuestion && (
          <div className="space-y-6">
            <div className="text-center text-xl font-semibold">
              第 {currentQuestionIndex + 1} 問 / {quizWords.length}
            </div>
            <div className="p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <p className="text-lg text-gray-800 italic">「{currentQuestion.example}」</p>
              <p className="text-md text-gray-600 mt-2">上記の例文に出てくる単語は何でしょう？</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`p-4 rounded-lg text-lg font-semibold transition ${
                    selectedAnswer === option
                      ? isCorrect !== null
                        ? isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-blue-200 text-blue-800"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer !== null && (
              <div className="text-center mt-4">
                {isCorrect ? (
                  <p className="text-green-600 text-xl font-bold">正解！</p>
                ) : (
                  <p className="text-red-600 text-xl font-bold">残念！</p>
                )}
                <p className="text-gray-700 mt-2">正解は「<span className="font-bold">{currentQuestion.term}</span>」でした。</p>
                <p className="text-gray-700">意味: {currentQuestion.mainDefinition}</p>
                <button
                  onClick={goToNextQuestion}
                  className="mt-6 bg-purple-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-purple-700 transition"
                >
                  {currentQuestionIndex < quizWords.length - 1 ? "次の問題へ" : "結果を見る"}
                </button>
              </div>
            )}
          </div>
        )}

        {quizFinished && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold mb-4">クイズ結果</h2>
            <p className="text-xl">
              {quizWords.length}問中 <span className="text-green-600 font-bold">{score}</span> 問正解でした！
            </p>
            <button
              onClick={restartQuiz}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg text-xl hover:bg-blue-700 transition mr-4"
            >
              もう一度プレイ
            </button>
            <Link href="/wordbook" className="bg-gray-400 text-white py-3 px-8 rounded-lg text-xl hover:bg-gray-500 transition">
              単語帳へ戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
