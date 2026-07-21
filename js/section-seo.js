// js/section-seo.js
// إدارة SEO لكل صفحة — بيانات تجريبية بالذاكرة، بانتظار الربط بالسيرفر.
(function () {
  'use strict';

  const FIELDS = [
    { key: 'metaTitleAr', label: 'Meta Title (عربي)', type: 'text' },
    { key: 'metaTitleEn', label: 'Meta Title (إنجليزي)', type: 'text' },
    { key: 'metaDescAr', label: 'Meta Description (عربي)', type: 'textarea', full: true },
    { key: 'metaDescEn', label: 'Meta Description (إنجليزي)', type: 'textarea', full: true },
    { key: 'keywords', label: 'الكلمات المفتاحية (مفصولة بفاصلة)', type: 'text', full: true },
    { key: 'ogImage', label: 'صورة Open Graph', type: 'image' },
  ];

  const DATA = {
    home: { metaTitleAr: 'العمران للمقاولات | الرئيسية', metaDescAr: 'شركة مقاولات وتطوير عقاري في المملكة العربية السعودية.', keywords: 'مقاولات, بناء فلل, تطوير عقاري, جدة' },
    about: { metaTitleAr: 'من نحن | العمران للمقاولات', metaDescAr: '' , keywords: ''},
    gallery: { metaTitleAr: 'معرض الأعمال | العمران للمقاولات', metaDescAr: '', keywords: '' },
  };

  const tabs = document.getElementById('seoTabs');
  const wrap = document.getElementById('seoFields');
  let currentPage = 'home';

  function fieldHtml(f, val) {
    const v = val || '';
    if (f.type === 'textarea') return `<div class="form-field${f.full ? ' full' : ''}"><label>${f.label}</label><textarea rows="2" data-bind="${f.key}">${v}</textarea></div>`;
    if (f.type === 'image') return `<div class="form-field${f.full ? ' full' : ''}"><label>${f.label}</label><div class="image-drop"><span class="thumb" aria-hidden="true">🖼</span><span>مقاس مقترح 1200×630</span></div></div>`;
    return `<div class="form-field${f.full ? ' full' : ''}"><label>${f.label}</label><input type="text" value="${v}" data-bind="${f.key}"></div>`;
  }

  function render() {
    const data = DATA[currentPage];
    wrap.innerHTML = FIELDS.map((f) => fieldHtml(f, data[f.key])).join('');
    wrap.querySelectorAll('[data-bind]').forEach((el) => {
      el.addEventListener('input', () => { data[el.getAttribute('data-bind')] = el.value; });
    });
  }

  tabs.querySelectorAll('.seg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.seg-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentPage = tab.getAttribute('data-page');
      render();
    });
  });

  document.getElementById('saveSeoBtn').addEventListener('click', () => {
    window.showToast('تم حفظ إعدادات SEO لهذه الصفحة (تجريبي)');
  });

  render();
})();
