import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Read initial value
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  // Write new value to storage and dispatch event
  const updateValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      setValue((current) => {
        const computed = newValue instanceof Function ? newValue(current) : newValue;
        try {
          // Decouple side effects from the current React update cycle
          setTimeout(() => {
            window.localStorage.setItem(key, JSON.stringify(computed));
            window.dispatchEvent(
              new CustomEvent("local-storage-sync", { detail: { key, value: computed } }),
            );
          }, 0);
        } catch {
          /* ignore */
        }
        return computed;
      });
    },
    [key],
  );

  // Listen to sync events from other hook instances or other tabs
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.key === key) {
        setValue(customEvent.detail.value as T);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("local-storage-sync", handleSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("local-storage-sync", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [key]);

  const reset = useCallback(() => updateValue(initial), [initial, updateValue]);

  return { value, setValue: updateValue, hydrated, reset };
}
