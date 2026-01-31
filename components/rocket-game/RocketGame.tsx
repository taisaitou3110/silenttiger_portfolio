"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  LEVEL_CONFIGS, 
  LAUNCH_X, 
  GROUND_Y, 
  VISUAL_SCALE, 
  CANVAS_WIDTH 
} from './constants';
import { drawScene } from './drawUtils';
import { usePhysics } from './usePhysics';
import GameControls from './GameControls';

export default function RocketGame() {
  // --- 基本ステート ---
  const [level, setLevel] = useState(0);
  const [pressure, setPressure] = useState(0.5);
  const [angle, setAngle] = useState(45);
  const [result, setResult] = useState<string | null>(null);
  const [wind, setWind] = useState({ x: 0, y: 0 });

  // --- 参照 (DOM & データ) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pastTrails = useRef<{ x: number; y: number }[][]>([]);

  // --- 物理エンジン Hook の接続 ---
  const { rocket, trail, isFlying, launch } = usePhysics(level, (finalMessage) => {
    setResult(finalMessage); // シミュレーション終了時にメッセージをセット
  });

  // --- 副作用: レベル切り替え時の初期化 ---
  useEffect(() => {
    if (level === 0) return;

    // パラメータリセット
    setPressure(0.5);
    setAngle(45);
    setResult(null);
    pastTrails.current = [];

    // 風の設定
    const config = LEVEL_CONFIGS[level];
    if (config.hasWind) {
      const randomSign = () => (Math.random() < 0.5 ? 1 : -1);
      setWind({ 
        x: (Math.random() * 4 + 1) * randomSign(), 
        y: (Math.random() * 4 + 1) * randomSign() 
      });
    } else {
      setWind({ x: 0, y: 0 });
    }
  }, [level]);

  // --- 副作用: 描画ループ ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || level === 0) return;

    // 毎フレーム描画（ロケットの位置や軌跡が変わるたびに実行）
    drawScene(
      ctx, 
      rocket.current, 
      LEVEL_CONFIGS[level], 
      isFlying, 
      trail.current, 
      pastTrails.current
    );
  }, [level, isFlying, trail.current.length]); // 状態変化に応じて再描画

  // --- ハンドラ ---
  const handleLaunch = () => {
    if (isFlying) return;
    setResult(null);
    if (trail.current.length > 0) {
      pastTrails.current.push([...trail.current]); // 前回の軌跡を保存
    }
    launch(pressure, angle, wind);
  };

  // --- 表示: メニュー画面 ---
  if (level === 0) {
    return (
      <div style={{ color: 'white', padding: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
        <h1 style={{ color: '#0cf', fontSize: '3rem', marginBottom: '40px' }}>ROCKET SIM v1.6</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {Object.keys(LEVEL_CONFIGS).map((key) => (
            <button 
              key={key} 
              onClick={() => setLevel(Number(key))} 
              style={{ padding: '25px', background: '#222', color: '#0cf', border: '2px solid #0cf', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#333')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#222')}
            >
              {LEVEL_CONFIGS[Number(key)].name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- 表示: ゲーム画面 ---
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace', color: 'white' }}>
      {/* ヘッダー部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '950px', margin: '0 auto 20px' }}>
        <button onClick={() => setLevel(0)} style={{ background: '#444', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px' }}>
          MENU
        </button>
        <h2 style={{ color: '#0cf', margin: 0 }}>{LEVEL_CONFIGS[level].name}</h2>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* メインキャンバス部 */}
      <div style={{ position: 'relative', display: 'inline-block', background: '#f0f4f8', borderRadius: '12px', border: '5px solid #333', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH * VISUAL_SCALE} 
          height={400 * VISUAL_SCALE} 
          style={{ display: 'block' }}
        />
        
        {/* 結果オーバーレイ */}
        {result && !isFlying && (
          <div 
            onClick={() => setResult(null)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '3rem', color: result.includes('GOAL') ? '#0f0' : '#ff0', margin: 0 }}>{result}</h2>
              <p style={{ color: 'white' }}>[ CLICK TO RETRY ]</p>
            </div>
          </div>
        )}
      </div>

      {/* 操作パネル (外部コンポーネント) */}
      <GameControls 
        pressure={pressure} 
        setPressure={setPressure} 
        angle={angle} 
        setAngle={setAngle} 
        onLaunch={handleLaunch} 
        isFlying={isFlying}
        hasWind={LEVEL_CONFIGS[level].hasWind}
        wind={wind}
      />
    </div>
  );
}