// =============================================================
// سكريبت مشترك لكل صفحات الموقع (الرئيسية، من نحن، مشاريعنا)
// يشمل الآن: تحميل الإعدادات والبانرات من لوحة التحكم، عرض الأعمال
// ديناميكياً من قاعدة البيانات، معرض صور بالسحب لكل عمل، وستديو
// تصفح صور بملء الشاشة (Lightbox)، وتوسيط الشعار على الجوال.
// كل جزء يتحقق أولاً من وجود عناصره في الصفحة قبل التشغيل.
// =============================================================

const CATEGORY_LABELS = { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي' };

/* ---------------- القائمة على الجوال + توسيط الشعار عند الفتح ---------------- */
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const siteHeader = document.querySelector('.site-header');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (siteHeader) siteHeader.classList.toggle('nav-open', open);
  });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      if (siteHeader) siteHeader.classList.remove('nav-open');
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) {
      mainNav.classList.remove('open');
      if (siteHeader) siteHeader.classList.remove('nav-open');
    }
  });
}

/* ---------------- تمييز الرابط النشط أثناء التمرير ---------------- */
const trackedSections = ['home', 'about', 'services', 'projects', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);
if (trackedSections.length) {
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => {
          const href = l.getAttribute('href') || '';
          l.classList.toggle('is-active', href === '#' + id || href.endsWith('#' + id));
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  trackedSections.forEach(s => navObserver.observe(s));
}

/* ---------------- ظهور تدريجي عند التمرير ---------------- */
function observeReveal(scope) {
  const els = (scope || document).querySelectorAll('.reveal:not(.in)');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .14 });
  els.forEach(el => io.observe(el));
}
observeReveal(document);

/* ---------------- Toast مشترك ---------------- */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

/* ---------------- نموذج التواصل (الصفحة الرئيسية فقط) ---------------- */
const contactForm = document.getElementById('quoteForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.name.value.trim();
    const phone = contactForm.phone.value.trim();
    const ptype = contactForm.ptype.value;
    const message = contactForm.message ? contactForm.message.value.trim() : '';
    const consent = document.getElementById('consent').checked;

    if (!name || phone.length < 9 || !ptype || !consent) {
      showToast('فضلاً أكمل البيانات المطلوبة بشكل صحيح.');
      return;
    }
    const waText = `مرحبا العمران العقارية
الاسم: ${name}
الجوال: ${phone}
نوع المشروع: ${ptype}
الرسالة: ${message || '-'}`;
    const waUrl = 'https://wa.me/966555592666?text=' + encodeURIComponent(waText);
    window.open(waUrl, '_blank');
    showToast('تم فتح واتساب، سنتواصل معك قريباً.');
    contactForm.reset();
  });
}

