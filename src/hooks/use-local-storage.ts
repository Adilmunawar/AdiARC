
import { useState, useEffect } from 'react';

// A custom hook to use localStorage that is SSR-safe
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value. Initialize with initialValue to prevent hydration mismatch.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // useEffect to update local storage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Save state to local storage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(error);
    }
  }, [key, storedValue]);

  // useEffect to load the value from localStorage after the initial render (client-side only)
  useEffect(() => {
    // This effect runs only on the client, after hydration.
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const item = window.localStorage.getItem(key);
        // Ensure item is not null, undefined, or an empty string before parsing.
        if (item) {
            setStoredValue(JSON.parse(item));
        }
    } catch (error) {
        console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only run this on mount

  return [storedValue, setStoredValue] as const;
}
