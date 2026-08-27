import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import MedicalTimeline from '../components/MedicalTimeline';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
          Patient Portal
        </h1>
        <p className="text-lg text-gray-600">
          Scan QR code to access your health records and history
        </p>
        
        {/* Privacy by Design Notice */}
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="flex-shrink-0 mt-0.5 h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-left">
              <p className="font-semibold text-emerald-800">Privacy by Design</p>
              <p className="text-sm mt-1">
                Doctors can only see your history if you share your QR code. Nothing is stored on any server.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {!patientData ? (
          <QRScanner onScanSuccess={handleScanSuccess} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm font-semibold text-gray-600">
                Viewing Record: <span className="font-mono text-gray-900">{patientData.patient_qr_id}</span>
              </span>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition"
              >
                Scan Another Code
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center shadow-sm">
                <h3 className="text-lg font-bold mb-2">Error Loading Record</h3>
                <p className="mb-4 text-sm">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm transition"
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