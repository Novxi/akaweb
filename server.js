/* ============ AKADEMIA — Express sunucu + API ============ */
'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-degistir';
const CURRENCY = (process.env.CURRENCY || 'try').toLowerCase();
const isProd = process.env.NODE_ENV === 'production';

/* ---- Stripe (anahtar yoksa devre dışı) ---- */
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

/* Sunucu tarafında sabitlenmiş plan fiyatları (istemciye güvenilmez).
   Tutarlar para biriminin en küçük biriminde (kuruş). */
const PLANS = {
  yillik: { name: 'Akademia — Yıllık Lisans', amount: 499000 }, // ₺4.990,00
  '10yillik': { name: 'Akademia — 10 Yıllık Lisans', amount: 3999000 }, // ₺39.990,00
};

app.use(express.json());
app.use(cookieParser());

/* ---------- yardımcılar ---------- */
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
function authOptional(req, _res, next) {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      /* geçersiz token → anonim */
    }
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapmalısınız.' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ error: 'Yetkiniz yok.' });
  next();
}
function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    school: u.school,
    email: u.email,
    role: u.role,
    license_key: u.license_key,
    plan: u.plan,
    status: u.status,
    created_at: u.created_at,
  };
}
const isEmail = (s) => typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

app.use(authOptional);

/* ---------- public yapılandırma ---------- */
app.get('/api/config', (_req, res) => {
  res.json({
    stripeEnabled: !!stripe,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    currency: CURRENCY,
    plans: Object.fromEntries(
      Object.entries(PLANS).map(([k, v]) => [k, { name: v.name, amount: v.amount }])
    ),
  });
});

/* ---------- kayıt ---------- */
app.post('/api/register', async (req, res) => {
  try {
    const { name, school, email, password } = req.body || {};
    if (!name || !isEmail(email) || !password)
      return res.status(400).json({ error: 'Ad, geçerli e-posta ve şifre gereklidir.' });
    if (String(password).length < 8)
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });

    const mail = String(email).toLowerCase().trim();
    const exists = await db.query('SELECT 1 FROM site_users WHERE email = $1', [mail]);
    if (exists.rows.length)
      return res.status(409).json({ error: 'Bu e-posta ile zaten bir hesap var.' });

    const hash = await bcrypt.hash(String(password), 12);

    /* Lisans anahtarı ve hizmetler kayıtta DEĞİL, ödeme başarılı olunca verilir. */
    const { rows } = await db.query(
      `INSERT INTO site_users (name, school, email, password_hash, role, status)
       VALUES ($1,$2,$3,$4,'customer','pending') RETURNING *`,
      [String(name).trim(), school ? String(school).trim() : null, mail, hash]
    );
    const user = rows[0];

    setAuthCookie(res, signToken(user));
    res.json({ ok: true, role: user.role, user: publicUser(user) });
  } catch (err) {
    console.error('register', err);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

/* ---------- giriş ---------- */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || !password)
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
    const mail = String(email).toLowerCase().trim();
    const { rows } = await db.query('SELECT * FROM site_users WHERE email = $1', [mail]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password), user.password_hash)))
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    setAuthCookie(res, signToken(user));
    res.json({ ok: true, role: user.role, user: publicUser(user) });
  } catch (err) {
    console.error('login', err);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM site_users WHERE id = $1', [req.user.id]);
  if (!rows.length) return res.status(401).json({ error: 'Oturum geçersiz.' });
  res.json({ user: publicUser(rows[0]) });
});

/* ---------- müşteri: hesap / hizmetler / ödemeler ---------- */
app.get('/api/account', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM site_users WHERE id = $1', [req.user.id]);
  res.json({ user: publicUser(rows[0]) });
});

app.get('/api/services', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, status, created_at FROM services WHERE user_id = $1 ORDER BY created_at',
    [req.user.id]
  );
  res.json({ services: rows });
});

app.get('/api/payments', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, plan, amount_cents, currency, status, created_at, paid_at
     FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ payments: rows });
});

/* ---------- içerik (fiyatlandırma vb.) ---------- */
app.get('/api/content', async (_req, res) => {
  const { rows } = await db.query("SELECT value FROM site_content WHERE key = 'pricing'");
  res.json(rows.length ? rows[0].value : db.DEFAULT_CONTENT);
});

app.put('/api/content', requireAuth, requireAdmin, async (req, res) => {
  const value = req.body && typeof req.body === 'object' ? req.body : {};
  await db.query(
    `INSERT INTO site_content (key, value, updated_at) VALUES ('pricing', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(value)]
  );
  res.json({ ok: true });
});

/* ---------- admin: müşteriler ---------- */
app.get('/api/admin/customers', requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.school, u.email, u.role, u.license_key, u.plan, u.status, u.created_at,
            COALESCE(p.paid_total, 0) AS paid_total
     FROM site_users u
     LEFT JOIN (
       SELECT user_id, SUM(amount_cents) AS paid_total
       FROM payments WHERE status = 'paid' GROUP BY user_id
     ) p ON p.user_id = u.id
     WHERE u.role = 'customer'
     ORDER BY u.created_at DESC`
  );
  res.json({ customers: rows });
});

app.get('/api/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
  const customers = await db.query("SELECT COUNT(*)::int AS c FROM site_users WHERE role='customer'");
  const active = await db.query("SELECT COUNT(*)::int AS c FROM site_users WHERE role='customer' AND status='active'");
  const revenue = await db.query("SELECT COALESCE(SUM(amount_cents),0)::bigint AS s FROM payments WHERE status='paid'");
  res.json({
    customers: customers.rows[0].c,
    active: active.rows[0].c,
    revenue_cents: Number(revenue.rows[0].s),
  });
});

