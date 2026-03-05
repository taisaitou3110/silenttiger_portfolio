"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import ErrorHandler from '@/components/ErrorHandler';
import { IMAGE_CONFIG } from '@/constants/config';
import { processHandwritingImage } from '@/components/imageProcessor';
import { AIProcessOverlay, AIMetrics } from '@/components/AI/AIProcessOverlay';

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = searchParams.get('type') || 'general';
  const profileId = searchParams.get('profileId') || undefined;

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [thoughtText, setThoughtText] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setLoading(true);
    setError(null);
    setThoughtText('');

    const startTime = Date.now();
    let firstChunkTime = 0;
    let thoughtStartTime = 0;
    let tokensGenerated = 0;
    let fullText = "";
    let fullThoughts = "";

    setAiMetrics({
      input_tokens: 0,
      thought_seconds: 0,
      current_tps: 0,
      total_latency: 0,
      status: 'transfer',
      debug_log: 'Uplinking visual data...',
    });

    try {
      const { base64, size } = await processHandwritingImage(image);
      if (size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
        setError({ message: 'VALIDATION_IMAGE_SIZE' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai/handwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: "image/jpeg",
          docType,
          profileId
        }),
      });

      if (!response.ok) throw new Error('Uplink failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream error');
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          let data;
          try {
            data = JSON.parse(line);
          } catch (e) {
            console.error("Chunk Parse Error:", e, line);
            continue;
          }

          if (data.type === 'event' && data.data === 'first_chunk') {
            firstChunkTime = Date.now();
            const latency = (firstChunkTime - startTime) / 1000;
            setAiMetrics(prev => ({ 
              ...prev, 
              total_latency: latency,
              status: 'thinking',
              debug_log: 'Cognitive analysis...'
            }));
            thoughtStartTime = Date.now();
          }

          if (data.type === 'chunk') {
            if (data.thought) {
              fullThoughts += data.thought;
              setThoughtText(fullThoughts);
              const thinkingTime = (Date.now() - thoughtStartTime) / 1000;
              setAiMetrics(prev => ({ ...prev, thought_seconds: thinkingTime }));
            }

            if (data.text) {
              if (aiMetrics.status !== 'generating') {
                setAiMetrics(prev => ({ ...prev, status: 'generating', debug_log: 'Synthesizing JSON...' }));
              }
              fullText += data.text;
              tokensGenerated += data.text.length * 0.75;
              const timeFromFirst = (Date.now() - firstChunkTime) / 1000;
              const tps = timeFromFirst > 0 ? tokensGenerated / timeFromFirst : 0;
              setAiMetrics(prev => ({ ...prev, current_tps: tps }));
            }
          }

          if (data.type === 'done') {
            setAiMetrics(prev => ({ 
              ...prev, 
              status: 'completed',
              input_tokens: data.usage?.promptTokenCount || 0,
              debug_log: 'Analysis sync complete'
            }));

            // JSONパース
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

          if (data.type === 'error') {
            setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: data.message }));
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setAiMetrics(prev => ({ ...prev, status: 'error', debug_log: err.message }));
      setError(err);
      setLoading(false);
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
...
        <header className="mb-8">
          <Link href="/handwriting" className="flex items-center text-gray-500 hover:text-[#0cf] transition-colors mb-6 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to App Portal</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tighter">
            Scan <span className="text-[#0cf]">{docType.toUpperCase()}</span>
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
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

          <div className="flex gap-4">
            <LoadingButton
              type="submit"
              className="flex-1 py-4 bg-[#0cf] hover:bg-[#0ef] text-black rounded-2xl font-black text-lg transition-all shadow-lg shadow-[#0cf]/20 disabled:opacity-50 disabled:grayscale"
              isLoading={loading}
              loadingText="最適化中..."
              disabled={!image || loading}
            >
              分析を開始する
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
