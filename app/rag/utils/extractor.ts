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
    const metadata = docs[0]?.metadata as any;
    const suggestedTitle = metadata?.pdf?.info?.Title || undefined;

    return { content, suggestedTitle };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDFの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * WebサイトのURLからテキストとサイトタイトルを抽出する (Playwright版)
 * 2階層（指定URLとその直下の同一ドメインリンク）まで再帰的に読み込みます。
 */
export async function extractTextFromURL(startUrl: string, maxPages: number = 15): Promise<{ content: string, suggestedTitle?: string }> {
  let browser: any;
  const visited = new Set<string>();
  const queue: { url: string, depth: number }[] = [{ url: startUrl, depth: 0 }];
  let combinedContent = "";
  let firstPageTitle = "";

  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const startUrlObj = new URL(startUrl);

    while (queue.length > 0 && visited.size < maxPages) {
      const { url, depth } = queue.shift()!;
      
      // URLの正規化（フラグメント除去など）
      const normalizedUrl = url.split('#')[0].replace(/\/$/, "");
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      console.log(`[Crawler] Visiting (${visited.size}/${maxPages}): ${normalizedUrl} (Depth: ${depth})`);

      const page = await context.newPage();
      try {
        await page.goto(normalizedUrl, { waitUntil: 'networkidle', timeout: 20000 });

        if (visited.size === 1) {
          firstPageTitle = await page.title();
        }

        // 不要な要素の削除
        await page.evaluate(() => {
          const selectors = ['script', 'style', 'nav', 'footer', 'header', 'aside', '.ads', '#cookie-banner', 'iframe'];
          selectors.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));
        });

        // テキスト抽出
        const pageText = await page.evaluate(() => {
          const mainElement = document.querySelector('article') || document.querySelector('main') || document.querySelector('body');
          return mainElement ? (mainElement as HTMLElement).innerText : '';
        });

        if (pageText.trim()) {
          combinedContent += `\n\n--- SOURCE: ${normalizedUrl} ---\n${pageText.trim()}`;
        }

        // 次の階層のリンクを抽出 (Depth 0 の時のみ実行 = 合計2階層)
        if (depth === 0) {
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .map(a => a.href)
              .filter(href => href.startsWith('http'));
          });

          for (const link of links) {
            try {
              const linkObj = new URL(link);
              // 同一ドメイン、かつまだ未訪問、かつキューにないものを追加
              if (linkObj.hostname === startUrlObj.hostname && !visited.has(link.split('#')[0].replace(/\/$/, ""))) {
                queue.push({ url: link, depth: depth + 1 });
              }
            } catch (e) { /* ignore invalid urls */ }
          }
        }
      } catch (e) {
        console.error(`Failed to crawl ${normalizedUrl}:`, e);
      } finally {
        await page.close();
      }
    }

    await browser.close();

    if (!combinedContent.trim()) {
      throw new Error('コンテンツの抽出に失敗しました。');
    }

    const finalTitle = visited.size > 1 
      ? `${firstPageTitle} (and ${visited.size - 1} related pages)`
      : firstPageTitle;

    return { 
      content: combinedContent.replace(/\s+/g, ' ').trim(), 
      suggestedTitle: finalTitle.trim() 
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error('Crawler error:', error);
    throw error;
  }
}
