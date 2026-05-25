// ============================================================
// NAMM GLOBAL – Dashboard JS
// ============================================================

let _allOrders   = [];
let _filter      = 'ALL';
let _waveFilter  = 'ALL';
let _searchQuery = '';
const STATUS_COLOR = {
  AWAITING_QUOTE:  '#6B7280',
  QUOTE_AVAILABLE: '#D97706',
  QUOTE_ACCEPTED:  '#3B82F6',
  QUOTE_REJECTED:  '#EF4444',
  CONFIRMED:       '#3B82F6',
  CN_TRANSIT:      '#8B5CF6',
  SHIPPING:        '#6366F1',
  CUSTOMS:         '#F59E0B',
  DELIVERED:       '#10B981',
  ISSUE:           '#EF4444',
  PENDING:         '#D97706',
};

// ── Init ──────────────────────────────────────────────────────
async function initDashboard() {
  const user = await window.AUTH.getCurrentUser();
  if (!user) return;

  // Notifications bell
  window.NOTIFS?.init(user.id);

  // Render user card
  renderUserCard(user);

  // Load and render orders
  await loadOrders(user);
  renderStats();
  renderWaveFilterBar();
  initFilters();
  initSearch();
  initNewOrderBtn();
}

// ── Load orders ───────────────────────────────────────────────
async function loadOrders(user) {
  _allOrders = await window.STORE.orders.getAll(user.id);
  renderOrders();
}

// ── User Card ─────────────────────────────────────────────────
function renderUserCard(user) {
  const el = document.getElementById('userCard');
  if (!el) return;
  const joined = new Date(user.joined || Date.now()).toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
  el.innerHTML = `
    <div class="p-5">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0"
             style="background:linear-gradient(135deg,#D62828,#E8A020);">${user.avatar || '?'}</div>
        <div class="min-w-0">
          <div class="font-bold text-base truncate" style="color:#1A1A2E;font-family:'Syne',sans-serif;">${user.name}</div>
          <div class="text-xs mt-0.5" style="color:#8C7B6B;">📍 ${user.city || '—'}, ${user.country || '—'}</div>
          <div class="text-xs mt-0.5" style="color:#8C7B6B;">Membre depuis ${joined}</div>
        </div>
      </div>
      <div class="space-y-2 pt-4" style="border-top:1px solid #F5F0E8;">
        <div class="flex items-center gap-2 text-xs" style="color:#5C5C6E;">
          <span>📱</span><span class="font-medium">${user.phone || '—'}</span>
        </div>
        ${user.email ? `<div class="flex items-center gap-2 text-xs" style="color:#5C5C6E;"><span>✉️</span><span class="font-medium truncate">${user.email}</span></div>` : ''}
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <a href="profile.html" class="btn-ghost text-xs text-center py-2 rounded-lg" style="font-size:12px;">
          ✏️ Mon profil
        </a>
        <button onclick="window.AUTH.logoutUser()"
                class="py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50"
                style="color:#D62828;border:1px solid #FECACA;">
          🚪 Déconnexion
        </button>
      </div>
    </div>`;
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const el = document.getElementById('dashStats');
  if (!el) return;
  const delivered = _allOrders.filter(o => o.status === 'DELIVERED').length;
  const active    = _allOrders.filter(o => !['DELIVERED','QUOTE_REJECTED'].includes(o.status)).length;
  const issues    = _allOrders.filter(o => o.status === 'ISSUE').length;
  const total     = _allOrders.length;
  const items = [
    { icon:'📦', label:'Total commandes', value: total,     color:'#1A1A2E' },
    { icon:'✅', label:'Livrées',          value: delivered, color:'#10B981' },
    { icon:'✈️', label:'En cours',         value: active,    color:'#6366F1' },
    { icon:'⚠️', label:'Problèmes',        value: issues,    color:'#EF4444' },
  ];
  el.innerHTML = items.map(s => `
    <div class="card p-4 text-center">
      <div class="text-2xl mb-1">${s.icon}</div>
      <div class="text-2xl font-black" style="color:${s.color};font-family:'Syne',sans-serif;">${s.value}</div>
      <div class="text-xs mt-0.5" style="color:#8C7B6B;">${s.label}</div>
    </div>`).join('');
}

