import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import MedicalTimeline from '../components/MedicalTimeline';
import InfoTooltip from '../components/InfoTooltip';

export default function PatientPortal() {
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState(null);

  const handleScanSuccess = (historyArray) => {
    setError(null);
    try {
      const patient_qr_id = historyArray.length > 0 
        ? `patient_${historyArray[0].doctor_name?.replace(/\s+/g, '_') || 'record'}_${Date.now()}`
        : 'unknown_patient';
      
      setPatientData({
        patient_qr_id,
        medical_history: historyArray,
        annotations: [],
        progression_alerts: []
      });
    } catch (err) {
      console.error('Scan processing error:', err);
      setError(err.message || 'Failed to process QR code');
      setPatientData(null);
    }
  };

  const handleReset = () => {
    setPatientData(null);
    setError(null);
  };

  return (
    <div className="py-2 px-2 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white font-casual tracking-tight mb-3 transition-colors">
          Patient Portal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
          Scan QR code to access your health records and history
        </p>
        
        {/* Privacy by Design Notice */}
        <div className="mt-8 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-900 dark:text-emerald-300 shadow-sm max-w-2xl mx-auto text-left transition-colors">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 mt-0.5 h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">Privacy by Design</p>
              <p className="text-sm mt-1.5 opacity-90">
                Doctors can only see your history if you share your QR code. Nothing is stored on any central server without your consent.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {!patientData ? (
          <>
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span>Patient QR scanner</span>
              <InfoTooltip label="Explain patient QR scanner">Scan the QR code your doctor gave you to view your medical history. This works completely offline.</InfoTooltip>
            </div>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors gap-4">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Viewing Record: <span className="font-mono text-emerald-700 dark:text-emerald-400 ml-1 py-0.5 px-2 bg-emerald-50 dark:bg-slate-700 rounded-md border border-emerald-100 dark:border-slate-600">{patientData.patient_qr_id}</span>
              </span>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-bold shadow-sm transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none flex items-center gap-2 justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a8 8 0 11-16 0 8 8 0 0116 0z"></path></svg>
                Scan Another Code
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-xl text-center shadow-sm">
                <h3 className="text-lg font-bold mb-2">Error Loading Record</h3>
                <p className="mb-4 text-sm">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-medium text-sm transition shadow"
                >
                  Go Back to Scanner
                </button>
              </div>
            )}

            {patientData && (
              <MedicalTimeline patientData={patientData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
