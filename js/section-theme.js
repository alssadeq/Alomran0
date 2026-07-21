// js/section-theme.js
// مدير الهوية البصرية (Theme Manager) — كل تغيير بيتحدث فوراً في لوحة
// المعاينة على الجانب عبر CSS Custom Properties. الحفظ الفعلي (تطبيقه على
// الموقع الحقيقي) هيتربط لاحقاً بالسيرفر.
(function () {
  'use strict';

  const preview = document.getElementById('themePreview');

  // ============================= الألوان ============================= //
  const COLORS = [
    { key: 'primary',   label: 'اللون الأساسي (Primary)',  value: '#1E2A32' },
    { key: 'secondary', label: 'اللون الثانوي (Secondary)', value: '#C9B895' },
    { key: 'accent',    label: 'لون التمييز (Accent)',      value: '#A44B3F' },
    { key: 'bg',        label: 'لون الخلفية',                value: '#FAF9F7' },
    { key: 'text',      label: 'لون النص',                  value: '#1A1A1A' },
    { key: 'header',    label: 'لون الهيدر',                value: '#1E2A32' },
    { key: 'footer',    label: 'لون الفوتر',                value: '#25333F' },
    { key: 'button',    label: 'لون الأزرار',                value: '#C9B895' },
  ];

  const colorGrid = document.getElementById('colorGrid');
  COLORS.forEach((c) => {
    const wrap = document.createElement('div');
    wrap.className = 'color-swatch';
    wrap.innerHTML = `
      <label for="c_${c.key}">${c.label}</label>
      <div class="color-swatch-input">
        <input type="color" id="c_${c.key}" value="${c.value}">
        <input type="text" id="c_${c.key}_hex" value="${c.value}">
      </div>
    `;
    colorGrid.appendChild(wrap);

    const colorInput = wrap.querySelector(`#c_${c.key}`);
    const hexInput = wrap.querySelector(`#c_${c.key}_hex`);
    function apply(val) { preview.style.setProperty(`--p-${c.key}`, val); }
    apply(c.value);
    colorInput.addEventListener('input', () => { hexInput.value = colorInput.value; apply(colorInput.value); });
    hexInput.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) { colorInput.value = hexInput.value; apply(hexInput.value); }
    });
  });

  // ============================= الخطوط ============================= //
  const fontAr = document.getElementById('fontAr');
  const fontEn = document.getElementById('fontEn');
  function applyFonts() {
    preview.style.setProperty('--p-font-ar', `"${fontAr.value}"`);
    preview.style.setProperty('--p-font-en', `"${fontEn.value}"`);
  }
  fontAr.addEventListener('change', applyFonts);
  fontEn.addEventListener('change', applyFonts);
  applyFonts();

  const SIZE_ROWS = [
    { key: 'h1', label: 'H1', ar: 34, en: 30 },
    { key: 'h2', label: 'H2', ar: 24, en: 21 },
    { key: 'h3', label: 'H3', ar: 19, en: 17 },
    { key: 'h4', label: 'H4', ar: 16, en: 15 },
    { key: 'body', label: 'النص العادي', ar: 15, en: 14 },
    { key: 'button', label: 'الأزرار', ar: 14, en: 13 },
    { key: 'nav', label: 'القائمة', ar: 14, en: 13 },
    { key: 'footer', label: 'الفوتر', ar: 12, en: 12 },
  ];
  const sizeBody = document.querySelector('#fontSizeTable tbody');
  SIZE_ROWS.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.label}</td>
      <td><input type="number" style="width:70px" id="size_${row.key}_ar" value="${row.ar}"></td>
      <td><input type="number" style="width:70px" id="size_${row.key}_en" value="${row.en}"></td>
    `;
    sizeBody.appendChild(tr);
    const arInput = tr.querySelector(`#size_${row.key}_ar`);
    if (['h2', 'body', 'button'].includes(row.key)) {
      arInput.addEventListener('input', () => preview.style.setProperty(`--p-size-${row.key}`, arInput.value + 'px'));
      preview.style.setProperty(`--p-size-${row.key}`, arInput.value + 'px');
    }
  });

  // ============================= المسافات والتخطيط ============================= //
  const SPACING_FIELDS = [
    { key: 'siteWidth', label: 'عرض الموقع (px)', value: 1440 },
    { key: 'contentWidth', label: 'عرض المحتوى (px)', value: 1180 },
    { key: 'sectionSpace', label: 'المسافة بين الأقسام (px)', value: 80, previewVar: 'section-space' },
    { key: 'headerHeight', label: 'ارتفاع الهيدر (px)', value: 84 },
    { key: 'heroHeight', label: 'ارتفاع الهيرو (px)', value: 560 },
    { key: 'radiusBtn', label: 'انحناء الأزرار (Radius، px)', value: 10, previewVar: 'radius-btn' },
    { key: 'radiusCard', label: 'انحناء البطاقات (Radius، px)', value: 16, previewVar: 'radius-card' },
  ];
  const spacingWrap = document.getElementById('spacingFields');
  SPACING_FIELDS.forEach((f) => {
    const div = document.createElement('div');
    div.className = 'form-field';
    div.innerHTML = `<label for="s_${f.key}">${f.label}</label><input type="number" id="s_${f.key}" value="${f.value}">`;
    spacingWrap.appendChild(div);
    if (f.previewVar) {
      const input = div.querySelector('input');
      input.addEventListener('input', () => preview.style.setProperty(`--p-${f.previewVar}`, input.value + 'px'));
      preview.style.setProperty(`--p-${f.previewVar}`, f.value + 'px');
    }
  });
  // الظلال والحدود كخيارين إضافيين يؤثران فعلياً على المعاينة
  (function addShadowBorderFields() {
    const shadowDiv = document.createElement('div');
    shadowDiv.className = 'form-field';
    shadowDiv.innerHTML = `<label for="s_shadow">قوة الظل على البطاقات</label>
      <select id="s_shadow"><option value="none">بدون</option><option value="0 6px 18px rgba(24,32,38,.06)" selected>خفيف</option><option value="0 12px 40px rgba(24,32,38,.16)">قوي</option></select>`;
    spacingWrap.appendChild(shadowDiv);
    const shadowSelect = shadowDiv.querySelector('select');
    shadowSelect.addEventListener('change', () => preview.style.setProperty('--p-shadow', shadowSelect.value));

    const borderDiv = document.createElement('div');
    borderDiv.className = 'form-field';
    borderDiv.innerHTML = `<label for="s_border">حدود البطاقات</label>
      <select id="s_border"><option value="none">بدون</option><option value="1px solid #E5E2DD" selected>رفيعة</option><option value="2px solid #C9B895">بلون الهوية</option></select>`;
    spacingWrap.appendChild(borderDiv);
    const borderSelect = borderDiv.querySelector('select');
    borderSelect.addEventListener('change', () => preview.style.setProperty('--p-border', borderSelect.value));
  })();

  // ============================= الحركة ============================= //
  const motionOn = document.getElementById('motionOn');
  const motionDuration = document.getElementById('motionDuration');
  const motionSpeed = document.getElementById('motionSpeed');
  const motionReveal = document.getElementById('motionReveal');
  const tryMotionBtn = document.getElementById('tryMotionBtn');

  function applyMotion() {
    const on = motionOn.checked;
    preview.style.setProperty('--p-motion-duration', on ? (motionDuration.value / 1000) + 's' : '0s');
    preview.style.setProperty('--p-motion-ease', motionSpeed.value);
  }
  [motionOn, motionDuration, motionSpeed].forEach((el) => el.addEventListener('input', applyMotion));
  applyMotion();

  tryMotionBtn.addEventListener('click', () => {
    if (!motionOn.checked || motionReveal.value === 'none') {
      window.showToast('الحركة متوقفة حالياً — فعّلها أولاً من الأعلى');
      return;
    }
    preview.classList.remove('reveal-anim');
    void preview.offsetWidth; // إعادة تشغيل الأنيميشن
    preview.classList.add('reveal-anim');
  });

  // ============================= التابات ============================= //
  const tabs = document.getElementById('themeTabs');
  tabs.querySelectorAll('.seg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.seg-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.theme-panel').forEach((p) => { p.hidden = p.getAttribute('data-panel') !== tab.getAttribute('data-panel'); });
    });
  });

  document.getElementById('saveThemeBtn').addEventListener('click', () => {
    window.showToast('تم حفظ الهوية البصرية (تجريبي — لسه بدون تطبيق فعلي على الموقع)');
  });
})();
