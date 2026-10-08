import fs from 'node:fs';
import path from 'node:path';
import { getUser, USERS } from '../lib/auth.js';

const read = (f) => fs.readFileSync(path.join(process.cwd(), 'app', f), 'utf8');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  let user = null;
  try { user = await getUser(req); } catch { /* storage not ready: show login, which explains */ }
  if (!user) return res.status(200).send(read('login.html'));
  const session = JSON.stringify({ id: user, name: USERS[user].name }).replace(/</g, '\\u003c');
  res.status(200).send(read('index.html').replace('/*__SESSION__*/', `const SESSION_USER = ${session};`));
}
