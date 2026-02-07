"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LEVEL_CONFIGS, 
  LAUNCH_X, 
  GROUND_Y, 
  CANVAS_WIDTH,
  HINTS 
} from '@/app/rocket-game/constants';
import { drawScene } from '@/app/rocket-game/drawUtils';
import { usePhysics } from '@/app/rocket-game/usePhysics';
import GameControls from '@/app/rocket-game/GameControls';
import { Point, Attempt } from '@/app/rocket-game/types';

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

    // --- 物理エンジン Hook の接続 ---
  const { rocket, trail, isFlying, launch, updatePhysics } = usePhysics(level, (msg, finalX, finalY) => {
    const distance = Math.round(finalX - LAUNCH_X);
    setResult({ msg, distance });
    setPastAttempts(prev => [
      ...prev,
      {
        pressure: currentPressure.current,
        angle: currentAngle.current,
        distance: distance,
        result: msg,
      }
    ]);
    if (msg.includes('MISS')) {
      const newFailedCount = failedAttempts + 1;
      if (newFailedCount >= 3) {
        const config = LEVEL_CONFIGS[level];
        let relevantHint = HINTS.parabolic;
        if (config.obstacle) relevantHint = HINTS.obstacle;
        else if (config.drag > 0) relevantHint = HINTS.drag;
        setHint(relevantHint);
        setFailedAttempts(0);
      } else {
        setFailedAttempts(newFailedCount);
      }
    } else if (msg.includes('GOAL')) {
      setFailedAttempts(0);
      setHint(null);
    }
  }, setRealtimeStatus);


  // --- 描画コールバック ---
  console.log("Draw Function defined, isFlying:", isFlying);
  const draw = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    if (level === 0 || !LEVEL_CONFIGS[level]) return;
    const currentLevelConfig = LEVEL_CONFIGS[level];

    if (!rocket.current || !trail.current) return;

    const scale = canvasSize.width / CANVAS_WIDTH;
    // for debug
    console.log("Canvas Context:", ctx);
    console.log("Scale:", scale);

    drawScene(
      ctx,
      rocket.current,
      currentLevelConfig,
      trail.current,
      pastTrails,
      canvasSize.width,
      canvasSize.height,
      scale
    );
  }, [level, pastTrails, canvasSize]); // ✅ rocket, trail を削除


  // --- アニメーションループ ---
  useEffect(() => {
    if (!isFlying) return;

    let animationFrameId: number;
    const animate = () => {
      const config = LEVEL_CONFIGS[level];
      // ✅ 第1, 第2引数に rocket と trail を渡す
      updatePhysics(rocket, trail, config, 1.0, wind);
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isFlying, level, wind, updatePhysics, draw, rocket, trail]); // ✅ 依存関係を整理

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

    setPressure(0.5);
    setAngle(45);
    setResult(null);
    setPastTrails([]);
    setPastAttempts([]);
    setRealtimeStatus({ altitude: 0, velocity: 0, distance: 0 });
    setFailedAttempts(0);
    setHint(null);

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

// --- 副作用: 初期描画 & リサイズ対応 ---
// 2026.2.7 ここ一回バグってロケット表示されなくなったところ。取扱注意
  useEffect(() => {
    // Canvas要素がDOMに出現するまで待つためのチェック
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas element not found yet...");
      return;
    }

    const ctx = canvas.getContext('2d');
    contextRef.current = ctx;
    console.log("Canvas Context Initialized:", ctx); // これが出るはず

    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const newHeight = containerWidth / (CANVAS_WIDTH / 400);
        setCanvasSize(prev => {
          if (prev.width === containerWidth && prev.height === newHeight) return prev;
          return { width: containerWidth, height: newHeight };
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
    // 依存配列に canvasRef.current を入れることで、
    // null から要素が入った瞬間に再実行されるようにします
  }, [canvasRef.current]);

  // --- ハンドラ ---
  const handleLaunch = () => {
    if (isFlying) return;
    setResult(null);
    setHint(null);

    const currentTrail = [...trail.current];
    if (currentTrail.length > 0) {
      setPastTrails(prev => [...prev, currentTrail]);
    }
    launch(pressure, angle, wind);
  };

  // --- 表示: メニュー画面 ---
  if (level === 0) {
    return (
      <div className="text-white p-12 text-center font-mono">
        <h1 className="text-[#0cf] text-5xl mb-10 sm:text-6xl">ROCKET SIM v1.6</h1>
        <div className="grid grid-cols-1 gap-5 max-w-4xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(LEVEL_CONFIGS).map((key) => {
            if (Number(key) === 0) return null;
            return (
              <button 
                key={key} 
                onClick={() => setLevel(Number(key))} 
                className="p-6 bg-[#222] text-[#0cf] border-2 border-[#0cf] rounded-xl text-lg cursor-pointer transition duration-200 hover:bg-[#333] active:bg-[#444] min-h-[44px]"
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
          <div className="text-center font-mono text-white bg-cover bg-fixed w-screen h-screen flex flex-col items-center justify-center relative p-5"
            style={{backgroundImage: 'url("/images/image_background_rocket.png")'}}>
            {/* MENU ボタン */}
            <div className="absolute top-5 left-5 z-20">
              <button onClick={() => setLevel(0)} className="bg-gray-700/70 text-white border border-gray-600 py-2 px-5 cursor-pointer rounded-md hover:bg-gray-600/70 active:bg-gray-800/70 min-h-[44px]">
                MENU
              </button>
            </div>
    
            {/* レベルタイトル */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-gray-800/70 p-3 px-6 rounded-xl border border-gray-600">
              <h2 className="text-[#0cf] text-lg sm:text-xl m-0">{LEVEL_CONFIGS[level].name}</h2>
            </div>
    
          <div className="flex justify-center gap-5 mx-auto flex-wrap w-full">
            <div ref={canvasContainerRef} className="flex-1 basis-[600px] min-w-[300px] relative rounded-xl border-4 border-gray-700 overflow-hidden shadow-xl shadow-black/50">
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height}
            className="block opacity-90 w-full"
          />
          
          {isFlying && (
            <div className="absolute top-3 left-3 bg-black/50 text-white p-3 rounded-lg text-sm text-left">
              <p className="m-0">Altitude: {realtimeStatus.altitude}m</p>
              <p className="m-0">Velocity: {realtimeStatus.velocity}m/s</p>
              <p className="m-0">Distance: {realtimeStatus.distance}m</p>
            </div>
          )}

          {/* 結果オーバーレイ */}
          {result && !isFlying && (
            <div 
              className="absolute inset-0 w-full h-full bg-black/70 flex justify-center items-center z-10" 
            >
              <div className="text-center bg-gray-800/90 p-6 rounded-xl shadow-lg shadow-black/50">
                <h2 className={result.msg.includes('GOAL') ? 'text-green-400 text-lg m-0' : 'text-yellow-300 text-lg m-0'}>{result.msg}</h2>
                <p className="text-white text-2xl mt-1 mb-0">飛距離: {result.distance}m</p>
                {result.msg.includes('GOAL') ? (
                  <div className="mt-5">
                    <p className="text-white text-lg mb-4">次のレベルへ進みますか？</p>
                    <button 
                      onClick={() => { setLevel(level + 1); setResult(null); }}
                      className="bg-[#0cf] text-white border-none py-2 px-5 cursor-pointer rounded-md mr-2 min-h-[44px]"
                    >
                      次のレベルへ
                    </button>
                    <button 
                      onClick={() => setResult(null)}
                      className="bg-gray-700 text-white border-none py-2 px-5 cursor-pointer rounded-md min-h-[44px]"
                    >
                      このレベルを続ける
                    </button>
                  </div>
                ) : (
                  <p onClick={() => setResult(null)} className="text-white cursor-pointer mt-5">[ CLICK TO RETRY ]</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 試行履歴サイドバー */}
        <div className="flex-1 basis-[250px] min-w-[250px] bg-gray-800/70 rounded-xl p-4 shadow-xl shadow-black/30 text-left overflow-y-auto max-h-[400px] sm:max-h-[80vh]">
          <h3 className="text-[#0cf] text-2xl mb-4 text-center">試行履歴</h3>
          {pastAttempts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center">まだ試行がありません。</p>
          ) : (
            <ul className="list-none p-0">
              {pastAttempts.slice().reverse().map((attempt, index) => (
                <li key={pastAttempts.length - 1 - index} className="mb-2 pb-2 border-b border-gray-700 last:border-b-0">
                  <p className="text-white text-sm mb-1">
                    <strong>#{pastAttempts.length - 1 - index}:</strong> {attempt.result}
                  </p>
                  <div className="flex justify-around text-gray-400 text-sm">
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
        <div className="bg-yellow-100/90 text-black p-3 rounded-lg mt-4 w-full shadow-lg shadow-black/30 text-sm sm:text-base">
          <strong>ヒント:</strong> {hint}
        </div>
      )}

      {/* 操作パネル (外部コンポーネント) */}
      <div className="w-full mt-4">
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