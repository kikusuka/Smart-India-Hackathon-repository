import { deflate, inflate } from 'pako';

const MAX_QR_HISTORY_RECORDS = 8;
const ENCRYPTED_QR_PREFIX = 'RHP2';
const QR_KEY_MATERIAL = 'rural-health-platform-local-qr-key-v2';
const QR_KEY_SALT = new TextEncoder().encode('rural-health-platform-qr-salt-v2');

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToUrlSafeBase64(bytes) {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function urlSafeBase64ToBytes(value) {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) base64 += '='.repeat(4 - padding);
  return base64ToBytes(base64);
}

async function getQRKey() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure Web Crypto is unavailable in this device context');
  }
  const material = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(QR_KEY_MATERIAL),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: QR_KEY_SALT, iterations: 100000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encodeHistoryToQR(historyArray) {
  if (!Array.isArray(historyArray)) {
    throw new Error('encodeHistoryToQR expects an array of diagnosis records');
  }
  
  const historyForQR = historyArray.slice(0, MAX_QR_HISTORY_RECORDS);
  if (historyForQR.length < historyArray.length) {
    console.warn(
      `QR history truncated from ${historyArray.length} to ${MAX_QR_HISTORY_RECORDS} records`
    );
  }

  const jsonString = JSON.stringify(historyForQR);
  
  const compressed = deflate(jsonString);

  const key = await getQRKey();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    compressed,
  );

  return `${ENCRYPTED_QR_PREFIX}.${bytesToUrlSafeBase64(iv)}.${bytesToUrlSafeBase64(new Uint8Array(encrypted))}`;
}

function validateHistory(historyArray) {
  if (!Array.isArray(historyArray)) {
    throw new Error('Invalid QR data: expected array of diagnosis records');
  }
  for (const record of historyArray) {
    if (!record.diagnosis_date || !record.doctor_name || !record.diagnosis_category ||
        !record.diagnosis_text || !record.treatment_text || !record.medicine) {
      throw new Error('Invalid diagnosis record: missing required fields');
    }
  }
  return historyArray;
}

function decodeLegacyQRToHistory(qrString) {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid QR data: expected non-empty string');
  }
  
  let base64 = qrString
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  let compressed;
  try {
    compressed = base64ToBytes(base64);
  } catch (e) {
    throw new Error('Invalid QR data: failed to decode base64');
  }
  
  let jsonString;
  try {
    jsonString = new TextDecoder().decode(inflate(compressed));
  } catch (e) {
    throw new Error('Invalid QR data: failed to decompress');
  }
  
  let historyArray;
  try {
    historyArray = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid QR data: failed to parse JSON');
  }
  
  return validateHistory(historyArray);
}

export async function decodeQRToHistory(qrString) {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid QR data: expected non-empty string');
  }
  if (!qrString.startsWith(`${ENCRYPTED_QR_PREFIX}.`)) {
    return decodeLegacyQRToHistory(qrString);
  }

  const [, encodedIv, encodedCiphertext] = qrString.split('.');
  if (!encodedIv || !encodedCiphertext) {
    throw new Error('Invalid encrypted QR data: malformed payload');
  }
  try {
    const compressed = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: urlSafeBase64ToBytes(encodedIv) },
      await getQRKey(),
      urlSafeBase64ToBytes(encodedCiphertext),
    );
    return validateHistory(JSON.parse(new TextDecoder().decode(inflate(new Uint8Array(compressed)))));
  } catch {
    throw new Error('Invalid encrypted QR data: could not decrypt or parse payload');
  }
}

export function createDiagnosisRecord(formData) {
  return {
    diagnosis_date: new Date().toISOString(),
    doctor_name: formData.doctor_name,
    diagnosis_category: formData.diagnosis_category,
    diagnosis_text: formData.diagnosis_text,
    treatment_text: formData.treatment_text,
    medicine: formData.medicine_prescribed,
    dosage: formData.dosage,
    follow_up_date: formData.follow_up_date || null,
    follow_up_type: formData.follow_up_type || null,
    checklist_data: formData.checklist_data || {}
  };
}

export async function generateNewQR(historyArray) {
  return encodeHistoryToQR(historyArray);
}

export function addDiagnosisToHistory(existingHistory, newDiagnosis) {
  const history = existingHistory ? [...existingHistory] : [];
  history.unshift(newDiagnosis);
  return history;
}
