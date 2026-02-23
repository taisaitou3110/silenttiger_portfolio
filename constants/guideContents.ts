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
    image: "/images/image_background_rocket_menu.png",
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
    image: "/images/image_background_poker.png",
  },
  CALORIE_APP: {
    title: "カロリー記録アプリの使い方",
    overview: "食事の写真を撮るだけでAIがカロリーを自動推定。テキストや音声での入力にも対応し、日々の健康管理をスマートにサポートします。",
    howTo: [
      "ダッシュボードから「写真」「テキスト」「音声」のいずれかの入力方法を選択します。",
      "写真を撮るか、食事内容を入力・発話してください。",
      "AIが即座にメニュー名とカロリーを推定し、健康へのアドバイスを表示します。",
      "登録されたデータはダッシュボードで確認でき、目標達成までの残りカロリーがリアルタイムに計算されます。"
    ],
    techStack: ["Next.js", "Gemini 1.5 Flash (Vision/Audio)", "Prisma", "Tailwind CSS"],
  },
  WORDBOOK: {
    title: "知識図鑑 Knowledge Cosmos の使い方",
    overview: "宇宙に星を散りばめるように、学習した知識を『ノード』として記録。エビングハウスの忘却曲線ロジックに基づき、最適なタイミングで復習を促すパーソナル・ナレッジ・マネジメント・システムです。",
    howTo: [
      "「単語登録」から新しい知識を宇宙（データベース）に保存します。",
      "「本日の学習 (Mission)」で、記憶が薄れかけているノードを復習し、定着させます。",
      "「登録単語リスト (Encyclopedia)」では、これまでに構築した全ネットワークを閲覧できます。",
      "「一括読込 (Bulk)」を利用して、大量のデータを一度にインポートすることも可能です。"
    ],
    techStack: ["Next.js", "Prisma", "忘却曲線アルゴリズム", "Tailwind CSS"],
    image: "/images/image_background_wordbook.png",
  },
  // 他のアプリもここに追加していく
} as const;
