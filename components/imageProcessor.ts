/**
 * 手書き文字解析用に画像を最適化するユーティリティ
 * 1. グレースケール化（モノクロ）
 * 2. 指定サイズへのリサイズ
 * 3. JPEG圧縮
 */
export async function processHandwritingImage(file: File): Promise<{ base64: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 最大幅を1200pxに制限（文字認識に十分な解像度を維持しつつ軽量化）
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        // 1. 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // 2. グレースケール化（モノクロ処理）
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // 加重平均法による輝度計算
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = avg;     // R
          data[i + 1] = avg; // G
          data[i + 2] = avg; // B
        }
        ctx.putImageData(imageData, 0, 0);

        // 3. JPEGとして書き出し（品質0.7程度で十分）
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        // data:image/jpeg;base64, の部分を除いた純粋なバイトサイズを概算
        const head = "data:image/jpeg;base64,";
        const fileSize = Math.round((base64.length - head.length) * 3 / 4);

        resolve({ base64, size: fileSize });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
