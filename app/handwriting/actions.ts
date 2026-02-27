"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --- User Profile Management ---

export async function getUserProfiles() {
  if (!prisma.userProfile) {
    console.error("Prisma client does not have userProfile model. Try running 'npx prisma generate'.");
    return [];
  }
  return await prisma.userProfile.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { trainingPool: true } } }
  });
}

export async function createUserProfile(displayName: string, penType: string) {
  if (!prisma.userProfile) {
    throw new Error("Prisma client not initialized (userProfile missing). Please run 'npx prisma generate' and restart the server.");
  }
  const count = await prisma.userProfile.count();
  if (count >= 10) throw new Error("ユーザー数は最大10名までです。");

  return await prisma.userProfile.create({
    data: {
      displayName,
      penType,
      trainingLevel: 0
    }
  });
}

export async function updateProfileTrainingLevel(profileId: string, level: number) {
  if (!prisma.userProfile) return null;
  return await prisma.userProfile.update({
    where: { id: profileId },
    data: { trainingLevel: level }
  });
}

// --- Training Onboarding ---

export async function getTrainingTemplates() {
  if (!prisma.trainingTemplate) {
    console.error("Prisma client does not have trainingTemplate model.");
    return [];
  }
  // 初期データがなければ作成 (Seed的な役割)
  const count = await prisma.trainingTemplate.count();
  if (count === 0) {
    await prisma.trainingTemplate.createMany({
      data: [
        { step: 1, category: "基本（いろは歌）", targetText: "いろはにほへとちりぬるをわかよたれそつねならむ", description: "ひらがなの全文字を丁寧に書いてください。はね・はらいが重要です。" },
        { step: 2, category: "数字と記号", targetText: "0123456789 / - ¥ . ,", description: "金額や電話番号で使われる数字と記号を書いてください。" },
        { step: 3, category: "アルファベット", targetText: "abcdefg ABCDEFG", description: "英数字混じりのメモに対応するため、アルファベットを書いてください。" },
        { step: 4, category: "ビジネス頻出語", targetText: "株式会社 様 円 個 お疲れ様です", description: "よく使う漢字や定型句の崩し字を学習させます。" },
        { step: 5, category: "実戦走り書き", targetText: "明日までに納品すること。至急確認願います。", description: "普段のスピードで、文字の繋がり（連筆）を意識して書いてください。" },
      ]
    });
  }
  return await prisma.trainingTemplate.findMany({ orderBy: { step: 'asc' } });
}

// --- Zod Schemas ---

const BusinessCallSchema = z.object({
  customerName: z.string(),
  phoneNumber: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  content: z.string(),
  confidence: z.number(),
  items: z.array(z.object({
    label: z.string(),
    value: z.string(),
    confidence: z.number(),
  })).optional(),
});

const OrderCallSchema = z.object({
  customerName: z.string(),
  phoneNumber: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  orderDate: z.string(),
  items: z.array(z.object({
    itemName: z.string(),
    quantity: z.union([z.number(), z.string()]),
    unit: z.string().optional(),
    price: z.union([z.number(), z.string()]),
    confidence: z.number(),
  })),
  confidence: z.number(),
});

/**
 * 郵便番号 lookup
 */
