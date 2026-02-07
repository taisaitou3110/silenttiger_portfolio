"use client";

import { useState, useEffect } from 'react';

// 単語の型定義
interface Word {
  id: number;
  term: string;
  definition: string;
  comments?: { source: string; example: string; }[];
}

// ユーザー提供のJSONデータの型
interface ImportedWord {
  word: string;
  definitions: string[];
  comments?: { source: string; example: string; }[];
}

const WordBook = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null); // インポートメッセージ用ステート

  // ローカルストレージキー
  const STORAGE_KEY = 'wikipedia-word-book';

  // 初回レンダリング時にローカルストレージからデータを読み込む
  useEffect(() => {
    try {
      const savedWords = localStorage.getItem(STORAGE_KEY);
      if (savedWords) {
        setWords(JSON.parse(savedWords));
      }
    } catch (error) {
      console.error("Failed to parse words from localStorage", error);
    }
  }, []);

  // wordsステートが更新されるたびにローカルストレージに保存
  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    } catch (error) {
        console.error("Failed to save words to localStorage", error);
    }
  }, [words]);

  // 新しい単語の追加
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    const newWord: Word = {
      id: Date.now(),
      term: term.trim(), // ここでtrimを適用
      definition: definition.trim(), // ここでtrimを適用
    };
    setWords([...words, newWord]);
    setTerm('');
    setDefinition('');
  };

  // 単語の削除
  const handleDeleteWord = (id: number) => {
    setWords(words.filter(word => word.id !== id));
  };
  
  // JSONファイルから単語をインポートするハンドラ
  const handleImportWords = async () => {
    setImportMessage(null); // メッセージをクリア

    try {
      // JSONファイルをフェッチ
      const response = await fetch('/words_rich.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch words_rich.json: ${response.statusText}`);
      }
      const importedData: ImportedWord[] = await response.json();

      let newWordsCount = 0;
      const updatedWords = [...words];
      const existingTerms = new Set(words.map(w => w.term.toLowerCase()));

      importedData.forEach((item) => {
        const normalizedTerm = item.word.trim();
        const lowercasedTerm = normalizedTerm.toLowerCase();
        const definitionText = item.definitions.join('; ').trim();
        const commentsData = item.comments; // commentsデータを取り込む

        if (!existingTerms.has(lowercasedTerm)) {
            updatedWords.push({
                id: Date.now() + newWordsCount,
                term: normalizedTerm,
                definition: definitionText,
                comments: commentsData, // commentsを保存
            });
            existingTerms.add(lowercasedTerm);
            newWordsCount++;
        } else {
            // 既存の単語が見つかった場合、定義とコメントを更新する
            const index = updatedWords.findIndex(w => w.term.toLowerCase() === lowercasedTerm);
            if (index !== -1) {
                updatedWords[index].definition = definitionText;
                updatedWords[index].comments = commentsData; // commentsも更新
            }
        }
      });

      setWords(updatedWords);
      setImportMessage(`${newWordsCount}個の単語をインポートしました。`);

    } catch (error: any) {
      console.error("Failed to import words:", error);
      setImportMessage(`インポートに失敗しました: ${error.message}`);
    }
  };


  // 検索に一致する単語をフィルタリング
  const filteredWords = words.filter(word => 
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="flex justify-between items-center mb-4"> {/* ヘッダー部分をflexboxで調整 */}
        <h2 className="text-2xl font-bold text-gray-800">Wikipedia風単語帳</h2>
        <button
          onClick={handleImportWords}
          className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition text-sm"
        >
          JSONからインポート
        </button>
      </div>

      {importMessage && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
          {importMessage}
        </div>
      )}

      {/* 単語追加フォーム */}
      <form onSubmit={handleAddWord} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md::grid-cols-2 gap-4">
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">単語</label>
            <input
              id="term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="例: Next.js"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <input
              id="definition"
              type="text"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="例: ReactベースのWebフレームワーク"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
          単語を追加
        </button>
      </form>

      {/* 検索フォーム */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="単語帳を検索..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 単語リスト */}
      <div className="space-y-4">
        {filteredWords.length > 0 ? (
          filteredWords.map((word) => (
            <div key={word.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{word.term}</h3>
                <p className="text-gray-600 mt-1">{word.definition}</p>
                {word.comments && word.comments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p className="font-semibold">コメント:</p>
                    <ul className="list-disc list-inside ml-4">
                      {word.comments.map((comment, index) => (
                        <li key={index}>
                          <strong>{comment.source}:</strong> {comment.example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteWord(word.id)}
                className="text-red-500 hover:text-red-700 font-medium ml-4 shrink-0"
              >
                削除
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">登録されている単語はありません。</p>
        )}
      </div>
    </div>
  );
};

export default WordBook;