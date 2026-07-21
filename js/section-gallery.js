// js/section-gallery.js
// متصل فعلياً بـ /api/works في alomran-site. الأزرار بتظهر حسب صلاحيات
// المستخدم الحالي (addWork/editWork/hideWork/deleteWork) القادمة من الجلسة.
(function () {
  'use strict';

  const CATEGORY_LABELS = { residential: 'سكني', commercial: 'تجاري', industrial: 'صناعي' };
  const MAX_PINNED = 6;

  let works = [];
  let perms = { addWork: false, editWork: false, hideWork: false, deleteWork: false };

  const grid = document.getElementById('galleryGrid');
  const searchInput = document.getElementById('gallerySearch');
  const addBtn = document.getElementById('openAddProject');
  const overlay = document.getElementById('projectModalOverlay');
  const form = document.getElementById('projectForm');
  const modalTitle = document.getElementById('projectModalTitle');
  const saveBtn = document.getElementById('saveProjectBtn');
  const formError = document.getElementById('projectFormError');
  const imageField = document.getElementById('imageUploadField');
  const imagesAfterCreateNote = document.getElementById('imagesAfterCreateNote');
  const imagesInput = document.getElementById('pImages');
  let editingId = null;

  async function loadWorks() {
    try {
      const data = await window.Api.listWorks();
      works = data.works;
      render();
    } catch (err) {
      grid.innerHTML = `<p class="table-empty">تعذّر تحميل الأعمال: ${err.message}</p>`;
    }
  }

  function pinnedCount() { return works.filter((w) => w.pinned).length; }

  function render() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const filtered = works.filter((w) => w.title.toLowerCase().includes(q)).sort((a, b) => a.order - b.order);

    grid.innerHTML = '';
    filtered.forEach((w) => {
      const card = document.createElement('div');
      card.className = 'gallery-card' + (w.visible ? '' : ' hidden-card');
      const thumbImg = w.images && w.images[0];
      card.innerHTML = `
        <div class="gallery-thumb" ${thumbImg ? `style="background-image:url('${window.API_BASE}${thumbImg}'); background-size:cover; background-position:center;"` : ''}>
          <span class="gallery-order">#${w.order}</span>
          ${w.pinned ? `<span class="gallery-order" style="left:auto; right:8px; background:rgba(201,184,149,.9); color:#1E2A32;">مثبّت</span>` : ''}
          ${!thumbImg ? `<svg width="26" height="26" viewBox="0 0 18 18" fill="none"><rect x="2.2" y="3.2" width="13.6" height="10.4" rx="1.1" stroke="currentColor" stroke-width="1.2"/><path d="M2.2 11.6l3.4-3.2c.5-.5 1.3-.5 1.8 0l2 2 1.7-1.6c.5-.4 1.2-.4 1.6.1l3 3.1" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>` : ''}
        </div>
        <div class="gallery-body">
          <h3>${w.title}</h3>
          <span class="gallery-meta">${CATEGORY_LABELS[w.category] || w.category} · ${w.city || '—'}</span>
          <div class="gallery-foot">
            <span class="badge ${w.visible ? 'badge-status-active' : 'badge-status-suspended'}">${w.visible ? 'ظاهر' : 'مخفي'}</span>
            <div class="cell-actions">
              ${perms.hideWork ? `<button class="btn-ghost" data-action="toggle" data-id="${w.id}">${w.visible ? 'إخفاء' : 'إظهار'}</button>` : ''}
              ${perms.editWork ? `<button class="btn-ghost" data-action="pin" data-id="${w.id}">${w.pinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>` : ''}
              ${perms.editWork ? `<button class="btn-ghost" data-action="edit" data-id="${w.id}">تعديل</button>` : ''}
              ${perms.deleteWork ? `<button class="btn-danger-text" data-action="delete" data-id="${w.id}">حذف</button>` : ''}
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    if (perms.addWork) {
      const addTile = document.createElement('button');
      addTile.type = 'button';
      addTile.className = 'add-card-tile';
      addTile.innerHTML = `<svg width="22" height="22" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>إضافة مشروع</span>`;
      addTile.addEventListener('click', () => openModal(null));
      grid.appendChild(addTile);
    }
  }

  searchInput.addEventListener('input', render);

  function openModal(work) {
    editingId = work ? work.id : null;
    form.reset();
    formError.hidden = true;
    if (work) {
      modalTitle.textContent = 'تعديل بيانات المشروع';
      saveBtn.textContent = 'حفظ التعديلات';
      document.getElementById('pTitle').value = work.title;
      document.getElementById('pCategory').value = work.category;
      document.getElementById('pCity').value = work.city || '';
      document.getElementById('pMeta').value = work.meta || '';
      document.getElementById('pArea').value = work.area || '';
      document.getElementById('pDescription').value = work.description || '';
      imageField.hidden = false;
      imagesAfterCreateNote.hidden = true;
    } else {
      modalTitle.textContent = 'إضافة مشروع جديد';
      saveBtn.textContent = 'إضافة المشروع';
      imageField.hidden = true;
      imagesAfterCreateNote.hidden = false;
    }
    overlay.hidden = false;
    document.getElementById('pTitle').focus();
  }
  function closeModal() { overlay.hidden = true; editingId = null; }

  addBtn.addEventListener('click', () => openModal(null));
  document.getElementById('closeProjectModal').addEventListener('click', closeModal);
  document.getElementById('cancelProjectForm').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    const payload = {
      title: document.getElementById('pTitle').value.trim(),
      category: document.getElementById('pCategory').value,
      city: document.getElementById('pCity').value.trim(),
      meta: document.getElementById('pMeta').value.trim(),
      area: document.getElementById('pArea').value.trim(),
      description: document.getElementById('pDescription').value.trim(),
    };
    saveBtn.disabled = true;
    try {
      let workId = editingId;
      if (editingId) {
        await window.Api.updateWork(editingId, payload);
        window.showToast('تم حفظ تعديلات المشروع');
      } else {
        const res = await window.Api.createWork(payload);
        workId = res.work.id;
        window.showToast('تمت إضافة المشروع');
      }
      if (imagesInput.files && imagesInput.files.length > 0 && workId) {
        const fd = new FormData();
        Array.from(imagesInput.files).forEach((f) => fd.append('images', f));
        await window.Api.uploadWorkImages(workId, fd);
        window.showToast('تم رفع صور المشروع');
      }
      closeModal();
      await loadWorks();
    } catch (err) {
      formError.textContent = err.message;
      formError.hidden = false;
    } finally {
      saveBtn.disabled = false;
    }
  });

  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const work = works.find((w) => w.id === id);
    const action = btn.getAttribute('data-action');

    try {
      if (action === 'edit') {
        openModal(work);
      } else if (action === 'toggle') {
        await window.Api.setWorkVisible(id, !work.visible);
        await loadWorks();
      } else if (action === 'pin') {
        if (!work.pinned && pinnedCount() >= MAX_PINNED) {
          window.showToast(`لا يمكن تثبيت أكثر من ${MAX_PINNED} أعمال في الرئيسية`);
          return;
        }
        await window.Api.setWorkPinned(id, !work.pinned);
        await loadWorks();
      } else if (action === 'delete') {
        if (confirm(`متأكد إنك عايز تحذف مشروع "${work.title}"؟`)) {
          await window.Api.deleteWork(id);
          window.showToast('تم حذف المشروع');
          await loadWorks();
        }
      }
    } catch (err) {
      window.showToast(err.message);
    }
  });

  document.addEventListener('auth-ready', (e) => {
    const user = e.detail;
    perms = user.isAdmin
      ? { addWork: true, editWork: true, hideWork: true, deleteWork: true }
      : Object.assign({ addWork: false, editWork: false, hideWork: false, deleteWork: false }, user.permissions);
    addBtn.hidden = !perms.addWork;
    loadWorks();
  });
})();
