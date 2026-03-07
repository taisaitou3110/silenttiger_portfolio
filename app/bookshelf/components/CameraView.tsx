// app/bookshelf/components/CameraView.tsx
"use client";

import { useEffect, useRef } from 'react';
import { Html5Qrcode, QrCodeSuccessCallback, QrCodeErrorCallback } from 'html5-qrcode';

interface CameraViewProps {
  isScanning: boolean;
  onScanSuccess: (decodedText: string) => void;
  onScanFailure: (errorMessage: string) => void;
  onScanStop: () => void;
  onLog?: (msg: string) => void; // 親にログを渡すためのプロップ
}

const qrcodeRegionId = "html5qr-code-full-region";

const CameraView = ({ isScanning, onScanSuccess, onScanFailure, onScanStop, onLog }: CameraViewProps) => {
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = useRef(false);

  const internalLog = (msg: string) => {
    console.log(`[CameraView] ${msg}`);
    if (onLog) onLog(msg);
  };

  useEffect(() => {
    internalLog(`Component Mount / Prop Change: isScanning=${isScanning}`);
    
    // セキュリティチェック
    if (typeof window !== 'undefined') {
        const isSecure = window.isSecureContext;
        internalLog(`Secure Context (HTTPS/Localhost): ${isSecure ? 'YES' : 'NO'}`);
        if (!isSecure) {
            internalLog("Error: Camera requires HTTPS or localhost.");
        }
    }

    const initScanner = () => {
        if (!html5QrcodeRef.current) {
            internalLog("Initializing Html5Qrcode instance...");
            try {
                html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
                internalLog("Scanner instance ready.");
            } catch (e) {
                internalLog(`Instance Init Failed: ${e}`);
            }
        }
    };

    const successCallback: QrCodeSuccessCallback = (decodedText) => {
      internalLog(`SUCCESS: Found ISBN ${decodedText}`);
      onScanSuccess(decodedText);
    };

    const errorCallback: QrCodeErrorCallback = (errorMessage) => {
      // 走査中の微細なエラーは親に流さない（ログが埋まるため）
    };

    const startScanning = async () => {
      initScanner();
      const html5Qrcode = html5QrcodeRef.current;
      if (!html5Qrcode) return;

      if (isTransitioningRef.current) return;
      
      internalLog("Requesting Camera Stream...");
      isTransitioningRef.current = true;
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            formatsToSupport: [10 /* EAN_13 */],
          },
          successCallback,
          errorCallback
        );
        internalLog("Sensor Online (Camera streaming started)");
      } catch (err) {
        internalLog(`Camera Start Error: ${err}`);
        onScanFailure(err instanceof Error ? err.message : String(err));
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const stopScanning = async () => {
      const html5Qrcode = html5QrcodeRef.current;
      if (!html5Qrcode || !html5Qrcode.isScanning || isTransitioningRef.current) return;

      internalLog("Stopping Sensor...");
      isTransitioningRef.current = true;
      try {
        await html5Qrcode.stop();
        internalLog("Sensor Offline.");
        onScanStop();
      } catch (err) {
        internalLog(`Stop Failed: ${err}`);
      } finally {
        isTransitioningRef.current = false;
      }
    };

    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      if (html5QrcodeRef.current?.isScanning) {
        internalLog("Unmount Cleanup...");
        html5QrcodeRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning, onScanSuccess, onScanFailure, onScanStop]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
        <div id={qrcodeRegionId} className="w-full max-w-md aspect-square sm:aspect-video rounded-lg overflow-hidden border border-white/5" />
    </div>
  );
};

export default CameraView;
