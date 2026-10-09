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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API Error: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
};

export const get = (endpoint, opts) => api(endpoint, { method: 'GET', ...opts });
export const post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint) => api(endpoint, { method: 'DELETE' });
