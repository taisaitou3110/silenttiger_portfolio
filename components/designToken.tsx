/**
 * 2. デザイントークンの定義
 */
export const UI_TOKENS = {
  CONTAINER: "max-w-4xl mx-auto px-6 py-12",
  CARD: "bg-white/80 backdrop-blur-md border border-slate-200 rounded-[2rem] shadow-sm p-8 transition-all hover:shadow-md",
  BUTTON: {
    PRIMARY: "px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md flex items-center justify-center",
    SECONDARY: "px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center",
    DANGER: "p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors",
  },
  TEXT: {
    H1: "text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6",
    H2: "text-2xl font-bold text-slate-800 mb-4",
    BODY: "text-slate-600 leading-relaxed",
    CAPTION: "text-xs text-slate-400 font-bold uppercase tracking-widest",
  }
} as const;