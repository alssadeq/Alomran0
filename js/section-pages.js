// js/section-pages.js
// محرر "صفحات الموقع" — متصل فعلياً بـ /api/settings و/api/settings/content
// وتوابعها في alomran-site. الحقول هنا مطابقة تمامًا لما يخزّنه السيرفر
// فعليًا؛ ما لم يكن للسيرفر حقل حقيقي له (زي Header منفصل أو "منهجيتنا")
// لم يُدرَج هنا حتى لا نعطي انطباعًا خاطئًا بأنه متصل.
(function () {
  'use strict';

  const tabsEl = document.getElementById('pageTabs');
  const accordionEl = document.getElementById('pagesAccordion');
  let settings = null; // آخر نسخة محمّلة من /api/settings
  let currentPage = 'home';

  function imgUrl(path) { return path ? window.API_BASE + path : ''; }

  function imageFieldHtml(id, label, currentPath) {
    return `<div class="form-field full">
      <label for="${id}">${label}</label>
      <div class="image-drop">
        <span class="thumb" aria-hidden="true">${currentPath ? `<img src="${imgUrl(currentPath)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : '🖼'}</span>
        <input type="file" id="${id}" accept="image/*" style="flex:1;">
      </div>
    </div>`;
  }

  async function uploadIfSelected(inputId, uploadFn) {
    const input = document.getElementById(inputId);
    if (input && input.files && input.files[0]) {
      const fd = new FormData();
      fd.append('image', input.files[0]);
      await uploadFn(fd);
      return true;
    }
    return false;
  }

  // ============================= مُنشئ أكورديون بسيط ============================= //
  function makeItem(title, sub, bodyHtml, onSave) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <div class="accordion-head">
        <span class="drag" aria-hidden="true">⠿</span>
        <div class="accordion-title"><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ''}</div>
        <span class="accordion-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
      <div class="accordion-body">
        ${bodyHtml}
        <div class="accordion-save-row"><button type="button" class="btn btn-primary" data-save>حفظ</button></div>
      </div>
    `;
    item.querySelector('.accordion-head').addEventListener('click', () => item.classList.toggle('open'));
    const saveBtn = item.querySelector('[data-save]');
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'جارٍ الحفظ...';
      try {
        await onSave(item);
        window.showToast(`تم حفظ قسم "${title}"`);
        await refreshSettings();
        renderPage(currentPage); // إعادة رسم لعرض القيم والصور المحدّثة
      } catch (err) {
        window.showToast(`تعذّر الحفظ: ${err.message}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ';
      }
    });
    return item;
  }

  // ============================= صفوف قابلة للتكرار (عام) ============================= //
  function repeaterHtml(containerId, rows, rowRenderer) {
    return `<div class="repeater" id="${containerId}">${rows.map((row, i) => rowRenderer(row, i)).join('')}</div>`;
  }
  function wireRepeaterControls(item, containerId, rowsRef, rowRenderer, newRowFactory) {
    const container = item.querySelector('#' + containerId);
    function redraw() {
      container.innerHTML = rowsRef.arr.map((row, i) => rowRenderer(row, i)).join('');
      wireRowEvents();
    }
    function wireRowEvents() {
      container.querySelectorAll('.repeater-row').forEach((rowEl) => {
        const idx = Number(rowEl.getAttribute('data-row'));
        rowEl.querySelectorAll('[data-row-action]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-row-action');
            if (action === 'remove') rowsRef.arr.splice(idx, 1);
            if (action === 'up' && idx > 0) [rowsRef.arr[idx - 1], rowsRef.arr[idx]] = [rowsRef.arr[idx], rowsRef.arr[idx - 1]];
            if (action === 'down' && idx < rowsRef.arr.length - 1) [rowsRef.arr[idx + 1], rowsRef.arr[idx]] = [rowsRef.arr[idx], rowsRef.arr[idx + 1]];
            redraw();
          });
        });
        rowEl.querySelectorAll('[data-field]').forEach((el) => {
          el.addEventListener('input', () => { rowsRef.arr[idx][el.getAttribute('data-field')] = el.value; });
        });
      });
    }
    wireRowEvents();
    const addBtn = item.querySelector('[data-add-row="' + containerId + '"]');
    if (addBtn) addBtn.addEventListener('click', () => { rowsRef.arr.push(newRowFactory()); redraw(); });
  }

  async function refreshSettings() {
    settings = await window.Api.getSettings();
  }

  // ============================= الصفحة الرئيسية ============================= //
  function renderHome() {
    accordionEl.innerHTML = '';
    const c = settings.content;

    // Hero
    accordionEl.appendChild(makeItem('Hero', 'العنوان والوصف الرئيسي وصورة الخلفية', `
      <div class="field-grid">
        <div class="form-field full"><label>العنوان</label><textarea id="f_heroTitle" rows="2">${c.heroTitle || ''}</textarea></div>
        <div class="form-field full"><label>الوصف</label><textarea id="f_heroSubtitle" rows="3">${c.heroSubtitle || ''}</textarea></div>
        ${imageFieldHtml('f_heroImage', 'صورة الهيرو', c.heroImage)}
      </div>
    `, async () => {
      await window.Api.putContent({ heroTitle: document.getElementById('f_heroTitle').value, heroSubtitle: document.getElementById('f_heroSubtitle').value });
      await uploadIfSelected('f_heroImage', (fd) => window.Api.uploadContentImage('hero', fd));
    }));

    // نبذة الشركة بالرئيسية (صورة فقط)
    accordionEl.appendChild(makeItem('نبذة الشركة (صورة الرئيسية)', 'الصورة المرافقة لمقتطف "من نحن" في الصفحة الرئيسية', `
      <div class="field-grid">${imageFieldHtml('f_aboutTeaserImage', 'الصورة', c.aboutTeaserImage)}</div>
    `, async () => {
      await uploadIfSelected('f_aboutTeaserImage', (fd) => window.Api.uploadContentImage('aboutTeaser', fd));
    }));

    // البانرات الثلاثة
    const bannersRows = [1, 2, 3].map((n) => {
      const b = settings.banners[n - 1] || { image: '', titleAr: '', titleEn: '' };
      return `<div class="repeater-row">
        <div class="field-grid">
          <div class="form-field full">${imageFieldHtml('f_banner' + n + '_img', 'صورة البانر ' + n, b.image)}</div>
          <div class="form-field"><label>العنوان (عربي)</label><input type="text" id="f_banner${n}_ar" value="${b.titleAr || ''}"></div>
          <div class="form-field"><label>العنوان (إنجليزي)</label><input type="text" id="f_banner${n}_en" value="${b.titleEn || ''}"></div>
        </div>
      </div>`;
    }).join('');
    accordionEl.appendChild(makeItem('البانرات الدوّارة', '3 بانرات تظهر بالتبادل في الهيدر', `
      <div class="repeater">${bannersRows}</div>
      <label class="switch" style="margin-top:10px;"><input type="checkbox" id="f_bannerTextVisible" ${settings.bannerTextVisible ? 'checked' : ''}><span>إظهار نص البانر</span></label>
    `, async () => {
      for (const n of [1, 2, 3]) {
        const fd = new FormData();
        fd.append('titleAr', document.getElementById(`f_banner${n}_ar`).value);
        fd.append('titleEn', document.getElementById(`f_banner${n}_en`).value);
        const fileInput = document.getElementById(`f_banner${n}_img`);
        if (fileInput.files && fileInput.files[0]) fd.append('image', fileInput.files[0]);
        await window.Api.uploadBanner(n, fd);
      }
      await window.Api.putBannerTextVisibility(document.getElementById('f_bannerTextVisible').checked);
    }));

    // الإحصائيات
    const s = settings.stats;
    accordionEl.appendChild(makeItem('الإحصائيات', 'الأرقام الظاهرة بالرئيسية وصفحة من نحن', `
      <div class="field-grid">
        <div class="form-field"><label>سنوات الخبرة</label><input type="text" id="f_yearsExperience" value="${s.yearsExperience}"></div>
        <div class="form-field"><label>المشاريع المنجزة</label><input type="text" id="f_projectsDone" value="${s.projectsDone}"></div>
        <div class="form-field"><label>رضا العملاء</label><input type="text" id="f_clientSatisfaction" value="${s.clientSatisfaction}"></div>
        <div class="form-field"><label>المدن المخدومة</label><input type="text" id="f_citiesServed" value="${s.citiesServed}"></div>
      </div>
    `, async () => {
      await window.Api.putStats({
        yearsExperience: document.getElementById('f_yearsExperience').value,
        projectsDone: document.getElementById('f_projectsDone').value,
        clientSatisfaction: document.getElementById('f_clientSatisfaction').value,
        citiesServed: document.getElementById('f_citiesServed').value,
      });
    }));

    // الخدمات (repeater)
    const servicesRef = { arr: settings.services.map((x) => ({ ...x })) };
    const serviceRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid">
        <div class="form-field"><label>العنوان</label><input type="text" data-field="title" value="${row.title || ''}"></div>
        <div class="form-field full"><label>الوصف</label><textarea rows="2" data-field="description">${row.description || ''}</textarea></div>
      </div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button>
        <button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const servicesItem = makeItem('خدماتنا', '', `
      ${repeaterHtml('servicesRepeater', servicesRef.arr, serviceRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="servicesRepeater">+ إضافة خدمة</button>
    `, async () => { await window.Api.putServices(servicesRef.arr); });
    accordionEl.appendChild(servicesItem);
    wireRepeaterControls(servicesItem, 'servicesRepeater', servicesRef, serviceRow, () => ({ title: '', description: '' }));

    // رسالة الترحيب
    const wm = settings.welcomeMessage;
    accordionEl.appendChild(makeItem('رسالة الترحيب', 'تظهر عند أول زيارة للموقع فقط', `
      <label class="switch" style="margin-bottom:12px;"><input type="checkbox" id="f_wmEnabled" ${wm.enabled ? 'checked' : ''}><span>تفعيل رسالة الترحيب</span></label>
      <div class="field-grid">
        <div class="form-field"><label>العنوان</label><input type="text" id="f_wmTitle" value="${wm.title}"></div>
        <div class="form-field"><label>نص الزر</label><input type="text" id="f_wmButton" value="${wm.buttonText}"></div>
        <div class="form-field full"><label>الرسالة</label><textarea id="f_wmMessage" rows="2">${wm.message}</textarea></div>
        <div class="form-field"><label>مدة الظهور (ثانية)</label><input type="number" id="f_wmDuration" value="${wm.durationSeconds}"></div>
      </div>
    `, async () => {
      await window.Api.putWelcome({
        enabled: document.getElementById('f_wmEnabled').checked,
        title: document.getElementById('f_wmTitle').value,
        message: document.getElementById('f_wmMessage').value,
        buttonText: document.getElementById('f_wmButton').value,
        durationSeconds: document.getElementById('f_wmDuration').value,
      });
    }));
  }

  // ============================= صفحة من نحن ============================= //
  function renderAbout() {
    accordionEl.innerHTML = '';
    const c = settings.content;

    accordionEl.appendChild(makeItem('Banner', 'خلفية أعلى صفحة "من نحن"', `
      <div class="field-grid">${imageFieldHtml('f_aboutHeroBg', 'الصورة', settings.aboutHeroBg)}</div>
    `, async () => { await uploadIfSelected('f_aboutHeroBg', (fd) => window.Api.uploadBackground('about', fd)); }));

    const storyRef = { arr: [...(c.aboutStory || [])] };
    const storyRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid"><div class="form-field full"><label>فقرة ${i + 1}</label><textarea rows="2" data-field="_text">${row}</textarea></div></div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button>
        <button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const storyItem = makeItem('نبذة الشركة', 'حتى 6 فقرات + صورة القصة', `
      ${repeaterHtml('storyRepeater', storyRef.arr, storyRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="storyRepeater">+ إضافة فقرة</button>
      <div class="field-grid" style="margin-top:14px;">${imageFieldHtml('f_aboutStoryImage', 'صورة القصة', c.aboutStoryImage)}</div>
    `, async () => {
      await window.Api.putContent({ aboutStory: storyRef.arr });
      await uploadIfSelected('f_aboutStoryImage', (fd) => window.Api.uploadContentImage('aboutStory', fd));
    });
    accordionEl.appendChild(storyItem);
    // نص فقرات النبذة مباشر String[] مش Object[] فحقل data-field الافتراضي مش هيشتغل، فبنربط يدويًا:
    (function wireStoryRows() {
      const container = storyItem.querySelector('#storyRepeater');
      function redraw() {
        container.innerHTML = storyRef.arr.map(storyRow).join('');
        wire();
      }
      function wire() {
        container.querySelectorAll('.repeater-row').forEach((rowEl) => {
          const idx = Number(rowEl.getAttribute('data-row'));
          rowEl.querySelector('textarea').addEventListener('input', (e) => { storyRef.arr[idx] = e.target.value; });
          rowEl.querySelectorAll('[data-row-action]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const action = btn.getAttribute('data-row-action');
              if (action === 'remove') storyRef.arr.splice(idx, 1);
              if (action === 'up' && idx > 0) [storyRef.arr[idx - 1], storyRef.arr[idx]] = [storyRef.arr[idx], storyRef.arr[idx - 1]];
              if (action === 'down' && idx < storyRef.arr.length - 1) [storyRef.arr[idx + 1], storyRef.arr[idx]] = [storyRef.arr[idx], storyRef.arr[idx + 1]];
              redraw();
            });
          });
        });
      }
      wire();
      storyItem.querySelector('[data-add-row="storyRepeater"]').addEventListener('click', () => { storyRef.arr.push(''); redraw(); });
    })();

    accordionEl.appendChild(makeItem('الرسالة والرؤية', '', `
      <div class="field-grid">
        <div class="form-field full"><label>الرؤية</label><textarea id="f_vision" rows="2">${c.vision || ''}</textarea></div>
        <div class="form-field full"><label>الرسالة</label><textarea id="f_mission" rows="2">${c.mission || ''}</textarea></div>
      </div>
    `, async () => {
      await window.Api.putContent({ vision: document.getElementById('f_vision').value, mission: document.getElementById('f_mission').value });
    }));

    const valuesRef = { arr: (c.values || []).map((x) => ({ ...x })) };
    const valueRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid">
        <div class="form-field"><label>العنوان</label><input type="text" data-field="title" value="${row.title || ''}"></div>
        <div class="form-field full"><label>الوصف</label><textarea rows="2" data-field="description">${row.description || ''}</textarea></div>
      </div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button><button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const valuesItem = makeItem('القيم', 'حتى 4 قيم', `
      ${repeaterHtml('valuesRepeater', valuesRef.arr, valueRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="valuesRepeater">+ إضافة قيمة</button>
    `, async () => { await window.Api.putContent({ values: valuesRef.arr }); });
    accordionEl.appendChild(valuesItem);
    wireRepeaterControls(valuesItem, 'valuesRepeater', valuesRef, valueRow, () => ({ title: '', description: '' }));

    const timelineRef = { arr: (c.timeline || []).map((x) => ({ ...x })) };
    const timelineRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid">
        <div class="form-field"><label>السنة</label><input type="text" data-field="year" value="${row.year || ''}"></div>
        <div class="form-field"><label>العنوان</label><input type="text" data-field="title" value="${row.title || ''}"></div>
        <div class="form-field full"><label>الوصف</label><textarea rows="2" data-field="description">${row.description || ''}</textarea></div>
      </div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button><button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const timelineItem = makeItem('المسيرة الزمنية', '', `
      ${repeaterHtml('timelineRepeater', timelineRef.arr, timelineRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="timelineRepeater">+ إضافة محطة</button>
    `, async () => { await window.Api.putContent({ timeline: timelineRef.arr }); });
    accordionEl.appendChild(timelineItem);
    wireRepeaterControls(timelineItem, 'timelineRepeater', timelineRef, timelineRow, () => ({ year: '', title: '', description: '' }));

    const certsRef = { arr: [...(c.certifications || [])] };
    const certRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid"><div class="form-field full"><label>الشهادة ${i + 1}</label><input type="text" data-field="_text" value="${row}"></div></div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button><button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const certsItem = makeItem('الشهادات', '', `
      ${repeaterHtml('certsRepeater', certsRef.arr, certRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="certsRepeater">+ إضافة شهادة</button>
    `, async () => { await window.Api.putContent({ certifications: certsRef.arr }); });
    accordionEl.appendChild(certsItem);
    (function wireCertRows() {
      const container = certsItem.querySelector('#certsRepeater');
      function redraw() { container.innerHTML = certsRef.arr.map(certRow).join(''); wire(); }
      function wire() {
        container.querySelectorAll('.repeater-row').forEach((rowEl) => {
          const idx = Number(rowEl.getAttribute('data-row'));
          rowEl.querySelector('input').addEventListener('input', (e) => { certsRef.arr[idx] = e.target.value; });
          rowEl.querySelectorAll('[data-row-action]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const action = btn.getAttribute('data-row-action');
              if (action === 'remove') certsRef.arr.splice(idx, 1);
              if (action === 'up' && idx > 0) [certsRef.arr[idx - 1], certsRef.arr[idx]] = [certsRef.arr[idx], certsRef.arr[idx - 1]];
              if (action === 'down' && idx < certsRef.arr.length - 1) [certsRef.arr[idx + 1], certsRef.arr[idx]] = [certsRef.arr[idx], certsRef.arr[idx + 1]];
              redraw();
            });
          });
        });
      }
      wire();
      certsItem.querySelector('[data-add-row="certsRepeater"]').addEventListener('click', () => { certsRef.arr.push(''); redraw(); });
    })();

    const teamRef = { arr: (settings.team || []).map((x) => ({ ...x })) };
    const teamRow = (row, i) => `<div class="repeater-row" data-row="${i}">
      <div class="field-grid">
        <div class="form-field"><label>الاسم</label><input type="text" data-field="name" value="${row.name || ''}"></div>
        <div class="form-field"><label>المسمى الوظيفي</label><input type="text" data-field="role" value="${row.role || ''}"></div>
      </div>
      <div class="repeater-controls">
        <button type="button" data-row-action="up">↑</button><button type="button" data-row-action="down">↓</button>
        <button type="button" class="remove-row" data-row-action="remove">✕</button>
      </div>
    </div>`;
    const teamItem = makeItem('فريق العمل', '', `
      ${repeaterHtml('teamRepeater', teamRef.arr, teamRow)}
      <button type="button" class="btn btn-outline repeater-add" data-add-row="teamRepeater">+ إضافة عضو</button>
    `, async () => { await window.Api.putTeam(teamRef.arr); });
    accordionEl.appendChild(teamItem);
    wireRepeaterControls(teamItem, 'teamRepeater', teamRef, teamRow, () => ({ name: '', role: '' }));
  }

  function renderPage(pageKey) {
    currentPage = pageKey;
    if (!settings) return;
    if (pageKey === 'home') renderHome(); else renderAbout();
  }

  tabsEl.querySelectorAll('.seg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      tabsEl.querySelectorAll('.seg-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderPage(tab.getAttribute('data-page'));
    });
  });

  document.addEventListener('auth-ready', async (e) => {
    if (!e.detail.isAdmin) return; // هذا القسم لا يظهر أصلًا لغير المسؤول، حماية إضافية فقط
    try {
      await refreshSettings();
      renderPage(currentPage);
    } catch (err) {
      accordionEl.innerHTML = `<p class="table-empty">تعذّر تحميل إعدادات الصفحات: ${err.message}</p>`;
    }
  });
})();
