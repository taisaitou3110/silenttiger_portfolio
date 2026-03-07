import { GuideContent } from '@/components/Navigation/WelcomeGuide';

// グループの定義（UIでの表示順やラベルに使用）
export const GUIDE_GROUPS = {
  BUSINESS_UTILITY: "Business & Productivity",
  LIFE_LOG: "Personal Life Log",
  ENTERTAINMENT: "Play & Simulation",
  COMMUNITY: "Community & Dev",
} as const;

export const GUIDE_CONTENTS: Record<string, GuideContent & { group: keyof typeof GUIDE_GROUPS }> = {
  // --- ENTERTAINMENT ---
  ROCKET_SIMULATOR: {
    group: "ENTERTAINMENT",
    title: "ロケット・シミュレーター",
    tagline: "物理演算で解き明かす、飛距離の正体。",
    overview: "映画「真夏の方方程式」からインスパイアした物理演算を用いたペットボトルロケットの発射シミュレーターです。",
    howTo: [
      "レベルを選択してシミュレーターを起動してください。",
      "スライダーで「圧力」と「角度」を調整します。",
      "発射ボタンを押し、リアルタイムの高度・速度・軌道を確認してください。"
    ],
    techStack: ["Next.js", "HTML5 Canvas", "Physics Engine"],
    image: "/images/image_background_rocket_menu.png",
    path: "/rocket-game",
  },
  POKER_GAME: {
    group: "ENTERTAINMENT",
    title: "ハイ＆ロー ポーカー",
    tagline: "運と記憶が交差する、究極の二択。",
    overview: "トランプの次の一枚を当てる、シンプルながら戦略的なゲームです。",
    howTo: ["掛け金を選択", "HIGH or LOWを予想", "ダブルアップに挑戦"],
    techStack: ["Next.js", "React Hooks", "Prisma"],
    image: "/images/image_background_poker.png",
    path: "/poker",
  },

  // --- LIFE_LOG ---
  BOOKSHELF_APP: {
    group: "LIFE_LOG",
    title: "マイ本棚",
    tagline: "あなたの蔵書と地域図書館をシンクロさせる。",
    overview: "登録した蔵書の一覧管理に加え、呉市・東広島市の図書館の蔵書状況をリアルタイムに確認できます。",
    howTo: ["蔵書を一覧で確認", "ステータス（読了・未読など）を管理", "地域図書館の在庫をチェック"],
    techStack: ["Next.js", "Calil API", "Prisma"],
    image: "/images/image_background_bookshelf.jpg",
    path: "/bookshelf",
  },
  CALORIE_APP: {
    group: "LIFE_LOG",
    title: "カロリー記録アプリ",
    tagline: "AIが食事を見守る、新しい健康習慣。",
    overview: "写真、テキスト、音声からAIがカロリーを自動推定します。",
    howTo: ["入力方法を選択", "食事内容を提示", "AIのアドバイスを確認"],
    techStack: ["Next.js", "Gemini 1.5 Flash", "Prisma"],
    image: "/images/toppage_wheel_labo.png",
    path: "/calorie",
  },
  WORDBOOK: {
    group: "LIFE_LOG",
    title: "復習ゲームつき英単語帳",
    tagline: "忘却を克服し、知識を星のように繋ぐ。",
    overview: "エビングハウスの忘却曲線に基づいたパーソナル・ナレッジ管理システム。",
    howTo: ["知識をノードとして保存", "忘却曲線に基づき復習", "全ネットワークを閲覧"],
    techStack: ["Next.js", "Prisma", "忘却曲線アルゴリズム"],
    image: "/images/image_background_wordbook.png",
    path: "/wordbook",
  },

  // --- BUSINESS_UTILITY ---
  POST_ASSISTANT: {
    group: "BUSINESS_UTILITY",
    title: "SNS投稿支援",
    tagline: "メモ書きやアイデアから素早く投稿まで！",
    overview: "過去の文章から文体を学習し、メモから投稿案を生成します。",
    howTo: ["文体をアップロード", "ネタやメモを入力", "ドラフトを生成"],
    techStack: ["Next.js", "Gemini 1.5 Flash", "Prisma"],
    image: "/images/image_background_post-assistance.jpg",
    path: "/post-assistant",
  },
  HANDWRITING_OCR: {
    group: "BUSINESS_UTILITY",
    title: "手書きビジネス支援",
    tagline: "あなたの筆跡をAIが学習。書類を構造化データへ。",
    overview: "手書き書類をAIが解析し、顧客管理や注文データとして保存。使うほど精度が向上します。",
    howTo: ["書類を撮影", "AI解析結果の修正", "データの蓄積と閲覧"],
    techStack: ["Next.js", "Gemini 1.5 Flash (Vision)", "Prisma"],
    image: "/images/image_background_handwriting.png",
    path: "/handwriting",
  },

  // --- COMMUNITY ---
  DEVELOP_DIARY: {
    group: "COMMUNITY",
    title: "開発日記",
    tagline: "プロジェクトの歩み",
    overview: "開発者の試行錯誤を記録したログです。",
    howTo: ["記事を選択して読む"],
    techStack: [],
    image: "/images/toppage_wheel_labo.png",
    path: "/devlog",
  },
  FEEDBACK_BOARD: {
    group: "COMMUNITY",
    title: "掲示板",
    tagline: "ご意見をお聞かせください",
    overview: "ユーザーの皆様との対話のための掲示板です。",
    howTo: ["スレッドを作成", "コメントを投稿"],
    techStack: ["Prisma"],
    image: "/images/toppage_wheel_labo.png",
    path: "/feedback",
  },
} as const;