// src/components/rocket-game/index.tsx
"use client";
import RocketGame from "@/app/rocket-game/RocketGame";

export default function RocketGameContainer() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#1a1a1a' }}>
      <RocketGame />
    </div>
  );
}