// js/section-messages.js
// صندوق رسائل التواصل — بيانات تجريبية في الذاكرة، بانتظار الربط بالـ API.
(function () {
  'use strict';

  const STATUS_LABELS = { new: 'جديدة', replied: 'تم الرد', closed: 'مغلقة' };
  const STATUS_DOT = { new: 'dot-new', replied: 'dot-replied', closed: 'dot-closed' };

  let messages = [
    { id: 'm1', name: 'عبدالله المطيري', phone: '0555123456', email: 'abdullah@example.com',
      message: 'السلام عليكم، أرغب بالحصول على عرض سعر لبناء فيلا سكنية في حي النرجس بالرياض، المساحة تقريباً 600 متر.',
      date: 'اليوم، 10:20 ص', status: 'new', notes: '', read: false },
    { id: 'm2', name: 'منيرة الحربي', phone: '0561987654', email: 'muneera.h@example.com',
      message: 'هل يمكن زيارة أحد المواقع المنفذة سابقاً قبل التعاقد؟ نحتاج تأكد من جودة التنفيذ.',
      date: 'أمس، 4:45 م', status: 'new', notes: '', read: false },
    { id: 'm3', name: 'شركة الأفق للتطوير', phone: '0112345678', email: 'info@alofoq.sa',
      message: 'نحتاج مقاول من الباطن لمشروع تجاري في جدة، الرجاء التواصل لمناقشة التفاصيل والجدول الزمني.',
      date: 'أمس، 11:00 ص', status: 'replied', notes: 'تم الاتصال، بانتظار إرسال كراسة الشروط منهم.', read: true },
    { id: 'm4', name: 'فهد القحطاني', phone: '0533221100', email: '',
      message: 'شكراً لكم على سرعة التنفيذ في مشروع فيلا النخيل، الجودة كانت ممتازة.',
      date: 'منذ 3 أيام', status: 'closed', notes: 'رسالة شكر — لا حاجة لمتابعة.', read: true },
  ];

  const listEl = document.getElementById('msgList');
  const emptyEl = document.getElementById('msgEmpty');
  const searchInput = document.getElementById('msgSearch');
  const statusTabs = document.getElementById('msgStatusTabs');
  const detailEmpty = document.getElementById('msgDetailEmpty');
  const detailContent = document.getElementById('msgDetailContent');

  let statusFilter = 'all';
  let selectedId = null;

  const badge = document.getElementById('msgBadge');
  function updateBadge() {
    const newCount = messages.filter((m) => m.status === 'new').length;
    if (badge) {
      badge.textContent = newCount;
      badge.style.display = newCount > 0 ? '' : 'none';
    }
  }

  function filteredList() {
    const q = (searchInput.value || '').trim().toLowerCase();
    return messages.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesQuery = m.name.toLowerCase().includes(q) || m.phone.includes(q);
      return matchesStatus && matchesQuery;
    });
  }

  function renderList() {
    const list = filteredList();
    listEl.innerHTML = '';
    emptyEl.hidden = list.length > 0;

    list.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'msg-item' + (m.id === selectedId ? ' active' : '') + (!m.read ? ' unread' : '');
      li.setAttribute('data-id', m.id);
      li.innerHTML = `
        <span class="status-dot ${STATUS_DOT[m.status]}"></span>
        <div class="msg-item-body">
          <div class="msg-item-top"><strong>${m.name}</strong><time>${m.date}</time></div>
          <div class="msg-item-snippet">${m.message}</div>
        </div>
      `;
      li.addEventListener('click', () => selectMessage(m.id));
      listEl.appendChild(li);
    });
    updateBadge();
  }

  function renderDetail() {
    const m = messages.find((x) => x.id === selectedId);
    if (!m) {
      detailEmpty.hidden = false;
      detailContent.hidden = true;
      return;
    }
    detailEmpty.hidden = true;
    detailContent.hidden = false;

    detailContent.innerHTML = `
      <div class="msg-detail-head">
        <div class="msg-detail-who">
          <h2>${m.name}</h2>
          <div class="msg-detail-meta">
            <span>📞 ${m.phone}</span>
            ${m.email ? `<span>✉️ ${m.email}</span>` : ''}
            <span>🕓 ${m.date}</span>
          </div>
        </div>
        <div class="msg-detail-status form-field">
          <label for="msgStatusSelect">الحالة</label>
          <select id="msgStatusSelect">
            <option value="new" ${m.status === 'new' ? 'selected' : ''}>جديدة</option>
            <option value="replied" ${m.status === 'replied' ? 'selected' : ''}>تم الرد</option>
            <option value="closed" ${m.status === 'closed' ? 'selected' : ''}>مغلقة</option>
          </select>
        </div>
      </div>

      <div class="msg-body-text">${m.message}</div>

      <div class="form-field" style="margin-bottom:18px;">
        <label for="msgNotes">ملاحظات داخلية (لا تظهر للعميل)</label>
        <textarea id="msgNotes" rows="2" placeholder="مثال: تمت المتابعة هاتفياً بتاريخ...">${m.notes}</textarea>
      </div>

      <div class="msg-reply-box">
        <label for="msgReply" style="font-size:12.5px; color: var(--muted); font-weight:600;">الرد على العميل</label>
        <textarea id="msgReply" placeholder="اكتب ردك هنا..."></textarea>
        <div class="msg-reply-actions">
          <button type="button" class="btn btn-primary" id="sendReplyBtn">إرسال الرد</button>
        </div>
      </div>
    `;

    document.getElementById('msgStatusSelect').addEventListener('change', (e) => {
      m.status = e.target.value;
      renderList();
      window.showToast('تم تحديث حالة الرسالة');
    });
    document.getElementById('msgNotes').addEventListener('input', (e) => { m.notes = e.target.value; });
    document.getElementById('sendReplyBtn').addEventListener('click', () => {
      const replyText = document.getElementById('msgReply').value.trim();
      if (!replyText) return;
      m.status = 'replied';
      renderList();
      renderDetail();
      window.showToast('تم إرسال الرد (تجريبي — لسه بدون ربط فعلي بالبريد/واتساب)');
    });
  }

  function selectMessage(id) {
    selectedId = id;
    const m = messages.find((x) => x.id === id);
    if (m) m.read = true;
    renderList();
    renderDetail();
  }

  searchInput.addEventListener('input', renderList);
  statusTabs.querySelectorAll('.seg-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      statusTabs.querySelectorAll('.seg-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      statusFilter = tab.getAttribute('data-status');
      renderList();
    });
  });

  renderList();
  renderDetail();
})();
