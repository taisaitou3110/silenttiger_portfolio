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
    
    // 型チェックのために response を模倣したオブジェクトを返す（自動ログ用）
    return { response: { usageMetadata: { promptTokenCount: batchContents.join("").length / 4, candidatesTokenCount: 0 } } };
  }, { level: 'intensive', isEmbedding: true, appId: 'rag' });
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
  }, { level: 'standard', isEmbedding: true, appId: 'rag' });
  
  const embedding = (result as any).embedding.values;

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
 * RAGによる回答生成 (精度・ソース識別・ドメイン意識強化型)
 */
export async function generateAnswer(query: string) {
  // 1. 関連情報の検索 (精度確保のため10件取得)
  const chunks = await searchSimilarChunks(query, 10);
  
  // 2. 登録済みドキュメントの全リストを取得 (AIに「何を知っているか」の全体像を教える)
  const allDocs = await prisma.document.findMany({
    select: { title: true, url: true }
  });
  
  const libraryList = allDocs
    .map(d => `- ${d.title}${d.url ? ` (URL: ${d.url})` : ''}`)
    .join('\n');

  // 3. AIに渡す文脈の構築
  const context = chunks.length > 0 
    ? chunks.map((c, i) => `--- 資料ブロック ${i+1} [ソース: ${c.documentTitle}] ---\n${c.content}`).join('\n\n')
    : "（今回の質問に直接一致する具体的な記述は、提供資料の断片からは見つかりませんでした）";

  const prompt = `あなたはオフィスのIT機器に精通したプロフェッショナルなコンシェルジュです。
ユーザーの質問に対し、登録済みの「学習ライブラリ」の情報を最大限に活用して回答してください。

【学習ライブラリの全体像】
現在、以下の資料がシステムに登録されています：
${libraryList}

【具体的に抽出された資料ソース（断片）】
${context}

【回答の構成ルール】
1. **資料ソースに直接の答えがある場合:**
   - その資料名を明示（例：[ソース: Canonマニュアル]）し、正確に回答してください。

2. **資料ソースに答えがないが、学習ライブラリに関連するドメイン・製品の場合:**
   - 「システムに登録されている『${allDocs[0]?.title || '関連資料'}』のドメイン/製品に関連する内容です。」と前置きしてください。
   - その上で、「現在の学習範囲（トップページ等）には詳細がありませんが、一般的なIT知識に基づくと〜」と、可能性の高い解決策を提示してください。
   - 資料のURLがわかっている場合は、「詳細は登録されているURL ${allDocs[0]?.url || ''} の先にある別の階層に記載されている可能性があります」と案内してください。
3. **どの資料とも関連がない場合:**
   - 一般的なIT知識に基づき、プロフェッショナルとして最善の助言をしてください。

【重要な心得】
- ユーザーに「不明です」とだけ答えるのは禁止です。
- 「学習済みのWebサイトと、今の質問がどう関係しているか（同じメーカーか、同じドメインか等）」を常に意識して、根拠を添えてください。

【ユーザーからの質問】
${query}`;

  // 4. withAIRetry を使用して実行（自動的にログ保存される）
  const result = await withAIRetry(async (model) => {
    return await model.generateContent(prompt);
  }, { appId: 'rag' });

  return {
    answer: result.response.text(),
    sources: chunks.map(c => c.documentTitle)
  };
}
