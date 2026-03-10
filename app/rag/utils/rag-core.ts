import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const prisma = new PrismaClient();
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
 * TaskType.RETRIEVAL_DOCUMENT を使用するのが公式の推奨
 */
export async function ingestChunkBatch(
  documentId: string,
  batchContents: string[],
  title: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  const result = await model.batchEmbedContents({
    requests: batchContents.map(text => ({
      content: { role: 'user', parts: [{ text }] },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: title // ドキュメントのタイトルを渡すと精度が向上
    }))
  });

  const embeddings = result.embeddings;

  for (let i = 0; i < batchContents.length; i++) {
    // データベース側の次元数を確認し、必要に応じて 768 に戻すか 3072 を受け入れる
    // gemini-embedding-001 は通常 768
    const embeddingValues = embeddings[i].values;
    
    await prisma.$queryRawUnsafe(
      `INSERT INTO "DocumentChunk" ("id", "documentId", "content", "embedding") 
       VALUES (gen_random_uuid()::text, $1, $2, $3::vector)`,
      documentId,
      batchContents[i],
      `[${embeddingValues.join(',')}]`
    );
  }
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
 * 検索時は TaskType.RETRIEVAL_QUERY を使用する
 */
export async function searchSimilarChunks(query: string, limit: number = 3) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text: query }] },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  
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
 * RAGによる回答生成 (モデルフォールバック & リトライ機能付き)
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 診断リストで確認された確実なモデル名
  const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

  for (const modelName of modelsToTry) {
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        console.log(`Generating answer using ${modelName} (Retry: ${retries})...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return {
          answer: response.text(),
          sources: chunks.map(c => c.documentTitle)
        };
      } catch (error: any) {
        // 429 (Quota Exceeded) の場合はリトライまたはモデル切り替え
        if (error.status === 429) {
          if (retries < maxRetries) {
            retries++;
            const waitTime = Math.pow(2, retries) * 2000;
            console.warn(`${modelName} rate limited. Waiting ${waitTime}ms...`);
            await sleep(waitTime);
            continue; // 同じモデルでリトライ
          } else {
            console.warn(`${modelName} exhausted. Switching to next model...`);
            break; // 次のモデルへ
          }
        }
        // その他のエラーはそのまま投げる
        console.error(`Error with ${modelName}:`, error);
        throw error;
      }
    }
  }

  throw new Error("すべての利用可能なモデルで制限に達しました。しばらく時間をおいてからお試しください。");
}
