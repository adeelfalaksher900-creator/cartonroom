import { blankState, validateState } from './engine.mjs';

const DB = 'gathershelf-workspace-v1', STORE = 'workspace', KEY = 'primary';
let opened;
export function openStore() {
  if (opened) return opened;
  const attempt = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    let failed = false;
    const fail = message => { failed = true; reject(Error(message)); };
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      const db = request.result;
      if (failed) { db.close(); return; }
      db.onversionchange = () => { db.close(); opened = null; };
      db.onclose = () => { opened = null; };
      resolve(db);
    };
    request.onerror = () => fail('Could not open local storage. Check browser permissions and try again.');
    request.onblocked = () => fail('Storage is blocked by another browser tab. Close it and try again.');
  });
  opened = attempt.catch(error => { opened = null; throw error; });
  return opened;
}
export async function readState() {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      try { resolve(validateState(request.result || blankState())); }
      catch (error) { reject(error); }
    };
    request.onerror = () => reject(Error('Could not read this workspace.'));
  });
}
export async function updateState(expected, change) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE);
    const request = store.get(KEY);
    let next, failure;
    request.onsuccess = () => {
      try {
        const current = validateState(request.result || blankState());
        if (current.revision !== expected) throw Error('This workspace changed in another tab. Close this form and review the latest information.');
        next = change(structuredClone(current));
        if (next.revision === current.revision) next.revision++;
        if (next.revision !== current.revision + 1) throw Error('Invalid workspace revision.');
        validateState(next); store.put(next, KEY);
      } catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = () => reject(failure || Error('Changes could not be saved. Your previous data is intact.'));
    tx.onerror = () => {};
  });
}
