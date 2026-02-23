import { GuideContent } from '@/components/Navigation/WelcomeGuide';

// ✅ 型を GuideContent に指定することで、page.tsx 側での赤線を消します
export const GUIDE_CONTENTS: Record<string, GuideContent> = {
  BOOKSHELF_SCAN: {
    title: "本棚スキャナーの使い方",
    overview: "背表紙を撮影するだけで、蔵書を自動的にリスト化します。",
    howTo: [
      "カメラのアイコンをタップして本棚を撮影してください。",
      "AIがタイトルと著者を抽出します。",
      "抽出結果を確認して保存ボタンを押してください。"
    ],
    techStack: ["Next.js", "Gemini 1.5 Flash", "Prisma"],
  },
  ROCKET_SIMULATOR: {
    title: "ロケット・シミュレーターの使い方",
    overview: "映画「真夏の方程式」からインスパイアした物理演算を用いたペットボトルロケットの発射シミュレーターです。圧力と角度を調整し、障害物を避けてゴールを目指します。",
    howTo: [
      "レベルを選択してシミュレーターを起動してください。",
      "スライダーで「圧力」と「角度」を調整します。",
      "発射ボタンを押し、リアルタイムの高度・速度・軌道を確認してください。",
      "失敗した場合は「試行履歴」を参考にパラメーターを微調整して再挑戦しましょう。"
    ],
    techStack: ["Next.js", "HTML5 Canvas", "Physics Engine (Custom TS)"],
  },
  POKER_GAME: {
    title: "ハイ＆ロー ポーカーの使い方",
    overview: "トランプの次の一枚が、今のカードより「高い」か「低い」かを当てるシンプルながら戦略的なゲームです。手持ちのゴールドを増やし、10,000G達成を目指しましょう！",
    howTo: [
      "まずは掛け金を選択してゲームを開始してください。",
      "現在のカードに対し、次に出るカードが『HIGH(上)』か『LOW(下)』かを予想します。",
      "的中すれば配当が倍増！さらにダブルアップに挑むか、ゴールドを回収（コレクト）するか選択できます。",
      "「でたカード記録」をチェックし、山札に残っているカードの傾向を読むのが攻略の鍵です。",
      "見事10,000Gに到達すれば、ランキングに名前を刻むことができます。"
    ],
    techStack: ["Next.js", "React Hooks", "Prisma", "Lucide React"],
  },
  // 他のアプリもここに追加していく
} as const;
