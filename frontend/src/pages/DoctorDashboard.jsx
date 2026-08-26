import React, { useState, useEffect } from 'react';
import DiagnosisForm from '../components/DiagnosisForm';

export default function DoctorDashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
          Rural Health Platform
        </h1>
        <p className="text-lg text-gray-600">
          Doctor Diagnosis Portal & Sync Center
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <DiagnosisForm isOnline={isOnline} />
      </div>
    </div>
  );
}
