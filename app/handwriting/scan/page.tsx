"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import LoadingButton from '@/components/LoadingButton';
import ErrorHandler from '@/components/ErrorHandler';
import { IMAGE_CONFIG } from '@/constants/config';
import { analyzeHandwriting } from '../actions';
import { processHandwritingImage } from '@/components/imageProcessor';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docType = searchParams.get('type') || 'general';

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      
      // 1. ファイル形式チェック (標準仕様 5.4.3 準拠)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError({ message: 'VALIDATION_IMAGE_TYPE' });
        return;
      }

      // 2. ブラウザでの読み込み上限 (10MB)
      // 生の画像が10MBを超えるとメモリ負荷が高いため、ここで一度ガード
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

    try {
      // 3. 画像の前処理（モノクロ化 & 軽量化）
      // 手書き文字解析のため、白黒データにしてから送信
      const { base64, size } = await processHandwritingImage(image);
      
      // 4. スリム化した後の最終チェック (標準仕様の3MB制限)
      if (size > IMAGE_CONFIG.MAX_FILE_SIZE_BYTES) {
        setError({ message: 'VALIDATION_IMAGE_SIZE' });
        setLoading(false);
        return;
      }

      console.log(`Original size: ${(image.size / 1024).toFixed(1)}KB, Processed size: ${(size / 1024).toFixed(1)}KB`);

      // AI解析実行
      const rawResult = await analyzeHandwriting(base64, "image/jpeg", docType);
      
      sessionStorage.setItem('lastScanResult', JSON.stringify({
        docType,
        result: rawResult,
        image: base64
      }));
      
      router.push('/handwriting/correction');
    } catch (err: any) {
      console.error("Analysis Error:", err);
      // AI側の制限（サイズ超過等）をキャッチ
      if (err.message?.includes("Payload Too Large")) {
        setError({ message: 'VALIDATION_IMAGE_SIZE' });
      } else {
        setError(err);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
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
                  <p className="text-[#0cf] font-bold tracking-widest animate-pulse uppercase tracking-[0.5em]">Optimizing & Analyzing...</p>
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
