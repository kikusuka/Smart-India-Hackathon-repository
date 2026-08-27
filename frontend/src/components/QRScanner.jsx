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
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 max-w-lg mx-auto transition-colors duration-300">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full mb-4">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a8 8 0 11-16 0 8 8 0 0116 0z"></path></svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white text-center font-casual">Scan Patient QR</h3>
      </div>
      
      {cameraError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span>{cameraError}</span>
        </div>
      )}

      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-6 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 transition-colors">
        {scannerActive ? (
          <video ref={videoRef} className="w-full h-full object-cover"></video>
        ) : (
          <div className="text-center p-6 flex flex-col items-center">
            <svg className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Camera is off</p>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-8">
        {!scannerActive ? (
          <button
            onClick={startScanner}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
            Start Camera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-3.5 px-6 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            Stop Scanner
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Or paste QR data string manually
          </label>
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Paste the raw QR code text here..."
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-sm min-h-[80px] resize-y font-mono"
            />
            <button
              type="submit"
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg shadow transition-all"
            >
              Decode & View History
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic text-center">
            Manual UUID/ID entry no longer works in offline mode — QR data is self-contained.
          </p>
        </form>
      </div>
    </div>
  );
}
