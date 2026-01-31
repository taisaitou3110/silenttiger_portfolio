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
    <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#222', padding: '20px', borderTop: '1px solid #444' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '750px', margin: '0 auto' }}>
        <div>
          <label style={{ display: 'block', color: '#0cf', marginBottom: '10px' }}>PRESSURE: {pressure.toFixed(2)} MPa</label>
          <input type="range" min="0.1" max="2.0" step="0.01" value={pressure} onChange={e => setPressure(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '10px' }}>ANGLE: {angle}°</label>
          <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
      <button 
        onClick={onLaunch} 
        disabled={isFlying} 
        style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '22px', fontWeight: 'bold', background: isFlying ? '#444' : '#0cf', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        🚀 LAUNCH
      </button>
    </div>
  );
}