/* ============ AKADEMIA — veritabanı katmanı (PostgreSQL) ============ */
'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function query(text, params) {
  return pool.query(text, params);
}

/* Kayıt olan her müşteriye otomatik atanan başlangıç hizmetleri */
const DEFAULT_SERVICES = [
  'Yönetim Paneli',
  'Ders Programı',
  'Yoklama Takibi',
  'Veli & Öğretmen İletişimi',
  'Mali Takip ve Muhasebe',
];

/* Sitedeki düzenlenebilir fiyat/içerik varsayılanları (admin panelinden değiştirilebilir) */
const DEFAULT_CONTENT = {
  heroSub:
    "Ders programından muhasebeye, yoklamadan veli iletişimine kadar 40'tan fazla modül. Akademia; sade, hızlı ve güvenilir bir arayüzle baştan sona son kullanıcı için tasarlandı.",
  cur: '₺',
  y_name: 'Yıllık Lisans',
  y_tag: 'Tek öğretim yılı geçerlidir',
  y_amount: '4.990',
  y_per: '/ yıl',
  y_desc: 'Bir öğretim yılı boyunca tüm özellikler.',
  y_feats: [
    "40'tan fazla modülün tamamı",
    'macOS · Windows · iOS · Android',
    'Sınırsız öğrenci ve öğretmen',
    'Gerçek zamanlı senkronizasyon',
    'E-posta ve sohbet desteği',
  ],
  t_badge: 'En avantajlı · %20 tasarruf',
  t_name: '10 Yıllık Lisans',
  t_tag: "Yılda yalnızca ₺3.999'a denk gelir",
  t_amount: '39.990',
  t_per: '/ 10 yıl',
  t_desc: 'Bir kez alın, on yıl boyunca rahat edin.',
  t_feats: [
    'Yıllık lisanstaki her şey',
    '10 yıl boyunca ücretsiz güncelleme',
    'Öncelikli 7/24 teknik destek',
    'Özel kurulum ve personel eğitimi',
    'Veri taşıma ve yedekleme',
    'Fiyat artışlarından etkilenmezsiniz',
  ],
};

/* Lisans key üretici → AKD-XXXX-XXXX-XXXX */
function generateLicenseKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
  return `AKD-${block()}-${block()}-${block()}`;
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS site_users (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name          text NOT NULL,
      school        text,
      email         text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
      license_key   text,
      plan          text,
      status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
      created_at    timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS services (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    uuid NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
      name       text NOT NULL,
      status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           uuid NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
      provider          text NOT NULL DEFAULT 'stripe',
      plan              text,
      amount_cents      bigint NOT NULL,
      currency          text NOT NULL DEFAULT 'try',
      status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
      stripe_session_id text,
      created_at        timestamptz NOT NULL DEFAULT now(),
      paid_at           timestamptz
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS site_content (
      key        text PRIMARY KEY,
      value      jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'contact.mertkaya@gmail.com').toLowerCase();
  const { rows } = await query('SELECT id FROM site_users WHERE email = $1', [email]);
  if (rows.length) return;
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'changeme', 12);
  await query(
    `INSERT INTO site_users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'admin', 'active')`,
    [process.env.ADMIN_NAME || 'Admin', email, hash]
  );
  console.log(`✓ Admin hesabı oluşturuldu: ${email}`);
}

async function seedContent() {
  const { rows } = await query("SELECT key FROM site_content WHERE key = 'pricing'");
  if (rows.length) return;
  await query("INSERT INTO site_content (key, value) VALUES ('pricing', $1)", [
    JSON.stringify(DEFAULT_CONTENT),
  ]);
}

/* Eski akışta kayıtta otomatik atanan demo verilerini temizle:
   satın alma tamamlamamış (pending) müşterilerin lisans anahtarı/planı ve
   ön-aktif edilmiş hizmetleri kaldırılır. Anahtar yalnızca ödeme sonrası verilir. */
async function cleanupDemoData() {
  await query(
    `UPDATE site_users SET license_key = NULL, plan = NULL
     WHERE role = 'customer' AND status = 'pending'`
  );
  await query(
    `DELETE FROM services WHERE user_id IN (
       SELECT id FROM site_users WHERE role = 'customer' AND status = 'pending'
     )`
  );
}

async function init() {
  await migrate();
  await seedAdmin();
  await seedContent();
  await cleanupDemoData();
}

module.exports = {
  pool,
  query,
  init,
  generateLicenseKey,
  DEFAULT_SERVICES,
  DEFAULT_CONTENT,
};
