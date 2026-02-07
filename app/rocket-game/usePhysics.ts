// src/components/rocket-game/usePhysics.ts
import { useState, useRef, useCallback } from 'react';
import { LAUNCH_X, GROUND_Y, LEVEL_CONFIGS } from '@/app/rocket-game/constants';
import { LevelConfig, Point } from '@/app/rocket-game/types';

export function usePhysics(
  level: number,
  onEnd: (msg: string, finalX: number, finalY: number) => void,
  onStatusUpdate: (status: { altitude: number; velocity: number; distance: number }) => void
) {
  const [isFlying, setIsFlying] = useState(false);
  const rocket = useRef({ x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 });
  const trail = useRef<Point[]>([]);

  // ✅ 標準仕様 6.4 に基づき、関数のシグネチャを RocketGame.tsx の呼び出しに合わせる
  // 引数に rocketRef, trailRef を追加し、外部からの操作を可能にします
  const updatePhysics = useCallback((
    
    rocketRef: React.MutableRefObject<{ x: number; y: number; vx: number; vy: number }>,
    trailRef: React.MutableRefObject<Point[]>,
    config: LevelConfig, 
    timeScale: number, 
    wind: Point
  ) => {
    // for debug
    // console.log("Rocket Position:", rocketRef.current.x, rocketRef.current.y);

    if (!rocketRef.current) return; // 安全策

    const dt = 0.05 * timeScale;
    const gravity = 9.8;

    // 物理計算 (rocketRef を使用するように変更)
    if (config.drag > 0) {
      const speed = Math.sqrt(rocketRef.current.vx ** 2 + rocketRef.current.vy ** 2);
      const dragForce = config.drag * speed;
      rocketRef.current.vx -= (dragForce * rocketRef.current.vx) * dt;
      rocketRef.current.vy += (gravity - dragForce * rocketRef.current.vy) * dt;
    } else {
      rocketRef.current.vy += gravity * dt;
    }

    // 風
    if (config.hasWind) {
      rocketRef.current.vx += wind.x * dt;
      rocketRef.current.vy += wind.y * dt;
    }

    rocketRef.current.x += rocketRef.current.vx * dt;
    rocketRef.current.y += rocketRef.current.vy * dt;
    trailRef.current.push({ x: rocketRef.current.x, y: rocketRef.current.y });

    // リアルタイムステータスの計算
    const altitude = Math.max(0, GROUND_Y - rocketRef.current.y);
    const velocity = Math.sqrt(rocketRef.current.vx ** 2 + rocketRef.current.vy ** 2);
    const distance = rocketRef.current.x - LAUNCH_X;
    onStatusUpdate({ altitude: Math.round(altitude), velocity: Math.round(velocity), distance: Math.round(distance) });

    // --- 衝突判定ロジック (rocketRef を使用) ---

    // 1. 山との衝突
    if (config.obstacle && config.obstacleX && config.obstacleWidth && config.obstacleHeight) {
      const { x, y } = rocketRef.current;
      const { obstacleX, obstacleWidth, obstacleHeight } = config;
      
      const p1 = { x: obstacleX, y: GROUND_Y + 10 };
      const p2 = { x: obstacleX + obstacleWidth / 2, y: GROUND_Y + 10 - obstacleHeight };
      const p3 = { x: obstacleX + obstacleWidth, y: GROUND_Y + 10 };

      const s = p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * x + (p1.x - p3.x) * y;
      const t = p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * x + (p2.x - p1.x) * y;

      if (!((s < 0) != (t < 0) && s != 0 && t != 0)) {
          const A = -p2.y * p3.x + p1.y * (p3.x - p2.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y;
          if (A < 0 ? (s <= 0 && s + t >= A) : (s >= 0 && s + t <= A)) {
              setIsFlying(false);
              onEnd('💥 MISS: 山にぶつかった！', x, y);
              return;
          }
      }
    }

    // 2. 地面との衝突
    if (rocketRef.current.y > GROUND_Y) {
      setIsFlying(false);
      const targetDistance = config.targetX;
      const landedDistance = rocketRef.current.x - LAUNCH_X;
      const tolerance = targetDistance * 0.01;

      let message = (landedDistance >= targetDistance - tolerance && landedDistance <= targetDistance + tolerance)
        ? `🎉 GOAL!`
        : (landedDistance > targetDistance + tolerance ? `💥 MISS: 目標オーバー` : `💥 MISS: 届かず`);

      onEnd(message, rocketRef.current.x, rocketRef.current.y);
    }
  }, [onEnd, onStatusUpdate]);

  const launch = (pressure: number, angle: number, wind: Point) => {
    const config = LEVEL_CONFIGS[level];
    const rad = (angle * Math.PI) / 180;
    const v0 = Math.sqrt((pressure * 1000000 * 2) / 100);

    rocket.current = { 
      x: LAUNCH_X, 
      y: GROUND_Y - (config.startHeight || 0), 
      vx: Math.cos(rad) * v0, 
      vy: -Math.sin(rad) * v0 
    };
    trail.current = [];
    setIsFlying(true);
  };

  return { rocket, trail, isFlying, launch, setIsFlying, updatePhysics };
}