// ── Wave Filter Bar ───────────────────────────────────────────
async function renderWaveFilterBar() {
  const el = document.getElementById('waveFilterBar');
  if (!el) return;
  const waves = await window.STORE.waves.getAll();

  // Only show waves that have orders
  const usedWaves = new Set(_allOrders.map(o => o.waveId).filter(Boolean));
  const relevant  = waves.filter(w => usedWaves.has(w.id));
  if (relevant.length === 0) { el.parentElement?.classList.add('hidden'); return; }

  el.innerHTML = `<span class="text-xs font-bold" style="color:#5C5C6E;">Vague :</span>` +
    `<button data-wave="ALL" onclick="setWaveFilter('ALL')" class="wave-tab active text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
             style="background:#FFF5F5;color:#D62828;">Toutes</button>` +
    relevant.map(w => `
      <button data-wave="${w.id}" onclick="setWaveFilter('${w.id}')"
              class="wave-tab text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style="background:#F5F0E8;color:#5C5C6E;">
        ${w.wave}
      </button>`).join('');
}

function setWaveFilter(waveId) {
  _waveFilter = waveId;
  document.querySelectorAll('.wave-tab').forEach(b => {
    const active = b.dataset.wave === waveId;
    b.style.background = active ? '#FFF5F5' : '#F5F0E8';
    b.style.color      = active ? '#D62828'  : '#5C5C6E';
  });
  renderOrders();
}

// ── Filters ───────────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', function () {
      _filter = this.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderOrders();
    });
  });
}

function initSearch() {
  const input = document.getElementById('orderSearch');
  if (!input) return;
  input.addEventListener('input', function () {
    _searchQuery = this.value.toLowerCase();
    renderOrders();
  });
}

// ── Render Orders ─────────────────────────────────────────────
function renderOrders() {
  const el = document.getElementById('orderList');
  if (!el) return;

  let list = [..._allOrders];

  // Status filter
  if (_filter !== 'ALL') {
    const filterMap = {
      DELIVERED:      ['DELIVERED'],
      SHIPPING:       ['SHIPPING', 'CN_TRANSIT', 'CUSTOMS', 'CONFIRMED'],
      PENDING:        ['AWAITING_QUOTE', 'QUOTE_AVAILABLE', 'QUOTE_ACCEPTED', 'PENDING'],
      ISSUE:          ['ISSUE', 'QUOTE_REJECTED'],
    };
    const allowed = filterMap[_filter] || [_filter];
    list = list.filter(o => allowed.includes(o.status));
  }

  // Wave filter
  if (_waveFilter !== 'ALL') list = list.filter(o => o.waveId === _waveFilter);

  // Search
  if (_searchQuery) {
    list = list.filter(o =>
      o.product?.toLowerCase().includes(_searchQuery) ||
      o.id?.toLowerCase().includes(_searchQuery) ||
      o.category?.toLowerCase().includes(_searchQuery)
    );
  }

  if (list.length === 0) {
    el.innerHTML = `
      <div class="card p-12 text-center">
        <div class="text-4xl mb-3">🔍</div>
        <div class="font-bold mb-1" style="color:#1A1A2E;">Aucune commande trouvée</div>
        <div class="text-sm" style="color:#8C7B6B;">Essayez d'autres filtres ou créez une nouvelle commande.</div>
      </div>`;
    return;
  }

  el.innerHTML = list.map(o => renderOrderCard(o)).join('');
}

