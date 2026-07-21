// js/section-settings.js
// الإعدادات العامة — متصل فعليًا بحقول الهوية الحقيقية في alomran-site فقط:
// الشعار، الفافيكون، شارة المشاريع، وروابط التواصل الاجتماعي الست الثابتة.
// (لا يوجد حقول GA/GTM/Maps في السيرفر الحالي، فلم تُدرَج هنا.)
(function () {
  'use strict';

  const accordionEl = document.getElementById('settingsAccordion');
  let settings = null;

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
        await onSave();
        window.showToast(`تم حفظ "${title}"`);
        settings = await window.Api.getSettings();
        render();
      } catch (err) {
        window.showToast(`تعذّر الحفظ: ${err.message}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ';
      }
    });
    return item;
  }

  function render() {
    accordionEl.innerHTML = '';

    accordionEl.appendChild(makeItem('الهوية الأساسية', 'الشعار والفافيكون', `
      <div class="field-grid">
        ${imageFieldHtml('f_logo', 'الشعار', settings.logo)}
        ${imageFieldHtml('f_favicon', 'Favicon', settings.favicon)}
      </div>
    `, async () => {
      await uploadIfSelected('f_logo', (fd) => window.Api.uploadLogo(fd));
      await uploadIfSelected('f_favicon', (fd) => window.Api.uploadFavicon(fd));
    }));

    accordionEl.appendChild(makeItem('شارة المشاريع', 'شعار مستقل يظهر بجانب بطاقات المشاريع', `
      <div class="field-grid">${imageFieldHtml('f_projectLogo', 'الصورة', settings.projectLogo.image)}</div>
      <label class="switch" style="margin-top:8px;"><input type="checkbox" id="f_projectLogoVisible" ${settings.projectLogo.visible ? 'checked' : ''}><span>إظهار شارة المشاريع</span></label>
    `, async () => {
      const fd = new FormData();
      fd.append('visible', document.getElementById('f_projectLogoVisible').checked);
      const fileInput = document.getElementById('f_projectLogo');
      if (fileInput.files && fileInput.files[0]) fd.append('image', fileInput.files[0]);
      await window.Api.uploadProjectLogo(fd);
    }));

    const soc = settings.social || {};
    accordionEl.appendChild(makeItem('روابط التواصل الاجتماعي', '', `
      <div class="field-grid">
        <div class="form-field"><label>فيسبوك</label><input type="text" id="f_facebook" value="${soc.facebook || ''}"></div>
        <div class="form-field"><label>تويتر / X</label><input type="text" id="f_twitter" value="${soc.twitter || ''}"></div>
        <div class="form-field"><label>إنستغرام</label><input type="text" id="f_instagram" value="${soc.instagram || ''}"></div>
        <div class="form-field"><label>سناب شات</label><input type="text" id="f_snapchat" value="${soc.snapchat || ''}"></div>
        <div class="form-field"><label>تيك توك</label><input type="text" id="f_tiktok" value="${soc.tiktok || ''}"></div>
        <div class="form-field"><label>لينكدإن</label><input type="text" id="f_linkedin" value="${soc.linkedin || ''}"></div>
      </div>
    `, async () => {
      await window.Api.putSocial({
        facebook: document.getElementById('f_facebook').value,
        twitter: document.getElementById('f_twitter').value,
        instagram: document.getElementById('f_instagram').value,
        snapchat: document.getElementById('f_snapchat').value,
        tiktok: document.getElementById('f_tiktok').value,
        linkedin: document.getElementById('f_linkedin').value,
      });
    }));

    accordionEl.appendChild(makeItem('خلفية صفحة معرض الأعمال', '', `
      <div class="field-grid">${imageFieldHtml('f_projectsHeroBg', 'الصورة', settings.projectsHeroBg)}</div>
    `, async () => { await uploadIfSelected('f_projectsHeroBg', (fd) => window.Api.uploadBackground('projects', fd)); }));

    if (accordionEl.firstElementChild) accordionEl.firstElementChild.classList.add('open');
  }

  document.addEventListener('auth-ready', async (e) => {
    if (!e.detail.isAdmin) return;
    try {
      settings = await window.Api.getSettings();
      render();
    } catch (err) {
      accordionEl.innerHTML = `<p class="table-empty">تعذّر تحميل الإعدادات: ${err.message}</p>`;
    }
  });
})();
