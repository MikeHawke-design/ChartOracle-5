import { useState, useEffect } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

// Helper function to load from storage, with error handling and default merging.
const loadFromStorage = <T,>(key: string, defaultValue: T, storage: Storage): T => {
    try {
        const savedValue = storage.getItem(key);
        if (savedValue === null) { // Explicitly check for null in case an empty string is stored
            return defaultValue;
        }

        const parsedValue = JSON.parse(savedValue);

        // If default value is an array, ensure the loaded value is also an array.
        if (Array.isArray(defaultValue)) {
            if (Array.isArray(parsedValue)) {
                return parsedValue as T;
            }
            console.warn(`Invalid type for key '${key}' in storage. Expected array, got ${typeof parsedValue}. Reverting to default.`);
            return defaultValue;
        }

        // If the default value is a non-array object, merge it with the parsed value.
        // This ensures new settings fields are added without overwriting user's existing ones.
        if (typeof defaultValue === 'object' && defaultValue !== null && typeof parsedValue === 'object' && parsedValue !== null) {
            return { ...defaultValue, ...parsedValue };
        }
        
        return parsedValue as T;

    } catch (error) {
        console.error(`Failed to load '${key}' from storage`, error);
        // On any error (e.g., JSON parsing), return the default to prevent app crash.
        return defaultValue;
    }
};


/**
 * A custom React hook that syncs state with web storage.
 * It can use either localStorage or sessionStorage.
 * @param key The key to use in storage.
 * @param defaultValue The default value if nothing is in storage or if loading fails.
 * @param storageType The type of storage to use ('localStorage' or 'sessionStorage'). Defaults to 'localStorage'.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorage<T>(key: string, defaultValue: T, storageType: StorageType = 'localStorage'): [T, React.Dispatch<React.SetStateAction<T>>] {
    const getStorage = (): Storage => storageType === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    
    const [value, setValue] = useState<T>(() => {
        return loadFromStorage(key, defaultValue, getStorage());
    });

    // This effect runs whenever the state value changes, saving it to storage.
    useEffect(() => {
        try {
            getStorage().setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save '${key}' to ${storageType}`, error);
        }
    }, [key, value, storageType]);

    return [value, setValue];
}

export default useLocalStorage;
