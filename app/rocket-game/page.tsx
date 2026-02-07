// src/app/rocket-game/page.tsx
import RocketGameContainer from "@/app/rocket-game/RocketGame";

export default function Page() {
  return (
    <main>
      {/* 実際のゲーム本体は components 側で管理 */}
      <RocketGameContainer />
    </main>
  );
}