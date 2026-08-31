import { openDB } from 'idb';
import { pullPatientDelta } from './api';

const DB_NAME = 'rural-health-platform-sync';
const DB_VERSION = 1;
const STORE_NAME = 'patient_sync_state';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'patient_qr_id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getLastSyncedSequence(patientQrId) {
  const state = await (await getDB()).get(STORE_NAME, patientQrId);
  return state?.last_synced_sequence || 0;
}

export async function setLastSyncedSequence(patientQrId, sequence) {
  await (await getDB()).put(STORE_NAME, {
    patient_qr_id: patientQrId,
    last_synced_sequence: sequence,
    updated_at: new Date().toISOString(),
  });
}

export async function listTrackedPatientQrIds() {
  return (await (await getDB()).getAllKeys(STORE_NAME)).map(String);
}

export function mergeDiagnosisDelta(localHistory, entries) {
  const existing = Array.isArray(localHistory) ? localHistory : [];
  const knownIds = new Set(existing.map((record) => record.id).filter(Boolean));
  const delta = entries
    .filter((entry) => !knownIds.has(entry.id))
    .map((entry) => ({ ...entry, diagnosis_date: entry.created_at, medicine: entry.medicine }));
  return [...delta.reverse(), ...existing];
}

export async function syncPatientDelta(patientQrId, localHistory = []) {
  const sinceSequence = await getLastSyncedSequence(patientQrId);
  const result = await pullPatientDelta(patientQrId, sinceSequence);
  const mergedHistory = mergeDiagnosisDelta(localHistory, result.entries || []);
  await setLastSyncedSequence(patientQrId, result.max_sequence_number || sinceSequence);
  return { ...result, history: mergedHistory, since_sequence: sinceSequence };
}

export default {
  getLastSyncedSequence,
  setLastSyncedSequence,
  listTrackedPatientQrIds,
  mergeDiagnosisDelta,
  syncPatientDelta,
};
