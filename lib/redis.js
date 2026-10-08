// Minimal Upstash Redis REST client (no dependencies).
// Works with the env vars Vercel's Upstash / KV integration injects.
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redis(...command) {
  const url = URL_(), token = TOKEN();
  if (!url || !token) throw Object.assign(new Error('Redis is not configured'), { code: 'no_storage' });
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw Object.assign(new Error(j.error || `Redis HTTP ${r.status}`), { code: 'unavailable' });
  return j.result;
}
