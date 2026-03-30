// ============================================================
// NAMM GLOBAL – Notifications
// Bell in nav, poll localStorage every 15s for new notifs
// ============================================================

(function () {
  'use strict';

  let _userId   = null;
  let _interval = null;

  const NOTIF_ICONS = {
    QUOTE_AVAILABLE: '💰',
    ORDER_SHIPPED:   '✈️',
    ORDER_DELIVERED: '📦',
    PAYMENT_DONE:    '✅',
    INFO:            'ℹ️'
  };

  function init(userId) {
    _userId = userId;
    _injectBell();
    _refresh();
    // Poll every 15 s
    if (_interval) clearInterval(_interval);
    _interval = setInterval(_refresh, 15000);
  }

  function _injectBell() {
    // Insert bell button before userMenuWrap or loginBtn in nav
    const nav = document.getElementById('navbar');
    if (!nav || document.getElementById('notifBell')) return;

    const wrap = nav.querySelector('#userMenuWrap') || nav.querySelector('a[href="login.html"]');
    if (!wrap) return;

    const bellEl = document.createElement('div');
    bellEl.id        = 'notifBellWrap';
    bellEl.className = 'relative';
    bellEl.innerHTML = `
      <button id="notifBell"
              onclick="window.NOTIFS.toggle()"
              class="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-red-50"
              style="border:1.5px solid #E8DDD0;"
              title="Notifications">
        🔔
        <span id="notifBadge"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full hidden items-center justify-center text-white text-xs font-bold"
              style="background:#D62828;font-size:10px;"></span>
      </button>

      <div id="notifDropdown"
           class="hidden absolute right-0 top-full mt-2 rounded-2xl shadow-xl overflow-hidden"
           style="width:340px;background:white;border:1px solid #E8DDD0;z-index:200;max-height:420px;overflow-y:auto;">

        <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid #F5F0E8;">
          <div class="font-bold text-sm" style="color:#1A1A2E;font-family:'Syne',sans-serif;">🔔 Notifications</div>
          <button onclick="window.NOTIFS.markAllRead()" class="text-xs font-semibold transition-colors hover:text-red-600"
                  style="color:#8C7B6B;">Tout lire</button>
        </div>

        <div id="notifList" class="divide-y" style="border-color:#F5F0E8;"></div>

        <div id="notifEmpty" class="hidden p-6 text-center">
          <div class="text-3xl mb-2">🔕</div>
          <div class="text-sm" style="color:#8C7B6B;">Aucune notification</div>
        </div>
      </div>`;

    wrap.parentNode.insertBefore(bellEl, wrap);
  }

  function _refresh() {
    if (!window.STORE) return;
    const list  = window.STORE.notifs.getAll(_userId);
    const unread = list.filter(n => !n.read);

    // Badge
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (unread.length > 0) {
        badge.textContent = unread.length > 9 ? '9+' : unread.length;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
    }

    // List
    const listEl  = document.getElementById('notifList');
    const emptyEl = document.getElementById('notifEmpty');
    if (!listEl) return;

    if (list.length === 0) {
      listEl.innerHTML  = '';
      emptyEl?.classList.remove('hidden');
      return;
    }
    emptyEl?.classList.add('hidden');

    listEl.innerHTML = list.slice(0, 15).map(n => {
      const icon   = NOTIF_ICONS[n.type] || 'ℹ️';
      const time   = _relativeTime(n.createdAt);
      const unread = !n.read;
      return `
        <div class="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${unread ? 'bg-red-50/40' : ''}"
             onclick="window.NOTIFS._clickNotif('${n.id}', '${n.orderId || ''}')">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
               style="background:${unread ? '#FFF5F5' : '#F5F0E8'};">${icon}</div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold truncate" style="color:${unread ? '#D62828' : '#1A1A2E'};">${n.title}</div>
            <div class="text-xs mt-0.5 line-clamp-2" style="color:#8C7B6B;line-height:1.4;">${n.message}</div>
            <div class="text-xs mt-1" style="color:#C4B5A5;">${time}</div>
          </div>
          ${unread ? '<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background:#D62828;"></div>' : ''}
        </div>`;
    }).join('');
  }

  function _relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Il y a ${days}j`;
  }

  // ── Public API ───────────────────────────────────────────────
  const NOTIFS = {
    init,
    toggle() {
      const dd = document.getElementById('notifDropdown');
      if (!dd) return;
      const opening = dd.classList.contains('hidden');
      dd.classList.toggle('hidden');
      if (opening) _refresh();
    },
    markAllRead() {
      window.STORE?.notifs.markAllRead(_userId);
      _refresh();
    },
    _clickNotif(id, orderId) {
      window.STORE?.notifs.markRead(id);
      _refresh();
      document.getElementById('notifDropdown')?.classList.add('hidden');
      if (orderId && window.location.href.includes('dashboard.html')) {
        // Highlight the order
        document.getElementById('notifDropdown')?.classList.add('hidden');
        const el = document.querySelector(`[data-order-id="${orderId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '2px solid #D62828';
          setTimeout(() => el.style.outline = '', 3000);
        }
      }
    },
    refresh: _refresh
  };

  // Close dropdown on outside click
  document.addEventListener('click', function (e) {
    const wrap = document.getElementById('notifBellWrap');
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById('notifDropdown')?.classList.add('hidden');
    }
  });

  window.NOTIFS = NOTIFS;
})();
