/* ============ AKADEMIA — Müşteri Paneli ============ */
(function () {
  'use strict';

  var CFG = { currency: 'try', transfer: {}, plans: {} };
  var CUR_SYMBOL = { try: '₺', usd: '$', eur: '€' };

  function api(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(url, opts);
  }
  function money(cents, currency) {
    var sym = CUR_SYMBOL[(currency || CFG.currency || 'try').toLowerCase()] || '₺';
    return sym + (Number(cents) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(s) {
    if (!s) return '—';
    var d = new Date(s);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function initials(name) {
    return (name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  var toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  var STATUS = {
    pending: { label: 'Ödeme Bekleniyor', cls: 'warn', hint: 'Lisansınızı etkinleştirmek için bir plan satın alın.' },
    active: { label: 'Aktif', cls: 'ok', hint: 'Lisansınız aktif. İyi çalışmalar!' },
    suspended: { label: 'Askıda', cls: 'off', hint: 'Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin.' },
  };
  var PLAN_LABEL = { yillik: 'Yıllık Lisans', '10yillik': '10 Yıllık Lisans' };
  // İndirme bağlantıları — gerçek kurulum dosyaları/mağaza linkleriyle değiştirin.
  var DOWNLOADS = {
    macos: '/downloads/Akademia-0.1.0-Mac.dmg',
    windows: '/downloads/Akademia-0.1.0-Windows.zip',
    ios: 'https://apps.apple.com/app/akademia',
    android: 'https://play.google.com/store/apps/details?id=tr.net.akademia',
  };
  var PAY_STATUS = {
    paid: { label: 'Ödendi', cls: 'ok' },
    pending: { label: 'Bekliyor', cls: 'warn' },
    failed: { label: 'Başarısız', cls: 'off' },
    refunded: { label: 'İade', cls: 'off' },
  };

  function renderAccount(u) {
    ACCOUNT_EMAIL = u.email || '';
    document.getElementById('userName').textContent = u.name;
    document.getElementById('userMail').textContent = u.email;
    document.getElementById('userAvatar').textContent = initials(u.name);
    document.getElementById('helloName').textContent = u.name.split(/\s+/)[0];
    var school = document.getElementById('helloSchool');
    school.textContent = u.school ? u.school : '';

    // Lisans anahtarı yalnızca satın alma sonrası oluşur.
    var keyEl = document.getElementById('licenseKey');
    var copyBtn = document.getElementById('copyKey');
    var hintEl = document.querySelector('.license-card .license-hint');
    if (u.license_key) {
      keyEl.textContent = u.license_key;
      keyEl.classList.remove('is-empty');
      if (copyBtn) copyBtn.hidden = false;
      if (hintEl) hintEl.textContent = 'Bu anahtarı uygulamaya girerek lisansınızı etkinleştirin.';
    } else {
      keyEl.textContent = 'Henüz lisans yok';
      keyEl.classList.add('is-empty');
      if (copyBtn) copyBtn.hidden = true;
      if (hintEl) hintEl.textContent = 'Bir plan satın aldığınızda lisans anahtarınız burada oluşturulur.';
    }

    // İndirme: yalnızca lisans (satın alma) varsa etkin.
    var unlocked = !!u.license_key;
    var dlGrid = document.getElementById('downloadGrid');
    var dlHint = document.getElementById('downloadHint');
    if (dlGrid) {
      dlGrid.classList.toggle('is-locked', !unlocked);
      if (dlHint) dlHint.textContent = unlocked
        ? 'Lisansınız aktif. Uygulamayı cihazınıza indirip lisans anahtarınızla etkinleştirin.'
        : 'Bir plan satın aldığınızda indirme bağlantıları burada etkinleşir.';
      dlGrid.querySelectorAll('.dl-card').forEach(function (a) {
        var url = DOWNLOADS[a.dataset.os];
        if (unlocked && url) {
          a.href = url;
          a.target = '_blank';
          a.removeAttribute('aria-disabled');
          a.removeAttribute('tabindex');
        } else {
          a.removeAttribute('href');
          a.setAttribute('aria-disabled', 'true');
          a.setAttribute('tabindex', '-1');
        }
      });
    }

    var st = STATUS[u.status] || STATUS.pending;
    var badge = document.getElementById('statusBadge');
    badge.textContent = st.label;
    badge.className = 'status-badge ' + st.cls;
    document.getElementById('statusHint').textContent = st.hint;
    document.getElementById('planName').textContent = u.plan ? (PLAN_LABEL[u.plan] || u.plan) : 'Plan yok';

    // aktifse satın alma bölümünü "yükselt" tonuna çevir
    var head = document.querySelector('#buySection .pnl-section-head h2');
    if (u.status === 'active') head.textContent = 'Lisansınızı Yenileyin veya Yükseltin';
  }

  function renderServices(list) {
    var grid = document.getElementById('serviceGrid');
    if (!list.length) { grid.innerHTML = '<p class="svc-empty">Bir plan satın aldığınızda hizmetleriniz burada listelenir.</p>'; return; }
    grid.innerHTML = list.map(function (s) {
      var on = s.status === 'active';
      return '<div class="svc-chip">' +
        '<span class="svc-dot ' + (on ? 'on' : 'off') + '"></span>' +
        '<span class="svc-name">' + escapeHtml(s.name) + '</span>' +
        '<span class="svc-state">' + (on ? 'Aktif' : 'Pasif') + '</span>' +
        '</div>';
    }).join('');
  }

  function renderPayments(list) {
    var body = document.getElementById('payBody');
    var empty = document.getElementById('payEmpty');
    var table = document.getElementById('payTable');
    if (!list.length) { table.hidden = true; empty.hidden = false; return; }
    table.hidden = false; empty.hidden = true;
    body.innerHTML = list.map(function (p) {
      var ps = PAY_STATUS[p.status] || PAY_STATUS.pending;
      return '<tr>' +
        '<td>' + fmtDate(p.paid_at || p.created_at) + '</td>' +
        '<td>' + (PLAN_LABEL[p.plan] || p.plan || '—') + '</td>' +
        '<td>' + money(p.amount_cents, p.currency) + '</td>' +
        '<td><span class="pay-pill ' + ps.cls + '">' + ps.label + '</span></td>' +
        '</tr>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function planAmountLabel(plan) {
    var p = CFG.plans[plan];
    return p ? money(p.amount, CFG.currency).replace(/,00$/, '') : '';
  }
  function setPrices() {
    document.getElementById('priceYillik').textContent = planAmountLabel('yillik') || '₺4.990';
    document.getElementById('price10yillik').textContent = planAmountLabel('10yillik') || '₺39.990';
  }

  /* ============ HAVALE / EFT MODALI ============ */
  var pay = { overlay: null, error: null, plan: null, lastFocus: null };
  var ACCOUNT_EMAIL = '';

  function planTitle(plan) {
    return plan === '10yillik' ? '10 Yıllık Lisans' : 'Yıllık Lisans';
  }

  function openPayModal(plan) {
    pay.plan = plan;
    var amount = planAmountLabel(plan);
    document.getElementById('paySumPlan').textContent = planTitle(plan);
    document.getElementById('paySumAmount').textContent = amount;
    document.getElementById('xferAmount').textContent = amount;

    var t = CFG.transfer || {};
    document.getElementById('xferIban').textContent = t.iban || '—';
    document.getElementById('xferName').textContent = t.name || '—';
    document.getElementById('xferBank').textContent = t.bank || '—';
    document.getElementById('xferRef').textContent = ACCOUNT_EMAIL || 'E-posta adresiniz';

    pay.error.hidden = true;
    pay.lastFocus = document.activeElement;
    pay.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('paySubmit').focus(); }, 50);
  }
  function closePayModal() {
    pay.overlay.hidden = true;
    document.body.style.overflow = '';
    if (pay.lastFocus && pay.lastFocus.focus) pay.lastFocus.focus();
  }

  async function submitPay() {
    pay.error.hidden = true;
    var btn = document.getElementById('paySubmit');
    var txt = document.getElementById('payBtnText');
    var old = txt.textContent;
    btn.disabled = true; txt.textContent = 'Gönderiliyor…';
    try {
      var res = await api('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pay.plan }),
      });
      var out = await res.json();
      if (!res.ok) {
        pay.error.textContent = out.error || 'Bildirim gönderilemedi.';
        pay.error.hidden = false;
        return;
      }
      closePayModal();
      var note = document.getElementById('flashNote');
      note.hidden = false; note.className = 'pnl-note ok';
      note.textContent = 'Havale bildiriminiz alındı. Ödemeniz onaylandığında lisansınız etkinleştirilecek.';
      toast('Bildirim alındı ✓');
      await refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      pay.error.textContent = 'Sunucuya ulaşılamadı.';
      pay.error.hidden = false;
    } finally {
      btn.disabled = false; txt.textContent = old;
    }
  }

  function initPayModal() {
    pay.overlay = document.getElementById('payOverlay');
    pay.error = document.getElementById('payError');

    document.getElementById('paySubmit').addEventListener('click', submitPay);
    document.getElementById('payClose').addEventListener('click', closePayModal);
    var copyIban = document.getElementById('copyIban');
    if (copyIban) copyIban.addEventListener('click', function () {
      var iban = document.getElementById('xferIban').textContent.replace(/\s+/g, '');
      navigator.clipboard.writeText(iban).then(function () { toast('IBAN kopyalandı ✓'); });
    });
    pay.overlay.addEventListener('click', function (e) {
      if (e.target === pay.overlay) closePayModal();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pay.overlay.hidden) closePayModal();
    });
  }

  function buy(plan) {
    openPayModal(plan);
  }

  async function refresh() {
    var account = (await (await api('/api/account')).json()).user;
    var services = (await (await api('/api/services')).json()).services;
    var payments = (await (await api('/api/payments')).json()).payments;
    renderAccount(account);
    renderServices(services);
    renderPayments(payments);
  }

  async function load() {
    // oturum kontrolü
    var meRes = await api('/api/me');
    if (meRes.status === 401) { location.href = 'auth.html'; return; }
    var me = (await meRes.json()).user;
    if (me.role === 'admin') { location.href = 'admin.html'; return; }

    var cfg = await (await api('/api/config')).json();
    CFG = cfg;
    setPrices();

    var account = (await (await api('/api/account')).json()).user;
    var services = (await (await api('/api/services')).json()).services;
    var payments = (await (await api('/api/payments')).json()).payments;

    renderAccount(account);
    renderServices(services);
    renderPayments(payments);

    document.getElementById('panelMain').hidden = false;
  }

  // olaylar
  document.getElementById('logout').addEventListener('click', async function () {
    await api('/api/logout', { method: 'POST' });
    location.href = 'index.html';
  });
  document.getElementById('copyKey').addEventListener('click', function () {
    var key = document.getElementById('licenseKey').textContent;
    if (!key || key === '—') return;
    navigator.clipboard.writeText(key).then(function () { toast('Lisans anahtarı kopyalandı ✓'); });
  });
  document.querySelectorAll('[data-plan]').forEach(function (b) {
    b.addEventListener('click', function () { buy(b.dataset.plan); });
  });

  initPayModal();
  load().catch(function (e) { console.error(e); location.href = 'auth.html'; });
})();
