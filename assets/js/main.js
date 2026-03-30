// ============================================================
// NAMM GLOBAL – Main JS (Landing Page)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
  initHeroParticles();
  initOrderForm();
  initShareButtons();
});

// ── Scroll Reveal ────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Animated Counters ────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString('fr-FR') + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('fr-FR') + suffix;
  }
  requestAnimationFrame(update);
}

// ── Hero Floating Particles ──────────────────────────────────
function initHeroParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.4,
      dy: -Math.random() * 0.5 - 0.2,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '#D62828' : '#E8A020'
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); });
  resize();
  createParticles();
  draw();
}

// ── Quick Order Form ─────────────────────────────────────────
function initOrderForm() {
  const form = document.getElementById('quickOrderForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const original = btn.innerHTML;
    btn.innerHTML = '⏳ Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      showToast('✅ Votre demande de devis a été envoyée ! Réponse sous 24h.', 'success');
      form.reset();
      btn.innerHTML = original;
      btn.disabled = false;
    }, 1500);
  });
}

// ── Share Buttons ────────────────────────────────────────────
function initShareButtons() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(
    "Découvrez NAMM GLOBAL – Importez depuis la Chine vers l'Afrique facilement !"
  );

  document.querySelectorAll('[data-share]').forEach(btn => {
    const platform = btn.dataset.share;

    btn.addEventListener('click', async () => {
      try {
        let shareUrl = '';

        switch (platform) {
          case 'whatsapp':
            shareUrl = `https://wa.me/?text=${text}%20${url}`;
            break;

          case 'facebook':
            shareUrl = `https://facebook.com/sharer/sharer.php?u=${url}`;
            break;

          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
            break;

          case 'telegram':
            shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
            break;

          case 'copy':
            if (!document.hasFocus()) {
              throw new Error("Document non actif");
            }

            await navigator.clipboard.writeText(window.location.href);
            showToast('📋 Lien copié dans le presse-papier !', 'info');
            return;
        }

        if (shareUrl) {
          window.open(shareUrl, '_blank', 'noopener,width=600,height=450');
        }

      } catch (err) {
        console.error("Share error:", err);
      }
    });
  });
}

// ── Toast Notification ──────────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#ECFDF5', border: '#2D7D46', text: '#2D7D46' },
    info:    { bg: '#EFF6FF', border: '#1A5F8A', text: '#1A5F8A' },
    error:   { bg: '#FEE2E2', border: '#D62828', text: '#D62828' }
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'toast-container';
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${c.bg};border:1.5px solid ${c.border};color:${c.text};
    padding:14px 20px;border-radius:14px;font-size:14px;font-weight:600;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 8px 32px rgba(0,0,0,0.12);
    animation:fadeInUp 0.3s ease forwards;
    max-width:360px;line-height:1.5;
  `;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeInUp 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Expose globally
window.showToast = showToast;
