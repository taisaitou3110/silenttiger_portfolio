"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * 4.1. 文体抽出プロンプト（Analyzer）
 * ユーザーの過去記事から文体を分析し、UserProfileに保存する
 */
export async function analyzeUserStyle(userId: string, pastArticles: string) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: "あなたはプロの執筆スタイル・プロファイラーです。渡されたテキストから、著者の「文体の癖」を極めて詳細に抽出し、再現可能な『文体指示書』を作成してください。"
  });

  const prompt = `
    以下のテキスト（過去の記事）を分析し、著者の執筆スタイルを抽出してください。
    
    【出力に含めるべき要素】
    1. 一人称、語尾（だ・である、です・ます、独自の語尾など）
    2. 文のリズム、改行の頻度、句読点の使い方
    3. 頻出するキーワード、ネットミーム、口癖（例：「どうかしてるぜ〜」「もったいない」など）
    4. 特徴的な構成の癖（体験談から入る、メタ視点の（ ）書き、独自の結びなど）
    5. 全体のトーン（情熱的、論理的、自虐的、淡々としている等）

    【出力形式】
    これらを統合した、AI（Gemini）への「システム指示文（System Instruction）」としてそのまま使える形式で出力してください。
    出力は「文体指示書」の内容のみとしてください。余計な解説は不要です。
    
    分析対象テキスト：
    ${pastArticles}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const styleInstruction = response.text();

    // トークン数（概算）に基づいて学習レベルを更新
    const tokenCount = pastArticles.length;
    let learningLevel = 1;
    if (tokenCount > 50000) learningLevel = 5;
    else if (tokenCount > 20000) learningLevel = 4;
    else if (tokenCount > 10000) learningLevel = 3;
    else if (tokenCount > 5000) learningLevel = 2;

    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        styleInstruction,
        learningLevel,
        lastAnalyzedAt: new Date(),
      },
    });

    revalidatePath("/post-assistant");
    return { success: true, styleInstruction };
  } catch (error) {
    console.error("Style Analysis Error:", error);
    throw new Error("文体分析に失敗しました。");
  }
}

/**
 * 4.2. 記事生成プロンプト（Generator）
 * 保存された文体指示書を使い、新しいネタから記事を生成する
 */
export async function generateSnsPost(userId: string, topic: string) {
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { styleInstruction: true }
  });

  if (!userProfile?.styleInstruction) {
    throw new Error("文体分析が完了していません。先に過去の記事を分析してください。");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: userProfile.styleInstruction
  });

  const prompt = `
    以下の「ネタ（議論ログやメモ）」を基に、あなたらしい文体でnote記事を作成してください。
    
    【制約事項】
    - 文字数は2,000字程度
    - note形式（見出し、箇条書き、太字などを適宜使用）
    - 最後に適切なハッシュタグを3〜5個付与
    - 抽出された文体の癖（口癖、リズム、（ ）書き等）を最大限に反映させる
    
    ネタ：
    ${topic}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return { success: true, content };
  } catch (error) {
    console.error("Post Generation Error:", error);
    throw new Error("記事の生成に失敗しました。");
  }
}

export async function getUserProfiles() {
  return await prisma.userProfile.findMany({
    orderBy: { createdAt: 'asc' }
  });
}

export async function ensureUserProfile() {
  let profile = await prisma.userProfile.findFirst();
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        displayName: "デフォルトユーザー",
      }
    });
  }
  return profile;
}
