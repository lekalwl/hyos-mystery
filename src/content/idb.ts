/** Tiny IndexedDB wrapper: one store for the draft document, one for file blobs. */
const DB = 'grayhaven-editor';
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: 'kv' | 'blobs', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => resolve(r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const idbGet = <T>(key: string) => tx<T>('kv', 'readonly', (s) => s.get(key) as IDBRequest<T>).catch(() => undefined);
export const idbSet = (key: string, v: unknown) => tx('kv', 'readwrite', (s) => { s.put(v, key); });
export const idbDel = (key: string) => tx('kv', 'readwrite', (s) => { s.delete(key); });
export const blobGet = (id: string) => tx<Blob>('blobs', 'readonly', (s) => s.get(id) as IDBRequest<Blob>).catch(() => undefined);
export const blobSet = (id: string, b: Blob) => tx('blobs', 'readwrite', (s) => { s.put(b, id); });
export const blobDel = (id: string) => tx('blobs', 'readwrite', (s) => { s.delete(id); });
export const blobKeys = () => tx<IDBValidKey[]>('blobs', 'readonly', (s) => s.getAllKeys()).catch(() => [] as IDBValidKey[]);
