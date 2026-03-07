"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  placeholder?: string;
  onStrokeChange?: (hasStroke: boolean) => void;
  required?: boolean;
}

export interface HandwritingCanvasHandle {
  getImageData: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(({
  width = 800,
  height = 300,
  placeholder,
  onStrokeChange,
  required = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // iPad/Safari対策: 標準のスクロールやズームを完全に無効化するための低レベルイベントリスナー
    const preventDefault = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // passive: false にすることで e.preventDefault() を有効にする
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getImageData: () => {
      if (!hasStroke) return null;
      return canvasRef.current?.toDataURL('image/png') || null;
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasStroke(false);
        onStrokeChange?.(false);
      }
    },
    isEmpty: () => !hasStroke
  }));

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }
    setIsDrawing(true);
    setHasStroke(true);
    onStrokeChange?.(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  return (
    <div className="relative group">
      {placeholder && !hasStroke && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-700 font-bold uppercase tracking-widest text-sm select-none">
          {placeholder} {required && <span className="text-red-900 ml-1">*</span>}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full bg-gray-900/40 border border-white/10 rounded-2xl cursor-crosshair active:border-[#0cf]/50 transition-colors select-none touch-none [-webkit-touch-callout:none]"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button 
        type="button"
        onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasStroke(false);
                onStrokeChange?.(false);
            }
        }}
        className="absolute bottom-2 right-2 p-1 text-[8px] font-mono text-gray-500 hover:text-white uppercase tracking-tighter select-none"
      >
        Clear
      </button>
    </div>
  );
});

HandwritingCanvas.displayName = 'HandwritingCanvas';

export default HandwritingCanvas;
