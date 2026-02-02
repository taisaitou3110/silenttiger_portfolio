// src/components/rocket-game/drawUtils.ts
import { GROUND_Y, LAUNCH_X, CANVAS_WIDTH } from './constants';
import { LevelConfig, Point } from './types';

export const drawRocket = (ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number, isFlying: boolean) => {
  const angleRad = Math.atan2(vy, vx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(15, 0); ctx.lineTo(10, -5); ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();

  if (isFlying) {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(-15, 3); ctx.lineTo(-15, -3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

export const drawScene = (
  ctx: CanvasRenderingContext2D, 
  rocket: {x: number, y: number, vx: number, vy: number}, 
  config: LevelConfig, 
  trail: Point[],
  pastTrails: Point[][],
  canvasWidth: number,
  canvasHeight: number,
  scale: number
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.scale(scale, scale);

  // 背景
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 400);
  ctx.fillStyle = config.hasWind ? "#0000FF" : "#228B22";
  ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, 40);
  
  // 打ち上げ位置
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(LAUNCH_X - 10, GROUND_Y + 20); ctx.lineTo(LAUNCH_X + 10, GROUND_Y + 20); ctx.lineTo(LAUNCH_X, GROUND_Y);
  ctx.fill();
  
  // 山
  if (config.obstacle && config.obstacleX && config.obstacleWidth && config.obstacleHeight) {
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    const peakX = config.obstacleX + config.obstacleWidth / 2;
    const peakY = GROUND_Y + 10 - config.obstacleHeight;
    ctx.moveTo(config.obstacleX, GROUND_Y + 10);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(config.obstacleX + config.obstacleWidth, GROUND_Y + 10);
    ctx.fill();
  }

  // ターゲット
  if (config.targetY < GROUND_Y) {
    ctx.fillStyle = "#78909c";
    ctx.fillRect(LAUNCH_X + config.targetX - 5, config.targetY + 10, 50, GROUND_Y - config.targetY);
  }
  ctx.fillStyle = "red";
  ctx.fillRect(LAUNCH_X + config.targetX, config.targetY, 40, 10);

  // ゴール地点の距離表示
  ctx.fillStyle = "white";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${config.targetX}m`, LAUNCH_X + config.targetX + 20, config.targetY - 5);


  // 過去の軌跡を描画
  ctx.strokeStyle = "rgba(150, 150, 150, 0.5)";
  ctx.lineWidth = 1;
  pastTrails.forEach(pTrail => {
    if (pTrail.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pTrail[0].x, pTrail[0].y);
    for (let i = 1; i < pTrail.length; i++) {
      ctx.lineTo(pTrail[i].x, pTrail[i].y);
    }
    ctx.stroke();
  });

  // 現在の軌跡を描画
  if (trail.length > 1) {
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.stroke();
  }
  
  drawRocket(ctx, rocket.x, rocket.y, rocket.vx, rocket.vy, true); // Temporarily hardcode isFlying to true
  ctx.restore();
};