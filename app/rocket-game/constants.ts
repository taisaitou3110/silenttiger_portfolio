// src/components/rocket-game/constants.ts
import { LevelConfig } from '@/app/rocket-game/types';

export const GROUND_Y = 350;
export const LAUNCH_X = 50;
export const CANVAS_WIDTH = 1200;
export const VISUAL_SCALE = 0.5;

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { 
    name: "Lv.1: 理想の放物線", 
    description: "高校の基本的な運動方程式で飛びます。圧力と角度を微調整しつつ、ゴール地点±10mを狙いましょう。",
    targetX: 1000, targetY: 350, drag: 0, obstacle: false 
  },
  2: { 
    name: "Lv.2: 山を越えろ", 
    description: "理想的な飛び方は同じ。障害物となる山を超えて、ホール地点±10mを狙いましょう。",
    targetX: 1000, targetY: 350, drag: 0, obstacle: true, obstacleX: 400, obstacleWidth: 300, obstacleHeight: 300 
  },
  3: { 
    name: "Lv.3: 高台のターゲット", 
    description: "次は、目標物に高度がついたケース。ちょうど良い場所に着地するよう調整しましょう。",
    targetX: 1000, targetY: 200, drag: 0, obstacle: false 
  },
  4: { 
    name: "Lv.4: 空気抵抗の壁", 
    description: "ここからは、少し現実に近づけて。実際には空気があってそれが邪魔をして計算通り飛びません。それを計算に入れてゴール地点を目指しましょう。",
    targetX: 600, targetY: 350, drag: 0.0015, obstacle: false 
  },
  5: { 
    name: "Lv.5: 抵抗と山", 
    description: "空気抵抗と山という障害物に気をつけて、ゴールを目指してください。",
    targetX: 800, targetY: 350, drag: 0.0012, obstacle: true, obstacleX: 400, obstacleWidth: 300, obstacleHeight: 250 
  },
  6: { 
    name: "Lv.6: 抵抗と高台", 
    description: "空気抵抗を計算に入れつつ、高台に着地させてください。",
    targetX: 500, targetY: 150, drag: 0.0015, obstacle: false 
  },
  7: { 
    name: "Lv.7: 真夏の方程式（風あり）", 
    description: "このゲームのモチーフの映画「真夏の方程式」より。空気抵抗に加え、ランダムで風が吹いています。何度か実験して風の向きを判断し、目標地点への着水を目指します。",
    targetX: 800, targetY: 350, drag: 0.0015, obstacle: false, hasWind: true, startHeight: 50 
  },
  8: {
    name: "Lv.8: 天国へのカウントダウン",
    description: "映画の名シーンを再現。隣のビルへ飛び移ります。爆風（初速）のみが頼り。ここでは水平発射（角度0度）しかできません。正確なパワー計算で生還しましょう。",
    targetX: 500, targetY: 250, drag: 0.001, obstacle: false, startHeight: 200, fixedAngle: 0
  },
  };

export const HINTS = {
  parabolic: "ヒント1: 放物運動の基本を理解しましょう。最高の飛距離は45度で得られます。",
  pressure: "ヒント2: 圧力が高いほど初速が上がります。",
  angle: "ヒント3: 角度は飛距離と高度のバランスを決めます。",
  drag: "ヒント4: 空気抵抗がある場合、最適角度は45度より少し小さくなります。",
  obstacle: "ヒント5: 山がある場合は高く打ち上げる必要があります。",
};
