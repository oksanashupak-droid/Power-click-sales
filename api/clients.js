import { getUser } from '../lib/auth.js';
import { redis } from '../lib/redis.js';

const ID = /^[A-Za-z0-9_-]{6,40}$/;
const MAX_BYTES = 250_000;

// Each user's clients live in their own Redis hash: clients:<user> -> { <id>: JSON }
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ code: 'unauth' });
    const key = `clients:${user}`;

    if (req.method === 'GET') {
      const flat = (await redis('HGETALL', key)) || [];
      const clients = [];
      for (let i = 0; i < flat.length; i += 2) {
        try { clients.push({ ...JSON.parse(flat[i + 1]), id: flat[i] }); } catch { /* skip a corrupt row */ }
      }
      return res.status(200).json({ clients });
    }

    // bulk create (Excel import): { items: [{ id, data }] }, up to 500 per request
    if (req.method === 'POST') {
      const items = (req.body || {}).items;
      if (!Array.isArray(items) || !items.length || items.length > 500) return res.status(400).json({ code: 'invalid_argument' });
      const args = [];
      for (const it of items) {
        if (!it || !ID.test(String(it.id)) || !it.data || typeof it.data !== 'object' || Array.isArray(it.data)) return res.status(400).json({ code: 'invalid_argument' });
        const { id: _drop, ...data } = it.data;
        const json = JSON.stringify(data);
        if (Buffer.byteLength(json) > MAX_BYTES) return res.status(413).json({ code: 'too_large' });
        args.push(String(it.id), json);
      }
      await redis('HSET', key, ...args);
      return res.status(200).json({ ok: true, count: items.length });
    }

    const id = String(req.query.id || '');
    if (!ID.test(id)) return res.status(400).json({ code: 'invalid_argument' });

    if (req.method === 'PUT') {
      const { data, mode } = req.body || {};
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ code: 'invalid_argument' });
      let next = data;
      if (mode === 'merge') {
        const old = await redis('HGET', key, id);
        if (!old) return res.status(404).json({ code: 'not_found' });
        next = { ...JSON.parse(old), ...data };
      }
      delete next.id;
      const json = JSON.stringify(next);
      if (Buffer.byteLength(json) > MAX_BYTES) return res.status(413).json({ code: 'too_large' });
      await redis('HSET', key, id, json);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await redis('HDEL', key, id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ code: 'method' });
  } catch (e) {
    return res.status(e.code === 'no_storage' ? 503 : 500).json({ code: e.code || 'unavailable' });
  }
}
