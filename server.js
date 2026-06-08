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

/* ---- Havale / EFT bilgileri (kart ödemesi yerine IBAN'a transfer) ---- */
const TRANSFER = {
  iban: process.env.TRANSFER_IBAN || 'TR91 0001 0090 1096 4078 8050 01',
  name: process.env.TRANSFER_NAME || 'Mert Kaya',
  bank: process.env.TRANSFER_BANK || 'Ziraat Bankası',
};

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
    currency: CURRENCY,
    transfer: TRANSFER,
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
            COALESCE(p.paid_total, 0) AS paid_total,
            pend.plan AS pending_plan, pend.created_at AS pending_at
     FROM site_users u
     LEFT JOIN (
       SELECT user_id, SUM(amount_cents) AS paid_total
       FROM payments WHERE status = 'paid' GROUP BY user_id
     ) p ON p.user_id = u.id
     LEFT JOIN LATERAL (
       SELECT plan, created_at FROM payments
       WHERE user_id = u.id AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1
     ) pend ON true
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

/* ---------- ödeme: havale ile ---------- */

/* Ödeme onaylandığında (admin) hesabı etkinleştirir:
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

/* Müşteri bir plan seçip havale bildirimi yapar → 'pending' ödeme kaydı oluşur.
   Hesap, admin havaleyi onaylayana kadar 'pending' kalır. */
app.post('/api/order', requireAuth, async (req, res) => {
  const { plan } = req.body || {};
  const p = PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Geçersiz plan.' });
  try {
    /* Aynı plan için zaten bekleyen bir bildirim varsa tekrar oluşturma. */
    const existing = await db.query(
      `SELECT id FROM payments WHERE user_id=$1 AND plan=$2 AND status='pending' LIMIT 1`,
      [req.user.id, plan]
    );
    if (!existing.rows.length) {
      await db.query(
        `INSERT INTO payments (user_id, provider, plan, amount_cents, currency, status)
         VALUES ($1,'transfer',$2,$3,$4,'pending')`,
        [req.user.id, plan, p.amount, CURRENCY]
      );
    }
    res.json({ ok: true, transfer: TRANSFER, amount_cents: p.amount, currency: CURRENCY, plan });
  } catch (err) {
    console.error('order', err);
    res.status(500).json({ error: 'Sipariş kaydedilemedi.' });
  }
});

/* ---------- admin: havale onayı / hesap aktifleştirme ---------- */
app.post('/api/admin/customers/:id/activate', requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const u = await db.query("SELECT id FROM site_users WHERE id=$1 AND role='customer'", [userId]);
    if (!u.rows.length) return res.status(404).json({ error: 'Müşteri bulunamadı.' });

    /* İstenen plan; yoksa müşterinin en güncel bekleyen ödemesinin planı. */
    let plan = (req.body && req.body.plan) || null;
    let payId = null;
    const pend = await db.query(
      `SELECT id, plan FROM payments
       WHERE user_id=$1 AND status='pending'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (pend.rows.length) {
      payId = pend.rows[0].id;
      if (!plan) plan = pend.rows[0].plan;
    }
    if (!plan || !PLANS[plan])
      return res.status(400).json({ error: 'Onaylanacak geçerli bir plan/ödeme bulunamadı.' });

    if (payId) {
      await db.query(`UPDATE payments SET status='paid', paid_at=now() WHERE id=$1`, [payId]);
    } else {
      /* Bekleyen kayıt yoksa (ör. admin elle aktifleştiriyor) ödeme kaydı oluştur. */
      await db.query(
        `INSERT INTO payments (user_id, provider, plan, amount_cents, currency, status, paid_at)
         VALUES ($1,'transfer',$2,$3,$4,'paid',now())`,
        [userId, plan, PLANS[plan].amount, CURRENCY]
      );
    }
    const licenseKey = await activateAccount(userId, plan);
    res.json({ ok: true, plan, license_key: licenseKey });
  } catch (err) {
    console.error('activate', err);
    res.status(500).json({ error: 'Hesap aktifleştirilemedi.' });
  }
});

/* ---------- statik site (yalnızca public/; backend dosyaları dışarı sunulmaz) ---------- */
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

/* ---------- başlat ---------- */
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Akademia sunucusu çalışıyor → http://localhost:${PORT}`);
      console.log(`• Havale IBAN: ${TRANSFER.iban} (${TRANSFER.name} · ${TRANSFER.bank})`);
    });
  })
  .catch((err) => {
    console.error('Veritabanı başlatılamadı:', err);
    process.exit(1);
  });
