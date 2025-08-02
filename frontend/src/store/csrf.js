// frontend/src/store/csrf.js
import Cookies from 'js-cookie';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export async function csrfFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const method = options.method ? options.method.toUpperCase() : 'GET';

  const headers = options.headers ? { ...options.headers } : {};

  if (method !== 'GET') {
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (!headers['XSRF-Token']) headers['XSRF-Token'] = Cookies.get('XSRF-TOKEN');
  }

  const credentials = options.credentials || 'include';

  const cache = options.cache;

  const fetchOptions = {
    ...options,
    method,
    headers,
    credentials,
  };

  if (cache !== undefined) {
    fetchOptions.cache = cache;
  }

  const res = await window.fetch(fullUrl, fetchOptions);

  if (res.status >= 400) throw res;
  return res;
}

export function restoreCSRF() {
  return csrfFetch('/csrf/restore');
}