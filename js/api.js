// js/api.js
// عميل الـ API الحقيقي — كل دالة هنا بتطابق مسار فعلي وموجود في مشروع
// alomran-site (server.js). أي قسم في لوحة التحكم مش موجود ليه مسار هنا
// (زي الرسائل، SEO، ألوان/خطوط الهوية) معناها السيرفر الحالي لسه ما بيدعمهوش،
// وده موضّح صراحة في واجهة القسم نفسه بدل ما يتوهم المستخدم إنه متصل.
window.Api = (function () {
  'use strict';

  async function request(path, options = {}) {
    const base = window.API_BASE || '';
    const res = await fetch(base + path, {
      credentials: 'include',
      headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      ...options,
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* لا يوجد محتوى JSON (مثلاً 204) */ }
    if (!res.ok) {
      const err = new Error(data.error || `حدث خطأ غير متوقع (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    // ============================= الجلسة ============================= //
    getSession: () => request('/api/session'),
    login: (username, password) => request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request('/api/logout', { method: 'POST' }),
    changeMyPassword: (currentPassword, newPassword) =>
      request('/api/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),

    // ============================= المستخدمون ============================= //
    listUsers: () => request('/api/users'),
    createUser: (username, password, permissions) =>
      request('/api/users', { method: 'POST', body: JSON.stringify({ username, password, permissions }) }),
    updateUserPermissions: (id, permissions) =>
      request(`/api/users/${id}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
    setUserSuspended: (id, suspended) =>
      request(`/api/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),
    deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

    // ============================= الأعمال (معرض الأعمال) ============================= //
    listWorks: () => request('/api/works'),
    createWork: (work) => request('/api/works', { method: 'POST', body: JSON.stringify(work) }),
    updateWork: (id, work) => request(`/api/works/${id}`, { method: 'PUT', body: JSON.stringify(work) }),
    setWorkVisible: (id, visible) => request(`/api/works/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ visible }) }),
    setWorkPinned: (id, pinned) => request(`/api/works/${id}/pin`, { method: 'PATCH', body: JSON.stringify({ pinned }) }),
    deleteWork: (id) => request(`/api/works/${id}`, { method: 'DELETE' }),
    uploadWorkImages: (id, formData) => request(`/api/works/${id}/images`, { method: 'PUT', body: formData }),

    // ============================= الإعدادات والهوية ============================= //
    getSettings: () => request('/api/settings'),
    putSocial: (social) => request('/api/settings/social', { method: 'PUT', body: JSON.stringify({ social }) }),
    putStats: (stats) => request('/api/settings/stats', { method: 'PUT', body: JSON.stringify({ stats }) }),
    putServices: (services) => request('/api/settings/services', { method: 'PUT', body: JSON.stringify({ services }) }),
    putTeam: (team) => request('/api/settings/team', { method: 'PUT', body: JSON.stringify({ team }) }),
    putWelcome: (welcome) => request('/api/settings/welcome', { method: 'PUT', body: JSON.stringify(welcome) }),
    putContent: (content) => request('/api/settings/content', { method: 'PUT', body: JSON.stringify(content) }),
    putBannerTextVisibility: (visible) => request('/api/settings/banner-text-visibility', { method: 'PATCH', body: JSON.stringify({ visible }) }),
    uploadLogo: (formData) => request('/api/settings/logo', { method: 'PUT', body: formData }),
    uploadFavicon: (formData) => request('/api/settings/favicon', { method: 'PUT', body: formData }),
    uploadProjectLogo: (formData) => request('/api/settings/project-logo', { method: 'PUT', body: formData }),
    uploadBannerLogo: (formData) => request('/api/settings/banner-logo', { method: 'PUT', body: formData }),
    uploadBanner: (slot, formData) => request(`/api/settings/banner/${slot}`, { method: 'PUT', body: formData }),
    uploadBackground: (key, formData) => request(`/api/settings/background/${key}`, { method: 'PUT', body: formData }),
    uploadContentImage: (key, formData) => request(`/api/settings/content-image/${key}`, { method: 'PUT', body: formData }),
  };
})();
