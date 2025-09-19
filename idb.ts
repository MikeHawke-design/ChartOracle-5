
// A simple key-value store using IndexedDB, inspired by idb-keyval.
// This avoids adding a new dependency to the import map.

const DB_NAME = 'chart-oracle-db';
const STORE_NAME = 'image-store';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
  });
}

function withStore(type: IDBTransactionMode, callback: (store: IDBObjectStore) => void): Promise<void> {
  return getDB().then(db => new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, type);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    callback(transaction.objectStore(STORE_NAME));
  }));
}

export function getItem<T>(key: IDBValidKey): Promise<T | undefined> {
  let req: IDBRequest;
  return withStore('readonly', store => {
    req = store.get(key);
  }).then(() => req.result);
}

export function setItem(key: IDBValidKey, value: any): Promise<void> {
  return withStore('readwrite', store => {
    store.put(value, key);
  });
}

export function deleteItem(key: IDBValidKey): Promise<void> {
  return withStore('readwrite', store => {
    store.delete(key);
  });
}

export function clearStore(): Promise<void> {
    return withStore('readwrite', store => {
        store.clear();
    });
}

export function getAllEntries(): Promise<[IDBValidKey, any][]> {
  return getDB().then(db => new Promise<[IDBValidKey, any][]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    const entries: [IDBValidKey, any][] = [];

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        entries.push([cursor.key, cursor.value]);
        cursor.continue();
      } else {
        resolve(entries);
      }
    };
  }));
}

// --- App-specific helpers ---

/**
 * Stores an image's base64 data in IndexedDB.
 * @param base64Data The full base64 string of the image.
 * @returns A unique key for the stored image.
 */
export async function storeImage(base64Data: string): Promise<string> {
  const key = `img_${Date.now()}_${Math.random()}`;
  await setItem(key, base64Data);
  return key;
}

/**
 * Retrieves an image's base64 data from IndexedDB.
 * @param key The key of the image to retrieve.
 * @returns The base64 data string, or undefined if not found.
 */
export async function getImage(key: string): Promise<string | undefined> {
  return getItem<string>(key);
}

/**
 * Deletes an image from IndexedDB.
 * @param key The key of the image to delete.
 */
export async function deleteImage(key: string): Promise<void> {
  return deleteItem(key);
}