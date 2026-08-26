import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveDiagnosisOffline,
  getPendingDiagnoses,
  getPendingDiagnosesForBatch,
  clearPendingDiagnoses,
  getPendingCount,
} from '../services/offlineSync';
import { postSyncBatch } from '../services/api';

export default function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [error, setError] = useState(null);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (err) {
      setError(err.message || 'Failed to count pending records');
    }
  }, []);

  const runSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setError(null);

    try {
      const batch = await getPendingDiagnosesForBatch();
      if (batch.length === 0) {
        setLastSyncResult({ success: true, synced_count: 0, failed_count: 0, skipped: true });
        return;
      }

      const result = await postSyncBatch(batch);

      if (result && result.success) {
        const syncedIds = batch.slice(0, result.synced_count || batch.length).map((r) => r.id);
        if (syncedIds.length > 0) {
          await clearPendingDiagnoses(syncedIds);
        }
        setLastSyncResult(result);
      } else {
        throw new Error(result?.error || 'Sync failed on server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sync');
      setLastSyncResult({ success: false, error: err.message });
    } finally {
      await refreshPendingCount();
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [refreshPendingCount]);

  const saveOffline = useCallback(
    async (diagnosisData) => {
      try {
        const saved = await saveDiagnosisOffline(diagnosisData);
        await refreshPendingCount();
        return saved;
      } catch (err) {
        setError(err.message || 'Failed to save diagnosis offline');
        throw err;
      }
    },
    [refreshPendingCount]
  );

  const loadPending = useCallback(async () => {
    try {
      const records = await getPendingDiagnoses();
      await refreshPendingCount();
      return records;
    } catch (err) {
      setError(err.message || 'Failed to load pending records');
      return [];
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runSync]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing && !syncingRef.current) {
      runSync();
    }
  }, [isOnline, pendingCount, isSyncing, runSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    error,
    saveOffline,
    loadPending,
    runSync,
    refreshPendingCount,
  };
}
