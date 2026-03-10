import * as cheerio from 'cheerio';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

/**
 * PDFファイルからテキストを抽出する
 * LangChainのWebPDFLoaderを使用して安定性を向上させる
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // BufferをBlobに変換してLoaderに渡す
    const blob = new Blob([buffer]);
    const loader = new WebPDFLoader(blob);
    
    // 全ページのドキュメントを取得
    const docs = await loader.load();
    
    // テキストを結合
    return docs.map(doc => doc.pageContent).join('\n');
  } catch (error) {
    console.error('PDF extraction error (LangChain):', error);
    throw new Error(`PDFの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * WebサイトのURLからテキストを抽出する
 */
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 不要な要素を削除
    $('script, style, nav, footer, header, aside').remove();

    // 主要なコンテンツエリアを特定
    let content = $('article').text() || $('main').text() || $('body').text();
    
    // 空白の調整
    return content.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('URL extraction error:', error);
    throw new Error('Webサイトの解析に失敗しました。');
  }
}
