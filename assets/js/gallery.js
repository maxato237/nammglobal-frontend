// ============================================================
// NAMM GLOBAL – Gallery (dynamic)
// ============================================================

let _allItems    = [];
let _galleryFilter = 'all';

async function initGallery() {
  _allItems = await window.STORE.gallery.getAll();
  renderGallery();
  initGalleryFilters();
}

function initGalleryFilters() {
  document.querySelectorAll('[data-gfilter]').forEach(btn => {
    btn.addEventListener('click', function () {
      _galleryFilter = this.dataset.gfilter;
      document.querySelectorAll('[data-gfilter]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderGallery();
    });
  });
}

function renderGallery() {
  const el = document.getElementById('galleryGrid');
  if (!el) return;

  const list = _galleryFilter === 'all'
    ? _allItems
    : _allItems.filter(g => g.type === _galleryFilter);

  if (list.length === 0) {
    el.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="text-4xl mb-3">🖼️</div>
        <div class="font-bold" style="color:#1A1A2E;">Aucun élément dans cette catégorie</div>
      </div>`;
    return;
  }

  const delays = ['', 'delay-100', 'delay-200', 'delay-100', 'delay-200', 'delay-300'];
  el.innerHTML = list.map((g, i) => `
    <div class="card reveal ${delays[i % delays.length]} overflow-hidden group cursor-pointer"
         onclick="openLightbox(${g.id})">
      <div class="relative overflow-hidden" style="aspect-ratio:4/3;">
        <img src="${g.thumb}" alt="${g.product}"
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
             loading="lazy">
        ${g.type === 'video' ? `
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
                 style="background:rgba(26,26,46,0.75);color:white;">▶</div>
          </div>` : ''}
        <div class="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style="background:linear-gradient(to top,rgba(26,26,46,0.85),transparent);">
          <div class="p-4 text-white">
            <div class="text-xs font-semibold">${g.product}</div>
            <div class="text-xs opacity-75">${g.client}</div>
          </div>
        </div>
        <div class="absolute top-3 left-3">
          <span class="text-xs px-2 py-1 rounded-full font-semibold"
                style="background:rgba(255,255,255,0.9);color:#1A1A2E;">
            ${g.type === 'video' ? '🎥 Vidéo' : '📷 Photo'}
          </span>
        </div>
      </div>
      <div class="p-4">
        <div class="flex gap-0.5 mb-2">${'⭐'.repeat(g.rating || 5)}</div>
        <div class="text-sm font-bold truncate" style="color:#1A1A2E;">${g.product}</div>
        <div class="text-xs mt-1 flex items-center justify-between">
          <span style="color:#8C7B6B;">${g.client}</span>
          <span class="px-2 py-0.5 rounded-full text-xs" style="background:#F5F0E8;color:#5C5C6E;">${g.category || ''}</span>
        </div>
      </div>
    </div>`).join('');
}

function openLightbox(id) {
  const g = _allItems.find(x => x.id === id);
  if (!g) return;

  const days = g.arrivalDate && g.orderDate
    ? Math.round((new Date(g.arrivalDate) - new Date(g.orderDate)) / 86400000)
    : null;

  let modal = document.getElementById('lightboxModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'lightboxModal'; document.body.appendChild(modal); }

  modal.innerHTML = `
    <div class="fixed inset-0 z-[150] flex items-center justify-center p-4"
         style="background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);"
         onclick="if(event.target===this)closeLightbox()">
      <div class="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
           style="background:white;max-height:92vh;overflow-y:auto;">
        <div class="relative">
          <img src="${g.full}" alt="${g.product}" class="w-full object-cover" style="max-height:420px;">
          <button onclick="closeLightbox()"
                  class="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                  style="background:rgba(0,0,0,0.6);">✕</button>
          ${g.type === 'video' ? `
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                   style="background:rgba(0,0,0,0.55);color:white;">▶</div>
            </div>` : ''}
        </div>
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-black" style="font-family:'Syne',sans-serif;color:#1A1A2E;">${g.product}</h3>
              <div class="text-sm mt-0.5" style="color:#8C7B6B;">${g.client}</div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold"
                  style="background:#F5F0E8;color:#5C5C6E;">${g.category || ''}</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div class="text-center p-3 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs" style="color:#8C7B6B;">Commandé</div>
              <div class="text-xs font-bold mt-0.5" style="color:#1A1A2E;">
                ${g.orderDate ? new Date(g.orderDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '—'}
              </div>
            </div>
            <div class="text-center p-3 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs" style="color:#8C7B6B;">Reçu</div>
              <div class="text-xs font-bold mt-0.5" style="color:#1A1A2E;">
                ${g.arrivalDate ? new Date(g.arrivalDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '—'}
              </div>
            </div>
            <div class="text-center p-3 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs" style="color:#8C7B6B;">Délai</div>
              <div class="text-xs font-bold mt-0.5" style="color:#D62828;">${days ? days + 'j' : '—'}</div>
            </div>
            <div class="text-center p-3 rounded-xl" style="background:#F5F0E8;">
              <div class="text-xs" style="color:#8C7B6B;">Poids</div>
              <div class="text-xs font-bold mt-0.5" style="color:#1A1A2E;">${g.weight ? g.weight + ' kg' : '—'}</div>
            </div>
          </div>

          <div class="p-4 rounded-2xl mb-4" style="background:#FEFCF8;border:1px solid #E8DDD0;">
            <div class="flex gap-1 mb-2">${'⭐'.repeat(g.rating || 5)}</div>
            <p class="text-sm italic" style="color:#5C5C6E;">"${g.comment}"</p>
          </div>

          <div class="flex gap-3">
            <a href="contact.html" class="btn-primary flex-1 justify-center text-sm">📩 Commander ce type de produit</a>
            <button onclick="closeLightbox()" class="btn-ghost px-5 text-sm">Fermer</button>
          </div>
        </div>
      </div>
    </div>`;
}

function closeLightbox() {
  document.getElementById('lightboxModal')?.remove();
}

document.addEventListener('DOMContentLoaded', initGallery);
