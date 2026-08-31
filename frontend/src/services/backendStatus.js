const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}`);
    const body = await response.json();
    if (body?.success !== true) throw new Error('Health check returned an invalid response');
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default { checkBackendHealth };
