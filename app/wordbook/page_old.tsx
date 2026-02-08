import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import versionData from '@/app/version.json'; // Import version data

export const dynamic = "force-dynamic"; // これを追加！

export default async function WordbookPage() {
  // 1. SQLiteから単語一覧を取得（サーバーサイドで実行）
  const words = await prisma.word.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // 2. 単語を追加するアクション
  async function addWord(formData: FormData) {
    'use server';
    const term = formData.get('term') as string;
    const definition = formData.get('definition') as string;

    if (!term || !definition) return;

await prisma.word.create({
  data: { 
    term: term as string, 
    description: definition as string // definition の中身を description という名前で送る
  },
});

    revalidatePath('/wordbook'); // 画面を更新
  }

  // 3. 単語を削除するアクション
  async function deleteWord(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await prisma.word.delete({ where: { id } });
    revalidatePath('/wordbook');
  }

  // 4. JSONファイルから単語をインポートするアクション
  async function importWordsFromJson(formData: FormData) {
    'use server';
    const jsonFile = formData.get('jsonFile') as File;

    if (!jsonFile) return;

    try {
      const fileContent = await jsonFile.text();
      const jsonData = JSON.parse(fileContent);

      const wordsToCreate = jsonData.map((item: any) => ({
        term: item.word,
        description: Array.isArray(item.definitions) ? item.definitions.join(', ') : item.definitions,
        comments: item.comments ? JSON.stringify(item.comments) : null,
      }));

      // Fetch existing terms to avoid duplicates
      const existingWords = await prisma.word.findMany({
        select: { term: true },
      });
      const existingTerms = new Set(existingWords.map((word) => word.term));

      const newWordsOnly = wordsToCreate.filter(
        (word) => !existingTerms.has(word.term)
      );

      if (newWordsOnly.length > 0) {
        await prisma.word.createMany({
          data: newWordsOnly,
        });
      }
      revalidatePath('/wordbook');
    } catch (error) {
      console.error('Failed to import words from JSON:', error);
      // エラーハンドリングをここに追加することもできます
    }
  }

  return (
    <main className="p-8 max_w-4xl mx-auto">
      <Link href="/" className="text-blue-600 hover:underline">← 戻る</Link>
      <h1 className="text-3xl font-bold mb-2">Wikipedia風単語帳 <span className="text-sm font-normal text-gray-500 ml-2">v{versionData.apps.wordbook}</span></h1>
      <p className="mb-8 text-gray-600">登録単語数: {words.length}件</p>

      {/* 入力フォーム群 */}
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        {/* 手動入力フォーム */}
        <form action={addWord} className="p-6 bg-white rounded-lg shadow-md border h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4">手動で単語を追加</h2>
          <div className="flex flex-col gap-4 flex-grow">
            <input
              name="term"
              placeholder="単語を入力 (例: ベクトル検索)"
              className="p-2 border rounded"
              required
            />
            <textarea
              name="definition"
              placeholder="定義を入力"
              className="p-2 border rounded flex-grow"
              rows={3}
              required
            />
            <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mt-auto">
              DBに登録する
            </button>
          </div>
        </form>
      
        {/* JSONファイルから単語をインポートするフォーム */}
        <form action={importWordsFromJson} className="p-6 bg-white rounded-lg shadow-md border h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4">JSONからインポート</h2>
          <div className="flex flex-col gap-4 flex-grow">
            <input
              type="file"
              name="jsonFile"
              accept=".json"
              className="p-2 border rounded"
              required
            />
            <div className="flex-grow"></div>
            <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mt-auto">
              JSONからインポート
            </button>
          </div>
        </form>
      </div>

    {/* クイズ開始ボタン */}
    <div className="text-center my-8">
      <Link href="/wordbook/quiz" className="bg-purple-600 text-white py-3 px-8 rounded-lg text-xl hover:bg-purple-700 transition">
        クイズに挑戦！
      </Link>
    </div>

            {/* 単語リスト */}
            <div className="grid grid-cols-1 gap-2">
              {/* ヘッダー */}
              <div className="grid grid-cols-3 gap-4 p-2 font-bold text-gray-500 border-b-2">
                <h3>単語</h3>
                <h3>主な意味</h3>
                <h3>例文</h3>
              </div>
              {words.map((word) => {
                const mainDefinition = word.description.split(',')[0];
                let exampleSentence = '';
                if (word.comments) {
                  try {
                    const comments = JSON.parse(word.comments);
                    if (Array.isArray(comments) && comments.length > 0) {
                      exampleSentence = comments[0].example;
                    }
                  } catch (e) {
                    // コメントがJSON形式でない場合は何もしない
                  }
                }
      
                return (
                  <div key={word.id} className="grid grid-cols-3 gap-4 items-center p-3 hover:bg-gray-50 rounded-lg relative group">
                    <h3 className="text-md font-semibold truncate">{word.term}</h3>
                    <p className="text-gray-700 truncate">{mainDefinition}</p>
                    <p className="text-gray-600 truncate text-sm">{exampleSentence}</p>
                    
                    <form action={deleteWord} className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <input type="hidden" name="id" value={word.id} />
                      <button className="text-red-500 hover:text-red-700 text-xs p-1">削除</button>
                    </form>
                  </div>
                );
              })}
              {words.length === 0 && (
                <p className="text-center text-gray-500 mt-4">登録されている単語はありません。</p>
              )}
            </div>    </main>
  );
}