function renderOrderCard(o) {
  const st     = ORDER_STATUSES[o.status] || ORDER_STATUSES.PENDING;
  const color  = STATUS_COLOR[o.status]   || '#8C7B6B';
  const hasQuote = o.quote;
  const isAwaitingQuote   = o.status === 'AWAITING_QUOTE';
  const isQuoteAvailable  = o.status === 'QUOTE_AVAILABLE';
  const isQuoteAccepted   = o.status === 'QUOTE_ACCEPTED';
  const isQuoteRejected   = o.status === 'QUOTE_REJECTED';

  return `
    <div class="card overflow-hidden transition-all hover:shadow-md" data-order-id="${o.id}">
      <div class="p-4 sm:p-5">
        <div class="flex gap-4">
          ${o.image ? `<img src="${o.image}" alt="" class="w-16 h-16 rounded-xl object-cover flex-shrink-0" style="border:2px solid #E8DDD0;">` : `<div class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style="background:#F5F0E8;">📦</div>`}
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="font-bold text-sm truncate" style="color:#1A1A2E;">${o.product}</div>
              <span class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                    style="background:${color}18;color:${color};">
                ${st.icon} ${st.label}
              </span>
            </div>
            <div class="text-xs mb-2" style="color:#8C7B6B;">
              ${o.id} · ${new Date(o.date).toLocaleDateString('fr-FR')}
              ${o.category ? ` · ${o.category}` : ''}
              ${o.waveId ? ` · <span style="color:#D62828;">${_getWaveLabel(o.waveId)}</span>` : ''}
            </div>

            ${isAwaitingQuote ? `
              <div class="flex items-center gap-2 p-2.5 rounded-xl text-xs" style="background:#F5F0E8;color:#5C5C6E;">
                <span class="animate-pulse">⏳</span>
                <span>Devis en cours de préparation par NAMM GLOBAL…</span>
              </div>` : ''}

            ${isQuoteAvailable ? `
              <div class="p-3 rounded-xl mb-3" style="background:#FFFBEB;border:1px solid #FDE68A;">
                <div class="text-xs font-bold mb-2" style="color:#D97706;">💰 Votre devis est disponible !</div>
                ${o.quote ? renderQuoteSummary(o.quote) : ''}
              </div>
              <div class="flex gap-2">
                <button onclick="acceptQuote('${o.id}')" class="btn-primary text-xs px-4 py-2">✅ Accepter & Payer</button>
                <button onclick="rejectQuote('${o.id}')" class="btn-ghost text-xs px-4 py-2" style="color:#EF4444;border-color:#FECACA;">❌ Refuser</button>
                <button onclick="showOrderDetail('${o.id}')" class="btn-ghost text-xs px-4 py-2">👁️ Détails</button>
              </div>` : ''}

            ${isQuoteAccepted ? `
              <div class="flex items-center gap-2 p-2.5 rounded-xl text-xs mb-2" style="background:#EFF6FF;color:#3B82F6;">
                <span>✅</span><span>Devis accepté – paiement en attente</span>
              </div>
              <button onclick="payOrder('${o.id}')" class="btn-primary text-xs px-4 py-2">💳 Procéder au paiement</button>` : ''}

            ${isQuoteRejected ? `
              <div class="flex items-center gap-2 p-2.5 rounded-xl text-xs" style="background:#FEF2F2;color:#EF4444;">
                <span>❌</span><span>Devis refusé – cette commande sera supprimée.</span>
              </div>` : ''}

            ${!isAwaitingQuote && !isQuoteAvailable && !isQuoteAccepted && !isQuoteRejected ? `
              <div class="flex flex-wrap gap-2 mt-2">
                ${o.quote ? `<span class="text-xs font-bold" style="color:#1A1A2E;">${Number(o.quote.total).toLocaleString('fr-FR')} FCFA</span>` : ''}
                <button onclick="showOrderDetail('${o.id}')" class="btn-ghost text-xs px-3 py-1.5">👁️ Détails</button>
                ${o.status === 'DELIVERED' ? `<button onclick="repeatOrder('${o.id}')" class="btn-ghost text-xs px-3 py-1.5">🔁 Répéter</button>` : ''}
              </div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

function renderQuoteSummary(q) {
  return `
    <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs" style="color:#5C5C6E;">
      <span>Produit :</span><span class="font-medium text-right">${Number(q.productCost).toLocaleString('fr-FR')} FCFA</span>
      <span>Service NAMM :</span><span class="font-medium text-right">${Number(q.serviceFee).toLocaleString('fr-FR')} FCFA</span>
      <span>Transport :</span><span class="font-medium text-right">${Number(q.shippingCost).toLocaleString('fr-FR')} FCFA</span>
      <span>Douane :</span><span class="font-medium text-right">${Number(q.customsDuty).toLocaleString('fr-FR')} FCFA</span>
      <span class="font-bold" style="color:#1A1A2E;">TOTAL :</span>
      <span class="font-black text-right" style="color:#D62828;">${Number(q.total).toLocaleString('fr-FR')} FCFA</span>
    </div>`;
}

function _getWaveLabel(waveId) {
  const waves = window.STORE ? (JSON.parse(localStorage.getItem('namm_waves')) || []) : ORDER_WAVES;
  const w = waves.find(w => w.id === waveId);
  return w ? w.wave : waveId;
}

// ── Accept / Reject / Pay ─────────────────────────────────────
async function acceptQuote(orderId) {
  await window.STORE.orders.acceptQuote(orderId);
  await loadOrders(await window.AUTH.getCurrentUser());
  // Immediately show payment
  payOrder(orderId);
}

async function rejectQuote(orderId) {
  const confirmed = await showConfirmDialog(
    'Refuser le devis',
    'Êtes-vous sûr de vouloir refuser ce devis ? La commande sera supprimée.',
    'Oui, refuser', '← Non, annuler'
  );
  if (!confirmed) return;
  await window.STORE.orders.rejectQuote(orderId);
  // Remove from list after short delay
  setTimeout(async () => {
    await window.STORE.orders.delete(orderId);
    await loadOrders(await window.AUTH.getCurrentUser());
    renderStats();
  }, 1500);
  await loadOrders(await window.AUTH.getCurrentUser());
}

async function payOrder(orderId) {
  const order = await window.STORE.orders.getById(orderId);
  if (!order || !order.quote) return;
  try {
    const result = await window.PAYMENT.open({
      amount:  order.quote.total,
      orderId: order.id
    });
    if (result.success) {
      await window.STORE.orders.confirmPayment(orderId, result.ref);
      window.showToast?.('✅ Paiement confirmé ! Votre commande est lancée.', 'success');
      await loadOrders(await window.AUTH.getCurrentUser());
      renderStats();
    }
  } catch (e) {
    if (!e?.cancelled) window.showToast?.('❌ Paiement annulé.', 'error');
  }
}

async function repeatOrder(originalId) {
  const order = await window.STORE.orders.getById(originalId);
  if (!order) return;
  openNewOrderDialog({ prefill: order });
}

// ── New Order Dialog ──────────────────────────────────────────
function initNewOrderBtn() {
  const btn = document.getElementById('newOrderBtn');
  if (btn) btn.addEventListener('click', () => openNewOrderDialog());
}

// ── Profile Incomplete Dialog ─────────────────────────────────
function showProfileIncompleteDialog() {
  let el = document.getElementById('profileIncompleteModal');
  if (!el) { el = document.createElement('div'); el.id = 'profileIncompleteModal'; document.body.appendChild(el); }
  el.innerHTML = `
    <div class="fixed inset-0 z-[150] flex items-center justify-center p-4"
         style="background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);">
      <div class="w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center" style="background:white;">
        <div class="text-5xl mb-4">👤</div>
        <h3 class="text-lg font-black mb-2" style="font-family:'Syne',sans-serif;color:#1A1A2E;">Profil incomplet</h3>
        <p class="text-sm mb-6" style="color:#8C7B6B;">
          Pour passer une commande, veuillez d'abord compléter les informations de votre profil
          (nom, téléphone, pays, ville).
        </p>
        <div class="flex gap-3">
          <button onclick="document.getElementById('profileIncompleteModal').remove()"
                  class="btn-ghost flex-1 justify-center">Annuler</button>
          <a href="profile.html" class="btn-primary flex-1 justify-center">✏️ Mon profil →</a>
        </div>
      </div>
    </div>`;
}

// ── Order Detail Modal ────────────────────────────────────────
async function showOrderDetail(orderId) {
  const o = await window.STORE.orders.getById(orderId);
  if (!o) return;
  const st    = ORDER_STATUSES[o.status] || {};
  const color = STATUS_COLOR[o.status] || '#8C7B6B';
  const modal = document.getElementById('orderModal');
  const content = document.getElementById('orderModalContent');
  if (!modal || !content) return;

  const stepLabels = ['Demande', 'Devis', 'Paiement', 'En Chine', 'Transit', 'Douane', 'Livré'];

  content.innerHTML = `
    <div class="p-6">
      <div class="flex items-start justify-between mb-5">
        <div>
          <div class="font-black text-lg" style="font-family:'Syne',sans-serif;color:#1A1A2E;">${o.product}</div>
          <div class="text-sm mt-0.5" style="color:#8C7B6B;">${o.id} · ${new Date(o.date).toLocaleDateString('fr-FR')}</div>
        </div>
        <button onclick="closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100" style="color:#8C7B6B;">✕</button>
      </div>

      <div class="flex items-center gap-2 mb-5">
        <span class="text-xs font-semibold px-3 py-1.5 rounded-full" style="background:${color}18;color:${color};">
          ${st.icon} ${st.label}
        </span>
        ${o.transport ? `<span class="text-xs px-2 py-1 rounded-full" style="background:#F5F0E8;color:#5C5C6E;">${o.transport === 'Avion' ? '✈️' : '🚢'} ${o.transport}</span>` : ''}
      </div>

      ${o.quote ? `
        <div class="card p-4 mb-5">
          <div class="font-bold text-sm mb-3" style="color:#1A1A2E;">💰 Devis</div>
          ${renderQuoteSummary(o.quote)}
        </div>` : o.status === 'AWAITING_QUOTE' ? `
        <div class="p-3 rounded-xl mb-5 text-xs" style="background:#F5F0E8;color:#5C5C6E;">
          ⏳ Devis en cours de préparation – vous serez notifié sous 24h.
        </div>` : ''}

      <div class="mb-5">
        <div class="font-bold text-sm mb-3" style="color:#1A1A2E;">📍 Suivi de la commande</div>
        <div class="space-y-3">
          ${(o.timeline || []).map(t => {
            const ts = ORDER_STATUSES[t.status] || {};
            const tc = STATUS_COLOR[t.status] || '#8C7B6B';
            return `
              <div class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                       style="background:${tc};">${ts.icon || '·'}</div>
                  <div class="w-0.5 flex-1 mt-1" style="background:#E8DDD0;min-height:12px;"></div>
                </div>
                <div class="pb-3">
                  <div class="text-xs font-bold" style="color:#1A1A2E;">${ts.label || t.status}</div>
                  <div class="text-xs" style="color:#8C7B6B;">${t.note}</div>
                  <div class="text-xs mt-0.5" style="color:#C4B5A5;">${new Date(t.date).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      ${o.rating ? `
        <div class="p-3 rounded-xl" style="background:#F5F0E8;">
          <div class="text-xs mb-1" style="color:#8C7B6B;">${'⭐'.repeat(o.rating)} Avis client</div>
          <div class="text-sm italic" style="color:#5C5C6E;">"${o.clientNote}"</div>
        </div>` : ''}
    </div>`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  const modal = document.getElementById('orderModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

// ── Confirm Dialog ────────────────────────────────────────────
function showConfirmDialog(title, message, confirmLabel, cancelLabel) {
  return new Promise((resolve) => {
    let el = document.getElementById('confirmDialog');
    if (!el) { el = document.createElement('div'); el.id = 'confirmDialog'; document.body.appendChild(el); }
    el.innerHTML = `
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4" style="background:rgba(0,0,0,0.6);">
        <div class="w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center" style="background:white;">
          <div class="text-4xl mb-3">⚠️</div>
          <h3 class="font-black text-base mb-2" style="font-family:'Syne',sans-serif;color:#1A1A2E;">${title}</h3>
          <p class="text-sm mb-5" style="color:#8C7B6B;">${message}</p>
          <div class="flex gap-3">
            <button onclick="document.getElementById('confirmDialog').remove();window._confirmResolve(false);"
                    class="btn-ghost flex-1 justify-center">${cancelLabel}</button>
            <button onclick="document.getElementById('confirmDialog').remove();window._confirmResolve(true);"
                    class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style="background:#D62828;">${confirmLabel}</button>
          </div>
        </div>
      </div>`;
    window._confirmResolve = resolve;
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDashboard);
