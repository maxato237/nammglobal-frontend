// ============================================================
// NAMM GLOBAL – Navigation (auth-aware)
// ============================================================

function getCurrentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

async function renderNav() {
  const current = getCurrentPage();

  const navLinks = [
    { href: 'index.html',     label: 'Accueil',      icon: '🏠' },
    { href: 'dashboard.html', label: 'Mon Espace',   icon: '📦' },
    { href: 'calendar.html',  label: 'Calendrier',   icon: '📅' },
    { href: 'pricing.html',   label: 'Tarifs',       icon: '💰' },
    // { href: 'gallery.html',   label: 'Galerie',      icon: '🖼️' },
    { href: 'training.html',  label: 'Formation',    icon: '🎓' },
    { href: 'community.html', label: 'Communauté',   icon: '🌐' },
    { href: 'contact.html',   label: 'Contact',      icon: '✉️' },
  ];

  // ── Bloc auth (droite de la nav) ─────────────────────────
  const user    = await window.AUTH?.getCurrentUser?.() || null;
  const authBtn = user
    ? /* Connecté – avatar + menu déroulant */ `
        <div class="relative" id="userMenuWrap">
          <button
            id="userMenuBtn"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-red-50"
            style="border:1.5px solid #E8DDD0;"
            onclick="toggleUserMenu()">
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style="background:linear-gradient(135deg,#D62828,#E8A020);">
              ${user.avatar}
            </div>
            <span class="hidden sm:block text-sm font-semibold" style="color:#1A1A2E;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${user.name.split(' ')[0]}
            </span>
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="#8C7B6B" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown -->
          <div
            id="userDropdown"
            class="hidden absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl overflow-hidden"
            style="background:white;border:1px solid #E8DDD0;z-index:200;">

            <!-- Infos utilisateur -->
            <div class="px-4 py-3" style="border-bottom:1px solid #F5F0E8;background:#FEFCF8;">
              <div class="text-xs font-bold truncate" style="color:#1A1A2E;">${user.name}</div>
              <div class="text-xs mt-0.5" style="color:#8C7B6B;">📍 ${user.city}, ${user.country}</div>
            </div>

            <!-- Liens -->
            <a href="dashboard.html" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style="color:#1A1A2E;">
              <span>📦</span> Mes commandes
            </a>
            <a href="contact.html" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors" style="color:#1A1A2E;">
              <span>➕</span> Nouvelle commande
            </a>

            <!-- Déconnexion -->
            <div style="border-top:1px solid #F5F0E8;">
              <button
                onclick="window.AUTH.logoutUser()"
                class="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-red-50"
                style="color:#D62828;">
                <span>🚪</span> Se déconnecter
              </button>
            </div>
          </div>
        </div>`

    : /* Non connecté – bouton Se connecter */ `
        <a
          href="login.html"
          class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
          style="background:linear-gradient(135deg,#D62828,#c0221e);">
          🔐 Se connecter
        </a>`;

  // ── HTML complet de la nav ────────────────────────────────
  const navHTML = `
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
     style="background:rgba(254,252,248,0.95);backdrop-filter:blur(16px);border-bottom:1px solid #E8DDD0;">
  <div class="max-w-7xl mx-auto px-4 lg:px-8">
    <div class="flex items-center justify-between h-16">

      <!-- Logo -->
      <a href="index.html" class="flex items-center gap-3 group flex-shrink-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
             style="background:linear-gradient(135deg,#D62828,#E8A020);">NG</div>
        <div class="leading-tight">
          <div class="font-bold text-sm tracking-wide" style="color:#1A1A2E;font-family:'Syne',sans-serif;">NAMM GLOBAL</div>
          <div class="text-xs hidden sm:block" style="color:#8C7B6B;">Import Chine – Afrique</div>
        </div>
      </a>

      <!-- Desktop Links -->
      <div class="hidden lg:flex items-center gap-0.5">
        ${navLinks.map(l => `
          <a href="${l.href}"
             class="nav-link px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${current === l.href ? 'nav-active' : ''}"
             style="font-family:'Plus Jakarta Sans',sans-serif;">
            ${l.label}
          </a>`).join('')}
      </div>

      <!-- Bloc auth + burger -->
      <div class="flex items-center gap-3">
        ${authBtn}
        <button id="menuToggle"
                class="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <span class="hamburger-line w-5 h-0.5 rounded-full transition-all duration-300" style="background:#1A1A2E;"></span>
          <span class="hamburger-line w-5 h-0.5 rounded-full transition-all duration-300" style="background:#1A1A2E;"></span>
          <span class="hamburger-line w-4 h-0.5 rounded-full transition-all duration-300" style="background:#1A1A2E;"></span>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  <div id="mobileMenu"
       class="lg:hidden hidden border-t"
       style="background:rgba(254,252,248,0.98);border-color:#E8DDD0;">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="grid grid-cols-2 gap-2">
        ${navLinks.map(l => `
          <a href="${l.href}"
             class="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${current === l.href ? 'nav-active' : 'hover:bg-gray-50'}"
             style="color:#1A1A2E;">
            <span>${l.icon}</span> ${l.label}
          </a>`).join('')}
      </div>

      <!-- Mobile auth -->
      <div class="mt-3 pt-3" style="border-top:1px solid #E8DDD0;">
        ${user
          ? `<div class="flex items-center justify-between px-1">
               <div class="flex items-center gap-2">
                 <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style="background:linear-gradient(135deg,#D62828,#E8A020);">${user.avatar}</div>
                 <div>
                   <div class="text-xs font-bold" style="color:#1A1A2E;">${user.name}</div>
                   <div class="text-xs" style="color:#8C7B6B;">${user.city}</div>
                 </div>
               </div>
               <button onclick="window.AUTH.logoutUser()"
                       class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50"
                       style="color:#D62828;border:1px solid #FECACA;">
                 🚪 Déconnexion
               </button>
             </div>`
          : `<a href="login.html"
               class="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white"
               style="background:linear-gradient(135deg,#D62828,#c0221e);">
               🔐 Se connecter
             </a>
             <a href="register.html"
               class="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl text-sm font-semibold"
               style="background:#F5F0E8;color:#1A1A2E;">
               ✨ Créer un compte
             </a>`
        }
      </div>
    </div>
  </div>
</nav>

<style>
  .nav-link  { color:#5C5C6E; }
  .nav-link:hover { color:#D62828; background:#FFF5F5; }
  .nav-active { color:#D62828 !important; background:#FFF5F5 !important; font-weight:600; }
  #navbar.scrolled { box-shadow:0 4px 24px rgba(0,0,0,0.08); }
</style>`;

  const container = document.getElementById('nav-container');
  if (container) {
    container.innerHTML = navHTML;
    initNav();
  }
}

// ── Dropdown utilisateur ──────────────────────────────────────
function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  if (!dd) return;
  dd.classList.toggle('hidden');
}

// Fermer dropdown si clic extérieur
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('userMenuWrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('userDropdown')?.classList.add('hidden');
  }
});

// ── Init nav comportement ─────────────────────────────────────
function initNav() {
  // Shadow au scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Burger mobile
  const toggle = document.getElementById('menuToggle');
  const menu   = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false;
      const lines = toggle.querySelectorAll('.hamburger-line');
      if (open) {
        lines[0].style.transform = 'translateY(8px) rotate(45deg)';
        lines[1].style.opacity   = '0';
        lines[2].style.transform = 'translateY(-6px) rotate(-45deg)';
        lines[2].style.width     = '20px';
      } else {
        lines[0].style.transform = '';
        lines[1].style.opacity   = '1';
        lines[2].style.transform = '';
        lines[2].style.width     = '16px';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', renderNav);
