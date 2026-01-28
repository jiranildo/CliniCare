import { useState, useEffect } from 'react';

/**
 * Custom hook to manage state synchronized with localStorage.
 * 
 * @param {string} key - The localStorage key to use.
 * @param {any} defaultValue - The default value if no value is found in storage.
 * @returns {[any, Function]} - The current value and a setter function.
 */
export function useViewPreference(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved !== null ? saved : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
}
