// constants/errorMsgs.ts
export const ERROR_MESSAGES = {
  // --- 特定の機能に紐づくエラー（画像解析など） ---
  VALIDATION_IMAGE_SIZE: {
    title: "画像が大きすぎます",
    description: "3MB以下の画像を選択してください。スマホの画質設定を少し落とすとスムーズです。",
    actionText: "画像を選び直す",
  },
  VALIDATION_IMAGE_TYPE: {
    title: "対応していない形式です",
    description: "JPEG, PNG, WebP形式の画像を選択してください（HEICやPDFは現在対応していません）。",
    actionText: "画像を選び直す",
  },
  VALIDATION_IMAGE_REQUIRED: {
    title: "画像が見つかりません",
    description: "解析を始める前に、食事の写真をアップロードしてください。",
    actionText: "了解",
  },
  VALIDATION_MISSING_ESTIMATION: {
    title: "登録できません",
    description: "推定結果が表示されてから、記録ボタンを押してください。",
    actionText: "戻る",
  },

    VALIDATION_VOICE_REQUIRED: {
    title: "音声が見つかりません",
    description: "音声が聞き取れませんでした。もう一度お話しください",
    actionText: "了解",
  },

  // --- AI汎用エラー ---

    AI_RATE_LIMIT: {
    title: "AIが休憩中です",
    description: "リクエストが集中しています。1分ほど待ってから再度お試しください。",
    actionText: "少し待って再試行",
  },
  AI_RESPONSE_INVALID: {
    title: "解析に失敗しました",
    description: "AIから正しい形式で回答が得られませんでした。もう一度試してみてください。",
    actionText: "もう一度試す",
  },


  // --- 汎用エラー（どこでも使える） ---
  DATA_SAVE_FAILED: {
    title: "保存に失敗しました",
    description: "通信状況を確認して、もう一度お試しください。", 
    actionText: "再試行",
  },
  DATA_FETCH_FAILED: {
    title: "読み込みに失敗しました",
    description: "データの取得中に問題が発生しました。画面を更新してみてください。",
    actionText: "更新する",
  },
  INFRA_DATABASE_ERROR: {
    title: "データの保存に失敗しました",
    description: "現在、システムが少し不安定なようです。時間を置いてもう一度お試しください。",
    actionText: "再試行する",
  },
  
  AUTH_SESSION_EXPIRED: {
    title: "セッションが切れました",
    description: "安全のため、もう一度ログインし直してください。",
    actionText: "ログイン画面へ",
  },
  UNKNOWN_ERROR: {
    title: "予期せぬエラー",
    description: "何らかの問題が発生しました。画面を更新してみてください。",
    actionText: "更新する",
  },
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;