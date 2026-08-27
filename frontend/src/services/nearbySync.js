import { openDB } from 'idb';

const DB_NAME = 'rural-health-nearby';
const DB_VERSION = 1;
const STORE_NAME = 'aggregate_counts';

export const NEARBY_DIAGNOSIS_CATEGORIES = ['fever', 'cough', 'injury', 'rash', 'diarrhea', 'other'];

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'record_id' });
        }
      },
    });
  }
  return dbPromise;
}

function normalizeRecord(record, source = 'relayed') {
  const region = String(record?.region || '').trim();
  const diagnosisCategory = String(record?.diagnosis_category || '').trim().toLowerCase();
  const dateBucket = String(record?.date_bucket || '').trim();
  const count = Number(record?.count);

  if (!region || !NEARBY_DIAGNOSIS_CATEGORIES.includes(diagnosisCategory) || !dateBucket || !Number.isFinite(count) || count < 0) {
    return null;
  }

  const recordId = `${region}|${diagnosisCategory}|${dateBucket}`;
  return {
    record_id: recordId,
    region,
    diagnosis_category: diagnosisCategory,
    date_bucket: dateBucket,
    count: Math.floor(count),
    source,
    hop_count: Math.max(0, Math.floor(Number(record?.hop_count) || 0)),
  };
}

export function createAggregateRecord({ region, diagnosis_category, date_bucket, count }) {
  return normalizeRecord({ region, diagnosis_category, date_bucket, count }, 'local');
}

export function mergeAggregateRecords(localRecords = [], incomingRecords = []) {
  const merged = new Map();

  localRecords.forEach((record) => {
    const normalized = normalizeRecord(record, record?.source === 'local' ? 'local' : 'relayed');
    if (normalized) merged.set(normalized.record_id, normalized);
  });

  incomingRecords.forEach((record) => {
    const relayed = normalizeRecord(record, 'relayed');
    if (!relayed) return;
    relayed.hop_count += 1;

    const existing = merged.get(relayed.record_id);
    if (!existing || relayed.count > existing.count) {
      merged.set(relayed.record_id, relayed);
    }
  });

  return [...merged.values()].sort((left, right) => left.record_id.localeCompare(right.record_id));
}

export async function getAggregateRecords() {
  return (await getDB()).getAll(STORE_NAME);
}

async function saveAggregateRecords(records) {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(records.map((record) => transaction.store.put(record)));
  await transaction.done;
}

export async function mergeNearbyPeerData(incomingRecords) {
  const localRecords = await getAggregateRecords();
  const records = mergeAggregateRecords(localRecords, incomingRecords);
  await saveAggregateRecords(records);

  const localById = new Map(localRecords.map((record) => [record.record_id, record]));
  const changedRecords = records.filter((record) => {
    const previous = localById.get(record.record_id);
    return !previous || previous.count !== record.count || previous.hop_count !== record.hop_count;
  });

  return { records, changedRecords };
}

export function getTodayBucket() {
  return new Date().toISOString().slice(0, 10);
}

// The repository has no Capacitor Nearby Connections bridge yet; this deterministic peer keeps demos and tests reliable offline.
export async function simulateNearbyPeer() {
  return {
    device_name: 'Nearby clinic handset (simulated)',
    records: [
      { region: 'North District', diagnosis_category: 'fever', date_bucket: getTodayBucket(), count: 7, source: 'local', hop_count: 0 },
      { region: 'North District', diagnosis_category: 'cough', date_bucket: getTodayBucket(), count: 12, source: 'local', hop_count: 0 },
      { region: 'South District', diagnosis_category: 'diarrhea', date_bucket: getTodayBucket(), count: 6, source: 'relayed', hop_count: 2 },
      { region: 'East District', diagnosis_category: 'rash', date_bucket: getTodayBucket(), count: 3, source: 'local', hop_count: 0 },
    ],
  };
}

export default { createAggregateRecord, getAggregateRecords, mergeAggregateRecords, mergeNearbyPeerData, simulateNearbyPeer };
