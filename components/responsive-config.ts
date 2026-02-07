/**
 * 標準仕様：レスポンシブ・ブレイクポイント定義
 */
export const BREAKPOINTS = {
  mobile: 640,  // sm
  tablet: 768,  // md
  desktop: 1024 // lg
};

/**
 * 標準仕様：メッセージボックスのレスポンシブ・スタイル
 * モバイル：画面下部にフル幅で表示
 * デスクトップ：画面中央に適切な幅で表示
 */
export const MESSAGE_BOX_STYLES = {
  overlay: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm",
  container: "bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200",
  title: "text-lg sm:text-xl font-bold text-gray-900",
  description: "text-sm sm:text-base text-gray-600 leading-relaxed",
  button: "w-full py-3 sm:py-4 px-4 bg-gray-900 text-white text-sm sm:text-base font-semibold rounded-xl active:scale-95 transition-transform"
};