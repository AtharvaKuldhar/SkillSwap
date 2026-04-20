const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return url.endsWith('/api') ? url : `${url}/api`;
};

const BASE_URL = getBaseUrl();

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.errors = data.errors || null;
    throw err;
  }
  return data;
};

// Helper to prevent /api/api double prefixing
const cleanPath = (path) => {
  return path.startsWith('/api/') ? path.replace('/api/', '/') : path;
};

export const api = {
  get: (path) =>
    fetch(`${BASE_URL}${cleanPath(path)}`, { headers: getHeaders() }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE_URL}${cleanPath(path)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE_URL}${cleanPath(path)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (path) =>
    fetch(`${BASE_URL}${cleanPath(path)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
};
