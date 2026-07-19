import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function useApi() {
  const { getToken } = useAuth();

  return async function apiFetch(path, options = {}) {
    const token = await getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  };
}
