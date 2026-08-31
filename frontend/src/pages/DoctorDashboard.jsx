import React, { useState, useEffect, useRef } from 'react';
import DiagnosisForm from '../components/DiagnosisForm';
import { useAuth } from '../context/AuthContext';
import InfoTooltip from '../components/InfoTooltip';
import UpcomingFollowUps from '../components/UpcomingFollowUps';
import { listTrackedPatientQrIds, syncPatientDelta } from '../services/patientSync';

export default function DoctorDashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('offline');
  const syncStatusTimeoutRef = useRef(null);
  const { doctorId, doctorName, stats, loading: statsLoading, refetchStats, isAuthenticated } = useAuth();

  useEffect(() => {
    const triggerOpportunisticSync = async () => {
      if (!isAuthenticated) return;
      const trackedPatients = await listTrackedPatientQrIds();
      await Promise.all(trackedPatients.map((patientQrId) => syncPatientDelta(patientQrId, [])));
    };

    const clearSyncTimer = () => {
      if (syncStatusTimeoutRef.current) {
        clearTimeout(syncStatusTimeoutRef.current);
        syncStatusTimeoutRef.current = null;
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      try {
        await triggerOpportunisticSync();
      } catch (error) {
        console.error('Opportunistic sync failed:', error);
      }
      clearSyncTimer();
      syncStatusTimeoutRef.current = setTimeout(() => {
        setSyncStatus('synced');
        syncStatusTimeoutRef.current = null;
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      clearSyncTimer();
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearSyncTimer();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  const accuracyDisplay = stats?.accuracy_score !== null && stats?.accuracy_score !== undefined
    ? `${Math.round(stats.accuracy_score * 100)}%`
    : 'Not yet rated';

  return (
    <div className="py-2 px-2 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white font-casual tracking-tight mb-3 transition-colors">
          Doctor Diagnosis Portal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
          Record patient symptoms, generate offline-first QR histories, and synchronize data seamlessly.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {syncStatus === 'syncing' ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span>Syncing...</span>
            </>
          ) : syncStatus === 'synced' ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span>Synced ✓</span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 p-5 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{doctorName || doctorId}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600 min-w-[140px] text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Diagnoses</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{stats?.total_diagnoses || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600 min-w-[140px] text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">Confirmation Rate <InfoTooltip label="Explain confirmation rate">Confirmation Rate reflects how often other doctors have confirmed your diagnoses as accurate. This helps track diagnostic reliability over time.</InfoTooltip></p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{accuracyDisplay}</p>
                </div>
                {statsLoading && (
                  <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                )}
                <button
                  onClick={refetchStats}
                  disabled={statsLoading}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <DiagnosisForm isOnline={isOnline} />
      </div>
      <UpcomingFollowUps />
    </div>
  );
}