export async function fetchAddressFromZip(zip: string) {
  if (!zip || zip.length < 7) return null;
  const cleanZip = zip.replace("-", "");
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`);
    const data = await res.json();
    if (data.results?.[0]) {
      const { address1, address2, address3 } = data.results[0];
      return `${address1}${address2}${address3}`;
    }
  } catch (e) { console.error(e); }
  return null;
}

function parseNumericValue(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val.replace(/[^\d.]/g, '')) || 0;
}

/**
 * Phase 3 & 4: パーソナライズ文脈 (Profile-specific)
 */
async function fetchPersonalizationContext(profileId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { id: profileId },
    include: {
      trainingPool: { take: 30, orderBy: { createdAt: 'desc' } }
    }
  });

  if (!profile) return "";

  const [customers, orders] = await Promise.all([
    prisma.customer.findMany({ take: 10, orderBy: { updatedAt: 'desc' } }),
    prisma.order.findMany({ take: 20, select: { itemName: true }, distinct: ['itemName'] }),
  ]);

  const habits = profile.trainingPool.map(t => `- "${t.correctLabel}" の筆跡特徴を学習済み` ).join('\n');
  const knownCustomers = customers.map(c => `- ${c.name}`).join('\n');
  
  return `
### 筆跡プロファイル: ${profile.displayName} (筆記具: ${profile.penType || '不明'})
【学習済みのクセ】:
${habits || "データ蓄積中"}

【既知のドメイン知識】:
顧客: ${customers.map(c => c.name).join(', ')}
商品: ${orders.map(o => o.itemName).join(', ')}
  `.trim();
}

export async function analyzeHandwriting(base64Image: string, mimeType: string, docType: string, profileId?: string) {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash" });
  
  let personalContext = "";
  if (profileId) {
    personalContext = await fetchPersonalizationContext(profileId);
  }

  const prompt = `
    ${personalContext}
    この画像は${docType === 'business' ? 'ビジネス電話' : docType === 'order' ? '発注電話' : '一般メモ'}です。
    内容をJSON形式で抽出してください。
    ${docType === 'general' ? '- rawText, confidence' : '- customerName, phoneNumber, zipCode, address, content/items, confidence'}
    筆跡プロファイルの傾向を考慮して、崩し字を正確に補正してください。
  `;

  const imagePart: Part = { inlineData: { data: base64Image.split(",")[1], mimeType } };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    throw new Error(`AI解析失敗: ${error.message}`);
  }
}

export async function saveHandwritingData(docType: string, data: any, trainingPool: any[], profileId: string) {
  let customerId = null;
  if (data.customerName) {
    const customer = await prisma.customer.upsert({
      where: { name_tel: { name: data.customerName, tel: data.phoneNumber || "" } },
      update: { zipCode: data.zipCode, address: data.address },
      create: { name: data.customerName, tel: data.phoneNumber || "", zipCode: data.zipCode, address: data.address }
    });
    customerId = customer.id;
  }

  // データ保存
  if (docType === 'business' && customerId) {
    await prisma.requirement.create({ data: { customerId, content: data.content } });
  } else if (docType === 'order' && customerId) {
    for (const item of data.items) {
      await prisma.order.create({
        data: { customerId, itemName: item.itemName, quantity: parseNumericValue(item.quantity), price: parseNumericValue(item.price) }
      });
    }
  } else if (docType === 'general') {
    await prisma.generalNote.create({ data: { rawText: data.rawText } });
  }

  // 学習データの保存 (Profileに紐付け)
  if (trainingPool.length > 0) {
    await prisma.trainingPool.createMany({
      data: trainingPool.map(item => ({
        profileId,
        imagePatch: item.imagePatch || "",
        correctLabel: item.correctLabel,
        confidence: item.confidence,
      }))
    });
  }

  return { success: true };
}

export async function deleteTrainingData(id: string) {
  return await prisma.trainingPool.delete({ where: { id } });
}

export async function getHandwritingData() {
  const [customers, requirements, orders, notes] = await Promise.all([
    prisma.customer.findMany({ include: { requirements: true, orders: true }, orderBy: { createdAt: 'desc' } }),
    prisma.requirement.findMany({ include: { customer: true }, orderBy: { receivedAt: 'desc' } }),
    prisma.order.findMany({ include: { customer: true }, orderBy: { orderDate: 'desc' } }),
    prisma.generalNote.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);
  return { customers, requirements, orders, notes };
}

export async function getTrainingData(profileId?: string) {
  return await prisma.trainingPool.findMany({
    where: profileId ? { profileId } : {},
    orderBy: { createdAt: 'desc' },
  });
}
