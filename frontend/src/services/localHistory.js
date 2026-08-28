import { deflate, inflate } from 'pako';

const MAX_QR_HISTORY_RECORDS = 8;

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

export function encodeHistoryToQR(historyArray) {
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

  const base64 = bytesToBase64(compressed);
  
  const urlSafe = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return urlSafe;
}

export function decodeQRToHistory(qrString) {
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

export function generateNewQR(historyArray) {
  return encodeHistoryToQR(historyArray);
}

export function addDiagnosisToHistory(existingHistory, newDiagnosis) {
  const history = existingHistory ? [...existingHistory] : [];
  history.unshift(newDiagnosis);
  return history;
}
