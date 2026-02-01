"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component

export default function RocketGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(0); 
  const [isFlying, setIsFlying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState("");
  
  const [pressure, setPressure] = useState(0.5); 
  const [angle, setAngle] = useState(45);
  const [timeScale, setTimeScale] = useState(1.0);
  const [failureCount, setFailureCount] = useState(0); // For hints
  const [lastResultType, setLastResultType] = useState<'GOAL' | 'MISS' | null>(null);
  const [showNextLevelPrompt, setShowNextLevelPrompt] = useState(false);
  const [wind, setWind] = useState({ x: 0, y: 0 }); // Wind vector
  const [showGameClear, setShowGameClear] = useState(false); // To show game clear screen

  const rocket = useRef({ x: 50, y: 350, vx: 0, vy: 0 });
  const trail = useRef<{x: number, y: number}[]>([]);
  const pastTrails = useRef<{x: number, y: number}[][]>([]); // To store previous trails
  const pastAttempts = useRef<{ pressure: number; angle: number; distance: number; result: string }[]>([]); // To store previous attempts
  const requestRef = useRef<number>();
  const prevLevelRef = useRef(0); // To track previous level for initialization logic

  const GROUND_Y = 350;
  const LAUNCH_X = 50;
  const CANVAS_WIDTH = 1200;
  const VISUAL_SCALE = 0.5;

  // --- ステージ構成の拡張 ---
  const levelConfigs = {
    1: { name: "Lv.1: 理想の放物線", targetX: 1000, targetY: 350, drag: 0, obstacle: false },
    2: { name: "Lv.2: 山を越えろ", targetX: 1000, targetY: 350, drag: 0, obstacle: true },
    3: { name: "Lv.3: 高台のターゲット", targetX: 800, targetY: 200, drag: 0, obstacle: false },
    4: { name: "Lv.4: 空気抵抗の壁", targetX: 600, targetY: 350, drag: 0.0015, obstacle: false },
    5: { name: "Lv.5: 抵抗と山", targetX: 800, targetY: 350, drag: 0.0012, obstacle: true },
    6: { name: "Lv.6: 抵抗と高台", targetX: 500, targetY: 150, drag: 0.0015, obstacle: false },
    7: { name: "Lv.7: 真夏の方程式（風あり：ランダム）", targetX: 800, targetY: 350, drag: 0.0015, obstacle: false, hasWind: true, startHeight: 50 },
  };

  const hints = {
    parabolic: "ヒント1: 放物運動の基本を理解しましょう。空気抵抗がない場合、最高の飛距離は45度の角度で得られます。",
    pressure: "ヒント2: 圧力が高いほど初速が上がります。距離を伸ばしたいなら圧力を上げ、抑えたいなら下げましょう。",
    angle: "ヒント3: 角度は飛距離と高度のバランスを決めます。高く飛ばしたいなら角度を上げ、遠くへ飛ばしたいなら最適な角度を探しましょう。",
    drag: "ヒント4: 空気抵抗がある場合、最大飛距離の角度は45度よりも少し小さくなります。速く飛ばすほど抵抗の影響は大きいです。",
    obstacle: "ヒント5: 山や高台がある場合は、より高い角度で打ち上げて障害物を越える必要があります。ただし、角度を上げすぎると飛距離が落ちます。",
  };

  const getWindDescription = (windX: number, windY: number) => {
    if (windX === 0 && windY === 0) return "風: なし";

    let description = "風: ";
    if (windX < 0) description += "左へ ";
    else if (windX > 0) description += "右へ ";
    
    if (windY < 0) description += "上へ ";
    else if (windY > 0) description += "下へ ";

    const strength = Math.sqrt(windX * windX + windY * windY);
    if (strength > 3) description += "(強め)";
    else description += "(弱め)";

    return description;
  };

  const drawRocket = (ctx: CanvasRenderingContext2D, x: number, y: number, angleRad: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleRad);
    
    // ロケット本体
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(15, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    // 炎 (飛行中のみ)
    if (isFlying) {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-15, 3);
      ctx.lineTo(-15, -3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const drawScene = (ctx: CanvasRenderingContext2D, rx: number, ry: number) => {
    ctx.save(); // Save current context state
    ctx.scale(VISUAL_SCALE, VISUAL_SCALE); // Apply scaling

    const config = levelConfigs[level as keyof typeof levelConfigs];
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, CANVAS_WIDTH, 400);
    ctx.fillStyle = level === 7 ? "#0000FF" : "#228B22"; // Blue for sea in Level 7
    ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, 40);
    
    // 打ち上げ位置マーカー
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(LAUNCH_X - 10, GROUND_Y + 20);
    ctx.lineTo(LAUNCH_X + 10, GROUND_Y + 20);
    ctx.lineTo(LAUNCH_X, GROUND_Y);
    ctx.fill();
    
    // 山の描画
    if (config.obstacle) {
      ctx.fillStyle = "#5d4037";
      ctx.beginPath();
      ctx.moveTo(400, GROUND_Y + 10);
      ctx.lineTo(550, 100); // より険しい山
      ctx.lineTo(700, GROUND_Y + 10);
      ctx.fill();

      // 山の高さ表示
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText("高さ: 250m", 520, 90); // 550x, 100y が山の頂点
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
    ctx.fillStyle = "yellow"; // Explicitly set color for goal distance
    ctx.fillText(`GOAL: ${config.targetX}m`, LAUNCH_X + config.targetX - 40, config.targetY + 15); // Adjust Y-position

    // 過去の軌跡
    pastTrails.current.forEach(pastTrail => {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // 非常に薄い色
      ctx.setLineDash([5, 5]); // 破線
      ctx.beginPath();
      pastTrail.forEach((p, index) => {
        if (index % 2 === 0) {
          if (index === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      });
      ctx.stroke();
    });

    // 現在の軌道
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    trail.current.forEach((p, i) => {
      if (i % 2 === 0) i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // ロケット
    const rocketAngle = Math.atan2(rocket.current.vy, rocket.current.vx);
    drawRocket(ctx, rx, ry, rocketAngle);

    // メーター (Scale back for meter text so it doesn't get tiny)
    ctx.restore(); // Restore context to draw meters unscaled, then save again
    ctx.save();
    
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    // Adjust coordinates by multiplying with VISUAL_SCALE to place them correctly in the scaled view
    ctx.fillRect(10, 10, 200, 80);
    ctx.fillStyle = "#0f0";
    ctx.font = "14px monospace";
    ctx.fillText(`ALTITUDE: ${Math.max(0, Math.round(GROUND_Y - ry))} m`, 20, 30);
    ctx.fillText(`DISTANCE: ${Math.round(rx - LAUNCH_X)} m`, 20, 50);
    const speed = Math.round(Math.sqrt(rocket.current.vx**2 + rocket.current.vy**2) * 3.6);
    ctx.fillText(`SPEED   : ${speed} km/h`, 20, 70);
    
    ctx.restore(); // Final restore
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
    
    // 風の影響
    if (config.hasWind) { // Only apply wind if the level has wind
      rocket.current.vx += wind.x * dt;
      rocket.current.vy += wind.y * dt;
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
    const dist = Math.round(rocket.current.x - LAUNCH_X);
    pastAttempts.current.push({ pressure, angle, distance: dist, result: msg }); // Store attempt details

    if (msg.includes("GOAL!!")) {
      setFailureCount(0); // Reset on success
      setLastResultType('GOAL'); // Set result type
      setShowNextLevelPrompt(true); // Show next level prompt
    } else {
      setFailureCount(prev => prev + 1); // Increment on failure
      setLastResultType('MISS'); // Set result type
      setShowResult(true); // Show normal result message for MISS
      setResult(msg); // Set result message for MISS
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

    const launch = () => {

      if (isFlying || showResult) return;

      

      if (trail.current.length > 0) {

        pastTrails.current.push([...trail.current]); // Store a copy of the completed trail

      }

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
    const currentLevel = level;
    const previousLevel = prevLevelRef.current;
    prevLevelRef.current = currentLevel; // Update prevLevelRef immediately

    if (currentLevel === 0) { // On menu screen
      return;
    }

    // Initialize game state for a new level
    pastAttempts.current = [];
    pastTrails.current = [];
    trail.current = [];
    rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 };
    setShowResult(false);
    setShowNextLevelPrompt(false);
    setFailureCount(0);
    setLastResultType(null);

    // Set initial pressure and angle only when starting a new game (level 0 to >0)
    if (previousLevel === 0 && currentLevel > 0) {
      setPressure(0.1); // 最低値
      setAngle(0);    // 最低値
    }

    // Set initial rocket position, potentially elevated
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const config = levelConfigs[currentLevel as keyof typeof levelConfigs];
      rocket.current = {
        x: LAUNCH_X,
        y: GROUND_Y - (config.startHeight || 0), // Adjust y for start height
        vx: 0, vy: 0
      };

      // Generate wind for levels with wind
      if (config.hasWind) {
        const randomSign = () => (Math.random() < 0.5 ? 1 : -1);
        const windX = (Math.random() * 4 + 1) * randomSign(); // 1 to 5 m/s
        const windY = (Math.random() * 4 + 1) * randomSign(); // 1 to 5 m/s
        setWind({ x: windX, y: windY });
      } else {
        setWind({ x: 0, y: 0 }); // No wind
      }

      drawScene(ctx, rocket.current.x, rocket.current.y);
    }

  }, [level]); // Depend on level state

  const retryCurrentLevel = () => {
    setShowNextLevelPrompt(false);
    setShowResult(false); // Ensure result overlay is also hidden
    trail.current = [];
    pastTrails.current = [];
    pastAttempts.current = []; // Clear for retry too, as it's a new attempt
    rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 };
    setLastResultType(null);
  };

  const goToNextLevel = () => {
    if (level === Object.keys(levelConfigs).length) { // Check if current level is the last level
      setShowGameClear(true);
    } else {
      setLevel(prevLevel => prevLevel + 1);
    }
    setShowNextLevelPrompt(false);
    setShowResult(false); // Ensure result overlay is also hidden
    trail.current = [];
    pastTrails.current = [];
    pastAttempts.current = [];
    rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 };
    setLastResultType(null);
  };

  if (level === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'white', padding: '50px' }}>
              <h1 style={{ color: '#0cf', margin: '0' }}>ROCKET SIM v1.7</h1>        <Link href="/" style={{ background: '#444', color: 'white', border: 'none', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
            トップページに戻る
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px', margin: '40px auto' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{ padding: '25px', fontSize: '16px', cursor: 'pointer', background: '#222', color: '#0cf', border: '2px solid #0cf', borderRadius: '8px', transition: '0.3s' }}>
              {levelConfigs[l as keyof typeof levelConfigs].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', color: 'white', padding: '20px', fontFamily: 'monospace' }}>
      {/* Header and Level Name */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', width: '100%', maxWidth: '950px', margin: '0 auto' }}>
        <button onClick={() => { setLevel(0); setShowResult(false); }} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px' }}>MENU</button>
        <h2 style={{ color: '#0cf', margin: 0 }}>{levelConfigs[level as keyof typeof levelConfigs].name}</h2>
        <div style={{ width: '80px' }}></div>
      </div>
      
      {/* Main responsive container for canvas, history, and controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%', maxWidth: '950px', margin: '0 auto' }}>

        {/* Canvas and overlays wrapper */}
        <div style={{ width: '100%', overflowX: 'auto' }}> {/* Scrollable canvas container */}
          <div style={{ position: 'relative', width: CANVAS_WIDTH, height: 400, margin: '0 auto' }}> {/* Actual canvas holder */}
            <canvas ref={canvasRef} width={CANVAS_WIDTH * VISUAL_SCALE} height={400 * VISUAL_SCALE} style={{ background: '#f0f4f8', borderRadius: '8px', border: '4px solid #333' }} />
            {showResult && lastResultType === 'MISS' && ( // Show result overlay ONLY for MISS
              <div onClick={() => { setShowResult(false); trail.current = []; pastTrails.current = []; rocket.current = { x: LAUNCH_X, y: GROUND_Y, vx: 0, vy: 0 }; setLastResultType(null); }}
                   style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10, borderRadius: '8px' }}>
                <h2 style={{ fontSize: '42px', color: '#ffff00', margin: '0 0 10px 0' }}>{result}</h2>
                <p style={{ color: 'white', fontSize: '18px' }}>[ CLICK TO RETRY ]</p>
              </div>
            )}

            {showNextLevelPrompt && ( // New next level prompt overlay
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '8px' }}>
                <h2 style={{ fontSize: '42px', color: '#00ff00', margin: '0 0 10px 0' }}>GOAL!!</h2>
                <p style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>次のレベルに進みますか？</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <button onClick={goToNextLevel} style={{ padding: '12px 25px', fontSize: '18px', background: '#0cf', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    次へ (レベル {level + 1})
                  </button>
                  <button onClick={retryCurrentLevel} style={{ padding: '12px 25px', fontSize: '18px', background: '#f00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    リトライ
                  </button>
                </div>
              </div>
            )}

            {showGameClear && ( // New Game Clear overlay
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 11, borderRadius: '8px' }}>
                <h2 style={{ fontSize: '60px', color: '#ffff00', margin: '0 0 20px 0', textShadow: '0 0 15px #ffff00' }}>GAME CLEAR!</h2>
                <p style={{ color: 'white', fontSize: '24px', marginBottom: '30px' }}>全てのレベルをクリアしました！</p>
                <button onClick={() => setLevel(0)} style={{ padding: '15px 30px', fontSize: '20px', background: '#0cf', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  メニューに戻る
                </button>
              </div>
            )}

            {/* 過去の挑戦履歴 (Overlayed on canvas) */}
            <div style={{ position: 'absolute', top: 10 * VISUAL_SCALE, right: 10 * VISUAL_SCALE, width: 200 * VISUAL_SCALE, background: 'rgba(34, 34, 34, 0.7)', padding: 10 * VISUAL_SCALE, borderRadius: 8 * VISUAL_SCALE, border: `1px solid rgba(68, 68, 68, 0.7)`, overflowY: 'auto', maxHeight: 150 * VISUAL_SCALE, zIndex: 5 }}>
              <h3 style={{ color: '#0cf', marginTop: '0', marginBottom: 5 * VISUAL_SCALE, fontSize: 14 * VISUAL_SCALE }}>過去の挑戦</h3>
              {pastAttempts.current.length === 0 ? (
                <p style={{ fontSize: 10 * VISUAL_SCALE, color: '#666' }}>まだ挑戦はありません。</p>
              ) : (
                <ul style={{ listStyleType: 'none', padding: '0' }}>
                  {pastAttempts.current.map((attempt, index) => (
                    <li key={index} style={{ marginBottom: 5 * VISUAL_SCALE, paddingBottom: 5 * VISUAL_SCALE, borderBottom: `1px dashed rgba(68, 68, 68, 0.7)`, fontSize: 10 * VISUAL_SCALE, color: '#ddd' }}>
                      <p style={{ margin: '0' }}>試行 {index + 1}:</p>
                      <p style={{ margin: '0' }}>圧: {attempt.pressure.toFixed(2)}, 角: {attempt.angle}°</p>
                      <p style={{ margin: '0' }}>距離: {attempt.distance}m, 結果: {attempt.result}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#222', padding: '20px', borderTop: '1px solid #444', zIndex: 100 }}> {/* Fixed to bottom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '750px', margin: '0 auto' }}> {/* Centered content */}
            <div>
              <label style={{ display: 'block', color: '#0cf', marginBottom: '10px' }}>PRESSURE: {pressure.toFixed(2)} MPa</label>
              <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px' }}>ANGLE: {angle}°</label>
              <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            {levelConfigs[level as keyof typeof levelConfigs].hasWind && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'left', marginTop: '10px' }}>
                <label style={{ display: 'block', color: '#fff', fontSize: '14px' }}>{getWindDescription(wind.x, wind.y)}</label>
              </div>
            )}
          </div>
          {!showResult && <button onClick={launch} disabled={isFlying} style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '22px', fontWeight: 'bold', background: isFlying ? '#444' : '#0cf', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚀 LAUNCH</button>}
        </div>
      </div>

      {failureCount >= 3 && (
        <div style={{ background: '#333', padding: '15px', borderRadius: '12px', marginTop: '15px', maxWidth: '750px', margin: '15px auto 100px auto', border: '1px solid #ffcc00', textAlign: 'left' }}>
          <h3 style={{ color: '#ffcc00', margin: '0 0 10px 0' }}>ヒント:</h3>
          <p style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>
            {hints.parabolic}
          </p>
          {levelConfigs[level as keyof typeof levelConfigs].drag > 0 && (
            <p style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>
              {hints.drag}
            </p>
          )}
          {levelConfigs[level as keyof typeof levelConfigs].obstacle && (
            <p style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>
              {hints.obstacle}
            </p>
          )}
          <p style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>
            {hints.pressure}
          </p>
          <p style={{ color: 'white', fontSize: '14px', marginBottom: '5px' }}>
            {hints.angle}
          </p>
        </div>
      )}
    </div>
  );
}