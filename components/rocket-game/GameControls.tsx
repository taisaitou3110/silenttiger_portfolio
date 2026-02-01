// src/components/rocket-game/GameControls.tsx
"use client";
import React from 'react';

interface GameControlsProps {
  pressure: number;
  setPressure: (val: number) => void;
  angle: number;
  setAngle: (val: number) => void;
  onLaunch: () => void;
  isFlying: boolean;
  hasWind?: boolean;
  wind: { x: number; y: number };
}

export default function GameControls({
  pressure, setPressure, angle, setAngle, onLaunch, isFlying, hasWind, wind
}: GameControlsProps) {
  return (
    <div style={{ background: 'rgba(34, 34, 34, 0.7)', padding: '15px', borderRadius: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center' }}>
        <div style={{ maxWidth: '200px', margin: '0 auto', width: '100%' }}>
          <label style={{ display: 'block', color: '#0cf', marginBottom: '10px' }}>PRESSURE: {pressure.toFixed(2)} MPa</label>
          <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <button 
          onClick={onLaunch} 
          disabled={isFlying} 
          style={{ 
            width: '80px', 
            height: '80px', 
            fontWeight: 'bold', 
            background: isFlying ? '#444' : '#0cf', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '24px' }}>🚀</span>
          <span style={{ fontSize: '12px', marginTop: '5px' }}>LAUNCH</span>
        </button>

        <div style={{ maxWidth: '200px', margin: '0 auto', width: '100%' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '10px' }}>ANGLE: {angle}°</label>
          <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}