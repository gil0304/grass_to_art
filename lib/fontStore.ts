// Persist uploaded font files in IndexedDB so a custom font survives reloads
// (blob/object URLs do not). Fonts can be multi-MB (esp. Japanese), so this is
// preferable to base64-in-localStorage.

const DB_NAME = "grass-to-art";
const STORE = "fonts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFont(id: string, name: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ name, buffer }, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getFont(id: string): Promise<{ name: string; blob: Blob } | null> {
  const db = await openDb();
  const result = await new Promise<{ name: string; buffer: ArrayBuffer } | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    },
  );
  db.close();
  return result ? { name: result.name, blob: new Blob([result.buffer]) } : null;
}
