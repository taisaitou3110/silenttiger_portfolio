import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

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
      <h1 className="text-3xl font-bold mb-8">Wikipedia風単語帳 (Local DB版)</h1>

      {/* 入力フォーム */}
      <form action={addWord} className="mb-12 p-6 bg-white rounded-lg shadow-md border">
        <div className="flex flex-col gap-4">
          <input
            name="term"
            placeholder="単語を入力 (例: ベクトル検索)"
            className="p-2 border rounded"
            required
          />
          <textarea
            name="definition"
            placeholder="定義を入力"
            className="p-2 border rounded"
            rows={3}
            required
          />
                <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  DBに登録する
                </button>
              </div>
            </form>
          
            {/* JSONファイルから単語をインポートするフォーム */}
            <form action={importWordsFromJson} className="mb-12 p-6 bg-white rounded-lg shadow-md border">
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  name="jsonFile"
                  accept=".json"
                  className="p-2 border rounded"
                  required
                />
                <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                  JSONからインポート
                </button>
              </div>
            </form>
          
            {/* 単語リスト */}
            <div className="grid gap-6">        {words.map((word) => (
          <div key={word.id} className="p-6 bg-white rounded-lg shadow border relative group">
            <h3 className="text-xl font-bold border-b mb-2">{word.term}</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{word.definition}</p>
            
            <form action={deleteWord} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
              <input type="hidden" name="id" value={word.id} />
              <button className="text-red-500 hover:text-red-700 text-sm">削除</button>
            </form>
          </div>
        ))}
        {words.length === 0 && (
          <p className="text-center text-gray-500">登録されている単語はありません。</p>
        )}
      </div>
    </main>
  );
}