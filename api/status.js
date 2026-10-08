import { hasPassword, USERS } from '../lib/auth.js';

// Tells the login screen which users still need to choose a password.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const users = {};
    for (const id of Object.keys(USERS)) users[id] = { hasPassword: await hasPassword(id) };
    res.status(200).json({ users });
  } catch (e) {
    res.status(503).json({ code: e.code || 'unavailable' });
  }
}
