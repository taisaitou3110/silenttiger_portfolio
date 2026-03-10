import { PrismaClient } from '@prisma/client';
import { TaskType } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { withAIRetry } from '@/lib/ai-handler';

const prisma = new PrismaClient();

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
 * 共通部品 withAIRetry を使用して安定性を確保
 */
export async function ingestChunkBatch(
  documentId: string,
  batchContents: string[],
  title: string
) {
  return await withAIRetry(async (model) => {
    const result = await model.batchEmbedContents({
      requests: batchContents.map(text => ({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: title
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
  }, { level: 'intensive', isEmbedding: true }); // isEmbeddingを追加
}

/**
 * ドキュメントの親レコードを作成する
 */
export async function createDocumentRecord(title: string, url?: string) {
  return await prisma.document.create({
    data: { title, url },
  });
}

/**
 * 質問に対して類似度の高いチャンクを検索する
 */
export async function searchSimilarChunks(query: string, limit: number = 3) {
  const result = await withAIRetry(async (model) => {
    return await model.embedContent({
      content: { role: 'user', parts: [{ text: query }] },
      taskType: TaskType.RETRIEVAL_QUERY,
    });
  }, { level: 'standard', isEmbedding: true }); // isEmbeddingを追加
  
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
 * RAGによる回答生成
 * モデルフォールバックとリトライを withAIRetry で完結
 */
export async function generateAnswer(query: string) {
  const chunks = await searchSimilarChunks(query);
  
  if (chunks.length === 0) {
    return {
      answer: "学習済みの資料の中に該当する情報が見つかりませんでした。資料をアップロードしてください。",
      sources: []
    };
  }

  const context = chunks.map(c => `[出典: ${c.documentTitle}] ${c.content}`).join('\n\n');
  const prompt = `あなたはオフィスのIT機器コンシェルジュです。
資料に基づき回答し、不明な点は「不明」と答えてください。

【資料抜粋】
${context}

【質問】
${query}`;

  return await withAIRetry(async (model) => {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      answer: response.text(),
      sources: chunks.map(c => c.documentTitle)
    };
  }, { level: 'intensive' });
}
