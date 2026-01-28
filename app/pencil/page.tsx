"use client";
//comment add

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function RocketGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(0); 
  const [isFlying, setIsFlying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState("");
  
  const [pressure, setPressure] = useState(0.5); 
  const [angle, setAngle] = useState(45);
  const [timeScale, setTimeScale] = useState(1.0);

  const rocket = useRef({ x: 50, y: 350, vx: 0, vy: 0 });
  const trail = useRef<{x: number, y: number}[]>([]);
  const requestRef = useRef<number>();

  const GROUND_Y = 350;
  const LAUNCH_X = 50;
  const CANVAS_WIDTH = 1200;

  // --- ステージ構成の拡張 ---
  const levelConfigs = {
    1: { name: "Lv.1: 理想の放物線", targetX: 1000, targetY: 350, drag: 0, obstacle: false },
    2: { name: "Lv.2: 山を越えろ", targetX: 1000, targetY: 350, drag: 0, obstacle: true },
    3: { name: "Lv.3: 高台のターゲット", targetX: 800, targetY: 200, drag: 0, obstacle: false },
    4: { name: "Lv.4: 空気抵抗の壁", targetX: 600, targetY: 350, drag: 0.0015, obstacle: false },
    5: { name: "Lv.5: 抵抗と山", targetX: 800, targetY: 350, drag: 0.0012, obstacle: true },
    6: { name: "Lv.6: 抵抗と高台", targetX: 500, targetY: 150, drag: 0.0015, obstacle: false },
  };

  const drawScene = (ctx: CanvasRenderingContext2D, rx: number, ry: number) => {
    const config = levelConfigs[level as keyof typeof levelConfigs];
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, CANVAS_WIDTH, 400);
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, 40);
    
    // 山の描画
    if (config.obstacle) {
      ctx.fillStyle = "#5d4037";
      ctx.beginPath();
      ctx.moveTo(400, GROUND_Y + 10);
      ctx.lineTo(550, 100); // より険しい山
      ctx.lineTo(700, GROUND_Y + 10);
      ctx.fill();
    }

    // 高台ターゲットの土台（Lv.3, Lv.6用）
    if (config.targetY < GROUND_Y) {
      ctx.fillStyle = "#78909c";
      ctx.fillRect(LAUNCH_X + config.targetX - 5, config.targetY + 10, 50, GROUND_Y - config.targetY);
    }

    // ターゲット
    ctx.fillStyle = "red";
    ctx.fillRect(LAUNCH_X + config.targetX, config.targetY, 40, 10);
    ctx.fillStyle = "black";
    ctx.font = "bold 12px Arial";
    ctx.fillText("TARGET", LAUNCH_X + config.targetX, config.targetY - 5);

    // 軌道
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    trail.current.forEach((p, i) => {
      if (i % 2 === 0) i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // ロケット
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, Math.PI * 2);
    ctx.fill();

    // メーター
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(10, 10, 200, 80);
    ctx.fillStyle = "#0f0";
    ctx.font = "14px monospace";
    ctx.fillText(`ALTITUDE: ${Math.max(0, Math.round(GROUND_Y - ry))} m`, 20, 30);
    ctx.fillText(`DISTANCE: ${Math.round(rx - LAUNCH_X)} m`, 20, 50);
    const speed = Math.round(Math.sqrt(rocket.current.vx**2 + rocket.current.vy**2) * 3.6);
    ctx.fillText(`SPEED   : ${speed} km/h`, 20, 70);
  };

  const animate = () => {
    if (!isFlying) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const config = levelConfigs[level as keyof typeof levelConfigs];
    const dt = 0.05 * timeScale;
    const gravity = 9.8;

    // 物理演算
    if (config.drag > 0) {
        const speed = Math.sqrt(rocket.current.vx**2 + rocket.current.vy**2);
        const dragForce = config.drag * speed;
        rocket.current.vx -= (dragForce * rocket.current.vx) * dt;
        rocket.current.vy += (gravity - dragForce * rocket.current.vy) * dt;
    } else {
        rocket.current.vy += gravity * dt;
    }
    
    rocket.current.x += rocket.current.vx * dt;
    rocket.current.y += rocket.current.vy * dt;
    trail.current.push({ x: rocket.current.x, y: rocket.current.y });

    drawScene(ctx, rocket.current.x, rocket.current.y);

    // 山衝突判定
    if (config.obstacle) {
        // 簡易的な三角形当たり判定
        const mountX = rocket.current.x - LAUNCH_X;
        if (mountX > 350 && mountX < 650) {
            const slope = 250 / 150; // 高さ/半幅
            const mountTopY = 100 + Math.abs(mountX - 500) * slope;
            if (rocket.current.y > mountTopY) {
                return endSim("💥 山に衝突！");
            }
        }
    }

    // 判定ロジック
    const targetX = LAUNCH_X + config.targetX;
    
    // 1. ターゲットとの接触判定
    if (rocket.current.x >= targetX && rocket.current.x <= targetX + 40) {
        if (Math.abs(rocket.current.y - config.targetY) < 10) {
            return endSim(`🎯 GOAL!! (${Math.round(rocket.current.x - LAUNCH_X)}m)`);
        }
    }

    // 2. ターゲットを通り過ぎた、あるいは下を抜けた判定
    if (rocket.current.x > targetX + 40) {
        // ターゲットより右に行った時点で、当たっていなければミス
        if (rocket.current.y > config.targetY - 10) {
             return endSim("💥 ターゲットに届きませんでした（低すぎ）");
        }
    }

    // 3. 地面衝突
    if (rocket.current.y > GROUND_Y) {
        return endSim(`💥 MISS: 地面に激突 (${Math.round(rocket.current.x - LAUNCH_X)}m)`);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  const endSim = (msg: string) => {
    setIsFlying(false);
    setShowResult(true);
    setResult(msg);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const launch = () => {
    if (isFlying || showResult) return;
    const rad = (angle * Math.PI) / 180;
    const v0 = Math.sqrt((pressure * 1000000 * 2) / 100); 
    rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: Math.cos(rad) * v0, vy: -Math.sin(rad) * v0 };
    trail.current = [];
    setResult("");
    setIsFlying(true);
  };

  useEffect(() => {
    if (isFlying) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isFlying]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && level > 0) drawScene(ctx, LAUNCH_X, GROUND_Y);
  }, [level]);

  if (level === 0) {
    return (
      <div style={{ textAlign: 'center', background: '#1a1a1a', color: 'white', padding: '50px', minHeight: '100vh' }}>
        <h1 style={{ color: '#0cf', fontSize: '36px', letterSpacing: '2px' }}>ROCKET COMMANDER</h1>
        <Link href="/" style={{ background: '#444', color: 'white', border: 'none', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
            トップページに戻る
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px', margin: '40px auto' }}>
          {[1, 2, 3, 4, 5, 6].map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{ padding: '25px', fontSize: '16px', cursor: 'pointer', background: '#222', color: '#0cf', border: '2px solid #0cf', borderRadius: '8px', transition: '0.3s' }}>
              {levelConfigs[l as keyof typeof levelConfigs].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', background: '#1a1a1a', color: 'white', padding: '20px', minHeight: '100vh', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button onClick={() => { setLevel(0); setShowResult(false); }} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px' }}>MENU</button>
        <h2 style={{ color: '#0cf', margin: 0 }}>{levelConfigs[level as keyof typeof levelConfigs].name}</h2>
        <div style={{ width: '80px' }}></div>
      </div>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={400} style={{ background: '#f0f4f8', borderRadius: '8px', border: '4px solid #333' }} />
        {showResult && (
          <div onClick={() => { setShowResult(false); trail.current = []; rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 }; }} 
               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10, borderRadius: '8px' }}>
            <h2 style={{ fontSize: '42px', color: '#ffff00', margin: '0 0 10px 0' }}>{result}</h2>
            <p style={{ color: 'white', fontSize: '18px' }}>[ CLICK TO RETRY ]</p>
          </div>
        )}
      </div>

      <div style={{ background: '#222', padding: '20px', borderRadius: '12px', marginTop: '15px', display: 'inline-block', width: '100%', maxWidth: '750px', border: '1px solid #444' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div>
            <label style={{ display: 'block', color: '#0cf', marginBottom: '10px' }}>PRESSURE: {pressure.toFixed(2)} MPa</label>
            <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '10px' }}>ANGLE: {angle}°</label>
            <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>
        {!showResult && <button onClick={launch} disabled={isFlying} style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '22px', fontWeight: 'bold', background: isFlying ? '#444' : '#0cf', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚀 LAUNCH</button>}
      </div>
    </div>
  );
}