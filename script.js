/* ============ AKADEMIA — etkileşimler (resmî sürüm) ============ */
(function () {
  'use strict';

  /* ---------- tutarlı çizgi ikon seti ---------- */
  const S = (inner) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const ICON = {
    grid: S('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    calendar: S('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    shield: S('<path d="M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z"/>'),
    users: S('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-2-5"/>'),
    cap: S('<path d="M3 9 12 5l9 4-9 4-9-4Z"/><path d="M7 11v5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-5"/>'),
    book: S('<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2V5ZM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V5Z"/>'),
    door: S('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M15 12h.01"/>'),
    idcard: S('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 4-1.5 4.5 0M14 10h4M14 14h3"/>'),
    pen: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>'),
    checksq: S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>'),
    award: S('<circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/>'),
    clipboard: S('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/>'),
    file: S('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    dots: S('<circle cx="6" cy="6" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="18" cy="6" r="1.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/><circle cx="6" cy="18" r="1.4"/><circle cx="12" cy="18" r="1.4"/><circle cx="18" cy="18" r="1.4"/>'),
    layout: S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>'),
    smile: S('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'),
    heart: S('<path d="M12 20S4 15 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11Z"/>'),
    trophy: S('<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 17h6M10 17v3M14 17v3M9 20h6"/>'),
    crown: S('<path d="M3 7l4 4 5-6 5 6 4-4-2 12H5L3 7Z"/>'),
    archive: S('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>'),
    megaphone: S('<path d="m3 11 14-6v14L3 13v-2Z"/><path d="M3 11H2v2h1M7 14v4a2 2 0 0 0 4 0"/>'),
    swap: S('<path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8"/>'),
    star: S('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z"/>'),
    plane: S('<path d="M10 15 3 13l1.5-2 5 1 4-5c.7-.8 2.5-1.5 3 0 .4 1.3-.4 2.4-1 3l-3.5 4 1 5-2 1-2-5Z"/>'),
    utensils: S('<path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10M16 3c-1.5 0-3 1.5-3 4s1 4 3 4v10"/>'),
    card: S('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
    books: S('<path d="M5 4h3v16H5zM10 4h3v16h-3zM16 5l3 .5-2.5 14.5-3-.5L16 5Z"/>'),
    bus: S('<rect x="3" y="5" width="16" height="11" rx="2"/><path d="M3 11h16M7 16v2M15 16v2M19 9h2v4h-2"/><circle cx="7" cy="16" r="1"/><circle cx="15" cy="16" r="1"/>'),
    monitor: S('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    send: S('<path d="m3 11 18-7-7 18-2.5-8L3 11Z"/>'),
    listcheck: S('<path d="M11 6h9M11 12h9M11 18h9M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>'),
    message: S('<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Z"/>'),
    gift: S('<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8 14 6 16.5 4.5 12 8 12 8Z"/>'),
    box: S('<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>'),
    note: S('<path d="M5 3h11l3 3v15H5V3Z"/><path d="M14 3v4h4M8 12h8M8 16h5"/>'),
    wallet: S('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14h2"/>'),
    settings: S('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 11-3"/><circle cx="18" cy="16" r="2.5"/><path d="M18 12v1.5M18 18.5V20M21.5 16H20M16 16h-1.5"/>'),
  };

  /* ---------- modüller (görsellerdeki tüm kalemler) ---------- */
  const MODULES = [
    { cat: 'Genel', items: [['grid','Panel'],['calendar','Ders Programı'],['clock','Ders Saatleri'],['shield','Program Kontrol']] },
    { cat: 'Yönetim', items: [['users','Öğretmenler'],['cap','Sınıflar'],['book','Dersler'],['door','Derslikler'],['idcard','Öğrenciler'],['users','Veliler']] },
    { cat: 'Akademik', items: [['pen','Günlük Takip'],['checksq','Yoklama'],['award','Notlar'],['clipboard','Ödevler'],['file','Sınavlar'],['dots','Kelebek Dağıtım'],['layout','Oturma Düzeni'],['smile','Davranış'],['heart','Rehberlik'],['trophy','Sınıf Geçme'],['crown','Sınıf Performansı'],['archive','Arşiv'],['megaphone','Duyurular'],['swap','Vekalet & İzin']] },
    { cat: 'Okul Hayatı', items: [['calendar','Takvim'],['shield','Nöbet Listesi'],['star','Etüt & Kurslar'],['plane','Geziler'],['trophy','Spor & Kulüpler'],['utensils','Yemekhane'],['card','Kantin Kartı'],['books','Kütüphane'],['bus','Servis'],['monitor','Akıllı Tahta']] },
    { cat: 'Etkileşim', items: [['send','Toplu İletişim'],['listcheck','Anketler'],['message','Öneri & Talep']] },
    { cat: 'Yardımcılar', items: [['file','Belge Üretici'],['clipboard','Ziyaretçi Defteri'],['gift','Doğum Günleri'],['box','Kayıp Eşya'],['note','Hızlı Notlar']] },
    { cat: 'Mali & Sistem', items: [['wallet','Muhasebe'],['settings','Hesap Yönetimi']] },
  ];

  const modTabs = document.getElementById('modTabs');
  const modPanel = document.getElementById('modPanel');
  if (modTabs && modPanel) {
    const renderPanel = (gi) => {
      const chips = MODULES[gi].items.map(([icon, name], i) =>
        `<div class="mod-chip" style="--d:${(i * 0.03).toFixed(2)}s"><span class="mi-ic">${ICON[icon] || ICON.grid}</span><span>${name}</span></div>`
      ).join('');
      modPanel.innerHTML = `<div class="mod-panel-grid">${chips}</div>`;
    };
    MODULES.forEach((group, gi) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'mod-tab' + (gi === 0 ? ' active' : '');
      t.innerHTML = `${group.cat}<span class="mt-count">${group.items.length}</span>`;
      t.addEventListener('click', () => {
        modTabs.querySelectorAll('.mod-tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        renderPanel(gi);
      });
      modTabs.appendChild(t);
    });
    renderPanel(0);
  }

  /* ---------- nav scrolled state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  /* ---------- count up ---------- */
  function animateCount(el) {
    const target = +el.dataset.count;
    const out = el.querySelector('.num') || el;
    const dur = 1300, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      out.textContent = Math.round(target * eased).toLocaleString('tr-TR');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      animateCount(e.target);
      cio.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((c) => cio.observe(c));

  /* ---------- tıklanabilir demo paneli ---------- */
  const wmMain = document.querySelector('.wm-main');
  const sideItems = document.querySelectorAll('.ws-item[data-view]');

  const sb = (s) => `<div class="sblock sb-${s[2]}">${s[0]}<small>${s[1]}</small></div>`;
  const VIEWS = {
    panel: `
      <div class="wm-head"><h5>Genel Durum</h5><span>2025–2026 · Güz</span></div>
      <div class="wm-stats">
        <div class="wm-stat"><div class="num" data-count="1240">0</div><div class="lbl">Öğrenci</div></div>
        <div class="wm-stat"><div class="num" data-count="86">0</div><div class="lbl">Öğretmen</div></div>
        <div class="wm-stat"><div class="num" data-count="98">0</div><div class="lbl">Yoklama %</div></div>
      </div>
      <div class="wm-chart">
        <div class="bars"><span style="--h:46%"></span><span style="--h:70%"></span><span style="--h:55%"></span><span style="--h:82%"></span><span style="--h:62%"></span><span style="--h:90%"></span><span style="--h:74%"></span><span style="--h:88%"></span></div>
        <div class="chart-cap">Haftalık devam ve etkinlik dağılımı</div>
      </div>
      <div class="wm-rows">
        <div class="wm-row"><span class="tick"></span>Yoklama tamamlandı · 9-A</div>
        <div class="wm-row"><span class="tick g"></span>Veli toplantısı · Cuma 15:00</div>
      </div>`,

    program: `
      <div class="wm-head"><h5>Ders Programı</h5><span>9-A · Haftalık</span></div>
      <div class="sched">
        <div class="scol"><span class="sday">Pzt</span>${sb(['Mat','9:00',1])}${sb(['Fen','9:50',2])}${sb(['Türkçe','10:40',3])}</div>
        <div class="scol"><span class="sday">Sal</span>${sb(['Tarih','9:00',3])}${sb(['Mat','9:50',1])}${sb(['Resim','10:40',4])}</div>
        <div class="scol"><span class="sday">Çar</span>${sb(['İng.','9:00',2])}${sb(['Fen','9:50',2])}${sb(['Beden','10:40',4])}</div>
        <div class="scol"><span class="sday">Per</span>${sb(['Türkçe','9:00',3])}${sb(['Mat','9:50',1])}${sb(['Müzik','10:40',4])}</div>
        <div class="scol"><span class="sday">Cum</span>${sb(['Coğ.','9:00',3])}${sb(['İng.','9:50',2])}${sb(['Reh.','10:40',1])}</div>
      </div>`,

    saatler: `
      <div class="wm-head"><h5>Ders Saatleri</h5><span>Zil Programı</span></div>
      <div class="periods">
        <div class="period"><span class="pnum">1</span><span class="plabel">1. Ders</span><span class="ptime">09:00 – 09:40</span></div>
        <div class="period"><span class="pnum">2</span><span class="plabel">2. Ders</span><span class="ptime">09:50 – 10:30</span></div>
        <div class="period brk"><span class="pnum">☕</span><span class="plabel">Teneffüs</span><span class="ptime">10:30 – 10:40</span></div>
        <div class="period"><span class="pnum">3</span><span class="plabel">3. Ders</span><span class="ptime">10:40 – 11:20</span></div>
        <div class="period"><span class="pnum">4</span><span class="plabel">4. Ders</span><span class="ptime">11:30 – 12:10</span></div>
      </div>`,

    ogretmenler: `
      <div class="wm-head"><h5>Öğretmenler</h5><span>86 kayıt</span></div>
      <div class="tlist">
        <div class="trow"><span class="tav">AY</span><div class="tinfo"><div class="tn">Ayşe Yılmaz</div><div class="tb">Matematik</div></div><span class="tbadge on">Derste</span></div>
        <div class="trow"><span class="tav g">MK</span><div class="tinfo"><div class="tn">Mehmet Kaya</div><div class="tb">Fen Bilimleri</div></div><span class="tbadge on">Derste</span></div>
        <div class="trow"><span class="tav">ED</span><div class="tinfo"><div class="tn">Elif Demir</div><div class="tb">Türkçe</div></div><span class="tbadge off">Boş</span></div>
        <div class="trow"><span class="tav g">CS</span><div class="tinfo"><div class="tn">Can Şahin</div><div class="tb">İngilizce</div></div><span class="tbadge off">İzinli</span></div>
      </div>`,

    siniflar: `
      <div class="wm-head"><h5>Sınıflar</h5><span>42 şube</span></div>
      <div class="cgrid">
        <div class="ccard"><div class="cn">9-A</div><div class="cs">30 öğrenci</div><div class="cbar"><i style="--w:92%"></i></div></div>
        <div class="ccard"><div class="cn">9-B</div><div class="cs">28 öğrenci</div><div class="cbar"><i style="--w:78%"></i></div></div>
        <div class="ccard"><div class="cn">10-A</div><div class="cs">32 öğrenci</div><div class="cbar"><i style="--w:85%"></i></div></div>
        <div class="ccard"><div class="cn">10-B</div><div class="cs">29 öğrenci</div><div class="cbar"><i style="--w:70%"></i></div></div>
        <div class="ccard"><div class="cn">11-A</div><div class="cs">26 öğrenci</div><div class="cbar"><i style="--w:88%"></i></div></div>
        <div class="ccard"><div class="cn">12-A</div><div class="cs">24 öğrenci</div><div class="cbar"><i style="--w:95%"></i></div></div>
      </div>`,

    dersler: `
      <div class="wm-head"><h5>Dersler</h5><span>Müfredat</span></div>
      <div class="llist">
        <div class="lrow"><span class="lic">${ICON.cap}</span><div class="lmain"><div class="lname">Matematik</div><div class="lbar"><i style="--w:90%"></i></div></div><span class="lhrs"><b>6</b>saat/hafta</span></div>
        <div class="lrow"><span class="lic">${ICON.book}</span><div class="lmain"><div class="lname">Türkçe</div><div class="lbar"><i style="--w:80%"></i></div></div><span class="lhrs"><b>5</b>saat/hafta</span></div>
        <div class="lrow"><span class="lic">${ICON.star}</span><div class="lmain"><div class="lname">Fen Bilimleri</div><div class="lbar"><i style="--w:66%"></i></div></div><span class="lhrs"><b>4</b>saat/hafta</span></div>
        <div class="lrow"><span class="lic">${ICON.send}</span><div class="lmain"><div class="lname">İngilizce</div><div class="lbar"><i style="--w:60%"></i></div></div><span class="lhrs"><b>4</b>saat/hafta</span></div>
      </div>`,
  };

  let activeView = 'panel';
  function showView(id, item) {
    if (!VIEWS[id] || id === activeView) return;
    activeView = id;
    sideItems.forEach((s) => s.classList.toggle('active', s === item));
    wmMain.classList.add('leaving');
    setTimeout(() => {
      wmMain.innerHTML = VIEWS[id];
      wmMain.classList.remove('leaving');
      wmMain.querySelectorAll('[data-count]').forEach(animateCount);
    }, 190);
  }
  sideItems.forEach((item) => {
    const go = () => showView(item.dataset.view, item);
    item.addEventListener('click', go);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  /* "+40 Özellik" → modüller bölümüne kaydır */
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    const go = () => document.getElementById(el.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  /* ---------- mobil menü ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (burger) {
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    }
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  burger?.addEventListener('click', () =>
    setMenu(!document.body.classList.contains('menu-open'))
  );
  menuBackdrop?.addEventListener('click', () => setMenu(false));
  mobileMenu?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setMenu(false))
  );
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && document.body.classList.contains('menu-open')) setMenu(false);
  });

})();
