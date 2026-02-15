"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserGoldData } from "@/lib/actions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getDashboardData() {
  const now = new Date();
  
  const { gold } = await getUserGoldData();

  const reviewCount = await prisma.word.count({
    where: { nextReview: { lte: now } }
  });

  const totalWords = await prisma.word.count();

  return {
    gold,
    reviewCount,
    totalWords,
  };
}

export async function generateWordSuggestions(term: string) {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview" });

  const prompt = `
    単語「${term}」について、以下のJSON形式のみで回答してください。解説文などは一切不要です。
    {
      "meaning": "日本語での主な意味",
      "phonetic": "発音記号",
      "examples": [
        { "text": "英語の例文1", "collocation": "その文中の核心となるコロケーション" }
      ]
    }
    ※例文は最大10個生成してください。実用的で、日常会話やビジネスで使いやすいものにしてください。
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // --- 丁寧なパース処理（デグレード対策） ---
  try {
    // Markdownのコードブロック（```json ... ```）が含まれている場合に備えて抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON形式のデータが見つかりませんでした");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Parse Error:", text);
    throw new Error("AIの回答を解析できませんでした。もう一度お試しください。");
  }
}

export async function saveWord(data: {
  term: string;
  meaning: string;
  phonetic?: string;
  scene?: string;
  examples: { text: string; collocation: string }[];
}) {
  const termLower = data.term.toLowerCase();

  return await prisma.word.upsert({
    where: {
      term: termLower,
    },
    update: {
      // 既存の単語がある場合、意味や発音を最新に更新しつつ、例文を追加
      meaning: data.meaning,
      phonetic: data.phonetic,
      scene: data.scene, // 最新のシーンに上書き（または追記も可能）
      examples: {
        create: data.examples.map((ex) => ({
          text: ex.text,
          collocation: ex.collocation,
        })),
      },
    },
    create: {
      // 新規登録の場合
      term: termLower,
      meaning: data.meaning,
      phonetic: data.phonetic,
      scene: data.scene,
      accuracy: 0.0,
      easeFactor: 2.5,
      interval: 0,
      nextReview: new Date(),
      examples: {
        create: data.examples.map((ex) => ({
          text: ex.text,
          collocation: ex.collocation,
        })),
      },
    },
  });
}

export async function getQuizWords(limit: number = 20) {
  const now = new Date();

  // まず復習対象を取得
  let words = await prisma.word.findMany({
    where: { nextReview: { lte: now } },
    include: { examples: true },
    orderBy: [{ nextReview: 'asc' }],
    take: limit
  });

  // もし復習対象が0件なら、全単語からランダムに取得（練習モード）
  if (words.length === 0) {
    words = await prisma.word.findMany({
      include: { examples: true },
      take: limit,
      // 本来はランダムソートが望ましいが、まずは最新順などで対応
      orderBy: { createdAt: 'desc' }
    });
  }

  return words;
}

export async function updateWordMastery(wordId: string, isCorrect: boolean) {
  const word = await prisma.word.findUnique({ where: { id: wordId } });
  if (!word) return;

  let { accuracy, easeFactor, interval } = word;

  if (isCorrect) {
    // 正解：間隔を広げる
    accuracy = Math.min(100, accuracy + 20); // 記憶割合アップ
    interval = interval === 0 ? 1 : Math.ceil(interval * easeFactor);
  } else {
    // 不正解：間隔をリセットし、難易度係数を下げる
    accuracy = Math.max(0, accuracy - 30);
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2); // 覚えにくいので頻度を上げる
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return await prisma.word.update({
    where: { id: wordId },
    data: { accuracy, easeFactor, interval, nextReview }
  });
}



// ヘルパー関数：指定したミリ秒待機する
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeBulkText(rawText: string, retryCount = 0): Promise<any> {
  const modelName = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
    以下のテキストから英単語、意味、発音記号、実用的な例文3つを抽出し、JSON形式で出力してください。
    【テキスト】: ${rawText}
    【形式】: {"words": [{"term": "...", "meaning": "...", "phonetic": "...", "examples": [{"text": "...", "collocation": "..."}]}]}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    // 503エラー（Overloaded）かつ リトライが2回未満なら再試行
    if (error.message?.includes("503") && retryCount < 2) {
      console.log(`Model overloaded. Retrying... (${retryCount + 1})`);
      await sleep(2000 * (retryCount + 1)); // 少し待ってからリトライ
      return analyzeBulkText(rawText, retryCount + 1);
    }
    
    // それでもダメならエラーを投げる
    throw new Error("AIサーバーが混雑しています。少し時間を置いてから再度お試しください。");
  }
}

// すべての単語を取得（一覧用）
export async function getWords() {
  return await prisma.word.findMany({
    orderBy: { term: 'asc' }, // アルファベット順
    include: {
      _count: {
        select: { examples: true } // 蓄積された例文の数
      }
    }
  });
}

// 特定の単語を全例文込みで取得（詳細用）
export async function getWordDetail(id: string) {
  
  return await prisma.word.findUnique({
    where: { id },
    include: {
      examples: {
        orderBy: { createdAt: 'desc' } // 新しい例文が上
      }
    }
  });
}

export async function saveWords(words: any[]) {
  const promises = words.map(word => saveWord(word));
  await Promise.all(promises);
  return { success: true, count: words.length };
}