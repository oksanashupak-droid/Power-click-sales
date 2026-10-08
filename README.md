# Power Click · עוזר שיחת מכירה

כלי לשיחות מכירה של Power Click: התאמת חבילה בזמן שיחה, תסריט, התנגדויות,
ורשימת לקוחות נפרדת לכל משתמש (אוקסנה, סטס) עם תיעוד ומועדי חזרה.

## מבנה
- `app/index.html` – האפליקציה (עמוד אחד)
- `app/login.html` – מסך כניסה
- `api/page.js` – מגיש את האפליקציה רק למשתמש מחובר
- `api/login.js`, `api/logout.js` – כניסה ויציאה (עוגייה חתומה ל-30 יום)
- `api/clients.js` – שמירה, קריאה ומחיקה של לקוחות, לכל משתמש בנפרד
- `lib/redis.js` – חיבור ל-Upstash Redis דרך REST

## הגדרה ב-Vercel
1. Add New → Project → לייבא את המאגר הזה. בלי Framework, בלי Build Command.
2. Storage → Create Database → **Upstash for Redis** (חינמי) → לחבר לפרויקט.
   זה מוסיף לבד את `KV_REST_API_URL` ו-`KV_REST_API_TOKEN`.
3. Settings → Environment Variables:
   - `OKSANA_PASSWORD` – הסיסמה של אוקסנה
   - `STAS_PASSWORD` – הסיסמה של סטס
   - `SESSION_SECRET` – מחרוזת אקראית ארוכה (לפחות 32 תווים)
4. Deployments → Redeploy.

## הוספת משתמש
מוסיפים שורה ל-`USERS` ב-`lib/auth.js`, מוסיפים כפתור ב-`app/login.html`,
ומגדירים משתנה סיסמה חדש ב-Vercel.
