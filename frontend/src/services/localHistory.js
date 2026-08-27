import { deflate, inflate } from 'pako';

export function encodeHistoryToQR(historyArray) {
  if (!Array.isArray(historyArray)) {
    throw new Error('encodeHistoryToQR expects an array of diagnosis records');
  }
  
  const jsonString = JSON.stringify(historyArray);
  
  const compressed = deflate(jsonString, { to: 'string' });
  
  const base64 = btoa(compressed);
  
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
    compressed = atob(base64);
  } catch (e) {
    throw new Error('Invalid QR data: failed to decode base64');
  }
  
  let jsonString;
  try {
    jsonString = inflate(compressed, { to: 'string' });
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
    dosage: formData.dosage
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