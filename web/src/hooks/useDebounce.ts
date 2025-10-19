import { useState, useEffect } from 'react';

/**
 * Hook yang menunda pembaruan nilai (value) sampai waktu tunda (delay) berlalu.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timer untuk memperbarui debouncedValue setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Batalkan timer jika value berubah sebelum delay selesai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); 

  return debouncedValue;
}