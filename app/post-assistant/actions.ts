"use server";

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * 補助関数: XML（特にnote形式）から本文のみを抽出する
 */
function extractTextFromXml(xml: string): string {
  // <content:encoded><![CDATA[ ... ]]> を抽出
  const matches = xml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/g);
  if (!matches) {
    // RSS形式でない場合はタグを単純除去
    return xml.replace(/<[^>]*>?/gm, "").trim();
  }

  return matches.map(m => {
    // CDATA内部を抽出し、HTMLタグを除去
    const content = m.replace(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/, "$1");
    return content.replace(/<[^>]*>?/gm, "").trim();
  }).join("\n\n---\n\n");
}

/**
 * 4.1. 文体抽出プロンプト（Analyzer）
 * ユーザーの過去記事から文体を分析し、UserProfileに保存する
 */
export async function analyzeUserStyle(userId: string, pastArticles: string) {
  console.log(`[analyzeUserStyle] Starting analysis for user: ${userId}, Text length: ${pastArticles.length}`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("[analyzeUserStyle] GEMINI_API_KEY is not set.");
    return { success: false, error: "APIキーが設定されていません。" };
  }

  // テキストがXMLっぽい場合はクレンジング
  let processedText = pastArticles;
  if (pastArticles.includes("<") && pastArticles.includes(">")) {
    console.log("[analyzeUserStyle] Markup format detected. Cleaning up...");
    processedText = extractTextFromXml(pastArticles);
    console.log(`[analyzeUserStyle] Cleaned text length: ${processedText.length}`);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
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
    ${processedText}
    `;

    console.log("[analyzeUserStyle] Calling Gemini API (this may take a while)...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const styleInstruction = response.text();
    console.log("[analyzeUserStyle] Gemini API response received.");

    // トークン数（概算）に基づいて学習レベルを更新
    const tokenCount = processedText.length;
    let learningLevel = 1;
    if (tokenCount > 50000) learningLevel = 5;
    else if (tokenCount > 20000) learningLevel = 4;
    else if (tokenCount > 10000) learningLevel = 3;
    else if (tokenCount > 5000) learningLevel = 2;

    await (prisma.userProfile as any).update({
      where: { id: userId },
      data: {
        styleInstruction,
        learningLevel,
        lastAnalyzedAt: new Date(),
      } as any,
    });

    console.log("[analyzeUserStyle] Analysis and update complete.");
    revalidatePath("/post-assistant");
    return { success: true, styleInstruction };
  } catch (error: any) {
    console.error("[analyzeUserStyle] Error encountered:", error);
    return { success: false, error: error.message || "文体分析中にエラーが発生しました。" };
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
      console.log("[uploadAndAnalyzeStyle] Processing PDF file...");
      try {
        const pdfModule = await import("pdf-parse");
        const pdf = (pdfModule as any).default || pdfModule;
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (pdfErr: any) {
        console.error("[uploadAndAnalyzeStyle] PDF Library Error:", pdfErr);
        return { success: false, error: "PDFの解析ライブラリでエラーが発生しました。テキストを直接貼り付けてお試しください。" };
      }
    } else {
      // XML, Text etc.
      console.log("[uploadAndAnalyzeStyle] Processing Text/XML file...");
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || !extractedText.trim()) {
      return { success: false, error: "ファイルからテキストを抽出できませんでした。" };
    }

    return await analyzeUserStyle(userId, extractedText);
  } catch (error: any) {
    console.error("[uploadAndAnalyzeStyle] Error:", error);
    return { success: false, error: `ファイル処理エラー: ${error.message}` };
  }
}

/**
 * 4.2. 記事生成プロンプト（Generator）
 * 保存された文体指示書を使い、新しいネタから記事を生成する
 */
export async function generateSnsPost(userId: string, topic: string) {
  try {
    const userProfile = await (prisma.userProfile as any).findUnique({
      where: { id: userId },
      select: { styleInstruction: true }
    });

    if (!userProfile?.styleInstruction) {
      return { success: false, error: "文体分析が完了していません。先に過去の記事を分析してください。" };
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return { success: true, content };
  } catch (error: any) {
    console.error("[generateSnsPost] Error:", error);
    return { success: false, error: error.message || "記事の生成に失敗しました。" };
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
