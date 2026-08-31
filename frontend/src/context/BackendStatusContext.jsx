import { createContext, useContext, useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/backendStatus';

const BackendStatusContext = createContext('connecting');

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

export function BackendStatusProvider({ children }) {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    let retryDelay = 1000;

    const check = async () => {
      if (cancelled) return;
      try {
        await checkBackendHealth();
        if (!cancelled) setStatus('connected');
      } catch (error) {
        if (cancelled) return;
        console.warn('Backend health check failed; offline features remain available:', error.message);
        setStatus('offline');
        retryTimer = window.setTimeout(check, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    };

    // This runs in the background so QR scanning and local records never wait for the backend.
    check();
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, []);

  return <BackendStatusContext.Provider value={status}>{children}</BackendStatusContext.Provider>;
}