/* ---------------- الزر العائم للتواصل ---------------- */
const fab = document.getElementById('contactFab');
const fabToggle = document.getElementById('fabToggle');
if (fab && fabToggle) {
  fabToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = fab.classList.toggle('open');
    fabToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target)) {
      fab.classList.remove('open');
      fabToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* =========================================================
   معرض صور المشروع داخل البطاقة: سحب يمين/يسار + أسهم + نقاط
   قابل للتطبيق على أي عنصر [data-gallery] يُنشأ حتى بعد تحميل
   الصفحة (يُستدعى من initGallery بعد بناء البطاقات ديناميكياً)
   ========================================================= */
function initGallery(gallery) {
  const slides = gallery.querySelector('.project-slides');
  if (!slides || gallery.dataset.galleryReady) return;
  gallery.dataset.galleryReady = '1';

  const imgs = Array.from(slides.children);
  const dotsWrap = gallery.querySelector('.thumb-dots');
  const prevBtn = gallery.querySelector('.thumb-nav.prev');
  const nextBtn = gallery.querySelector('.thumb-nav.next');
  let index = 0, startX = 0, currentX = 0, dragging = false;

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    imgs.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'thumb-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'الانتقال للصورة ' + (i + 1));
      dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
      dotsWrap.appendChild(dot);
    });
  }
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  function update() {
    slides.style.transform = `translateX(${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }
  function goTo(i) { index = Math.max(0, Math.min(imgs.length - 1, i)); update(); }
  function next() { goTo((index + 1) % imgs.length); }
  function prev() { goTo((index - 1 + imgs.length) % imgs.length); }

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  gallery.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dragging = true; }, { passive: true });
  gallery.addEventListener('touchmove', (e) => { if (dragging) currentX = e.touches[0].clientX; }, { passive: true });
  gallery.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    const diff = currentX - startX;
    if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
    startX = 0; currentX = 0;
  });
  gallery.addEventListener('mousedown', (e) => { startX = e.clientX; dragging = true; });
  window.addEventListener('mousemove', (e) => { if (dragging) currentX = e.clientX; });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    const diff = currentX - startX;
    if (Math.abs(diff) > 40) { diff < 0 ? next() : prev(); }
    startX = 0; currentX = 0;
  });

  update();
  gallery._getIndex = () => index;
}
document.querySelectorAll('[data-gallery]').forEach(initGallery);

/* =========================================================
   ستديو تصفح الصور (Lightbox): يفتح بملء الشاشة عند الضغط على
   صورة المشروع أو اسمه، ويعرض كل صور نفس العمل بالتنقل الكامل
   ========================================================= */
const lightbox = (function () {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay hidden';
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="إغلاق">×</button>
    <button type="button" class="lightbox-nav prev" aria-label="السابق">‹</button>
    <div class="lightbox-stage"><img alt=""></div>
    <button type="button" class="lightbox-nav next" aria-label="التالي">›</button>
    <div class="lightbox-counter"></div>
    <div class="lightbox-info">
      <h3 class="lightbox-title"></h3>
      <p class="lightbox-desc"></p>
    </div>
    <div class="lightbox-thumbs"></div>
  `;
  document.body.appendChild(overlay);

  let images = [];
  let idx = 0;
  const imgEl = overlay.querySelector('img');
  const counterEl = overlay.querySelector('.lightbox-counter');
  const thumbsEl = overlay.querySelector('.lightbox-thumbs');
  const titleEl = overlay.querySelector('.lightbox-title');
  const descEl = overlay.querySelector('.lightbox-desc');

  function renderThumbs() {
    thumbsEl.innerHTML = images.map((src, i) => `
      <button type="button" class="lightbox-thumb${i === idx ? ' is-active' : ''}" data-i="${i}" aria-label="الصورة ${i + 1}">
        <img src="${src}" alt="">
      </button>
    `).join('');
    thumbsEl.querySelectorAll('.lightbox-thumb').forEach(btn => {
      btn.addEventListener('click', () => { idx = parseInt(btn.dataset.i, 10); render(); });
    });
  }

  function render() {
    if (!images.length) return;
    imgEl.src = images[idx];
    counterEl.textContent = `${idx + 1} / ${images.length}`;
    thumbsEl.querySelectorAll('.lightbox-thumb').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === idx);
    });
    const activeThumb = thumbsEl.children[idx];
    if (activeThumb && activeThumb.scrollIntoView) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }
  function open(imgList, startIndex, title, description) {
    images = imgList && imgList.length ? imgList : [];
    idx = Math.max(0, Math.min(images.length - 1, startIndex || 0));
    if (!images.length) return;
    titleEl.textContent = title || '';
    titleEl.style.display = title ? '' : 'none';
    descEl.textContent = description || '';
    descEl.style.display = description ? '' : 'none';
    renderThumbs();
    render();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
  function next() { idx = (idx + 1) % images.length; render(); }
  function prev() { idx = (idx - 1 + images.length) % images.length; render(); }

  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.querySelector('.lightbox-nav.next').addEventListener('click', next);
  overlay.querySelector('.lightbox-nav.prev').addEventListener('click', prev);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') prev();
    if (e.key === 'ArrowLeft') next();
  });

  return { open, close };
})();

