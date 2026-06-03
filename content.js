/* ============ AKADEMIA — site içerik motoru ============ */
/* Fiyatlandırma/içerik artık backend'de (PostgreSQL) saklanır.
   Admin panelinden düzenlenir, /api/content üzerinden yayınlanır. */
(function () {
  window.AKADEMIA_DEFAULTS = {
    heroSub: "Ders programından muhasebeye, yoklamadan veli iletişimine kadar 40'tan fazla modül. Akademia; sade, hızlı ve güvenilir bir arayüzle baştan sona son kullanıcı için tasarlandı.",
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
      'E-posta ve sohbet desteği'
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
      'Fiyat artışlarından etkilenmezsiniz'
    ]
  };

  // backend'den içerik çek (hata olursa varsayılanlara düş)
  window.AKADEMIA_CONTENT = function () {
    return fetch('/api/content', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (saved) {
        var out = {};
        for (var k in window.AKADEMIA_DEFAULTS) out[k] = window.AKADEMIA_DEFAULTS[k];
        for (var j in saved) if (saved[j] != null) out[j] = saved[j];
        return out;
      });
  };

  window.applyContent = function () {
    return window.AKADEMIA_CONTENT().then(function (c) {
      document.querySelectorAll('[data-edit]').forEach(function (el) {
        var k = el.dataset.edit;
        if (c[k] != null && !Array.isArray(c[k])) el.textContent = c[k];
      });
      ['y', 't'].forEach(function (p) {
        var ul = document.getElementById(p + '_feats');
        var arr = c[p + '_feats'];
        if (ul && Array.isArray(arr)) ul.innerHTML = arr.map(function (f) { return '<li>' + f + '</li>'; }).join('');
      });
      return c;
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.applyContent);
  } else {
    window.applyContent();
  }
})();
