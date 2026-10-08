import crypto from 'node:crypto';

// The two sales users. Passwords live only in Vercel environment variables.
export const USERS = {
  oksana: { name: 'אוקסנה', passwordEnv: 'OKSANA_PASSWORD' },
  stas: { name: 'סטס', passwordEnv: 'STAS_PASSWORD' },
};

const COOKIE = 'pcs';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is missing or shorter than 16 characters');
  return s;
}

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(user, password) {
  const u = USERS[user];
  if (!u) return false;
  const expected = process.env[u.passwordEnv];
  if (!expected) return false;
  // hash both sides so the comparison is constant-time regardless of length
  const h = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
  return safeEqual(h(password), h(expected));
}

export function sessionCookie(user) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${user}.${exp}`;
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function getUser(req) {
  const raw = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [user, exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!user || !exp || !sig || !USERS[user]) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!safeEqual(sig, sign(`${user}.${exp}`))) return null;
  return user;
}
