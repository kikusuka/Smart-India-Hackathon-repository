import { openDB } from 'idb';

const DB_NAME = 'rural-health-follow-ups';
const DB_VERSION = 1;
const STORE_NAME = 'follow_ups';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'local_id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveFollowUp(followUp) {
  const record = {
    local_id: followUp.local_id || globalThis.crypto?.randomUUID?.() || `follow-up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    follow_up_date: followUp.follow_up_date,
    follow_up_type: followUp.follow_up_type,
    patient_qr_id: followUp.patient_qr_id || null,
    created_at: new Date().toISOString(),
  };
  await (await getDB()).put(STORE_NAME, record);
  window.dispatchEvent(new CustomEvent('rhp-follow-up-saved'));
  return record;
}

export async function getFollowUps() {
  const records = await (await getDB()).getAll(STORE_NAME);
  return records.sort((left, right) => left.follow_up_date.localeCompare(right.follow_up_date));
}

export default { saveFollowUp, getFollowUps };
