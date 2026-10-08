# Power Click · עוזר שיחת מכירה

כלי לשיחות מכירה של Power Click: התאמת חבילה בזמן שיחה, תסריט, התנגדויות,
ורשימת לקוחות נפרדת לכל משתמש (אוקסנה, סטס) עם תיעוד ומועדי חזרה.

## מבנה
- `app/index.html` – האפליקציה (עמוד אחד)
- `app/login.html` – מסך כניסה; בכניסה הראשונה כל משתמש בוחר סיסמה
- `api/page.js` – מגיש את האפליקציה רק למשתמש מחובר
- `api/login.js`, `api/logout.js` – כניסה ויציאה (עוגייה חתומה ל-30 יום)
- `api/setup.js` – בחירת סיסמה ראשונה (רק כשלמשתמש עוד אין סיסמה)
- `api/password.js` – שינוי סיסמה מתוך האפליקציה
- `api/status.js` – למי עוד אין סיסמה (למסך הכניסה)
- `api/clients.js` – שמירה, קריאה ומחיקה של לקוחות, לכל משתמש בנפרד
- `lib/redis.js` – חיבור ל-Upstash Redis דרך REST

סיסמאות נשמרות רק כ-hash (scrypt עם salt) ב-Redis.

## הגדרה ב-Vercel
1. Add New → Project → לייבא את המאגר הזה. Framework Preset: Other.
2. Storage → Create Database → **Upstash for Redis** (חינמי) → לחבר לפרויקט.
   זה מוסיף לבד את `KV_REST_API_URL` ו-`KV_REST_API_TOKEN`.
3. Deployments → Redeploy.
4. נכנסים לאתר: כל משתמש בוחר סיסמה בכניסה הראשונה שלו.

`SESSION_SECRET` אופציונלי: אם לא מוגדר, נוצר אחד אקראי ונשמר ב-Redis.

## סיסמה שנשכחה
מוחקים את המפתח `pw:oksana` או `pw:stas` ב-Upstash (Data Browser),
והמשתמש יבחר סיסמה חדשה בכניסה הבאה.

## הוספת משתמש
מוסיפים שורה ל-`USERS` ב-`lib/auth.js` וכפתור ב-`app/login.html`.
