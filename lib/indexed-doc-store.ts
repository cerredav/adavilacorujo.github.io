const DB_NAME = 'receipt-documents-db';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

export type IndexedDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveDocument(doc: IndexedDocument): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getDocument(id: string): Promise<IndexedDocument | undefined> {
  const db = await openDb();
  const result = await new Promise<IndexedDocument | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as IndexedDocument | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export function trackUploadedDocument(id: string) {
  const key = 'uploaded-documents';
  const current = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  if (!current.includes(id)) {
    localStorage.setItem(key, JSON.stringify([id, ...current]));
  }
}
