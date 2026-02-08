"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getDashboardData() {
  const now = new Date();
  
  // ユーザー設定の取得（存在しなければ作成）
  let userSettings = await prisma.userSettings.findFirst();
  if (!userSettings) {
    userSettings = await prisma.userSettings.create({ data: { gold: 0 } });
  }

  const reviewCount = await prisma.word.count({
    where: { nextReview: { lte: now } }
  });

  const totalWords = await prisma.word.count();

  return {
    gold: userSettings.gold,
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

export async function saveWord(data: any) {
  const word = await prisma.word.create({
    data: {
      term: data.term,
      meaning: data.meaning,
      phonetic: data.phonetic,
      scene: data.scene,
      examples: {
        create: data.examples.map((ex: any) => ({
          text: ex.text,
          collocation: ex.collocation
        }))
      }
    }
  });
  return word;
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

export async function addGold(amount: number) {
  // 最初のユーザー設定を取得（基本1つしかない想定）
  const settings = await prisma.userSettings.findFirst();
  
  if (!settings) return;

  return await prisma.userSettings.update({
    where: { id: settings.id },
    data: {
      gold: {
        increment: amount // 現在の値に加算
      }
    }
  });
}

