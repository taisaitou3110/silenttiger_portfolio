import { GuideContent } from '@/components/Navigation/WelcomeGuide';

// ✅ 型を GuideContent に指定することで、page.tsx 側での赤線を消します
export const GUIDE_CONTENTS: Record<string, GuideContent> = 
{  BOOKSHELF_SCAN: {
    title: "本棚スキャナーの使い方",
    overview: "背表紙を撮影するだけで、蔵書を自動的にリスト化します。",
    howTo: [
      "カメラのアイコンをタップして本棚を撮影してください。",
      "AIがタイトルと著者を抽出します。",
      "抽出結果を確認して保存ボタンを押してください。"
    ],
    techStack: ["Next.js", "Gemini 1.5 Flash", "Prisma"],
  },
  // 他のアプリもここに追加していく
} as const;