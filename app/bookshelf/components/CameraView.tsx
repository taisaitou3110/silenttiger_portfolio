// app/bookshelf/components/CameraView.tsx
"use client";

import { useEffect, useRef } from 'react';
import { Html5Qrcode, QrCodeSuccessCallback, QrCodeErrorCallback } from 'html5-qrcode';

interface CameraViewProps {
  isScanning: boolean;
  onScanSuccess: (decodedText: string) => void;
  onScanFailure: (errorMessage: string) => void;
  onScanStop: () => void;
}

const qrcodeRegionId = "html5qr-code-full-region";

const CameraView = ({ isScanning, onScanSuccess, onScanFailure, onScanStop }: CameraViewProps) => {
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (!html5QrcodeRef.current) {
      html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
    }
    const html5Qrcode = html5QrcodeRef.current;

    const successCallback: QrCodeSuccessCallback = (decodedText) => {
      onScanSuccess(decodedText);
    };

    const errorCallback: QrCodeErrorCallback = (errorMessage) => {
      onScanFailure(errorMessage);
    };

    const startScanning = async () => {
      if (isTransitioningRef.current) return;
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
      } catch (err) {
        onScanFailure(err instanceof Error ? err.message : String(err));
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const stopScanning = async () => {
      if (isTransitioningRef.current) return;
      if (!html5Qrcode.isScanning) return;

      isTransitioningRef.current = true;
      try {
        await html5Qrcode.stop();
        onScanStop();
      } catch (err) {
        console.error("Failed to stop scanning.", err);
      } finally {
        isTransitioningRef.current = false;
      }
    };

    if (isScanning) {
      if (!html5Qrcode.isScanning) {
        startScanning();
      }
    } else {
      if (html5Qrcode.isScanning) {
        stopScanning();
      }
    }

    return () => {
      // Cleanup on unmount
      if (html5Qrcode && html5Qrcode.isScanning) {
        // We can't await here easily, but we can try to stop it
        if (!isTransitioningRef.current) {
            isTransitioningRef.current = true;
            html5Qrcode.stop()
                .catch(err => console.error("Failed to stop scanning on unmount.", err))
                .finally(() => { isTransitioningRef.current = false; });
        }
      }
    };
  }, [isScanning, onScanSuccess, onScanFailure, onScanStop]);

  return <div id={qrcodeRegionId} style={{ minHeight: '300px' }} />;
};

export default CameraView;
