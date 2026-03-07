const CALIL_API_KEY = process.env.CALIL_API_KEY || 'c6008800000000000000000000000000'; // デフォルトまたは環境変数
const SYSTEMS = ['Hiroshima_Kure', 'Hiroshima_Higashihiroshima'];

export interface LibraryStatus {
  systemid: string;
  systemName: string;
  status: '貸出可' | '蔵書あり' | '館内のみ' | '貸出中' | '準備中' | '蔵書なし' | '不明';
  reserveUrl: string | null;
}

export async function checkLibraryStock(isbn: string): Promise<LibraryStatus[]> {
  const systemIds = SYSTEMS.join(',');
  const url = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&isbn=${isbn}&systemid=${systemIds}&format=json&callback=no`;

  try {
    let res = await fetch(url);
    let data = await res.json();

    // ポーリングが必要な場合 (status が 'Running')
    let attempts = 0;
    while (data.continue === 1 && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      res = await fetch(url);
      data = await res.json();
      attempts++;
    }

    const results: LibraryStatus[] = [];
    for (const sysId of SYSTEMS) {
      const sysData = data.books?.[isbn]?.[sysId];
      const systemName = sysId === 'Hiroshima_Kure' ? '呉市立図書館' : '東広島市立図書館';
      
      if (!sysData) {
        results.push({ systemid: sysId, systemName, status: '不明', reserveUrl: null });
        continue;
      }

      // 簡易的なステータス変換
      let status: LibraryStatus['status'] = '蔵書なし';
      const libkeys = sysData.libkeys || {};
      const states = Object.values(libkeys) as string[];

      if (states.includes('貸出可')) status = '貸出可';
      else if (states.includes('蔵書あり')) status = '蔵書あり';
      else if (states.includes('貸出中')) status = '貸出中';
      else if (states.length > 0) status = '蔵書あり';

      results.push({
        systemid: sysId,
        systemName,
        status,
        reserveUrl: data.books?.[isbn]?.reserveurl || null
      });
    }

    return results;
  } catch (error) {
    console.error("Calil API error:", error);
    return SYSTEMS.map(sysId => ({
      systemid: sysId,
      systemName: sysId === 'Hiroshima_Kure' ? '呉市立図書館' : '東広島市立図書館',
      status: '不明',
      reserveUrl: null
    }));
  }
}
