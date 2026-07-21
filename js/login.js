// js/login.js
// منطق صفحة تسجيل الدخول — متصل فعلياً بمشروع alomran-site عبر js/api.js.
(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const submitBtn = form.querySelector('button[type="submit"]');

  // لو المستخدم عنده جلسة شغّالة بالفعل، وديه على لوحة التحكم مباشرة
  window.Api.getSession().then(() => { window.location.href = 'dashboard.html'; }).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'جارٍ الدخول...';
    try {
      await window.Api.login(username, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'دخول';
    }
  });
})();
