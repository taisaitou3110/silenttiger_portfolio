// constants/errorMsgs.ts
export const ERROR_MESSAGES = {
  INFRA_DATABASE_ERROR: {
    title: "データの保存に失敗しました",
    description: "現在、システムが少し不安定なようです。時間を置いてもう一度お試しください。",
    actionText: "再試行する",
  },
  VALIDATION_IMAGE_SIZE: {
    title: "画像が大きすぎます",
    description: "3MB以下の画像を選択してください。スマホの画質設定を少し落とすとスムーズです。",
    actionText: "画像を選び直す",
  },
  AI_RATE_LIMIT: {
    title: "AIが休憩中です",
    description: "リクエストが集中しています。1分ほど待ってから再度お試しください。",
    actionText: "少し待って再試行",
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