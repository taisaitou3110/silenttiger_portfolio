// src/components/rocket-game/usePhysics.ts
import { useState, useRef, useCallback } from 'react';
import { LAUNCH_X, GROUND_Y, LEVEL_CONFIGS } from './constants';
import { LevelConfig, Point } from './types';

export function usePhysics(
  level: number,
  onEnd: (msg: string, finalX: number, finalY: number) => void,
  draw: () => void,
  onStatusUpdate: (status: { altitude: number; velocity: number; distance: number }) => void // 追加
) {
  const [isFlying, setIsFlying] = useState(false);
  const rocket = useRef({ x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 });
  const trail = useRef<Point[]>([]);
  const requestRef = useRef<number | null>(null);

  const animate = useCallback((config: LevelConfig, timeScale: number, wind: Point) => {
    const dt = 0.05 * timeScale;
    const gravity = 9.8;

    // 物理計算
    if (config.drag > 0) {
      const speed = Math.sqrt(rocket.current.vx ** 2 + rocket.current.vy ** 2);
      const dragForce = config.drag * speed;
      rocket.current.vx -= (dragForce * rocket.current.vx) * dt;
      rocket.current.vy += (gravity - dragForce * rocket.current.vy) * dt;
    } else {
      rocket.current.vy += gravity * dt;
    }

    // 風
    if (config.hasWind) {
      rocket.current.vx += wind.x * dt;
      rocket.current.vy += wind.y * dt;
    }

    rocket.current.x += rocket.current.vx * dt;
    rocket.current.y += rocket.current.vy * dt;
    trail.current.push({ x: rocket.current.x, y: rocket.current.y });

    // リアルタイムステータスの計算と更新
    const altitude = Math.max(0, GROUND_Y - rocket.current.y);
    const velocity = Math.sqrt(rocket.current.vx ** 2 + rocket.current.vy ** 2);
    const distance = rocket.current.x - LAUNCH_X;
    onStatusUpdate({ altitude: Math.round(altitude), velocity: Math.round(velocity), distance: Math.round(distance) }); // statusUpdateコールバック

    // 描画コールバックを実行
    draw();

    // 衝突判定ロジック（元のコードから移植）
    if (rocket.current.y > GROUND_Y) {
      setIsFlying(false);

      const targetDistance = config.targetX;
      const landedDistance = rocket.current.x - LAUNCH_X;
      const tolerance = targetDistance * 0.01;

      let message = "";
      if (landedDistance >= targetDistance - tolerance && landedDistance <= targetDistance + tolerance) {
        message = `🎉 GOAL!`; // メッセージから距離を削除
      } else if (landedDistance > targetDistance + tolerance) {
        message = `💥 MISS: 目標をオーバー`;
      } else {
        message = `💥 MISS: 目標に届かず`;
      }

      onEnd(message, rocket.current.x, rocket.current.y);
      return;
    }

    requestRef.current = requestAnimationFrame(() => animate(config, timeScale, wind));
  }, [onEnd, draw, onStatusUpdate]); // 依存配列にonStatusUpdateを追加

  const launch = (pressure: number, angle: number, wind: Point) => {
    // 既存のアニメーションフレームをキャンセル
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
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
    animate(config, 1.0, wind);
  };

  return { rocket, trail, isFlying, launch, setIsFlying };
}