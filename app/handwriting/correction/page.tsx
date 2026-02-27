"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ChevronLeft, Eye, Edit3, CheckCircle2, AlertTriangle, MapPin, Package } from 'lucide-react';
import ConfidenceChecker from '../components/ConfidenceChecker';
import LoadingButton from '@/components/LoadingButton';
import { saveHandwritingData, fetchAddressFromZip } from '../actions';
import ErrorHandler from '@/components/ErrorHandler';

export default function CorrectionPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trainingPool, setTrainingPool] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    try {
      const savedResult = sessionStorage.getItem('lastScanResult');
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (!parsed.result || !parsed.image) {
          throw new Error("解析データが不完全です。もう一度スキャンしてください。");
        }
        setScanResult(parsed);
        setData(parsed.result);
      } else {
        router.push('/handwriting/scan');
      }
    } catch (err: any) {
      console.error("Correction Page Init Error:", err);
      setError({ message: 'AI_RESPONSE_INVALID', details: err.message });
    }
  }, [router]);

  const handleCorrect = (key: string, newValue: string, originalValue: string, confidence: number) => {
    setData((prev: any) => ({ ...prev, [key]: newValue }));
    
    setTrainingPool(prev => [
      ...prev.filter(item => item.label !== key),
      {
        label: key,
        correctLabel: newValue,
        originalValue,
        confidence,
        imagePatch: "", 
      }
    ]);

    // 郵便番号が入力されたら住所を自動取得
    if (key === 'zipCode' && newValue.length >= 7) {
      autoFillAddress(newValue);
    }
  };

  const autoFillAddress = async (zip: string) => {
    const address = await fetchAddressFromZip(zip);
    if (address) {
      setData((prev: any) => ({ ...prev, address }));
    }
  };

  const handleItemCorrect = (index: number, field: string, newValue: string) => {
    setData((prev: any) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: newValue };
      return { ...prev, items: newItems };
    });

    setTrainingPool(prev => [
      ...prev,
      {
        label: `item-${index}-${field}`,
        correctLabel: newValue,
        originalValue: data.items[index][field],
        confidence: 0.7,
        imagePatch: "",
      }
    ]);
  };

  const handleSave = async () => {
    if (!scanResult || !data) return;
    setLoading(true);
    try {
      await saveHandwritingData(scanResult.docType, data, trainingPool);
      setSaved(true);
      setTimeout(() => router.push('/handwriting'), 1500);
    } catch (err: any) {
      console.error("Save Error:", err);
      setError(err);
      setLoading(false);
    }
  };

  // 1. エラー表示
  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-4 text-white">データの読み込みに失敗しました</h2>
      <ErrorHandler error={error} onClose={() => {
        sessionStorage.removeItem('lastScanResult');
        router.push('/handwriting/scan');
      }} />
      <Link href="/handwriting/scan" className="mt-8 text-[#0cf] hover:underline">スキャン画面に戻る</Link>
    </div>
  );

  // 2. 読み込み中（データがない状態）のガード
  if (!data || !scanResult) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-[#0cf] font-mono uppercase tracking-[0.5em]">Initializing Review UI...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/handwriting/scan" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-[#0cf]">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Review & <span className="text-[#0cf]">Correct</span></h1>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">{scanResult.docType} mode</p>
            </div>
          </div>
          <LoadingButton
            onClick={handleSave}
            isLoading={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#0cf] hover:bg-[#0ef] text-black rounded-xl font-black text-sm transition-all shadow-lg shadow-[#0cf]/20"
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "SAVED!" : "CONFIRM & SAVE"}
          </LoadingButton>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* 左側: 全体プレビュー */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-12">
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Original Document</span>
              </div>
              <div className="aspect-[3/4] bg-gray-900/40 border border-white/10 rounded-3xl overflow-hidden relative group">
                <img 
                  src={scanResult.image} 
                  alt="Original" 
                  className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>

          {/* 右側: 項目別編集フォーム */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2 mb-4 text-gray-500">
              <Edit3 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Extraction Result</span>
            </div>

            <div className="space-y-4">
              {scanResult.docType === 'business' || scanResult.docType === 'order' ? (
                <>
                  <ConfidenceChecker 
                    label="Customer Name" 
                    value={data.customerName || "N/A"} 
                    confidence={data.confidence || 0.7} 
                    onCorrect={(val) => handleCorrect('customerName', val, data.customerName, data.confidence || 0.7)}
                  />
                  <ConfidenceChecker 
                    label="Phone Number" 
                    value={data.phoneNumber || "N/A"} 
                    confidence={0.9} 
                    onCorrect={(val) => handleCorrect('phoneNumber', val, data.phoneNumber, 0.9)}
                  />

                  {/* Phase 2: Address & Zip */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <ConfidenceChecker 
                        label="Zip Code" 
                        value={data.zipCode || ""} 
                        confidence={0.7} 
                        onCorrect={(val) => handleCorrect('zipCode', val, data.zipCode, 0.7)}
                      />
                    </div>
                    <div className="col-span-2">
                      <ConfidenceChecker 
                        label="Address" 
                        value={data.address || ""} 
                        confidence={0.6} 
                        onCorrect={(val) => handleCorrect('address', val, data.address, 0.6)}
                      />
                    </div>
                  </div>

                  {scanResult.docType === 'business' ? (
                    <ConfidenceChecker 
                      label="Requirement" 
                      value={data.content || "N/A"} 
                      confidence={0.85} 
                      onCorrect={(val) => handleCorrect('content', val, data.content, 0.85)}
                    />
                  ) : (
                    <div className="p-4 border border-white/5 rounded-xl bg-gray-900/20">
                       <div className="flex items-center gap-2 mb-4">
                         <Package className="w-3 h-3 text-gray-500" />
                         <span className="text-gray-500 text-[10px] font-mono uppercase">Order Items</span>
                       </div>
                       {data.items?.length > 0 ? data.items.map((item: any, idx: number) => (
                         <div key={idx} className="mb-6 last:mb-0 border-b border-white/5 pb-6 last:border-0 last:pb-0 space-y-3">
                           <div className="grid grid-cols-2 gap-2">
                             <input 
                               value={item.itemName}
                               onChange={(e) => handleItemCorrect(idx, 'itemName', e.target.value)}
                               className="bg-black/40 border border-white/5 rounded-lg p-2 text-sm focus:border-[#0cf] outline-none"
                               placeholder="商品名"
                             />
                             <div className="flex gap-2">
                               <input 
                                 value={item.quantity}
                                 onChange={(e) => handleItemCorrect(idx, 'quantity', e.target.value)}
                                 className="w-1/2 bg-black/40 border border-white/5 rounded-lg p-2 text-sm focus:border-[#0cf] outline-none"
                                 placeholder="数量"
                               />
                               <input 
                                 value={item.price}
                                 onChange={(e) => handleItemCorrect(idx, 'price', e.target.value)}
                                 className="w-1/2 bg-black/40 border border-white/5 rounded-lg p-2 text-sm focus:border-[#0cf] outline-none"
                                 placeholder="単価"
                               />
                             </div>
                           </div>
                         </div>
                       )) : <p className="text-gray-500 text-sm">項目が見つかりませんでした。</p>}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-500 text-xs font-mono uppercase mb-2">Raw Text Extraction</div>
                  <textarea 
                    value={data.rawText || ""}
                    onChange={(e) => setData((prev: any) => ({ ...prev, rawText: e.target.value }))}
                    className="w-full min-h-[300px] bg-gray-900/40 border border-white/10 rounded-2xl p-6 text-gray-300 leading-relaxed focus:border-[#0cf] outline-none transition-all font-serif"
                    placeholder="解析されたテキストがここに表示されます"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0cf]/5 border border-[#0cf]/10 rounded-2xl flex gap-4 items-start">
              <div className="p-2 bg-[#0cf]/10 rounded-lg text-[#0cf]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[#0cf] text-sm font-bold mb-1">Phase 2: ビジネスロジック有効化</h4>
                <p className="text-gray-500 text-xs leading-relaxed">
                  郵便番号からの住所自動入力、および数量・金額の自動パースが有効です。
                  同一の顧客名＋電話番号がDBにある場合、自動的に履歴として紐付けられます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
