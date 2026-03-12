// lib/ai/ai-loader.ts
import fs from 'fs';
import path from 'path';

export function getSystemInstruction(appId: string): string {
  const settingsDir = path.join(process.cwd(), 'ai-settings');
  
  // 1. 共通ベース（base.md）
  const base = fs.readFileSync(path.join(settingsDir, 'base.md'), 'utf-8');
  
  // 2. 開発用（development.md）※開発中のみ
  let dev = "";
  if (process.env.NODE_ENV === 'development') {
    try {
      dev = fs.readFileSync(path.join(settingsDir, 'development.md'), 'utf-8');
    } catch (e) {
      console.warn("Development rules not found, skipping...");
    }
  }

  // 3. アプリ個別（apps/appId.md）
  let appSpecific = "";
  try {
    appSpecific = fs.readFileSync(path.join(settingsDir, 'apps', `${appId}.md`), 'utf-8');
  } catch (e) {
    console.warn(`Specific rules for ${appId} not found.`);
  }

  // 合体！
  return `
# SYSTEM RULES
${base}

# DEVELOPMENT RULES
${dev}

# APP SPECIFIC RULES
${appSpecific}
  `.trim();
}