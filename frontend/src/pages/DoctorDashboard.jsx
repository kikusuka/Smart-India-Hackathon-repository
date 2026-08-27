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
    <div className="py-2 px-2 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white font-casual tracking-tight mb-3 transition-colors">
          Doctor Diagnosis Portal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
          Record patient symptoms, generate offline-first QR histories, and synchronize data seamlessly.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <DiagnosisForm isOnline={isOnline} />
      </div>
    </div>
  );
}
