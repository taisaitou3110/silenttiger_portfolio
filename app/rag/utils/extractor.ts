import * as cheerio from 'cheerio';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

/**
 * PDFファイルからテキストとメタデータを抽出する
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{ content: string, suggestedTitle?: string }> {
  try {
    const blob = new Blob([buffer]);
    const loader = new WebPDFLoader(blob);
    const docs = await loader.load();
    
    const content = docs.map(doc => doc.pageContent).join('\n');
    
    // PDFのメタデータからタイトルを探す（存在する場合）
    // WebPDFLoaderの1ページ目のメタデータに情報が入っていることがある
    const metadata = docs[0]?.metadata as any;
    const suggestedTitle = metadata?.pdf?.info?.Title || undefined;

    return { content, suggestedTitle };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDFの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * WebサイトのURLからテキストとサイトタイトルを抽出する
 */
export async function extractTextFromURL(url: string): Promise<{ content: string, suggestedTitle?: string }> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // サイトタイトルの取得
    const suggestedTitle = $('title').text() || $('h1').first().text();

    // 不要な要素を削除
    $('script, style, nav, footer, header, aside').remove();

    // 主要なコンテンツエリアを特定
    let content = $('article').text() || $('main').text() || $('body').text();
    
    return { 
      content: content.replace(/\s+/g, ' ').trim(), 
      suggestedTitle: suggestedTitle.trim() 
    };
  } catch (error) {
    console.error('URL extraction error:', error);
    throw new Error('Webサイトの解析に失敗しました。');
  }
}
