import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import * as cheerio from 'cheerio';

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
    const metadata = docs[0]?.metadata as any;
    const suggestedTitle = metadata?.pdf?.info?.Title || undefined;

    return { content, suggestedTitle };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDFの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * WebサイトのURLからテキストとサイトタイトルを抽出する (Cheerio版 - Vercel対応)
 * 2階層（指定URLとその直下の同一ドメインリンク）まで再帰的に読み込みます。
 */
export async function extractTextFromURL(startUrl: string, maxPages: number = 15): Promise<{ content: string, suggestedTitle?: string }> {
  const visited = new Set<string>();
  const queue: { url: string, depth: number }[] = [{ url: startUrl, depth: 0 }];
  let combinedContent = "";
  let firstPageTitle = "";

  const startUrlObj = new URL(startUrl);
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  while (queue.length > 0 && visited.size < maxPages) {
    const { url, depth } = queue.shift()!;
    
    // URLの正規化（フラグメント除去など）
    let normalizedUrl;
    try {
      const u = new URL(url);
      u.hash = ''; // フラグメント除去
      normalizedUrl = u.toString().replace(/\/$/, "");
    } catch (e) {
      continue;
    }

    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    console.log(`[Crawler/Cheerio] Visiting (${visited.size}/${maxPages}): ${normalizedUrl} (Depth: ${depth})`);

    try {
      const response = await fetch(normalizedUrl, {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const html = await response.text();
      const $ = cheerio.load(html);

      if (visited.size === 1) {
        firstPageTitle = $('title').text() || normalizedUrl;
      }

      // 不要な要素を削除
      $('script, style, nav, footer, header, aside, .ads, #cookie-banner, iframe, noscript').remove();

      // テキスト抽出 (main, article, bodyの順に優先)
      const mainElement = $('article').length ? $('article') : ($('main').length ? $('main') : $('body'));
      
      // 改行を考慮したテキスト取得
      const pageText = mainElement.find('p, h1, h2, h3, h4, li, td, th').map((_, el) => $(el).text().trim()).get().join('\n');

      if (pageText.trim()) {
        combinedContent += `\n\n--- SOURCE: ${normalizedUrl} ---\n${pageText.trim()}`;
      }

      // 次の階層のリンクを抽出 (Depth 0 の時のみ実行)
      if (depth === 0) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          try {
            // 相対パスを絶対パスに変換
            const absoluteUrl = new URL(href, normalizedUrl);
            const absoluteUrlStr = absoluteUrl.toString().split('#')[0].replace(/\/$/, "");

            // 同一ドメイン、かつ未訪問、かつプロトコルがhttp/https
            if (absoluteUrl.hostname === startUrlObj.hostname && 
                !visited.has(absoluteUrlStr) && 
                absoluteUrl.protocol.startsWith('http')) {
              queue.push({ url: absoluteUrl.toString(), depth: depth + 1 });
            }
          } catch (e) { /* ignore invalid urls */ }
        });
      }
    } catch (e) {
      console.error(`Failed to fetch ${normalizedUrl}:`, e);
    }
  }

  if (!combinedContent.trim()) {
    throw new Error('コンテンツの抽出に失敗しました。URLが正しいか、アクセス制限されている可能性があります。');
  }

  const finalTitle = visited.size > 1 
    ? `${firstPageTitle} (and ${visited.size - 1} pages)`
    : firstPageTitle;

  return { 
    content: combinedContent.replace(/\s+/g, ' ').trim(), 
    suggestedTitle: finalTitle.trim() 
  };
}
