import { useState, useEffect, useCallback } from 'react';

/**
 * Professional formatTime utility
 * Converts seconds to mm:ss format (e.g., 125 -> 02:05)
 */
export const formatTime = (seconds) => {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * useCooldown Hook
 * Syncs with the existing 'cd_<key>' localStorage system.
 * 
 * @param {string} key - The cooldown ID (e.g., 'pulse_missing')
 * @param {number} durationMs - The total cooldown duration in milliseconds
 */
export function useCooldown(key, durationMs) {
  const storageKey = `cd_${key}`;

  const calculateRemaining = useCallback(() => {
    try {
      const lastTrigger = parseInt(localStorage.getItem(storageKey) || '0', 10);
      if (!lastTrigger) return 0;

      const elapsed = Date.now() - lastTrigger;
      const remainingMs = durationMs - elapsed;
      
      // Return remaining time in whole seconds
      return Math.max(0, Math.ceil(remainingMs / 1000));
    } catch (e) {
      return 0;
    }
  }, [storageKey, durationMs]);

  const [remainingTime, setRemainingTime] = useState(calculateRemaining);

  useEffect(() => {
    // Initial check on mount
    setRemainingTime(calculateRemaining());

    // Precise 1s interval for countdown
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingTime(remaining);
    }, 1000);

    // Cross-tab synchronization via storage event
    const handleStorageChange = (e) => {
      if (e.key === storageKey) {
        setRemainingTime(calculateRemaining());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [calculateRemaining, storageKey]);

  return {
    remainingTime,
    isActive: remainingTime > 0
  };
}
