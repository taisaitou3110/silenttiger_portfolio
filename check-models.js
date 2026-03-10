const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // 正しいメソッド呼び出し: genAI.listModels()
    const result = await genAI.listModels();
    console.log("--- 利用可能なモデル一覧 ---");
    result.models.forEach((m) => {
      console.log(`Model: ${m.name}`);
      console.log(`Supported Methods: ${m.supportedGenerationMethods.join(", ")}`);
      console.log("----------------------------");
    });
  } catch (error) {
    console.error("モデル一覧の取得に失敗しました:", error.message);
  }
}

listModels();
