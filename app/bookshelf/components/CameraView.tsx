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

  useEffect(() => {
    if (!html5QrcodeRef.current) {
      // verbose: false をコンストラクタの第二引数に渡す
      html5QrcodeRef.current = new Html5Qrcode(qrcodeRegionId, false);
    }
    const html5Qrcode = html5QrcodeRef.current;

    const successCallback: QrCodeSuccessCallback = (decodedText, _result) => {
      onScanSuccess(decodedText);
    };

    const errorCallback: QrCodeErrorCallback = (errorMessage) => {
      onScanFailure(errorMessage);
    };

    if (isScanning) {
      html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [10 /* EAN_13 */],
        },
        successCallback,
        errorCallback
      ).catch(err => {
        onScanFailure(err.toString());
      });
    } else {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().then(() => {
          onScanStop();
        }).catch(err => {
          console.error("Failed to stop scanning.", err);
        });
      }
    }

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(err => {
            console.error("Failed to stop scanning on unmount.", err);
        });
      }
    };
  }, [isScanning, onScanSuccess, onScanFailure, onScanStop]);

  // カメラ映像が表示される<video>要素のために、コンテナに最小の高さを設定
  return <div id={qrcodeRegionId} style={{ minHeight: '300px' }} />;
};

export default CameraView;