function wireLightboxForCard(card, images, workTitle, workDescription) {
  if (!images || !images.length) return;
  const thumb = card.querySelector('.project-thumb');
  const titleEl = card.querySelector('.project-body h3');
  const openFromThumb = () => {
    const gallery = card.querySelector('[data-gallery]');
    const startIndex = gallery && gallery._getIndex ? gallery._getIndex() : 0;
    lightbox.open(images, startIndex, workTitle, workDescription);
  };
  if (thumb) {
    thumb.style.cursor = 'zoom-in';
    thumb.addEventListener('click', (e) => {
      if (e.target.closest('.thumb-nav') || e.target.closest('.thumb-dot')) return;
      openFromThumb();
    });
  }
  if (titleEl) {
    titleEl.style.cursor = 'zoom-in';
    titleEl.addEventListener('click', openFromThumb);
  }
}

/* =========================================================
   بناء بطاقة مشروع ديناميكياً من بيانات لوحة التحكم
   ========================================================= */
function buildProjectCard(work, logoSrc) {
  const article = document.createElement('article');
  article.className = 'project-card';
  article.dataset.cat = work.category;

  const images = (work.images && work.images.length) ? work.images : [];
  const slidesHtml = images.map((src, i) =>
    `<img src="${src}" alt="${escapeHtml(work.title)} - صورة ${i + 1}" loading="lazy">`
  ).join('');

  article.innerHTML = `
    <div class="project-thumb" data-gallery>
      <div class="project-slides">${slidesHtml}</div>
      ${images.length > 1 ? `
        <button type="button" class="thumb-nav prev" aria-label="الصورة السابقة">‹</button>
        <button type="button" class="thumb-nav next" aria-label="الصورة التالية">›</button>
        <div class="thumb-dots"></div>
      ` : ''}
      ${logoSrc ? `<div class="project-logo-badge"><img src="${logoSrc}" alt="شعار العمران"></div>` : ''}
      <span class="project-tag">${CATEGORY_LABELS[work.category] || work.category}</span>
    </div>
    <div class="project-body">
      <h3>${escapeHtml(work.title)}</h3>
      <div class="project-meta">${escapeHtml(work.city)}${work.meta ? ' <span class="meta-dot"></span> ' + escapeHtml(work.meta) : ''}</div>
      ${work.area ? `<div class="project-foot"><span>المساحة</span><strong>${escapeHtml(work.area)}</strong></div>` : ''}
    </div>
  `;

  const galleryEl = article.querySelector('[data-gallery]');
  if (galleryEl) initGallery(galleryEl);
  wireLightboxForCard(article, images, work.title, work.description);

  return article;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* =========================================================
   جلب الإعدادات العامة (بانرات/خلفيات/سوشيال/شعار) وتطبيقها
   ========================================================= */
async function loadPublicSettings() {
  try {
    const res = await fetch('/api/settings/public');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function applySocialLinks(social) {
  if (!social) return;
  document.querySelectorAll('[data-social]').forEach(a => {
    const key = a.getAttribute('data-social');
    if (social[key]) a.setAttribute('href', social[key]);
  });
}

function applyHeroBackground(selector, url) {
  if (!url) return;
  const section = document.querySelector(selector);
  if (!section) return;
  section.style.setProperty('--hero-bg-image', `url('${url}')`);
  section.classList.add('has-custom-bg');
}

function applyLogo(logoUrl) {
  if (!logoUrl) return;
  document.querySelectorAll('.brand-mark img').forEach(img => { img.src = logoUrl; });
}

function applyFavicon(url) {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

/* ---------------- بانرات الصفحة الرئيسية (3 بانرات، تبديل كل 3 ثوانٍ) ---------------- */
function setupBanners(banners, bannerLogo, bannerTextVisible) {
  const wrap = document.getElementById('heroBanners');
  if (!wrap) return;
  const usable = (banners || []).filter(b => b && b.image);
  if (!usable.length) return; // يبقى الشكل الافتراضي كما هو إن لم تُرفع بانرات بعد

  const showLogo = !!(bannerLogo && bannerLogo.visible && bannerLogo.image);
  const showText = bannerTextVisible !== false;

  wrap.innerHTML = usable.map((b, i) => `
    <div class="hero-banner-slide ${i === 0 ? 'is-active' : ''}" style="background-image:url('${b.image}')">
      <div class="hero-banner-overlay"></div>
      <div class="hero-banner-content">
        ${showLogo ? `<div class="hero-banner-logo"><img src="${bannerLogo.image}" alt="شعار العمران"></div>` : '<div></div>'}
        ${showText ? `
        <div class="hero-banner-text">
          <strong class="ar">${escapeHtml(b.titleAr || '')}</strong>
          <span class="en">${escapeHtml(b.titleEn || '')}</span>
        </div>` : ''}
      </div>
    </div>
  `).join('');

  if (usable.length > 1) {
    let current = 0;
    setInterval(() => {
      const slides = wrap.querySelectorAll('.hero-banner-slide');
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 3000);
  }
}

/* ---------------- تحميل الأعمال (المميزة أو الكاملة) ---------------- */
async function loadPublicWorks() {
  try {
    const res = await fetch('/api/works/public');
    if (!res.ok) return [];
    const data = await res.json();
    return data.works || [];
  } catch (e) {
    return [];
  }
}

async function renderFeaturedWorks(projectLogo) {
  const grid = document.getElementById('featuredWorksGrid');
  if (!grid) return;
  const works = await loadPublicWorks();
  const featured = works.filter(w => w.pinned).slice(0, 6);
  const logoSrc = (projectLogo && projectLogo.visible && projectLogo.image) ? projectLogo.image : '';

  if (!featured.length) {
    grid.innerHTML = '<p class="muted" style="text-align:center;grid-column:1/-1;">لا توجد أعمال مميزة مثبّتة حالياً.</p>';
    return;
  }
  grid.innerHTML = '';
  featured.forEach(w => grid.appendChild(buildProjectCard(w, logoSrc)));
  observeReveal(grid);
}

async function renderAllWorks(projectLogo) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const works = await loadPublicWorks();
  const logoSrc = (projectLogo && projectLogo.visible && projectLogo.image) ? projectLogo.image : '';

  if (!works.length) {
    grid.innerHTML = '<p class="muted" style="text-align:center;grid-column:1/-1;">لا توجد أعمال منشورة حالياً.</p>';
    return;
  }
  grid.innerHTML = '';
  works.forEach(w => grid.appendChild(buildProjectCard(w, logoSrc)));
  observeReveal(grid);

  const pills = document.querySelectorAll('.pill');
  const cards = () => document.querySelectorAll('#projectsGrid .project-card');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('is-active'));
      p.classList.add('is-active');
      const f = p.dataset.filter;
      cards().forEach(c => {
        const show = f === 'all' || c.dataset.cat === f;
        c.style.display = show ? '' : 'none';
      });
    });
  });
}