/* ---------- ödeme: Stripe Checkout ---------- */
function baseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

/* Ödeme başarılı olduğunda hesabı etkinleştirir:
   - yoksa lisans anahtarı üretir (varsa korunur, yenileme/yükseltmede aynı kalır)
   - planı ve durumu günceller
   - dahil hizmetleri (yoksa) oluşturup aktifleştirir */
async function activateAccount(userId, plan) {
  const { rows } = await db.query('SELECT license_key FROM site_users WHERE id = $1', [userId]);
  const licenseKey = rows[0] && rows[0].license_key ? rows[0].license_key : db.generateLicenseKey();
  await db.query(`UPDATE site_users SET status='active', plan=$2, license_key=$3 WHERE id=$1`, [
    userId,
    plan,
    licenseKey,
  ]);
  for (const svc of db.DEFAULT_SERVICES) {
    await db.query(
      `INSERT INTO services (user_id, name, status)
       SELECT $1, $2, 'active'
       WHERE NOT EXISTS (SELECT 1 FROM services WHERE user_id = $1 AND name = $2)`,
      [userId, svc]
    );
  }
  return licenseKey;
}

app.post('/api/checkout', requireAuth, async (req, res) => {
  if (!stripe)
    return res.status(503).json({
      error: 'Ödeme sistemi henüz yapılandırılmamış. Lütfen yöneticinizle iletişime geçin.',
    });
  const { plan } = req.body || {};
  const p = PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Geçersiz plan.' });
  try {
    const { rows } = await db.query('SELECT * FROM site_users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: p.amount,
            product_data: { name: p.name },
          },
        },
      ],
      success_url: `${baseUrl(req)}/panel.html?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl(req)}/panel.html?canceled=1`,
      metadata: { user_id: user.id, plan },
    });
    await db.query(
      `INSERT INTO payments (user_id, provider, plan, amount_cents, currency, status, stripe_session_id)
       VALUES ($1,'stripe',$2,$3,$4,'pending',$5)`,
      [user.id, plan, p.amount, CURRENCY, session.id]
    );
    res.json({ url: session.url });
  } catch (err) {
    console.error('checkout', err);
    res.status(500).json({ error: 'Ödeme oturumu oluşturulamadı.' });
  }
});

/* başarı dönüşünde ödemeyi doğrula ve hesabı aktifleştir */
app.get('/api/checkout/verify', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Ödeme sistemi yapılandırılmamış.' });
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'session_id gerekli.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    if (session.metadata.user_id !== req.user.id)
      return res.status(403).json({ error: 'Bu ödeme size ait değil.' });

    if (session.payment_status === 'paid') {
      await db.query(
        `UPDATE payments SET status='paid', paid_at=now()
         WHERE stripe_session_id=$1 AND status<>'paid'`,
        [session.id]
      );
      await activateAccount(req.user.id, session.metadata.plan);
      return res.json({ ok: true, status: 'paid' });
    }
    res.json({ ok: false, status: session.payment_status });
  } catch (err) {
    console.error('verify', err);
    res.status(500).json({ error: 'Ödeme doğrulanamadı.' });
  }
});

/* ---------- ödeme: uygulama içi kart formu ----------
   Not: PCI uyumu için ham kart numarası SAKLANMAZ; yalnızca doğrulanır ve
   son 4 hane kayıt amacıyla tutulur. Gerçek tahsilat için bir ödeme
   sağlayıcısının sunucu-taraflı tokenizasyonuna bağlanmalıdır. */
function luhnValid(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return num.length >= 13 && sum % 10 === 0;
}

app.post('/api/pay', requireAuth, async (req, res) => {
  const { plan, number, exp, cvv } = req.body || {};
  const p = PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Geçersiz plan.' });

  const digits = String(number || '').replace(/\D/g, '');
  if (!luhnValid(digits))
    return res.status(400).json({ error: 'Kart numarası geçersiz.' });

  const m = String(exp || '').match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return res.status(400).json({ error: 'Son kullanma tarihi geçersiz (AA/YY).' });
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12)
    return res.status(400).json({ error: 'Son kullanma ayı geçersiz.' });
  const now = new Date();
  const endOfMonth = new Date(year, month, 1);
  if (endOfMonth <= now)
    return res.status(400).json({ error: 'Kartın süresi dolmuş.' });

  if (!/^\d{3,4}$/.test(String(cvv || '')))
    return res.status(400).json({ error: 'CVV geçersiz.' });

  try {
    const last4 = digits.slice(-4);
    await db.query(
      `INSERT INTO payments (user_id, provider, plan, amount_cents, currency, status, paid_at)
       VALUES ($1,'card',$2,$3,$4,'paid',now())`,
      [req.user.id, plan, p.amount, CURRENCY]
    );
    const licenseKey = await activateAccount(req.user.id, plan);
    res.json({ ok: true, last4, plan, license_key: licenseKey });
  } catch (err) {
    console.error('pay', err);
    res.status(500).json({ error: 'Ödeme işlenemedi.' });
  }
});

/* ---------- statik site (yalnızca public/; backend dosyaları dışarı sunulmaz) ---------- */
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

/* ---------- başlat ---------- */
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Akademia sunucusu çalışıyor → http://localhost:${PORT}`);
      if (!stripe) console.log('! Stripe anahtarı yok — ödeme butonları devre dışı.');
    });
  })
  .catch((err) => {
    console.error('Veritabanı başlatılamadı:', err);
    process.exit(1);
  });
