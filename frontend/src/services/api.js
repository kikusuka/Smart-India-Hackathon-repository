const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

export const api = {
  postDiagnosis,
  getPatient,
  getSurveillance,
  getSurveillanceDashboard,
  postSyncBatch,
};

export default api;
