// Cloud2Crop API client v2 – supports Bearer token + httpOnly cookie auth
const API_BASE = import.meta.env.VITE_API_URL || '';

export const getAuthToken = () => localStorage.getItem('c2c_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('c2c_token', token);
  else localStorage.removeItem('c2c_token');
};

export const api = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send httpOnly cookies
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorData = {};
    if (isJson) {
      errorData = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      if (text) errorData = { message: text };
    }
    const error = new Error(errorData.message || `API Error: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) return null;
  if (!isJson) {
    const text = await response.text().catch(() => '');
    return text ? { text } : {};
  }

  const rawText = await response.text();
  if (!rawText || !rawText.trim()) return {};
  try {
    return JSON.parse(rawText);
  } catch (e) {
    throw new Error('Invalid JSON response received from server');
  }
};

export const get = (endpoint, opts) => api(endpoint, { method: 'GET', ...opts });
export const post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint) => api(endpoint, { method: 'DELETE' });
