const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Ensure it doesn't end with /api if we are going to add it manually in some places, 
  // but here we'll standardize: BASE_URL is the root.
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

export const api = {
  get: (path) =>
    fetch(`${BASE_URL}${path}`, { headers: getHeaders() }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (path) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
};
