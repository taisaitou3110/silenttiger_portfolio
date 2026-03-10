import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function diagnoseAI() {
  const client = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: 'v1beta'
  });

  try {
    console.log("--- 利用可能なモデルの調査を開始 ---");
    const response = await client.models.list();
    
    // レスポンスの全容をログ出力して構造を特定
    console.log("Response Keys:", Object.keys(response));
    
    // 通常、新SDKでは response.models または response 自体が配列ライクなオブジェクト
    const models = response.models || response;

    if (Array.isArray(models)) {
      console.log(`\n合計モデル数: ${models.length}`);
      
      const embeddingModels = models.filter(m => m.supportedGenerationMethods.includes('embedContent'));
      const chatModels = models.filter(m => m.supportedGenerationMethods.includes('generateContent'));

      console.log("\n[Embedding Models]");
      embeddingModels.forEach(m => console.log(`- ${m.name}`));

      console.log("\n[Chat Models]");
      chatModels.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("Models is not an array. Details:", typeof models);
      console.log(JSON.stringify(response, null, 2));
    }

  } catch (error) {
    console.error("調査失敗:", error);
  }
}

diagnoseAI();
