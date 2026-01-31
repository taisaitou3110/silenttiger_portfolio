import Link from 'next/link';
import Image from 'next/image';
import versionData from '@/app/version.json';

type AppKey = keyof typeof versionData.apps;

const apps: { name: string; description: string; path: string; versionKey: AppKey }[] = [
  {
    name: '北国食堂 〜数字で生き残れ〜',
    description: '北国の観光地にある実家の飲食店を引き継ぎ、意思決定によってBS/PL/CFがリアルタイムに変化。「黒字なのに金がない」「人を雇うと楽だが苦しい」を体感し、簿記が判断の言語になることを目的としたゲーム。',
    path: '/dashboard',
    versionKey: 'dashboard',
  },
  {
    name: 'Wikipedia風単語帳',
    description: 'あなたの学習メモから単語と定義を登録できるパーソナル単語帳。',
    path: '/wordbook',
    versionKey: 'wordbook',
  },
  {
    name: 'カロリー記録アプリ',
    description: '写真を撮るだけでAIがカロリーを推定し、目標達成を視覚的にサポートします。',
    path: '/calorie',
    versionKey: 'calorie',
  },
  {
    name: 'ハイ＆ロー ポーカー',
    description: 'コンピュータとポーカーで対戦できます。戦略を練って勝利を目指しましょう！',
    path: '/poker',
    versionKey: 'poker',
  },
  {
    name: 'ロケットゲーム',
    description: 'ペットボトルロケットの物理演算をシミュレートするゲームアプリです。',
    path: '/rocket-game',
    versionKey: 'pencil',
  },
  {
    name: 'フィードバック掲示板',
    description: 'ご意見・ご要望をお寄せください。',
    path: '/feedback',
    versionKey: 'feedback',
  },
  {
    name: '開発日記',
    description: '日々の開発記録を綴りましょう。',
    path: '/devlog',
    versionKey: 'devlog',
  },
];

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/toppage_wheel_labo.png"
        alt="車輪再発明室 背景"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />

      {/* Scrollable Content Container */}
      <div className="relative z-10 h-full w-full overflow-y-auto">
        {/* Spacer to push content down, leaving top of image visible */}
        <div className="h-[50vh]" />

        {/* Table Section */}
        <div className="px-2 pb-24 sm:px-4 md:px-8">
          <div className="mx-auto max-w-5xl rounded-xl border border-white/10 bg-black/40 p-1 shadow-2xl backdrop-blur-lg">
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-white/80 md:px-6">
                      Application
                    </th>
                    {/* Hide description on small screens */}
                    <th className="hidden px-6 py-3 text-left font-medium text-white/80 md:table-cell">
                      Description
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-white/80 md:px-6">
                      Version
                    </th>
                    <th className="px-4 py-3 md:px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {apps.map((app) => (
                    <tr key={app.path} className="hover:bg-black/20">
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-white md:px-6">
                        {app.name}
                      </td>
                      {/* Hide description on small screens */}
                      <td className="hidden px-6 py-4 text-white/80 md:table-cell">
                        {app.description}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-white/80 md:px-6">
                        v{versionData.apps[app.versionKey]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right md:px-6">
                        <Link
                          href={app.path}
                          className="inline-block rounded-md bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-400"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}