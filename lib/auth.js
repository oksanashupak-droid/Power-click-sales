import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { redis } from './redis.js';

const scrypt = promisify(crypto.scrypt);

// The two sales users. Each one picks a password on first login; it is stored only as a salted scrypt hash.
export const USERS = {
  oksana: { name: 'אוקסנה' },
  stas: { name: 'סטס' },
};

export const MIN_PASSWORD = 6;
const COOKIE = 'pcs';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const pwKey = (user) => `pw:${user}`;

// SESSION_SECRET from the environment if set; otherwise one random secret created once and kept in Redis.
let cachedSecret = null;
async function secret() {
  if (cachedSecret) return cachedSecret;
  const env = process.env.SESSION_SECRET;
  if (env && env.length >= 16) return (cachedSecret = env);
  await redis('SET', 'session_secret', crypto.randomBytes(32).toString('base64url'), 'NX');
  return (cachedSecret = await redis('GET', 'session_secret'));
}

const sign = async (payload) => crypto.createHmac('sha256', await secret()).update(payload).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = (await scrypt(String(password), salt, 64)).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

export async function hasPassword(user) {
  return Boolean(await redis('GET', pwKey(user)));
}

export async function checkPassword(user, password) {
  if (!USERS[user]) return false;
  const stored = await redis('GET', pwKey(user));
  if (!stored) return false;
  const [, salt, hash] = stored.split('$');
  const test = (await scrypt(String(password), salt, 64)).toString('base64url');
  return safeEqual(test, hash);
}

// Sets the first password. Atomic (SET NX): fails if a password already exists.
export async function setFirstPassword(user, password) {
  if (!USERS[user]) return false;
  const ok = await redis('SET', pwKey(user), await hashPassword(password), 'NX');
  return ok === 'OK';
}

export async function changePassword(user, password) {
  await redis('SET', pwKey(user), await hashPassword(password));
}

export async function sessionCookie(user) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${user}.${exp}`;
  return `${COOKIE}=${payload}.${await sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function getUser(req) {
  const raw = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [user, exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!user || !exp || !sig || !USERS[user]) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!safeEqual(sig, await sign(`${user}.${exp}`))) return null;
  return user;
}
