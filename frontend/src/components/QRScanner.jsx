import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url';
import { decodeQRToHistory } from '../services/localHistory';

QrScanner.WORKER_PATH = QrScannerWorkerPath;

export default function QRScanner({ onScanSuccess }) {
  const videoRef = useRef(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualData, setManualData] = useState('');
  const qrScannerRef = useRef(null);

  const startScanner = async () => {
    if (qrScannerRef.current) return;
    setCameraError(null);
    setScannerActive(true);
    
    setTimeout(async () => {
      if (!videoRef.current) return;
      try {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            const qrData = typeof result === 'object' ? result.data : result;
            console.info('QR scanner detected a code', {
              length: qrData?.length || 0,
              preview: qrData?.slice(0, 32),
            });
            if (qrData) {
              try {
                const historyArray = decodeQRToHistory(qrData);
                onScanSuccess(historyArray);
                stopScanner();
              } catch (err) {
                console.error('QR decode error:', err);
                setCameraError(`Invalid QR code: ${err.message}`);
              }
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          }
        );
        
        qrScannerRef.current = qrScanner;
        await qrScanner.start();
        console.info('QR scanner started and is scanning video frames');
      } catch (err) {
        console.error('QR Scanner init error:', err);
        setCameraError(err.message || 'Could not access camera. Please check permissions.');
        setScannerActive(false);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualData.trim()) {
      try {
        const historyArray = decodeQRToHistory(manualData.trim());
        onScanSuccess(historyArray);
      } catch (err) {
        setCameraError(`Invalid QR data: ${err.message}`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Scan Patient QR Code</h3>
      
      {cameraError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
          {cameraError}
        </div>
      )}

      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center border border-gray-300">
        {scannerActive ? (
          <video ref={videoRef} className="w-full h-full object-cover"></video>
        ) : (
          <div className="text-center p-4">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
            <p className="text-sm text-gray-500">Camera is off</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center mb-6">
        {!scannerActive ? (
          <button
            onClick={startScanner}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow transition"
          >
            Start Camera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded shadow transition"
          >
            Stop Scanner
          </button>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Or paste QR data string manually (fallback)
          </label>
          <div className="flex flex-col gap-2">
            <textarea
              placeholder="Paste the QR code data string here..."
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px] resize-y"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-sm shadow transition"
            >
              Decode & View History
            </button>
          </div>
          <p className="text-xs text-gray-400 italic">
            Manual UUID/ID entry no longer works in offline mode — QR data is self-contained.
          </p>
        </form>
      </div>
    </div>
  );
}
