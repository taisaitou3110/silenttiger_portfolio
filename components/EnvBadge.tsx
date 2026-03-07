"use client"; // URLを取得するためにクライアントコンポーネントにします

import { usePathname } from "next/navigation";
import versions from "../app/version.json";

export default function EnvBadge() {
  const pathname = usePathname();
  const isProduction = process.env.NODE_ENV === "production";

  // URLからどのアプリか判定してバージョンを選択
  const getVersion = () => {
    if (pathname.includes("/poker")) return `poker v${versions.apps.poker}`;
    if (pathname.includes("/wordbook")) return `wordbook v${versions.apps.wordbook}`;
    if (pathname.includes("/calorie")) return `calorie v${versions.apps.calorie}`;
    if (pathname.includes("/feedback")) return `feedback v${versions.apps.feedback}`;
    if (pathname.includes("/handwriting")) return `handwriting v${versions.apps.handwriting}`;
    if (pathname.includes("/dashboard")) return `dashboard v${versions.apps.dashboard}`;
    if (pathname.includes("/devlog")) return `devlog v${versions.apps.devlog}`;
    if (pathname.includes("/pencil")) return `pencil v${versions.apps.pencil}`;
    if (pathname.includes("/bookshelf")) return `bookshelf v${versions.apps.bookshelf}`;
    if (pathname.includes("/post-assistant")) return `post-assistant v${versions.apps["post-assistant"]}`;
    return `global v${versions.version}`; // 該当なしは全体バージョン
  };

  return (
    <div className={`
      fixed bottom-2 right-2 px-3 py-1 rounded-full text-[10px] font-mono shadow-md z-50 border transition-all
      ${isProduction 
        ? "bg-red-600/90 text-white border-red-800" 
        : "bg-emerald-600/90 text-white border-emerald-800"
      }
    `}>
      <span className="font-bold">{isProduction ? "PROD" : "DEV"}</span>
      <span className="mx-2 opacity-50">|</span>
      <span>{getVersion()}</span>
    </div>
  );
}