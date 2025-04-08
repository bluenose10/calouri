
import { useState, useEffect } from 'react';

interface CapacitorStatus {
  isCapacitor: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function useCapacitor(): CapacitorStatus {
  const [status, setStatus] = useState<CapacitorStatus>({
    isCapacitor: false,
    isIOS: false,
    isAndroid: false
  });

  useEffect(() => {
    // Check if app is running in Capacitor
    const isCapacitor = window.Capacitor?.isNativePlatform?.() || false;
    
    // Check platform if in Capacitor
    let isIOS = false;
    let isAndroid = false;
    
    if (isCapacitor) {
      const platform = window.Capacitor?.getPlatform?.();
      isIOS = platform === 'ios';
      isAndroid = platform === 'android';
    }
    
    setStatus({
      isCapacitor,
      isIOS,
      isAndroid
    });
  }, []);

  return status;
}
