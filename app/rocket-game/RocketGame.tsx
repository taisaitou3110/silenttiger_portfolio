"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LEVEL_CONFIGS, 
  LAUNCH_X, 
  GROUND_Y, 
  CANVAS_WIDTH,
  HINTS 
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
  const [result, setResult] = useState<{ msg: string; distance: number } | null>(null);
  const [wind, setWind] = useState({ x: 0, y: 0 });
  const [pastTrails, setPastTrails] = useState<Point[][]>([]);
  const [pastAttempts, setPastAttempts] = useState<Attempt[]>([]); // 試行履歴
  const [realtimeStatus, setRealtimeStatus] = useState({ altitude: 0, velocity: 0, distance: 0 }); // リアルタイムステータス
  const [failedAttempts, setFailedAttempts] = useState(0); // 失敗回数カウンター
  const [hint, setHint] = useState<string | null>(null); // ヒントメッセージ
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: 400 });


  // --- 参照 (DOM & データ) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // --- 描画コールバック ---
  const draw = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return; // Always need context

    // Add robust checks for critical arguments before calling drawScene
    // Guard against level 0 and ensure LEVEL_CONFIGS[level] is valid
    if (level === 0 || !LEVEL_CONFIGS[level]) {
      // If level 0, it's the menu. If config is missing, it's an invalid state.
      // Simply return, as there's nothing meaningful to draw for an invalid level.
      return; 
    }
    const currentLevelConfig = LEVEL_CONFIGS[level];

    // Ensure rocket and trail refs are initialized and contain valid data
    // The usePhysics hook should ensure these are always objects, but defensive check is good.
    if (!rocket.current || !trail.current) {
        // console.warn("Rocket or Trail data not yet available for drawing.");
        return;
    }

    const scale = canvasSize.width / CANVAS_WIDTH;
    // 毎フレーム描画
    drawScene(
      ctx,
      rocket.current,
      currentLevelConfig, // Use the guarded config
      trail.current,
      pastTrails,
      canvasSize.width,
      canvasSize.height,
      scale
    );
  }, [level, pastTrails, canvasSize]);

  // --- 物理エンジン Hook の接続 ---
  const { rocket, trail, isFlying, launch } = usePhysics(level, (msg, finalX, finalY) => {
    const distance = Math.round(finalX - LAUNCH_X);
    setResult({ msg, distance }); // オブジェクトで結果をセット

    // 試行履歴に保存
    setPastAttempts(prev => [
      ...prev,
      {
        pressure: currentPressure.current,
        angle: currentAngle.current,
        distance: distance,
        result: msg,
      }
    ]);
    
    // ヒント機能のロジック
    if (msg.includes('MISS')) {
      const newFailedCount = failedAttempts + 1;
      if (newFailedCount >= 3) {
        const config = LEVEL_CONFIGS[level];
        let relevantHint = HINTS.parabolic; // デフォルトヒント
        if (config.obstacle) {
          relevantHint = HINTS.obstacle;
        } else if (config.drag > 0) {
          relevantHint = HINTS.drag;
        }
        setHint(relevantHint);
        setFailedAttempts(0); // ヒント表示後にカウンターをリセット
      } else {
        setFailedAttempts(newFailedCount);
      }
    } else if (msg.includes('GOAL')) {
      setFailedAttempts(0);
      setHint(null);
    }
  }, draw, setRealtimeStatus);

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
    setPastAttempts([]);
    setRealtimeStatus({ altitude: 0, velocity: 0, distance: 0 });
    setFailedAttempts(0);
    setHint(null);

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
    
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const newHeight = containerWidth / (CANVAS_WIDTH / 400); // Maintain aspect ratio
        setCanvasSize({
          width: containerWidth,
          height: newHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    draw();

    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);
  
  // --- ハンドラ ---
  const handleLaunch = () => {
    if (isFlying) return;
    setResult(null);
    setHint(null); // Launch時にヒントを消す

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
            if (Number(key) === 0) return null;
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
            textAlign: 'center', 
            fontFamily: 'monospace', 
            color: 'white',
            backgroundImage: 'url("/images/image_background_rocket.png")',
            backgroundSize: 'cover',                                     
            backgroundAttachment: 'fixed',                               
            width: '100vw',
            height: '100vh',
            display: 'flex',                                             
            flexDirection: 'column',                                     
            alignItems: 'center',                                        
            justifyContent: 'center',                                    
            position: 'relative', 
            padding: '20px',
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
    
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '0 auto', flexWrap: 'wrap', width: '100%' }}>
            <div ref={canvasContainerRef} style={{ flex: '1 1 600px', minWidth: '300px', position: 'relative', borderRadius: '12px', border: '5px solid #333', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height}
            style={{ display: 'block', opacity: 0.9, width: '100%' }}
          />
          
          {isFlying && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
              <p style={{ margin: 0 }}>Altitude: {realtimeStatus.altitude}m</p>
              <p style={{ margin: 0 }}>Velocity: {realtimeStatus.velocity}m/s</p>
              <p style={{ margin: 0 }}>Distance: {realtimeStatus.distance}m</p>
            </div>
          )}

          {/* 結果オーバーレイ */}
          {result && !isFlying && ( // resultがnullでなく、かつロケットが飛行中でない場合にのみ表示
            <div 
            // 全画面を覆う半透明オーバーレイ
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }} 
            >
              <div style={{ textAlign: 'center', background: 'rgba(34, 34, 34, 0.9)', padding: '30px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' }}> {/* 中央に表示されるメッセージボックスのスタイル */}
                <h2 style={{ fontSize: '1rem', color: result.msg.includes('GOAL') ? '#0f0' : '#ff0', margin: 0 }}>{result.msg}</h2> {/* 結果メッセージ（GOAL! または MISS: ...） */}
                <p style={{ color: 'white', fontSize: '1.5rem', margin: '5px 0 0 0' }}>飛距離: {result.distance}m</p> {/* 達成した飛距離を表示 */}
                {result.msg.includes('GOAL') ? ( // GOAL! の場合
                  <div style={{ marginTop: '20px' }}> {/* ボタンコンテナ */}
                    <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '15px' }}>次のレベルへ進みますか？</p> {/* ユーザーへの問いかけ */}
                    <button 
                      onClick={() => { setLevel(level + 1); setResult(null); }} // 次のレベルへ進むボタン。レベルを上げ、結果表示をクリア
                      style={{ background: '#0cf', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px', marginRight: '10px' }}
                    >
                      次のレベルへ
                    </button>
                    <button 
                      onClick={() => setResult(null)} // 現在のレベルを続けるボタン。結果表示をクリア
                      style={{ background: '#444', color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      このレベルを続ける
                    </button>
                  </div>
                ) : ( // MISS: の場合
                  <p onClick={() => setResult(null)} style={{ color: 'white', cursor: 'pointer', marginTop: '20px' }}>[ CLICK TO RETRY ]</p> // 再試行を促すメッセージ。クリックでメッセージを閉じる
                )}
              </div>
            </div>
          )}
        </div>

        {/* 試行履歴サイドバー */}
        <div style={{ flex: '1 1 250px', minWidth: '250px', background: 'rgba(34, 34, 34, 0.7)', borderRadius: '12px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', textAlign: 'left', overflowY: 'auto', maxHeight: '400px' }}>
          <h3 style={{ color: '#0cf', fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>試行履歴</h3>
          {pastAttempts.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem', textAlign: 'center' }}>まだ試行がありません。</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pastAttempts.slice().reverse().map((attempt, index) => (
                <li key={pastAttempts.length - 1 - index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                  <p style={{ color: '#fff', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                    <strong>#{pastAttempts.length - index}:</strong> {attempt.result}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-around', color: '#ccc', fontSize: '0.85rem' }}>
                    <span>P: {attempt.pressure.toFixed(2)}</span>
                    <span>A: {attempt.angle}°</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {hint && (
        <div style={{ background: 'rgba(255, 255, 100, 0.9)', color: 'black', padding: '10px', borderRadius: '8px', marginTop: '15px', width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          <strong>ヒント:</strong> {hint}
        </div>
      )}

      {/* 操作パネル (外部コンポーネント) */}
      <div style={{ width: '100%', marginTop: '15px' }}>
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
