// ============================================================
// NAMM GLOBAL – Calendar (dynamic)
// ============================================================

let _calView     = 'full';   // 'full' | 'simplified'
let _calMonth    = new Date().getMonth();
let _calYear     = new Date().getFullYear();
let _waves       = [];

async function initCalendar() {
  _waves = await window.STORE.waves.getAll();
  renderCalendarView();
  renderMiniCalendar();
  initCalendarToggle();
}

function initCalendarToggle() {
  document.querySelectorAll('[data-calview]').forEach(btn => {
    btn.addEventListener('click', function () {
      _calView = this.dataset.calview;
      document.querySelectorAll('[data-calview]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderCalendarView();
    });
  });
}

function renderCalendarView() {
  if (_calView === 'simplified') {
    renderWaves();
    document.getElementById('fullCalView')?.classList.add('hidden');
    document.getElementById('simplifiedCalView')?.classList.remove('hidden');
  } else {
    renderEvents();
    document.getElementById('fullCalView')?.classList.remove('hidden');
    document.getElementById('simplifiedCalView')?.classList.add('hidden');
  }
}

// ── Events list ───────────────────────────────────────────────
function renderEvents() {
  const el = document.getElementById('eventsList');
  if (!el) return;

  const now    = new Date();
  const sorted = [...CHINESE_EVENTS].sort((a, b) => new Date(a.date) - new Date(b.date));

  const severityStyle = {
    high:     { bg:'#FEF2F2', border:'#FECACA', color:'#D62828', badge:'bg-red-100 text-red-700' },
    medium:   { bg:'#FFFBEB', border:'#FDE68A', color:'#D97706', badge:'bg-yellow-100 text-yellow-700' },
    low:      { bg:'#F0FDF4', border:'#BBF7D0', color:'#2D7D46', badge:'bg-green-100 text-green-700' },
    positive: { bg:'#EFF6FF', border:'#BFDBFE', color:'#1D4ED8', badge:'bg-blue-100 text-blue-700' },
  };

  el.innerHTML = sorted.map(ev => {
    const st      = severityStyle[ev.severity] || severityStyle.low;
    const evDate  = new Date(ev.date);
    const isPast  = evDate < now;
    const daysTo  = Math.ceil((evDate - now) / 86400000);

    return `
      <div class="card overflow-hidden reveal ${isPast ? 'opacity-60' : ''}"
           style="border-left:4px solid ${st.color};">
        <div class="p-4">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="text-xl flex-shrink-0">
                ${ev.type === 'major' ? '🔴' : ev.type === 'shopping' ? '🛒' : ev.type === 'fair' ? '🏭' : ev.type === 'warning' ? '⚠️' : '📅'}
              </div>
              <div class="min-w-0">
                <div class="font-bold text-sm truncate" style="color:#1A1A2E;">${ev.name}</div>
                <div class="text-xs mt-0.5" style="color:#8C7B6B;">
                  ${evDate.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  ${ev.duration > 1 ? ` · ${ev.duration} jours` : ''}
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span class="text-xs font-semibold px-2 py-1 rounded-full"
                    style="background:${st.bg};color:${st.color};">
                ${ev.severity === 'high' ? '🔴 Critique' : ev.severity === 'medium' ? '🟡 Moyen' : ev.severity === 'positive' ? '🟢 Positif' : '⚪ Faible'}
              </span>
              ${!isPast ? `<span class="text-xs" style="color:#8C7B6B;">dans ${daysTo}j</span>` : '<span class="text-xs" style="color:#C4B5A5;">Passé</span>'}
            </div>
          </div>
          <div class="text-xs p-2 rounded-lg mt-1" style="background:${st.bg};color:${st.color};">
            ${ev.impact}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Waves list (dynamic from store) ──────────────────────────
function renderWaves() {
  const el = document.getElementById('wavesList');
  if (!el) return;
  if (_waves.length === 0) {
    el.innerHTML = '<div class="text-center py-8 text-sm" style="color:#8C7B6B;">Aucune vague disponible pour le moment.</div>';
    return;
  }

  const now     = new Date();
  el.innerHTML = _waves.map((w, i) => {
    const deadline = new Date(w.deadline);
    const shipping = new Date(w.shipping);
    const arrival  = new Date(w.arrival);
    const isPast   = deadline < now;
    const daysLeft = Math.ceil((deadline - now) / 86400000);
    const isNext   = !isPast && i === _waves.findIndex(v => new Date(v.deadline) > now);

    return `
      <div class="card overflow-hidden reveal ${isPast ? 'opacity-50' : ''} ${isNext ? 'ring-2' : ''}"
           style="${isNext ? 'ring-color:#D62828;outline:2px solid #D62828;' : ''}">
        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-base" style="font-family:'Syne',sans-serif;color:#1A1A2E;">${w.wave}</span>
                ${isNext ? '<span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:#FFF5F5;color:#D62828;">🔥 Prochaine</span>' : ''}
                ${isPast ? '<span class="text-xs px-2 py-0.5 rounded-full" style="background:#F5F0E8;color:#8C7B6B;">Passée</span>' : ''}
              </div>
              <div class="text-xs mt-0.5" style="color:#8C7B6B;">${w.notes}</div>
            </div>
            ${!isPast ? `<span class="text-xs font-bold px-2 py-1 rounded-full" style="background:#FFF5F5;color:#D62828;">${daysLeft}j restants</span>` : ''}
          </div>

          <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="text-center p-2 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs mb-0.5" style="color:#8C7B6B;">Limite commande</div>
              <div class="text-xs font-bold" style="color:#D62828;">${deadline.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </div>
            <div class="text-center p-2 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs mb-0.5" style="color:#8C7B6B;">Expédition</div>
              <div class="text-xs font-bold" style="color:#1A1A2E;">${shipping.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </div>
            <div class="text-center p-2 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs mb-0.5" style="color:#8C7B6B;">Arrivée prévue</div>
              <div class="text-xs font-bold" style="color:#2D7D46;">${arrival.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs px-2 py-1 rounded-full" style="background:#EFF6FF;color:#3B82F6;">
              ${w.transport === 'Avion' || w.transport?.includes('Avion') ? '✈️' : '🚢'} ${w.transport}
            </span>
            ${!isPast ? `
              <button onclick="selectWaveAndOrder('${w.id}','${w.wave}')"
                      class="btn-primary text-xs px-4 py-2">
                Commander cette vague →
              </button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Select wave → redirect to dashboard / new order ──────────
function selectWaveAndOrder(waveId, waveLabel) {
  if (!window.AUTH?.isLoggedIn()) {
    sessionStorage.setItem('namm_redirect', 'calendar.html');
    window.location.href = 'login.html';
    return;
  }
  // Pass selected wave to dashboard via sessionStorage
  sessionStorage.setItem('namm_selected_wave', JSON.stringify({ id: waveId, label: waveLabel }));
  window.location.href = 'dashboard.html?action=neworder&wave=' + waveId;
}

// ── Mini Calendar ─────────────────────────────────────────────
function renderMiniCalendar() {
  const el = document.getElementById('miniCalendar');
  if (!el) return;

  const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const firstDay   = new Date(_calYear, _calMonth, 1).getDay();
  const daysInMon  = new Date(_calYear, _calMonth + 1, 0).getDate();
  const offset     = (firstDay + 6) % 7; // Mon-first
  const today      = new Date();

  // Collect event dates for this month
  const eventDates = {};
  CHINESE_EVENTS.forEach(ev => {
    const d = new Date(ev.date);
    if (d.getFullYear() === _calYear && d.getMonth() === _calMonth) {
      eventDates[d.getDate()] = ev.severity;
    }
  });

  const dotColor = { high:'#D62828', medium:'#D97706', low:'#2D7D46', positive:'#3B82F6' };

  let html = `
    <div class="flex items-center justify-between mb-3">
      <button onclick="prevMonth()" class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100" style="color:#5C5C6E;">‹</button>
      <div class="font-bold text-sm" style="color:#1A1A2E;">${monthNames[_calMonth]} ${_calYear}</div>
      <button onclick="nextMonth()" class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100" style="color:#5C5C6E;">›</button>
    </div>
    <div class="grid grid-cols-7 gap-0.5 mb-1">
      ${['L','M','M','J','V','S','D'].map(d => `<div class="text-center text-xs font-bold py-1" style="color:#8C7B6B;">${d}</div>`).join('')}
    </div>
    <div class="grid grid-cols-7 gap-0.5">
      ${Array(offset).fill('<div></div>').join('')}
      ${Array.from({length: daysInMon}, (_, i) => {
        const day     = i + 1;
        const isToday = today.getDate() === day && today.getMonth() === _calMonth && today.getFullYear() === _calYear;
        const sev     = eventDates[day];
        return `
          <div class="relative flex items-center justify-center rounded-lg text-xs py-1.5 ${isToday ? 'font-black text-white' : ''}"
               style="${isToday ? 'background:#D62828;' : 'color:#1A1A2E;'}">
            ${day}
            ${sev ? `<span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style="background:${dotColor[sev] || '#8C7B6B'};"></span>` : ''}
          </div>`;
      }).join('')}
    </div>`;

  el.innerHTML = html;
}

function prevMonth() {
  if (_calMonth === 0) { _calMonth = 11; _calYear--; } else _calMonth--;
  renderMiniCalendar();
}
function nextMonth() {
  if (_calMonth === 11) { _calMonth = 0; _calYear++; } else _calMonth++;
  renderMiniCalendar();
}

document.addEventListener('DOMContentLoaded', initCalendar);
