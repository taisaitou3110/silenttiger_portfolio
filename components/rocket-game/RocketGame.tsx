"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Point, Attempt } from './types';

export default function RocketGame() {
  // --- 基本ステート ---
  const [level, setLevel] = useState(0);
  const [pressure, setPressure] = useState(0.5);
  const [angle, setAngle] = useState(45);
  const [result, setResult] = useState<string | null>(null);
  const [wind, setWind] = useState({ x: 0, y: 0 });
  const [pastTrails, setPastTrails] = useState<Point[][]>([]);
  const [pastAttempts, setPastAttempts] = useState<Attempt[]>([]); // 試行履歴
  const [realtimeStatus, setRealtimeStatus] = useState({ altitude: 0, velocity: 0, distance: 0 }); // リアルタイムステータス

  // --- 参照 (DOM & データ) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // --- 描画コールバック ---
  const draw = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx || level === 0) return;

    // 毎フレーム描画
    drawScene(
      ctx,
      rocket.current,
      LEVEL_CONFIGS[level],
      trail.current,
      pastTrails
    );
  }, [level, pastTrails]);

  // --- 物理エンジン Hook の接続 ---
  const { rocket, trail, isFlying, launch } = usePhysics(level, (msg, finalX, finalY) => {
    setResult(msg); // シミュレーション終了時にメッセージをセット

    // 試行履歴に保存
    setPastAttempts(prev => [
      ...prev,
      {
        pressure: currentPressure.current, // handleLaunchで保存した圧力
        angle: currentAngle.current,       // handleLaunchで保存した角度
        distance: Math.round(finalX - LAUNCH_X),
        result: msg,
      }
    ]);
  }, draw, setRealtimeStatus); // setRealtimeStatus を追加

  // handleLaunch時に最新の圧力と角度を記録するためのref
  const currentPressure = useRef(pressure);
  const currentAngle = useRef(angle);

  useEffect(() => {
    currentPressure.current = pressure;
    currentAngle.current = angle;
  }, [pressure, angle]);


  // --- 副作用: レベル切り替え時の初期化 ---
  useEffect(() => {
    if (level === 0) return;

    // パラメータリセット
    setPressure(0.5);
    setAngle(45);
    setResult(null);
    setPastTrails([]);
    setPastAttempts([]); // 試行履歴もリセット
    setRealtimeStatus({ altitude: 0, velocity: 0, distance: 0 }); // リアルタイムステータスもリセット

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

  // --- 副作用: 初期描画 & リサイズ対応など ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    contextRef.current = canvas.getContext('2d');
    
    // 状態が変わるたびに再描画（特にisFlyingがfalseになった時など）
    draw();

  }, [draw]); // draw関数が再生成されたら実行
  
  // --- ハンドラ ---
  const handleLaunch = () => {
    if (isFlying) return;
    setResult(null);

    const currentTrail = [...trail.current];
    if (currentTrail.length > 0) {
      setPastTrails(prev => [...prev, currentTrail]);
    }
    launch(pressure, angle, wind);
  };

  // --- 表示: メニュー画面 ---
  if (level === 0) {
    return (
      <div style={{ color: 'white', padding: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
        <h1 style={{ color: '#0cf', fontSize: '3rem', marginBottom: '40px' }}>ROCKET SIM v1.6</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {Object.keys(LEVEL_CONFIGS).map((key) => {
            if (Number(key) === 0) return null; // Skip dummy data
            return (
              <button 
                key={key} 
                onClick={() => setLevel(Number(key))} 
                style={{ padding: '25px', background: '#222', color: '#0cf', border: '2px solid #0cf', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#333')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#222')}
              >
                {LEVEL_CONFIGS[Number(key)].name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- 表示: ゲーム画面 ---
  return (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            fontFamily: 'monospace', 
            color: 'white',
            backgroundImage: 'url("/images/image_background_rocket.png")',
            backgroundSize: 'cover',                                     
            backgroundAttachment: 'fixed',                               
            minHeight: '100vh',                                          
            display: 'flex',                                             
            flexDirection: 'column',                                     
            alignItems: 'center',                                        
            justifyContent: 'center',                                    
            position: 'relative', 
          }}>
            {/* MENU ボタン */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 20 }}>
              <button onClick={() => setLevel(0)} style={{ background: 'rgba(50, 50, 50, 0.7)', color: 'white', border: '1px solid #777', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px' }}>
                MENU
              </button>
            </div>
    
            {/* レベルタイトル */}
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(34, 34, 34, 0.7)', padding: '10px 30px', borderRadius: '12px', border: '1px solid #555' }}>
              <h2 style={{ color: '#0cf', margin: 0, fontSize: '1.2rem' }}>{LEVEL_CONFIGS[level].name}</h2>
            </div>
    
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>        {/* メインキャンバス部 */}
        <div style={{ flexGrow: 1, position: 'relative', display: 'inline-block', borderRadius: '12px', border: '5px solid #333', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', backgroundImage: 'url("/images/image_background_rocket.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH * VISUAL_SCALE} 
            height={400 * VISUAL_SCALE} 
            style={{ display: 'block', opacity: 0.8 }}
          />
          
          {isFlying && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
              <p style={{ margin: 0 }}>Altitude: {realtimeStatus.altitude}m</p>
              <p style={{ margin: 0 }}>Velocity: {realtimeStatus.velocity}m/s</p>
              <p style={{ margin: 0 }}>Distance: {realtimeStatus.distance}m</p>
            </div>
          )}

          {/* 結果オーバーレイ */}
          {result && !isFlying && (
            <div 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
            >
              <div style={{ textAlign: 'center', background: 'rgba(34, 34, 34, 0.9)', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }}>
                <h2 style={{ fontSize: '3rem', color: result.includes('GOAL') ? '#0f0' : '#ff0', margin: 0 }}>{result}</h2>
                {result.includes('GOAL') ? (
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '15px' }}>次のレベルへ進みますか？</p>
                    <button 
                      onClick={() => { setLevel(level + 1); setResult(null); }} 
                      style={{ background: '#0cf', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px', marginRight: '10px' }}
                    >
                      次のレベルへ
                    </button>
                    <button 
                      onClick={() => setResult(null)} 
                      style={{ background: '#444', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      このレベルを続ける
                    </button>
                  </div>
                ) : (
                  <p onClick={() => setResult(null)} style={{ color: 'white', cursor: 'pointer' }}>[ CLICK TO RETRY ]</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 試行履歴サイドバー */}
        <div style={{ width: '250px', background: 'rgba(34, 34, 34, 0.7)', borderRadius: '12px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', textAlign: 'left', overflowY: 'auto', maxHeight: '600px' }}>
          <h3 style={{ color: '#0cf', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>試行履歴</h3>
          {pastAttempts.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem', textAlign: 'center' }}>まだ試行がありません。</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pastAttempts.slice().reverse().slice(0, 3).map((attempt, index) => ( // 最新3つ分だけ表示
                <li key={pastAttempts.length - 1 - index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                  {/* 1行目: 結果メッセージ (フォントサイズ小さく) */}
                  <p style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                    <strong>#{pastAttempts.length - index}:</strong> {attempt.result.split('(')[0].trim()}
                  </p>
                  {/* 2行目: P, A, D の順で一行に */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '0.85rem' }}>
                    <span>P: {attempt.pressure.toFixed(2)}</span>
                    <span>A: {attempt.angle}°</span>
                    <span>D: {attempt.distance}m</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 操作パネル (外部コンポーネント) */}
      <div style={{ width: '100%', maxWidth: '950px', marginTop: '20px' }}>
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
    </div>
  );
}