/* =========================================================
   إحصاءات الصفحة الرئيسية (سنوات الخبرة، المشاريع، المدن، الرضا)
   ========================================================= */
function applyStats(stats) {
  if (!stats) return;
  document.querySelectorAll('[data-stat]').forEach(el => {
    const key = el.dataset.stat;
    if (stats[key] !== undefined && stats[key] !== '') {
      el.textContent = stats[key];
    }
  });
}

/* =========================================================
   خدمات الصفحة الرئيسية — تُبنى بالكامل ديناميكياً، وتدعم أي
   عدد من الخدمات (وليس 4 فقط)؛ الأيقونات الأربع الأصلية تتكرر
   بالترتيب حفاظاً على الشكل الحالي حتى مع إضافة خدمات جديدة.
   ========================================================= */
const SERVICE_ICONS = [
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>',
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="8" height="18" rx="1"></rect><rect x="14" y="8" width="6" height="13" rx="1"></rect></svg>',
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21V9l4-3v0l4 3 4-2 6 2v12H3z"/><path d="M7 13v4M12 13v4M17 13v4"/></svg>',
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21l7-7"/><path d="M14.5 6.5l3 3L7 20H4v-3L14.5 6.5z"/><path d="M13 7l3 3"/></svg>',
];

function applyServices(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  if (!Array.isArray(services) || services.length === 0) return;

  grid.innerHTML = services.map((svc, i) => `
    <article class="service-card">
      <div class="svc-icon" aria-hidden="true">${SERVICE_ICONS[i % SERVICE_ICONS.length]}</div>
      <h3>${escapeHtml(svc.title || '')}</h3>
      <p>${escapeHtml(svc.description || '')}</p>
    </article>
  `).join('');
}

