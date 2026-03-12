// src/components/rocket-game/types.ts
export interface Point {
  x: number;
  y: number;
}

export interface LevelConfig {
  name: string;
  description?: string;
  targetX: number;
  targetY: number;
  drag: number;
  obstacle: boolean;
  hasWind?: boolean;
  startHeight?: number;
  fixedAngle?: number;
  obstacleX?: number;
  obstacleWidth?: number;
  obstacleHeight?: number;
}

export interface Attempt {
  pressure: number;
  angle: number;
  distance: number;
  result: string;
}