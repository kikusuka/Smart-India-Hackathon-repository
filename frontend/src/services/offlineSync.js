import { openDB } from 'idb';

const DB_NAME = 'rural-health-platform';
const DB_VERSION = 1;
const STORE_NAME = 'pending_diagnoses';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          store.createIndex('offline_created_at', 'offline_created_at');
          store.createIndex('region', 'region');
        }
      },
    });
  }
  return dbPromise;
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export async function saveDiagnosisOffline(data) {
  const db = await getDB();
  const id = data.id || generateId();
  const record = {
    id,
    doctor_name: data.doctor_name,
    diagnosis_text: data.diagnosis_text,
    diagnosis_category: data.diagnosis_category,
    treatment_text: data.treatment_text,
    medicine_prescribed: data.medicine_prescribed,
    dosage: data.dosage,
    diagnosis_date: data.diagnosis_date,
    region: data.region,
    language: data.language,
    doctor_id: data.doctor_id,
    offline_created_at: data.offline_created_at || new Date().toISOString(),
  };
  await db.put(STORE_NAME, record);
  return record;
}

export async function getPendingDiagnoses() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.sort((a, b) => {
    return new Date(a.offline_created_at) - new Date(b.offline_created_at);
  });
}

export async function getPendingDiagnosesForBatch() {
  const pending = await getPendingDiagnoses();
  return pending.map((record) => ({
    id: record.id,
    doctor_name: record.doctor_name,
    diagnosis_text: record.diagnosis_text,
    diagnosis_category: record.diagnosis_category,
    treatment_text: record.treatment_text,
    region: record.region,
    language: record.language,
    offline_created_at: record.offline_created_at,
  }));
}

export async function removePendingDiagnosis(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function clearPendingDiagnoses(ids) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([
    ...ids.map((id) => tx.store.delete(id)),
    tx.done,
  ]);
}

export async function getPendingCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}

const offlineSync = {
  saveDiagnosisOffline,
  getPendingDiagnoses,
  getPendingDiagnosesForBatch,
  removePendingDiagnosis,
  clearPendingDiagnoses,
  getPendingCount,
};

export default offlineSync;
