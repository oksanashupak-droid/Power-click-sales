import { MIN_PASSWORD, sessionCookie, setFirstPassword, USERS } from '../lib/auth.js';

// First login: the user chooses their own password. Only works while that user has no password yet.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  const { user, password } = req.body || {};
  if (!USERS[user]) return res.status(400).json({ code: 'invalid_argument' });
  if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > 200)
    return res.status(400).json({ code: 'weak_password' });
  try {
    if (!(await setFirstPassword(user, password))) return res.status(409).json({ code: 'already_set' });
    res.setHeader('Set-Cookie', await sessionCookie(user));
    res.status(200).json({ user, name: USERS[user].name });
  } catch (e) {
    res.status(503).json({ code: e.code || 'unavailable' });
  }
}
