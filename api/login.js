import { checkPassword, sessionCookie, USERS } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  const { user, password } = req.body || {};
  if (!checkPassword(user, password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return res.status(401).json({ code: 'bad_login' });
  }
  res.setHeader('Set-Cookie', sessionCookie(user));
  res.status(200).json({ user, name: USERS[user].name });
}
