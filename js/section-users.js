// js/section-users.js
// متصل فعلياً بـ /api/users في مشروع alomran-site. يبدأ العمل بعد حدث
// "auth-ready" (من dashboard-shell.js) للتأكد إن فيه جلسة مسؤول صالحة.
(function () {
  'use strict';

  const PERM_LABELS = { addWork: 'إضافة', editWork: 'تعديل', hideWork: 'إظهار/إخفاء', deleteWork: 'حذف' };

  let users = [];

  const tbody = document.getElementById('usersTableBody');
  const emptyMsg = document.getElementById('usersEmptyMsg');
  const searchInput = document.getElementById('userSearch');
  const overlay = document.getElementById('userModalOverlay');
  const form = document.getElementById('userForm');
  const modalTitle = document.getElementById('userModalTitle');
  const passwordField = document.getElementById('passwordField');
  const saveBtn = document.getElementById('saveUserBtn');
  const formError = document.getElementById('userFormError');
  let editingId = null;

  function initials(name) { return name.trim().charAt(0).toUpperCase(); }

  async function loadUsers() {
    try {
      const data = await window.Api.listUsers();
      users = data.users;
      render();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">تعذّر تحميل المستخدمين: ${err.message}</td></tr>`;
    }
  }

  function activeAdminCount() {
    return users.filter((u) => u.isAdmin && !u.suspended).length;
  }

  function permBadges(u) {
    if (u.isAdmin) return `<span class="badge badge-role-super">مسؤول عام — كل الصلاحيات</span>`;
    const active = Object.keys(PERM_LABELS).filter((k) => u.permissions && u.permissions[k]);
    if (active.length === 0) return `<span class="badge badge-role-editor">بدون صلاحيات</span>`;
    return active.map((k) => `<span class="badge badge-role-manager">${PERM_LABELS[k]}</span>`).join(' ');
  }

  function render() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const filtered = users.filter((u) => u.username.toLowerCase().includes(q));

    tbody.innerHTML = '';
    emptyMsg.hidden = filtered.length > 0;

    filtered.forEach((u) => {
      const isSelf = window.currentUser && u.id === window.currentUser.id;
      const isLastAdmin = u.isAdmin && !u.suspended && activeAdminCount() <= 1;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="cell-user">
            <span class="user-avatar">${initials(u.username)}</span>
            <div class="cell-user-info"><strong>${u.username}${isSelf ? ' (أنت)' : ''}</strong></div>
          </div>
        </td>
        <td>${permBadges(u)}</td>
        <td><span class="badge ${u.suspended ? 'badge-status-suspended' : 'badge-status-active'}">${u.suspended ? 'موقوف' : 'نشِط'}</span></td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : '—'}</td>
        <td>
          <div class="cell-actions">
            <button class="btn-ghost" data-action="edit" data-id="${u.id}" ${u.isAdmin ? 'disabled title="حساب المسؤول له كل الصلاحيات دائمًا"' : ''}>تعديل الصلاحيات</button>
            <button class="btn-ghost" data-action="toggle" data-id="${u.id}" ${u.isAdmin ? 'disabled title="لا يمكن إيقاف حساب المسؤول"' : ''}>${u.suspended ? 'تفعيل' : 'إيقاف'}</button>
            <button class="btn-danger-text" data-action="delete" data-id="${u.id}" ${isSelf || (u.isAdmin && isLastAdmin) || users.length <= 1 ? 'disabled title="' + (isSelf ? 'لا يمكنك حذف حسابك الخاص' : users.length <= 1 ? 'لا يمكن حذف آخر مستخدم في النظام' : 'حماية آخر مسؤول عام') + '"' : ''}>حذف</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  searchInput.addEventListener('input', render);

  function openModal(user) {
    editingId = user ? user.id : null;
    form.reset();
    formError.hidden = true;
    if (user) {
      modalTitle.textContent = 'تعديل صلاحيات المستخدم';
      saveBtn.textContent = 'حفظ الصلاحيات';
      document.getElementById('uUsername').value = user.username;
      document.getElementById('uUsername').disabled = true;
      passwordField.hidden = true;
      document.getElementById('pAdd').checked = !!user.permissions.addWork;
      document.getElementById('pEdit').checked = !!user.permissions.editWork;
      document.getElementById('pHide').checked = !!user.permissions.hideWork;
      document.getElementById('pDelete').checked = !!user.permissions.deleteWork;
    } else {
      modalTitle.textContent = 'إضافة مستخدم جديد';
      saveBtn.textContent = 'إضافة المستخدم';
      document.getElementById('uUsername').disabled = false;
      passwordField.hidden = false;
    }
    overlay.hidden = false;
    document.getElementById('uUsername').focus();
  }
  function closeModal() { overlay.hidden = true; editingId = null; }

  document.getElementById('openAddUser').addEventListener('click', () => openModal(null));
  document.getElementById('closeUserModal').addEventListener('click', closeModal);
  document.getElementById('cancelUserForm').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    const permissions = {
      addWork: document.getElementById('pAdd').checked,
      editWork: document.getElementById('pEdit').checked,
      hideWork: document.getElementById('pHide').checked,
      deleteWork: document.getElementById('pDelete').checked,
    };
    saveBtn.disabled = true;
    try {
      if (editingId) {
        await window.Api.updateUserPermissions(editingId, permissions);
        window.showToast('تم تحديث صلاحيات المستخدم');
      } else {
        const username = document.getElementById('uUsername').value.trim();
        const password = document.getElementById('uPassword').value;
        await window.Api.createUser(username, password, permissions);
        window.showToast('تمت إضافة المستخدم');
      }
      closeModal();
      await loadUsers();
    } catch (err) {
      formError.textContent = err.message;
      formError.hidden = false;
    } finally {
      saveBtn.disabled = false;
    }
  });

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;
    const id = btn.getAttribute('data-id');
    const user = users.find((u) => u.id === id);
    const action = btn.getAttribute('data-action');

    try {
      if (action === 'edit') {
        openModal(user);
      } else if (action === 'toggle') {
        await window.Api.setUserSuspended(id, !user.suspended);
        window.showToast(user.suspended ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب');
        await loadUsers();
      } else if (action === 'delete') {
        if (confirm(`متأكد إنك عايز تحذف "${user.username}"؟`)) {
          await window.Api.deleteUser(id);
          window.showToast('تم حذف المستخدم');
          await loadUsers();
        }
      }
    } catch (err) {
      window.showToast(err.message);
    }
  });

  document.addEventListener('auth-ready', () => { loadUsers(); });
})();