/* =========================================================
   فريق العمل (صفحة "من نحن") — يُبنى بالكامل ديناميكياً
   ========================================================= */
function applyTeam(team) {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  if (!Array.isArray(team) || team.length === 0) {
    grid.innerHTML = '<p class="muted">لم تتم إضافة أعضاء فريق بعد.</p>';
    return;
  }
  grid.innerHTML = team.map(member => {
    const initials = (member.name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
    return `
      <article class="team-card">
        <div class="team-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
        <h3>${escapeHtml(member.name)}</h3>
        <span>${escapeHtml(member.role || '')}</span>
      </article>
    `;
  }).join('');
}

/* =========================================================
   رسالة الترحيب عند أول زيارة (تظهر مرة واحدة لكل متصفح)
   ========================================================= */
const WELCOME_SEEN_KEY = 'alomran_welcome_seen';

function showWelcomeMessage(welcome) {
  if (!welcome || !welcome.enabled) return;
  if (localStorage.getItem(WELCOME_SEEN_KEY)) return;

  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.innerHTML = `
    <div class="welcome-card">
      <button type="button" class="welcome-close" aria-label="إغلاق">×</button>
      <h2>${escapeHtml(welcome.title || '')}</h2>
      <p>${escapeHtml(welcome.message || '')}</p>
      <button type="button" class="btn btn-dark welcome-ok">${escapeHtml(welcome.buttonText || 'حسناً')}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function dismiss() {
    overlay.classList.remove('is-visible');
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    clearTimeout(autoTimer);
    setTimeout(() => overlay.remove(), 300);
  }
  overlay.querySelector('.welcome-close').addEventListener('click', dismiss);
  overlay.querySelector('.welcome-ok').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });

  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  // تختفي الرسالة تلقائياً بعد المدة المحددة (بالثواني)، حتى لو لم يتفاعل الزائر
  const seconds = Number(welcome.durationSeconds) > 0 ? Number(welcome.durationSeconds) : 6;
  const autoTimer = setTimeout(dismiss, seconds * 1000);
}

/* =========================================================
   محتوى الصفحات النصي القابل للتعديل من لوحة التحكم:
   الهيرو، قصة الشركة، الرسالة والرؤية، القيم، المسيرة الزمنية،
   والاعتمادات. كل جزء يتحقق من وجود عنصره بالصفحة قبل التطبيق.
   ========================================================= */
const CERT_ICONS = [
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 6L9 17l-5-5"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
];

function applyContent(content) {
  if (!content) return;

  const heroTitleEl = document.getElementById('heroTitle');
  if (heroTitleEl && content.heroTitle) {
    heroTitleEl.innerHTML = escapeHtml(content.heroTitle).replace(/\n/g, '<br>');
  }
  const heroSubEl = document.getElementById('heroSubtitle');
  if (heroSubEl && content.heroSubtitle) heroSubEl.textContent = content.heroSubtitle;

  const heroImgEl = document.getElementById('heroImage');
  if (heroImgEl && content.heroImage) heroImgEl.src = content.heroImage;

  const aboutTeaserImgEl = document.getElementById('aboutTeaserImage');
  if (aboutTeaserImgEl && content.aboutTeaserImage) aboutTeaserImgEl.src = content.aboutTeaserImage;

  const aboutStoryImgEl = document.getElementById('aboutStoryImage');
  if (aboutStoryImgEl && content.aboutStoryImage) aboutStoryImgEl.src = content.aboutStoryImage;

  const storyEl = document.getElementById('aboutStory');
  if (storyEl && Array.isArray(content.aboutStory) && content.aboutStory.length) {
    storyEl.innerHTML = content.aboutStory
      .filter(p => p && p.trim())
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
  }

  const missionEl = document.getElementById('missionText');
  if (missionEl && content.mission) missionEl.textContent = content.mission;
  const visionEl = document.getElementById('visionText');
  if (visionEl && content.vision) visionEl.textContent = content.vision;

  if (Array.isArray(content.values)) {
    document.querySelectorAll('[data-value]').forEach(card => {
      const idx = parseInt(card.dataset.value, 10);
      const v = content.values[idx];
      if (!v) return;
      const t = card.querySelector('[data-field="title"]');
      const d = card.querySelector('[data-field="description"]');
      if (t && v.title) t.textContent = v.title;
      if (d && v.description) d.textContent = v.description;
    });
  }

  const timelineGrid = document.getElementById('timelineGrid');
  if (timelineGrid) {
    if (Array.isArray(content.timeline) && content.timeline.length) {
      timelineGrid.innerHTML = content.timeline.map(item => `
        <div class="timeline-item">
          <div class="timeline-dot" aria-hidden="true"></div>
          <div class="timeline-year">${escapeHtml(item.year || '')}</div>
          <h3>${escapeHtml(item.title || '')}</h3>
          <p>${escapeHtml(item.description || '')}</p>
        </div>
      `).join('');
    } else {
      timelineGrid.innerHTML = '<p class="muted">لم تتم إضافة محطات بعد.</p>';
    }
  }

  const certsGrid = document.getElementById('certsGrid');
  if (certsGrid) {
    if (Array.isArray(content.certifications) && content.certifications.length) {
      certsGrid.innerHTML = content.certifications.map((text, i) => `
        <div class="cert-card">
          <div class="cert-icon" aria-hidden="true">${CERT_ICONS[i % CERT_ICONS.length]}</div>
          <span>${escapeHtml(text)}</span>
        </div>
      `).join('');
    } else {
      certsGrid.innerHTML = '<p class="muted">لم تتم إضافة اعتمادات بعد.</p>';
    }
  }
}

/* ---------------- تشغيل كل شيء متعلق بالبيانات الديناميكية ---------------- */
(async function initDynamicContent() {
  const settings = await loadPublicSettings();
  if (settings) {
    applyLogo(settings.logo);
    applyFavicon(settings.favicon);
    applySocialLinks(settings.social);
    applyHeroBackground('.page-hero[data-hero="about"]', settings.aboutHeroBg);
    applyHeroBackground('.page-hero[data-hero="projects"]', settings.projectsHeroBg);
    setupBanners(settings.banners, settings.bannerLogo, settings.bannerTextVisible);
    applyStats(settings.stats);
    applyServices(settings.services);
    applyTeam(settings.team);
    applyContent(settings.content);
    showWelcomeMessage(settings.welcomeMessage);
  }
  const projectLogo = settings ? settings.projectLogo : null;
  await renderFeaturedWorks(projectLogo);
  await renderAllWorks(projectLogo);
})();
