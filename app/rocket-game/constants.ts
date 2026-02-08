// src/components/rocket-game/constants.ts
import { LevelConfig } from '@/app/rocket-game/types';

export const GROUND_Y = 350;
export const LAUNCH_X = 50;
export const CANVAS_WIDTH = 1200;
export const VISUAL_SCALE = 0.5;

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { name: "Lv.1: 理想の放物線", targetX: 1000, targetY: 350, drag: 0, obstacle: false },
  2: { name: "Lv.2: 山を越えろ", targetX: 1000, targetY: 350, drag: 0, obstacle: true, obstacleX: 400, obstacleWidth: 300, obstacleHeight: 250 },
  3: { name: "Lv.3: 高台のターゲット", targetX: 800, targetY: 200, drag: 0, obstacle: false },
  4: { name: "Lv.4: 空気抵抗の壁", targetX: 600, targetY: 350, drag: 0.0015, obstacle: false },
  5: { name: "Lv.5: 抵抗と山", targetX: 800, targetY: 350, drag: 0.0012, obstacle: true, obstacleX: 400, obstacleWidth: 300, obstacleHeight: 250 },
  6: { name: "Lv.6: 抵抗と高台", targetX: 500, targetY: 150, drag: 0.0015, obstacle: false },
  7: { name: "Lv.7: 真夏の方程式（風あり）", targetX: 800, targetY: 350, drag: 0.0015, obstacle: false, hasWind: true, startHeight: 50 },
};
export const HINTS = {
  parabolic: "ヒント1: 放物運動の基本を理解しましょう。最高の飛距離は45度で得られます。",
  pressure: "ヒント2: 圧力が高いほど初速が上がります。",
  angle: "ヒント3: 角度は飛距離と高度のバランスを決めます。",
  drag: "ヒント4: 空気抵抗がある場合、最適角度は45度より少し小さくなります。",
  obstacle: "ヒント5: 山がある場合は高く打ち上げる必要があります。",
};
