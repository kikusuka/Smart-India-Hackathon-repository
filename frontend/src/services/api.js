const BASE_URL = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('rhp-doctor-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  return response.json();
}

export async function postDiagnosis(payload) {
  return request('/api/diagnosis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPatient(qrId) {
  return request(`/api/patient/${encodeURIComponent(qrId)}`, {
    method: 'GET',
  });
}

export async function getSurveillance(region) {
  return request(`/api/surveillance/${encodeURIComponent(region)}`, {
    method: 'GET',
  });
}

export async function getSurveillanceDashboard() {
  return request('/api/surveillance/dashboard', {
    method: 'GET',
  });
}

export async function postSyncBatch(batch) {
  return request('/api/sync/batch', {
    method: 'POST',
    body: JSON.stringify({ batch }),
  });
}

export async function signupDoctor(payload) {
  return request('/api/auth/doctor/signup', { method: 'POST', body: JSON.stringify(payload) });
}

export async function loginDoctor(payload) {
  const result = await request('/api/auth/doctor/login', { method: 'POST', body: JSON.stringify(payload) });
  if (result.access_token) localStorage.setItem('rhp-doctor-token', result.access_token);
  return result;
}

export async function pullPatientDelta(patientQrId, sinceSequence = 0) {
  return request('/api/sync/pull', {
    method: 'POST',
    body: JSON.stringify({ patient_qr_id: patientQrId, since_sequence: sinceSequence }),
  });
}

export async function pushDiagnosisEntry(payload) {
  return request('/api/sync/push', { method: 'POST', body: JSON.stringify(payload) });
}

export async function confirmDiagnosis(entryId) {
  return request(`/api/diagnosis/${encodeURIComponent(entryId)}/confirm`, { method: 'POST' });
}

export async function getDoctorStats(doctorId) {
  return request(`/api/doctor/${encodeURIComponent(doctorId)}/stats`, { method: 'GET' });
}

export async function getOutbreakCheck(region) {
  return request(`/api/surveillance/outbreak-check/${encodeURIComponent(region)}`, { method: 'GET' });
}

export const api = {
  postDiagnosis,
  getPatient,
  getSurveillance,
  getSurveillanceDashboard,
  postSyncBatch,
  signupDoctor,
  loginDoctor,
  pullPatientDelta,
  pushDiagnosisEntry,
  confirmDiagnosis,
  getDoctorStats,
  getOutbreakCheck,
};

export default api;