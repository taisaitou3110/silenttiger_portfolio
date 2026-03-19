'use server'

import { extractTextFromPDF, extractTextFromURL } from './utils/extractor';
import { splitDocument, createDocumentRecord, ingestChunkBatch, generateAnswer } from './utils/rag-core';
import { revalidatePath } from 'next/cache';
import prisma from "@/lib/prisma";

/**
 * 学習済みのドキュメント一覧を取得する
 */
export async function getDocumentsAction() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        _count: {
          select: { chunks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, documents };
  } catch (error: any) {
    console.error('Get documents error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ドキュメントを削除する
 */
export async function deleteDocumentAction(id: string) {
  try {
    await prisma.document.delete({
      where: { id }
    });
    revalidatePath('/rag');
    return { success: true };
  } catch (error: any) {
    console.error('Delete document error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 1. ドキュメントの基本情報を保存し、テキストを抽出してチャンク化する
 */
export async function prepareDocumentAction(formData: FormData) {
  const url = formData.get('url') as string;
  const file = formData.get('file') as File;
  const userTitle = formData.get('title') as string;

  try {
    let content = '';
    let autoTitle = '';

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await extractTextFromPDF(buffer);
      content = result.content;
      autoTitle = result.suggestedTitle || file.name;
    } else if (url) {
      const result = await extractTextFromURL(url);
      content = result.content;
      autoTitle = result.suggestedTitle || url;
    } else {
      throw new Error('URLまたはPDFファイルが必要です。');
    }

    // ユーザー入力優先、なければ自動抽出タイトル
    let finalTitle = userTitle || autoTitle || '無題のドキュメント';

    // もし抽出されたタイトルが「PDF Document」などの汎用的なものなら、ファイル名を優先する
    if (!userTitle && file && (finalTitle === 'PDF Document' || finalTitle === 'pdf-document')) {
      finalTitle = file.name;
    }

    const document = await createDocumentRecord(
      finalTitle, 
      url || undefined, 
      (file && file.size > 0) ? file.name : undefined
    );
    const chunks = await splitDocument(content);

    return { 
      success: true, 
      documentId: document.id, 
      chunks, 
      totalChunks: chunks.length 
    };
  } catch (error: any) {
    console.error('Prepare document error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. 1バッチ分のチャンクをインジェクションする
 */
export async function injectBatchAction(documentId: string, batch: string[]) {
  try {
    await ingestChunkBatch(documentId, batch);
    return { success: true };
  } catch (error: any) {
    console.error('Inject batch error:', error);
    // 429エラーをクライアントに伝える
    return { success: false, error: error.message, status: error.status };
  }
}

/**
 * 最終処理（再バリデートなど）
 */
export async function finalizeIngestionAction() {
  revalidatePath('/rag');
}

/**
 * 質問に回答する
 */
export async function askQuestionAction(query: string) {
  try {
    const result = await generateAnswer(query);
    return { success: true, ...result };
  } catch (error: any) {
    console.error('Ask action error:', error);
    return { success: false, error: error.message };
  }
}
