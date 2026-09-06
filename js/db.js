const DB_NAME = 'bishi-app';
const DB_VERSION = 1;
const STORE_NAME = 'bishis';

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
  });
}

async function saveBishi(bishi) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(bishi);
    request.onsuccess = () => resolve(bishi);
    request.onerror = () => reject(request.error);
  });
}

async function getBishi(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function getActiveBishi() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const bishis = request.result || [];
      resolve(bishis.length > 0 ? bishis[0] : null);
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteAllBishis() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function generateId() {
  return 'bishi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function generateMemberId() {
  return 'member_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}
