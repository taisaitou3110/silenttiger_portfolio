"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, Loader2, AlertCircle, ChevronLeft, PenTool, Image as ImageIcon } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import ErrorHandler from '@/components/ErrorHandler';
import { IMAGE_CONFIG } from '@/constants/config';
import { processHandwritingImage } from '@/components/imageProcessor';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';
import HandwritingCanvas, { HandwritingCanvasHandle } from '../components/HandwritingCanvas';

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = searchParams.get('type') || 'general';
  const profileId = searchParams.get('profileId') || undefined;

  const [inputMode, setInputMode] = useState<'scan' | 'handwriting'>('handwriting');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [thoughtText, setThoughtText] = useState('');

  // カンバス用Ref
  const canvasRefs = useRef<{ [key: string]: HandwritingCanvasHandle | null }>({});

  // メトリクス状態
  const [aiMetrics, setAiMetrics] = useState<AIMetrics>({
    input_tokens: 0,
    thought_seconds: 0,
    current_tps: 0,
    total_latency: 0,
    status: 'idle',
    debug_log: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError({ message: 'VALIDATION_IMAGE_TYPE' });
        return;
      }
      const BROWSER_LIMIT = 10 * 1024 * 1024; 
      if (file.size > BROWSER_LIMIT) {
        setError({ message: 'VALIDATION_IMAGE_SIZE' }); 
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const mergeCanvases = async (imagesData: { field: string, data: string | null }[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const loadedImages: { img: HTMLImageElement, field: string }[] = [];
        let loadedCount = 0;
        const total = imagesData.filter(i => i.data).length;

        if (total === 0) {
            reject(new Error("No strokes found"));
            return;
        }

        imagesData.forEach((item) => {
            if (!item.data) return;
            const img = new Image();
            img.onload = () => {
                loadedImages.push({ img, field: item.field });
                loadedCount++;
                if (loadedCount === total) {
                    // 全てロード完了。描画。
                    // 元の順番を維持
                    const sortedImages = imagesData
                        .map(id => loadedImages.find(li => li.field === id.field))
                        .filter((li): li is { img: HTMLImageElement, field: string } => !!li);

                    const totalHeight = sortedImages.reduce((sum, li) => sum + li.img.height + 20, 0);
                    const maxWidth = Math.max(...sortedImages.map(li => li.img.width));
                    
                    canvas.width = maxWidth;
                    canvas.height = totalHeight;
                    ctx.fillStyle = "black"; // 背景黒
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    let currentY = 10;
                    sortedImages.forEach(li => {
                        // ラベル描画（白文字）
                        ctx.fillStyle = "white";
                        ctx.font = "12px monospace";
                        ctx.fillText(li.field.toUpperCase(), 10, currentY + 10);
                        ctx.drawImage(li.img, 0, currentY + 15);
                        currentY += li.img.height + 20;
                    });
                    resolve(canvas.toDataURL('image/png'));
                }
            };
            img.src = item.data;
        });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setThoughtText('');

    let base64: string;
    let mimeType: string = "image/jpeg";

    try {
        if (inputMode === 'handwriting') {
            const fieldConfigs: any = {
                business: ['company', 'name', 'requirement'],
                order: ['company', 'name', 'phone', 'product', 'quantity'],
                general: ['memo']
            };
            const fields = fieldConfigs[docType] || [];
            const imageDataList = fields.map((f: string) => ({
                field: f,
                data: canvasRefs.current[f]?.getImageData() || null
            }));

            const missingFields = fields.filter((f: string) => canvasRefs.current[f]?.isEmpty());
            if (missingFields.length > 0) {
                throw new Error(`未記入の項目があります: ${missingFields.join(', ')}`);
            }

            base64 = await mergeCanvases(imageDataList);
            mimeType = "image/png";
        } else {
            if (!image) throw new Error("画像が選択されていません");
            const processed = await processHandwritingImage(image);
            base64 = processed.base64;
            if (processed.size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
                throw new Error("VALIDATION_IMAGE_SIZE");
            }
        }

        // AI解析 (APIへのリクエスト)
        const startTime = Date.now();
        setAiMetrics({
            input_tokens: 0,
            thought_seconds: 0,
            current_tps: 0,
            total_latency: 0,
            status: 'transfer',
            debug_log: 'Uplinking visual data...',
        });

        const response = await fetch('/api/ai/handwriting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64,
              mimeType,
              docType,
              profileId
            }),
        });

        if (!response.ok) throw new Error('Uplink failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream error');
        const decoder = new TextDecoder();
        
        let fullText = "";
        let fullThoughts = "";
        let firstChunkTime = 0;
        let thoughtStartTime = 0;
        let tokensGenerated = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                let data;
                try { data = JSON.parse(line); } catch (e) { continue; }

                if (data.type === 'event' && data.data === 'first_chunk') {
                    firstChunkTime = Date.now();
                    setAiMetrics(prev => ({ ...prev, total_latency: (firstChunkTime - startTime) / 1000, status: 'thinking' }));
                    thoughtStartTime = Date.now();
                }

                if (data.type === 'chunk') {
                    if (data.thought) {
                        fullThoughts += data.thought;
                        setThoughtText(fullThoughts);
                        setAiMetrics(prev => ({ ...prev, thought_seconds: (Date.now() - thoughtStartTime) / 1000 }));
                    }
                    if (data.text) {
                        if (aiMetrics.status !== 'generating') setAiMetrics(prev => ({ ...prev, status: 'generating' }));
                        fullText += data.text;
                        tokensGenerated += data.text.length * 0.75;
                        const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
                        setAiMetrics(prev => ({ ...prev, current_tps: timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0 }));
                    }
                }

                if (data.type === 'done') {
                    setAiMetrics(prev => ({ ...prev, status: 'completed', input_tokens: data.usage?.promptTokenCount || 0 }));
                    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error("Result corrupted");
                    const rawResult = JSON.parse(jsonMatch[0]);

                    sessionStorage.setItem('lastScanResult', JSON.stringify({
                        docType,
                        profileId,
                        result: rawResult,
                        image: base64
                    }));
                    setTimeout(() => router.push('/handwriting/correction'), 1000);
                }

                if (data.type === 'error') throw new Error(data.message);
            }
        }
    } catch (err: any) {
        console.error("Error:", err);
        setError(err);
        setLoading(false);
    }
  };

  const renderHandwritingInputs = () => {
    switch(docType) {
        case 'business':
            return (
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">会社名</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.company = el; }} placeholder="Company Name" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">ご担当者様名</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.name = el; }} placeholder="Contact Person" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">要件</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.requirement = el; }} placeholder="Requirement Details" height={250} required />
                    </div>
                </div>
            );
        case 'order':
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">会社名</label>
                            <HandwritingCanvas ref={el => { canvasRefs.current.company = el; }} placeholder="Company" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">担当者名</label>
                            <HandwritingCanvas ref={el => { canvasRefs.current.name = el; }} placeholder="Name" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">電話番号</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.phone = el; }} placeholder="Phone Number" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">商品名</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.product = el; }} placeholder="Product Item" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">数量</label>
                        <HandwritingCanvas ref={el => { canvasRefs.current.quantity = el; }} placeholder="Quantity / Amount" required />
                    </div>
                </div>
            );
        default:
            return (
                <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">自由記述メモ</label>
                    <HandwritingCanvas ref={el => { canvasRefs.current.memo = el; }} placeholder="Free Handwriting Memo..." height={400} required />
                </div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <AIProcessOverlay 
        metrics={aiMetrics} 
        thoughtText={thoughtText} 
        title="Vision Link Processor" 
        modelName="Gemini 2.5 Flash"
      />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-8">
          <Link href="/handwriting" className="flex items-center text-gray-500 hover:text-[#0cf] transition-colors mb-6 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to App Portal</span>
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">
                Scan <span className="text-[#0cf]">{docType.toUpperCase()}</span>
              </h1>
            </div>
            
            <div className="flex bg-gray-900/60 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setInputMode('scan')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'scan' ? 'bg-[#0cf] text-black shadow-[0_0_10px_#0cf]' : 'text-gray-500 hover:text-white'}`}
                >
                    <ImageIcon className="w-3 h-3" /> CAMERA
                </button>
                <button 
                  onClick={() => setInputMode('handwriting')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${inputMode === 'handwriting' ? 'bg-[#0cf] text-black shadow-[0_0_10px_#0cf]' : 'text-gray-500 hover:text-white'}`}
                >
                    <PenTool className="w-3 h-3" /> CANVAS
                </button>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {inputMode === 'scan' ? (
            <div className="relative group">
              <input 
                id="file-upload" 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                accept="image/*" 
                onChange={handleImageChange} 
                disabled={loading}
              />
              
              <div className={`
                relative aspect-[4/3] w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center overflow-hidden transition-all duration-500
                ${imagePreview ? 'border-[#0cf]/50 bg-gray-900/40' : 'border-white/10 bg-gray-900/20 hover:border-[#0cf]/30'}
              `}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain animate-in fade-in zoom-in duration-500" />
                ) : (
                  <div className="text-center p-8 group-hover:scale-110 transition-transform duration-500">
                    <div className="w-20 h-20 bg-[#0cf]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-10 h-10 text-[#0cf]" />
                    </div>
                    <p className="text-xl font-bold mb-2">写真を撮影または選択</p>
                    <p className="text-gray-500 text-sm">手書き文字がはっきり写るように撮影してください</p>
                  </div>
                )}
                
                {loading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                    <Loader2 className="w-12 h-12 text-[#0cf] animate-spin mb-4" />
                    <p className="text-[#0cf] font-bold tracking-widest animate-pulse uppercase tracking-[0.5em]">Vision Syncing...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom duration-500">
                <div className="bg-gray-900/20 border border-white/5 rounded-3xl p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <PenTool className="w-5 h-5 text-[#0cf]" />
                        <h2 className="text-lg font-bold">Direct Handwriting Input</h2>
                    </div>
                    {renderHandwritingInputs()}
                </div>
            </div>
          )}

          <div className="flex gap-4">
            <LoadingButton
              type="submit"
              className="flex-1 py-4 bg-[#0cf] hover:bg-[#0ef] text-black rounded-2xl font-black text-lg transition-all shadow-lg shadow-[#0cf]/20 disabled:opacity-50 disabled:grayscale"
              isLoading={loading}
              loadingText="最適化中..."
              disabled={(inputMode === 'scan' && !image) || loading}
            >
              {inputMode === 'scan' ? '分析を開始する' : '手書きデータを送信'}
            </LoadingButton>
          </div>
        </form>

        {error && (
          <ErrorHandler 
            error={error} 
            onClose={() => setError(null)} 
          />
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0cf] animate-spin" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
