import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, readState } from '../storage.mjs';

test('a storage opening failure does not poison later retries', async t => {
  const original = globalThis.indexedDB;
  let attempts = 0, closed = 0;
  const db = { close() { closed++; } };
  t.after(() => { db.onversionchange?.(); globalThis.indexedDB = original; });
  globalThis.indexedDB = { open() {
    const request = { result: db };
    attempts++;
    queueMicrotask(() => attempts < 3 ? request.onerror() : request.onsuccess());
    return request;
  } };
  await assert.rejects(openStore(), /Could not open local storage/);
  await assert.rejects(openStore(), /Could not open local storage/);
  assert.equal(await openStore(), db);
  assert.equal(attempts, 3);
  db.onversionchange();
  assert.equal(closed, 1);
});

test('an aborted storage read rejects instead of leaving the workspace loading forever', async t => {
  const original = globalThis.indexedDB;
  const db = {
    close() {},
    transaction() {
      const tx = { objectStore: () => ({ get() {
        queueMicrotask(() => tx.onabort());
        return {};
      } }) };
      return tx;
    }
  };
  t.after(() => { db.onversionchange?.(); globalThis.indexedDB = original; });
  globalThis.indexedDB = { open() {
    const request = { result: db };
    queueMicrotask(() => request.onsuccess());
    return request;
  } };
  await assert.rejects(readState(), /Could not read this workspace/);
});
