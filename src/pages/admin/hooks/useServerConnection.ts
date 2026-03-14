// hooks/useServerConnection.ts
import { useState } from "react";

type ConnectionStatus = 'idle' | 'loading' | 'success' | 'error';

export const useServerConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

  const testConnection = async (serverAdresse: string) => {
    if (!serverAdresse) return;
    setConnectionStatus('loading');
    try {
      const res = await fetch(`http://${serverAdresse}/ping`, {
        signal: AbortSignal.timeout(5000),
      });
      setConnectionStatus(res.ok ? 'success' : 'error');
    } catch {
      setConnectionStatus('error');
    }
  };

  return { connectionStatus, testConnection };
};