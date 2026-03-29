"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { withAIRetry } from "@/lib/ai-handler";
import { getSystemInstruction } from "@/lib/ai/ai-loader";

/**
 * 補助関数: XML（特にnote形式）から本文のみを抽出する
 */
function extractTextFromXml(xml: string): string {
  const matches = xml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g);
  if (!matches) {
    return xml.replace(/<[^>]*>?/gm, "").trim();
  }

  return matches.map(m => {
    const content = m.replace(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/, "$1");
    return content.replace(/<[^>]*>?/gm, "").trim();
  }).join("\n\n---\n\n");
}

/**
 * 4.1. 文体抽出プロンプト（Analyzer）
 */
export async function analyzeUserStyle(userId: string, pastArticles: string) {
  let processedText = pastArticles;
  if (pastArticles.includes("<") && pastArticles.includes(">")) {
    processedText = extractTextFromXml(pastArticles);
  }

  try {
    const result = await withAIRetry(async (model) => {
      const rawPrompt = getSystemInstruction("post-assistant-analyzer");
      const prompt = rawPrompt.replace("{{pastArticles}}", processedText || "");
      return await model.generateContent(prompt);
    }, { 
      appId: 'post-assistant',
      title: 'Style Analysis'
    });

    const styleInstruction = result.response.text();

    const userProfile = await (prisma.userProfile as any).findUnique({
      where: { id: userId },
      select: { learningLevel: true }
    });
    const currentLevel = userProfile?.learningLevel || 0;

    const tokenCount = processedText.length;
    let gainedLevel = 1;
    if (tokenCount > 50000) gainedLevel = 5;
    else if (tokenCount > 20000) gainedLevel = 4;
    else if (tokenCount > 10000) gainedLevel = 3;
    else if (tokenCount > 5000) gainedLevel = 2;

    await (prisma.userProfile as any).update({
      where: { id: userId },
      data: {
        styleInstruction,
        learningLevel: currentLevel + gainedLevel,
        lastAnalyzedAt: new Date(),
      } as any,
    });

    revalidatePath("/post-assistant");
    return { success: true, styleInstruction };
  } catch (error: any) {
    console.error("[analyzeUserStyle] Error:", error);
    return { success: false, error: "文体分析中にエラーが発生しました。しばらく時間を置いてお試しください。" };
  }
}

/**
 * ファイルを受け取ってテキストを抽出し、分析する
 */
export async function uploadAndAnalyzeStyle(formData: FormData) {
  const userId = formData.get("userId") as string;
  const file = formData.get("file") as File;

  if (!userId || !file) {
    return { success: false, error: "ユーザーIDまたはファイルがありません。" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const pdfModule = await import("pdf-parse");
        const pdf = (pdfModule as any).default || pdfModule;
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (pdfErr: any) {
        return { success: false, error: "PDFの解析に失敗しました。" };
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    return await analyzeUserStyle(userId, extractedText);
  } catch (error: any) {
    return { success: false, error: `ファイル処理エラー: ${error.message}` };
  }
}

/**
 * 4.2. 記事生成プロンプト（Generator）
 */
export async function generateSnsPost(userId: string, topic: string) {
  try {
    const userProfile = await (prisma.userProfile as any).findUnique({
      where: { id: userId },
      select: { styleInstruction: true }
    });

    if (!userProfile?.styleInstruction) {
      return { success: false, error: "文体分析が完了していません。" };
    }

    const result = await withAIRetry(async (model) => {
      // システム指示文を反映させるため、一時的にモデルの設定を上書きするか、プロンプトに含める
      // withAIRetryの中で渡されるmodelは新しいインスタンス
      const prompt = `
        【システム指示文】
        ${userProfile.styleInstruction}

        【指示】
        以下の「ネタ（議論ログやメモ）」を基に、あなたらしい文体でnote記事を作成してください。
        
        【制約事項】
        - 文字数は2,000字程度
        - note形式（見出し、箇条書き、太字などを適宜使用）
        - 最後に適切なハッシュタグを3〜5個付与
        
        ネタ：
        ${topic}
      `;
      return await model.generateContent(prompt);
    }, { 
      appId: 'post-assistant',
      title: 'Post Generation'
    });

    return { success: true, content: result.response.text() };
  } catch (error: any) {
    return { success: false, error: "記事の生成に失敗しました。" };
  }
}

/**
 * 4.3. 画像生成用プロンプト作成 & 画像生成（模擬）
 */
export async function generateImageWithPrompt(topic: string, touch: string, keywords: string) {
  try {
    const result = await withAIRetry(async (model) => {
      const rawPrompt = getSystemInstruction("post-assistant-visualizer");
      const prompt = rawPrompt
        .replace("{{topic}}", topic || "")
        .replace("{{touch}}", touch || "")
        .replace("{{keywords}}", keywords || "");

      return await model.generateContent(prompt);
    }, { 
      appId: 'post-assistant',
      title: 'Image Prompt Generation'
    });

    const imagePrompt = result.response.text().trim();
    const randomSeed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(keywords || "note")}-${randomSeed}/1280/670`;

    return { success: true, imagePrompt, imageUrl };
  } catch (error: any) {
    return { success: false, error: "画像のプロンプト生成に失敗しました。" };
  }
}

/**
 * 4.4. 添削から学習する（Refine機能）
 */
export async function refineUserStyle(userId: string, draftText: string, finalText: string) {
  try {
    const userProfile = await (prisma.userProfile as any).findUnique({
      where: { id: userId },
      select: { styleInstruction: true, learningLevel: true }
    });

    if (!userProfile?.styleInstruction) {
      return { success: false, error: "先に文体を蒸留（分析）してください。" };
    }

    const currentLevel = userProfile.learningLevel || 0;

    const result = await withAIRetry(async (model) => {
      const rawPrompt = getSystemInstruction("post-assistant-reflection");
      const prompt = rawPrompt
        .replace("{{styleInstruction}}", userProfile.styleInstruction || "")
        .replace("{{draftText}}", draftText || "")
        .replace("{{finalText}}", finalText || "");

      return await model.generateContent(prompt);
    }, { 
      appId: 'post-assistant',
      title: 'Style Refinement'
    });

    const responseText = result.response.text();
    // JSONのパース（Markdownの ```json が付いている場合のケア）
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(jsonStr);

    const gainedLevel = 2; // 添削学習による成長EXP

    await (prisma.userProfile as any).update({
      where: { id: userId },
      data: {
        styleInstruction: data.newStyleInstruction,
        learningLevel: currentLevel + gainedLevel,
        lastAnalyzedAt: new Date(),
      } as any,
    });

    revalidatePath("/post-assistant");
    return { success: true, feedback: data.feedback, newStyle: data.newStyleInstruction };
  } catch (error: any) {
    console.error("[refineUserStyle] Error:", error);
    return { success: false, error: "添削の分析中にエラーが発生しました。" };
  }
}

export async function getUserProfiles() {
  return await prisma.userProfile.findMany({
    orderBy: { createdAt: 'asc' }
  });
}

export async function createUserProfile(displayName: string) {
  const count = await prisma.userProfile.count();
  if (count >= 10) throw new Error("ユーザー数は最大10名までです。");

  const profile = await prisma.userProfile.create({
    data: {
      displayName,
      trainingLevel: 0
    }
  });
  revalidatePath("/post-assistant");
  return profile;
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


