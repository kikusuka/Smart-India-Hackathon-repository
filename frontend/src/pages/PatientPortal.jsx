import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import MedicalTimeline from '../components/MedicalTimeline';

export default function PatientPortal() {
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatientDetails = async (qrId) => {
    setLoading(true);
    setError(null);
    setPatientId(qrId);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/patient/${qrId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve patient (Status: ${response.status})`);
      }
      
      const data = await response.json();
      setPatientData(data);
    } catch (err) {
      console.error('Fetch patient error:', err);
      setError(err.message || 'Error fetching patient information.');
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatientId(null);
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
          Scan QR code to access electronic health records and history
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {!patientId ? (
          <QRScanner onScanSuccess={fetchPatientDetails} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm font-semibold text-gray-600">
                Viewing Record: <span className="font-mono text-gray-900">{patientId}</span>
              </span>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition"
              >
                Scan Another Code
              </button>
            </div>

            {loading && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 font-medium">Fetching patient medical records...</p>
              </div>
            )}

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

            {!loading && !error && patientData && (
              <MedicalTimeline patientData={patientData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
