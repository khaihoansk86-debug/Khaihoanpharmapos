/**
 * Khai Hoan Pharma POS - IndexedDB Service
 * Provides Promise-based wrapper for IndexedDB for offline data caching.
 */

const DB_NAME = 'PharmaPOS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'cache_store';

function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("Your browser doesn't support IndexedDB."));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB Error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function idbSet(key, value) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.warn("Failed to set in IndexedDB, falling back to localStorage", error);
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch(e) {
            console.error("LocalStorage fallback also failed", e);
            return false;
        }
    }
}

export async function idbGet(key) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.warn("Failed to get from IndexedDB, falling back to localStorage", error);
        try {
            const lsValue = localStorage.getItem(key);
            return lsValue ? JSON.parse(lsValue) : undefined;
        } catch(e) {
            return undefined;
        }
    }
}

export async function idbDelete(key) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        localStorage.removeItem(key);
        return true;
    }
}
