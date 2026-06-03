# Akademia — Tanıtım Sitesi + Müşteri/Admin Paneli

Statik tanıtım sitesi + Node.js/Express/PostgreSQL backend. Müşteri hesapları,
roller (admin/müşteri), otomatik lisans key üretimi, hizmet yönetimi ve Stripe
ödeme entegrasyonu içerir.

## Kurulum

```bash
npm install
cp .env.example .env   # değerleri doldur (zaten bir .env oluşturuldu)
npm start
```

Sonra tarayıcıdan: **http://localhost:3000**

> Not: PostgreSQL çalışır durumda olmalı. Site, okul uygulamasının `akademia`
> veritabanından tamamen ayrı, kendi `akademia_site` veritabanını kullanır.
> Tablolar ve admin hesabı ilk açılışta otomatik oluşturulur.

## Hesaplar ve akış

- **Kayıt ol / Giriş yap** (`auth.html`) → role göre yönlendirir:
  - **Müşteri** → `panel.html` (lisans key, durum/plan, hizmetler, ödeme geçmişi, satın alma)
  - **Admin** → `admin.html` (fiyat/içerik düzenleme + müşteri hesapları)
- Müşteri kaydında **otomatik lisans key** üretilir ve başlangıç hizmetleri atanır.

### Admin hesabı

`.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile ilk açılışta oluşturulur:

- **E-posta:** `contact.mertkaya@gmail.com`
- **Şifre:** `.env` dosyasındaki `ADMIN_PASSWORD` değeri

İlk girişten sonra `.env`'deki şifreyi değiştirip sunucuyu yeniden başlatabilirsin
(mevcut admin varsa yeniden seed edilmez; şifre değişimi için ileride panele
"şifre değiştir" eklenebilir).

## Stripe ödeme entegrasyonu

`.env` içine anahtarları gir:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
CURRENCY=try
```

Anahtarlar boşken satın alma butonları otomatik devre dışı kalır ("ödeme
yapılandırılmamış" uyarısı). Anahtar girilince müşteri panelindeki planlar Stripe
Checkout'a yönlendirir; başarılı ödemede hesap `active` olur ve plan atanır.

Plan fiyatları sunucu tarafında sabittir (`server.js` → `PLANS`):
- Yıllık: ₺4.990
- 10 Yıllık: ₺21.000

## API özeti

| Yöntem | Uç | Açıklama |
|---|---|---|
| POST | `/api/register` | Müşteri kaydı (key + hizmet otomatik) |
| POST | `/api/login` | Giriş (rol döner) |
| POST | `/api/logout` | Çıkış |
| GET | `/api/me` | Oturum bilgisi |
| GET | `/api/account` | Müşteri hesap detayı |
| GET | `/api/services` | Müşteri hizmetleri |
| GET | `/api/payments` | Müşteri ödemeleri |
| GET/PUT | `/api/content` | Site içeriği/fiyatlar (PUT: admin) |
| GET | `/api/admin/customers` | Müşteri listesi (admin) |
| GET | `/api/admin/stats` | Özet istatistikler (admin) |
| POST | `/api/checkout` | Stripe ödeme oturumu |
| GET | `/api/checkout/verify` | Ödeme doğrulama |

## Dosyalar

- `server.js` — Express sunucu + API
- `db.js` — PostgreSQL şema/migration/seed
- `index.html`, `styles.css`, `script.js`, `content.js` — tanıtım sitesi
- `auth.html`, `auth.css` — giriş/kayıt
- `panel.html`, `panel.css`, `panel.js` — müşteri paneli
- `admin.html`, `admin.css` — admin paneli
