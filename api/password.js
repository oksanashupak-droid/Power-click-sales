import { changePassword, checkPassword, getUser, MIN_PASSWORD } from '../lib/auth.js';

// Change your own password while signed in (requires the current one).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ code: 'unauth' });
    const { current, next } = req.body || {};
    if (typeof next !== 'string' || next.length < MIN_PASSWORD || next.length > 200) return res.status(400).json({ code: 'weak_password' });
    if (!(await checkPassword(user, current))) {
      await new Promise((r) => setTimeout(r, 600));
      return res.status(403).json({ code: 'bad_password' });
    }
    await changePassword(user, next);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(503).json({ code: e.code || 'unavailable' });
  }
}
