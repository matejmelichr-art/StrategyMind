// Základní URL na Cloudflare Worker (backend)
export const API_BASE = "https://tight-field-436e.matejmelichr.workers.dev";

// Pomocníček na fetch s logem chyb (a CORS friendly hlavičky)
export async function apiFetch(path, init = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method || 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, init.headers || {}),
    body: init.body ? JSON.stringify(init.body) : undefined,
    mode: 'cors',
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`API ${path} ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
