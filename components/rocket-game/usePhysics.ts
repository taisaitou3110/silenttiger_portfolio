// src/components/rocket-game/usePhysics.ts
import { useState, useRef, useCallback } from 'react';
import { LAUNCH_X, GROUND_Y, LEVEL_CONFIGS } from './constants';
import { LevelConfig, Point } from './types';

export function usePhysics(level: number, onEnd: (msg: string) => void) {
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

    // 衝突判定ロジック（元のコードから移植）
    if (rocket.current.y > GROUND_Y) {
      setIsFlying(false);
      onEnd(`💥 MISS: 地面に激突 (${Math.round(rocket.current.x - LAUNCH_X)}m)`);
      return;
    }

    requestRef.current = requestAnimationFrame(() => animate(config, timeScale, wind));
  }, [onEnd]);

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
    animate(config, 1.0, wind);
  };

  return { rocket, trail, isFlying, launch, setIsFlying };
}