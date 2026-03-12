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

    // 2. 高台（ターゲットの柱）との衝突
    if (config.targetY < GROUND_Y) {
        const pillarXStart = LAUNCH_X + config.targetX - 5;
        const pillarXEnd = LAUNCH_X + config.targetX + 45;
        const { x, y } = rocketRef.current;

        // 柱の側面に当たったか
        if (x >= pillarXStart && x <= pillarXEnd && y > config.targetY + 10 && y <= GROUND_Y) {
            setIsFlying(false);
            onEnd('💥 MISS: 高台の柱に激突！', x, y);
            return;
        }
    }

    // 3. ターゲット面（または地面）との衝突
    const isOverTargetPlatform = (
        rocketRef.current.x >= LAUNCH_X + config.targetX && 
        rocketRef.current.x <= LAUNCH_X + config.targetX + 40
    );

    // ターゲットの高さに到達したか、または地面に落ちたか
    const hitY = config.targetY < GROUND_Y ? config.targetY : GROUND_Y;

    if (rocketRef.current.y >= hitY) {
      const landedDistance = rocketRef.current.x - LAUNCH_X;
      const targetDistance = config.targetX;
      
      // 高台の場合は、x座標がプラットフォームの幅(40px)に収まっている必要がある
      const isGoal = config.targetY < GROUND_Y 
        ? (landedDistance >= targetDistance && landedDistance <= targetDistance + 40)
        : (Math.abs(landedDistance - targetDistance) <= targetDistance * 0.01);

      if (isGoal) {
        setIsFlying(false);
        onEnd(`🎉 GOAL!`, rocketRef.current.x, rocketRef.current.y);
      } else if (rocketRef.current.y >= GROUND_Y) {
        // 地面に落ちた場合
        setIsFlying(false);
        const message = landedDistance > targetDistance ? `💥 MISS: 目標オーバー` : `💥 MISS: 届かず`;
        onEnd(message, rocketRef.current.x, rocketRef.current.y);
      }
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

  const reset = useCallback(() => {
    const config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
    rocket.current = { x: LAUNCH_X, y: GROUND_Y - (config.startHeight || 0), vx: 0, vy: 0 };
    trail.current = [];
    setIsFlying(false);
  }, [level]);

  return { rocket, trail, isFlying, launch, setIsFlying, updatePhysics, reset };
}