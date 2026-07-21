// js/dashboard-shell.js
// منطق الهيكل العام + الاتصال الحقيقي بجلسة تسجيل الدخول في alomran-site.
// أي قسم يحتاج بيانات حقيقية (مستخدمين، أعمال، إعدادات) بينتظر حدث
// "auth-ready" اللي بيتبعت من هنا بعد التأكد من الجلسة، ومعاه window.currentUser.
(function () {
  'use strict';

  const navItems = Array.from(document.querySelectorAll('.nav-item[data-view]'));
  const navGroups = Array.from(document.querySelectorAll('.nav-group[data-requires]'));
  const views = Array.from(document.querySelectorAll('.view[id^="view-"]'));
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarEyebrow = document.getElementById('topbarEyebrow');
  const userRoleChip = document.getElementById('userRoleChip');
  const currentUserLabel = document.getElementById('currentUserLabel');
  const userAvatarInitial = document.getElementById('userAvatarInitial');
  const sessionDot = document.getElementById('sessionDot');
  const sessionLabel = document.getElementById('sessionLabel');

  window.currentUser = null;

  function applyAccess(user) {
    const isAdmin = !!user.isAdmin;

    navGroups.forEach((group) => {
      const req = group.getAttribute('data-requires');
      group.style.display = (req === 'admin' && !isAdmin) ? 'none' : '';
    });
    navItems.forEach((item) => {
      const req = item.getAttribute('data-requires') || 'any';
      item.style.display = (req === 'admin' && !isAdmin) ? 'none' : '';
    });

    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem && activeItem.style.display === 'none') switchView('overview');
  }

  function renderUser(user) {
    const isAdmin = !!user.isAdmin;
    userRoleChip.textContent = isAdmin ? 'مسؤول عام' : 'صلاحيات مخصصة';
    currentUserLabel.textContent = user.username;
    userAvatarInitial.textContent = user.username.trim().charAt(0).toUpperCase();
    sessionDot.classList.add('ok');
    sessionLabel.textContent = `متصل: ${user.username}`;
  }

  function switchView(view) {
    navItems.forEach((item) => item.classList.toggle('active', item.getAttribute('data-view') === view));
    views.forEach((section) => {
      const isTarget = section.id === 'view-' + view;
      section.classList.toggle('active', isTarget);
      if (isTarget) {
        topbarTitle.textContent = section.getAttribute('data-title') || '';
        topbarEyebrow.textContent = section.getAttribute('data-eyebrow') || '';
      }
    });
    document.getElementById('side').classList.remove('open');
  }

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.getAttribute('data-view'));
    });
  });

  document.getElementById('sideOpen').addEventListener('click', () => {
    document.getElementById('side').classList.add('open');
  });
  document.getElementById('sideCollapse').addEventListener('click', () => {
    document.getElementById('side').classList.remove('open');
  });

  document.getElementById('backToSiteLink').href = window.SITE_URL || '#';

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await window.Api.logout(); } catch (e) { /* حتى لو فشل، اطرد المستخدم محلياً */ }
    window.location.href = 'login.html';
  });

  // ============================= تغيير كلمة المرور ============================= //
  const pwOverlay = document.getElementById('passwordModalOverlay');
  const pwForm = document.getElementById('passwordForm');
  const pwError = document.getElementById('pwError');
  document.getElementById('changePasswordBtn').addEventListener('click', () => {
    pwForm.reset();
    pwError.hidden = true;
    pwOverlay.hidden = false;
  });
  document.getElementById('closePasswordModal').addEventListener('click', () => { pwOverlay.hidden = true; });
  document.getElementById('cancelPasswordForm').addEventListener('click', () => { pwOverlay.hidden = true; });
  pwOverlay.addEventListener('click', (e) => { if (e.target === pwOverlay) pwOverlay.hidden = true; });
  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pwError.hidden = true;
    try {
      await window.Api.changeMyPassword(document.getElementById('pwCurrent').value, document.getElementById('pwNew').value);
      pwOverlay.hidden = true;
      window.showToast('تم تغيير كلمة المرور بنجاح');
    } catch (err) {
      pwError.textContent = err.message;
      pwError.hidden = false;
    }
  });

  // ============================= توست تنبيه مشترك (تستخدمه كل الأقسام) ============================= //
  let toastEl = null;
  let toastTimer = null;
  window.showToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  };

  // ============================= التحقق من الجلسة الحقيقية ============================= //
  switchView('overview'); // يظهر فورًا بدون انتظار الشبكة
  window.Api.getSession()
    .then(({ user }) => {
      window.currentUser = user;
      renderUser(user);
      applyAccess(user);
      document.dispatchEvent(new CustomEvent('auth-ready', { detail: user }));
    })
    .catch(() => {
      // لا توجد جلسة صالحة — رجّعه لصفحة الدخول
      window.location.href = 'login.html';
    });
})();
