// src/app/rocket-game/page.tsx
import RocketGameContainer from "@/app/rocket-game/RocketGame";
import { getUserGoldData } from "@/lib/actions";

export default async function Page() {
  const { gold } = await getUserGoldData();
  return (
    <main>
      {/* 実際のゲーム本体は components 側で管理 */}
      <RocketGameContainer initialGold={gold} />
    </main>
  );
}