"use client";

import { useState, FormEvent, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, HelpCircle, Camera, Search, Sparkles, Terminal } from 'lucide-react';
import CameraView from '@/app/bookshelf/components/CameraView';
import MessageBox from '@/components/MessageBox';
import LoadingButton from '@/components/LoadingButton';
import { GoldStatus } from '@/components/GoldStatus';
import { getUserGoldData } from '@/lib/actions';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';

const ScanPage = () => {
  const router = useRouter();
  const { isOpen, markAsSeen, showAgain } = useSessionFirstTime('bookshelf-scan-guide');
  const [error, setError] = useState<string | null>(null);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [gold, setGold] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const isNavigatingRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    console.log(`[VisionDebug] ${msg}`);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  useEffect(() => {
    const fetchGold = async () => {
      const data = await getUserGoldData();
      setGold(data.gold);
    };
    fetchGold();
    addLog("System initialized. Awaiting sensor activation.");
  }, [addLog]);

  const handleScanSuccess = useCallback((decodedText: string) => {
    addLog(`Scan Success: ISBN ${decodedText}`);
    if (isNavigatingRef.current) {
        addLog("Navigation already in progress, skipping.");
        return;
    }
    
    isNavigatingRef.current = true;
    setIsScanning(false);
    addLog("Navigating to book details...");
    router.push(`/bookshelf/book/${decodedText}`);
  }, [router, addLog]);

  const handleScanFailure = useCallback((errorMessage: string) => {
    if (errorMessage.includes("NotAllowedError") || errorMessage.includes("NotFoundError")) {
      addLog(`Critical Camera Error: ${errorMessage}`);
      setCameraAccessError(`カメラへのアクセスがブロックされました。ブラウザの設定を確認してください。`);
      setIsScanning(false);
    }
  }, [addLog]);
  
  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    addLog(`Manual Entry Attempt: ${isbnInput}`);

    const isbnRegex = /^(?:\d{10}|\d{13})$/;
    if (!isbnRegex.test(isbnInput)) {
      addLog("Validation Failed: Invalid ISBN format.");
      setError('有効なISBNコード（10桁または13桁の半角数字）を入力してください。');
      return;
    }
    
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    addLog("Navigating to book details...");
    router.push(`/bookshelf/book/${isbnInput}`);
  };

  const handleScanStop = useCallback(() => {
    addLog("Sensor deactivated.");
    setIsScanning(false);
  }, [addLog]);

  const toggleScan = () => {
    const nextState = !isScanning;
    addLog(nextState ? "Activating Vision Sensor..." : "Deactivating Sensor...");
    setIsScanning(nextState);

    if (nextState) {
      setTimeout(() => {
        if (isNavigatingRef.current) return;
        setDebugLogs(prev => {
          if (prev.some(l => l.includes("started") || l.includes("Error"))) return prev;
          const msg = `${new Date().toLocaleTimeString()}: [Warning] Sensor taking too long. Check permissions or HTTPS.`;
          return [...prev.slice(-4), msg];
        });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <Image src="/images/toppage_wheel_labo.png" alt="" fill className="object-cover" />
      </div>

      <WelcomeGuide 
        content={GUIDE_CONTENTS.BOOKSHELF_SCAN} 
        isOpen={isOpen} 
        onClose={markAsSeen} 
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <header className="mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
                <Link href="/bookshelf" className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Bookshelf
                </Link>
                <button onClick={showAgain} className="p-2 bg-white/5 text-gray-500 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <GoldStatus amount={gold} />
          </div>

          <h1 className="text-4xl font-black tracking-tighter mb-4">ISBN <span className="text-[#0cf]">Scanner</span></h1>
          <p className="text-gray-400">カメラまたはISBN入力で書籍を特定し、マイ本棚へ追加します。</p>
        </header>

        <main className="space-y-12">
          {/* Camera Section */}
          <section className="bg-gray-900/40 border border-white/10 rounded-[32px] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-[#0cf]" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Vision Scan</h2>
                </div>
                <button 
                    onClick={toggleScan}
                    className={`px-6 py-2 font-black text-[10px] rounded-lg transition-all ${isScanning ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#0cf] text-black hover:scale-105'}`}
                >
                    {isScanning ? 'DEACTIVATE SENSOR' : 'ACTIVATE SENSOR'}
                </button>
            </div>

            <div className="relative aspect-video bg-black/60 flex items-center justify-center">
                {cameraAccessError ? (
                    <div className="p-8 text-center text-red-500">
                        <p className="text-sm font-bold">{cameraAccessError}</p>
                    </div>
                ) : !isScanning ? (
                    <div className="text-center opacity-20">
                        <Sparkles className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting Activation...</p>
                    </div>
                ) : (
                    <CameraView
                        isScanning={isScanning}
                        onScanSuccess={handleScanSuccess}
                        onScanFailure={handleScanFailure}
                        onScanStop={handleScanStop}
                        onLog={addLog}
                    />
                )}
                {isScanning && <div className="absolute inset-0 pointer-events-none border-2 border-[#0cf]/30 rounded-lg animate-pulse z-20" />}
            </div>

            {/* Debug Logs */}
            {debugLogs.length > 0 && (
                <div className="p-4 bg-black/60 border-t border-white/5 font-mono text-[8px] text-gray-500 space-y-1">
                    <div className="flex items-center gap-2 mb-1 text-gray-600">
                        <Terminal className="w-2 h-2" /> SYSTEM DIAGNOSTICS
                    </div>
                    {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
          </section>

          {/* Manual Input */}
          <section className="bg-white/5 border border-white/10 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-8">
                <Search className="w-5 h-5 text-[#0cf]" />
                <h2 className="text-sm font-black uppercase tracking-widest">Manual Entry</h2>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-4">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ISBN-10 / ISBN-13</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={isbnInput}
                        onChange={(e) => setIsbnInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="例: 9784041092000"
                        className="w-full bg-black border border-white/10 rounded-2xl p-6 text-2xl font-black text-[#0cf] focus:border-[#0cf] outline-none transition-all placeholder:text-gray-800"
                    />
                </div>
                <LoadingButton 
                    type="submit" 
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10"
                >
                    SEARCH DATABASE
                </LoadingButton>
            </form>
          </section>

          {error && <MessageBox status="error" title="Input Error" description={error} onClose={() => setError(null)} />}
        </main>
      </div>
    </div>
  );
};

export default ScanPage;
