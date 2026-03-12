import prisma from "@/lib/prisma";
import { TaskType } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { withAIRetry } from '@/lib/ai-handler';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * ドキュメントをチャンクに分割する
 */
export async function splitDocument(content: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.createDocuments([content]);
  return chunks.map(c => c.pageContent);
}

/**
 * 1バッチ分のチャンクをベクトル化して保存する
 */
export async function ingestChunkBatch(
  documentId: string,
  batchContents: string[],
  title?: string
) {
  return await withAIRetry(async (model) => {
    const result = await model.batchEmbedContents({
      requests: batchContents.map(text => ({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: title || 'RAG Document'
      }))
    });

    const embeddings = result.embeddings;

    for (let i = 0; i < batchContents.length; i++) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO "DocumentChunk" ("id", "documentId", "content", "embedding") 
         VALUES (gen_random_uuid()::text, $1, $2, $3::vector)`,
        documentId,
        batchContents[i],
        `[${embeddings[i].values.join(',')}]`
      );
    }
  }, { level: 'intensive', isEmbedding: true });
}

/**
 * ドキュメントの親レコードを作成する
 */
export async function createDocumentRecord(title: string, url?: string, filePath?: string) {
  return await prisma.document.create({
    data: { title, url, filePath },
  });
}

/**
 * 質問に対して類似度の高いチャンクを検索する
 */
export async function searchSimilarChunks(query: string, limit: number = 8) {
  const result = await withAIRetry(async (model) => {
    return await model.embedContent({
      content: { role: 'user', parts: [{ text: query }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    });
  }, { level: 'standard', isEmbedding: true });
  
  const embedding = result.embedding.values;

  const chunks = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
      c.id, 
      c.content, 
      d.title as "documentTitle",
      1 - (c.embedding <=> $1::vector) as similarity
    FROM "DocumentChunk" c
    JOIN "Document" d ON c."documentId" = d.id
    ORDER BY c.embedding <=> $1::vector
    LIMIT $2`,
    `[${embedding.join(',')}]`,
    limit
  );

  return chunks;
}

/**
 * RAGによる回答生成 (精度・ソース識別強化型)
 */
export async function generateAnswer(query: string) {
  // 1. 関連情報の検索 (精度確保のため10件取得)
  const chunks = await searchSimilarChunks(query, 10);
  
  if (chunks.length === 0) {
    return {
      answer: "学習済みの資料の中に該当する情報が見つかりませんでした。",
      sources: []
    };
  }

  // 2. AIに渡す文脈の構築 (ソースを明確に区別させる)
  const context = chunks
    .map((c, i) => `--- 資料ブロック ${i+1} [ソース: ${c.documentTitle}] ---\n${c.content}`)
    .join('\n\n');

  const prompt = `あなたはオフィスのIT機器に精通したコンシェルジュです。
提供された「複数の資料ソース」に基づき、ユーザーの質問に正確に回答してください。

【重要な回答ルール】
1. 情報の出所（どの資料からの情報か）を回答内で必ず言及してください。
2. 複数のソースに情報がある場合は、それらを比較・統合して回答してください。
3. 資料 A と 資料 B で情報が矛盾している場合は、両方の内容を併記してください。
4. 提供された資料に情報がない場合は「不明」と答え、自分の知識で補完しないでください。

【提供資料ソース】
${context}

【ユーザーからの質問】
${query}`;

  // 3. モデルの優先順位を「分散」させてリトライ待ちを回避
  const models = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return {
        answer: response.text(),
        sources: chunks.map(c => c.documentTitle)
      };
    } catch (error: any) {
      if (error.status === 429) {
        console.warn(`[Quota Limit] ${modelName} is busy, trying next available model...`);
        continue; 
      }
      console.error(`Model ${modelName} error:`, error);
    }
  }

  throw new Error("現在、すべてのAIモデルが制限に達しています。数分待ってから再度お試しください。");
}
