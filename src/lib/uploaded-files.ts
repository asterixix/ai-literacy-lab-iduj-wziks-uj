/**
 * Local browser cache for uploaded files.
 * Keeps a copy of the original File so OCR can use the real payload later.
 */

const DB_NAME = "eden-playground-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface StoredFileRecord {
  file: File;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => void): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let settled = false;

    tx.oncomplete = () => {
      if (!settled) {
        settled = true;
        resolve(undefined as T);
      }
      db.close();
    };
    tx.onerror = () => {
      if (!settled) {
        settled = true;
        reject(tx.error ?? new Error("IndexedDB transaction failed"));
      }
      db.close();
    };
    tx.onabort = () => {
      if (!settled) {
        settled = true;
        reject(tx.error ?? new Error("IndexedDB transaction aborted"));
      }
      db.close();
    };

    try {
      handler(store);
    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
      db.close();
    }
  });
}

export async function saveUploadedFile(fileId: string, file: File): Promise<void> {
  await withStore<void>("readwrite", (store) => {
    store.put({ file } satisfies StoredFileRecord, fileId);
  });
}

export async function getUploadedFile(fileId: string): Promise<File | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(fileId);

    request.onsuccess = () => {
      const record = request.result as StoredFileRecord | undefined;
      resolve(record?.file ?? null);
      db.close();
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB read failed"));
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
      db.close();
    };
  });
}

export async function deleteUploadedFile(fileId: string): Promise<void> {
  await withStore<void>("readwrite", (store) => {
    store.delete(fileId);
  });
}
