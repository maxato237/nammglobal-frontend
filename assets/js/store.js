// ============================================================
// NAMM GLOBAL – Store (data layer)
// localStorage-backed mock store, designed to be swapped for
// real fetch() calls against a Flask backend.
// All public methods return Promises so callers are already
// structured for async/await when the real API arrives.
// ============================================================

(function () {
  'use strict';

  const KEYS = {
    WAVES:    'namm_waves',
    GALLERY:  'namm_gallery',
    PRICING:  'namm_pricing',
    ORDERS:   'namm_orders',
    NOTIFS:   'namm_notifs',
    ADMIN:    'namm_admin',
    STATS:    'namm_stats',
    USERS:    'namm_users',
  };

  // ── localStorage helpers ────────────────────────────────────
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  }

  // ── Seed on first visit ─────────────────────────────────────
  function seed() {
    if (!load(KEYS.WAVES))   save(KEYS.WAVES,   JSON.parse(JSON.stringify(ORDER_WAVES)));
    if (!load(KEYS.GALLERY)) save(KEYS.GALLERY, JSON.parse(JSON.stringify(GALLERY_ITEMS)));
    if (!load(KEYS.PRICING)) save(KEYS.PRICING, JSON.parse(JSON.stringify(PRICING_DATA)));
    if (!load(KEYS.ORDERS))  save(KEYS.ORDERS,  JSON.parse(JSON.stringify(MOCK_ORDERS)));
    if (!load(KEYS.NOTIFS))  save(KEYS.NOTIFS,  []);
    if (!load(KEYS.USERS))   save(KEYS.USERS,   []);  // registered users

    // Computed stats from mockdata
    if (!load(KEYS.STATS)) {
      save(KEYS.STATS, JSON.parse(JSON.stringify(STATS)));
    }
  }

  // ── Micro-delay to simulate network ────────────────────────
  function delay(ms = 120) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ══════════════════════════════════════════════════════════
  //  WAVES
  // ══════════════════════════════════════════════════════════
  const waves = {
    async getAll() {
      await delay();
      return load(KEYS.WAVES) || [];
    },
    async getById(id) {
      const list = await waves.getAll();
      return list.find(w => w.id === id) || null;
    },
    async create(data) {
      await delay(200);
      const list = load(KEYS.WAVES) || [];
      const item = { ...data, id: 'WAVE-' + Date.now() };
      list.push(item);
      save(KEYS.WAVES, list);
      return item;
    },
    async update(id, data) {
      await delay(200);
      const list = load(KEYS.WAVES) || [];
      const idx  = list.findIndex(w => w.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      save(KEYS.WAVES, list);
      return list[idx];
    },
    async delete(id) {
      await delay(200);
      const list = (load(KEYS.WAVES) || []).filter(w => w.id !== id);
      save(KEYS.WAVES, list);
      return true;
    }
  };

  // ══════════════════════════════════════════════════════════
  //  GALLERY
  // ══════════════════════════════════════════════════════════
  const gallery = {
    async getAll(filter = 'all') {
      await delay();
      const list = load(KEYS.GALLERY) || [];
      if (filter === 'all') return list;
      return list.filter(g => g.type === filter);
    },
    async create(data) {
      await delay(300);
      const list = load(KEYS.GALLERY) || [];
      const item = { ...data, id: Date.now() };
      list.unshift(item);
      save(KEYS.GALLERY, list);
      return item;
    },
    async update(id, data) {
      await delay(200);
      const list = load(KEYS.GALLERY) || [];
      const idx  = list.findIndex(g => g.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      save(KEYS.GALLERY, list);
      return list[idx];
    },
    async delete(id) {
      await delay(200);
      const list = (load(KEYS.GALLERY) || []).filter(g => g.id !== id);
      save(KEYS.GALLERY, list);
      return true;
    }
  };

  // ══════════════════════════════════════════════════════════
  //  PRICING
  // ══════════════════════════════════════════════════════════
  const pricing = {
    async get() {
      await delay();
      return load(KEYS.PRICING) || PRICING_DATA;
    },
    async update(data) {
      await delay(200);
      const current = load(KEYS.PRICING) || {};
      const merged  = { ...current, ...data };
      save(KEYS.PRICING, merged);
      return merged;
    },
    async updateServiceFees(fees) {
      const p = await pricing.get();
      p.serviceFees = fees;
      save(KEYS.PRICING, p);
      return p;
    },
    async updateShipping(shipping) {
      const p = await pricing.get();
      p.shippingByKg = shipping;
      save(KEYS.PRICING, p);
      return p;
    },
    async updateProductTypes(types) {
      const p = await pricing.get();
      p.byProductType = types;
      save(KEYS.PRICING, p);
      return p;
    }
  };

  // ══════════════════════════════════════════════════════════
  //  ORDERS
  // ══════════════════════════════════════════════════════════
  const orders = {
    async getAll(userId = null) {
      await delay();
      const list = load(KEYS.ORDERS) || [];
      if (!userId) return list;
      return list.filter(o => o.userId === userId || !o.userId);
    },
    async getById(id) {
      const list = await orders.getAll();
      return list.find(o => o.id === id) || null;
    },
    async create(data) {
      await delay(300);
      const list = load(KEYS.ORDERS) || [];
      const id   = 'CMD-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
      const item = {
        id,
        date:        new Date().toISOString().split('T')[0],
        status:      'AWAITING_QUOTE',
        quote:       null,
        timeline:    [{ date: new Date().toISOString().split('T')[0], status: 'AWAITING_QUOTE', note: 'Demande de devis envoyée' }],
        clientNote:  '',
        rating:      null,
        deliveryDate: null,
        ...data
      };
      list.unshift(item);
      save(KEYS.ORDERS, list);
      return item;
    },
    async update(id, data) {
      await delay(200);
      const list = load(KEYS.ORDERS) || [];
      const idx  = list.findIndex(o => o.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...data };
      save(KEYS.ORDERS, list);
      return list[idx];
    },
    async delete(id) {
      await delay(200);
      const list = (load(KEYS.ORDERS) || []).filter(o => o.id !== id);
      save(KEYS.ORDERS, list);
      return true;
    },
    // Admin: attach quote to order
    async attachQuote(id, quoteData) {
      await delay(300);
      const list  = load(KEYS.ORDERS) || [];
      const idx   = list.findIndex(o => o.id === id);
      if (idx === -1) return null;

      list[idx].quote  = quoteData;
      list[idx].status = 'QUOTE_AVAILABLE';
      list[idx].timeline.push({
        date:   new Date().toISOString().split('T')[0],
        status: 'QUOTE_AVAILABLE',
        note:   'Devis disponible – en attente de validation client'
      });
      save(KEYS.ORDERS, list);

      // Create notification
      notifs.add({
        type:    'QUOTE_AVAILABLE',
        orderId: id,
        title:   'Votre devis est disponible',
        message: `Le devis pour la commande ${id} est prêt. Consultez-le et validez pour continuer.`,
        userId:  list[idx].userId
      });

      return list[idx];
    },
    // Client: accept quote → move to payment
    async acceptQuote(id) {
      await delay(200);
      return orders.update(id, { status: 'QUOTE_ACCEPTED' });
    },
    // Client: reject quote → delete order
    async rejectQuote(id) {
      await delay(200);
      const list = load(KEYS.ORDERS) || [];
      const idx  = list.findIndex(o => o.id === id);
      if (idx !== -1) {
        list[idx].status = 'QUOTE_REJECTED';
        list[idx].timeline.push({ date: new Date().toISOString().split('T')[0], status: 'QUOTE_REJECTED', note: 'Devis refusé par le client' });
        save(KEYS.ORDERS, list);
      }
      return true;
    },
    // Mark as paid → CONFIRMED
    async confirmPayment(id, paymentRef) {
      await delay(300);
      const list = load(KEYS.ORDERS) || [];
      const idx  = list.findIndex(o => o.id === id);
      if (idx === -1) return null;
      list[idx].status     = 'CONFIRMED';
      list[idx].paymentRef = paymentRef;
      list[idx].timeline.push({
        date:   new Date().toISOString().split('T')[0],
        status: 'CONFIRMED',
        note:   `Paiement confirmé (réf: ${paymentRef})`
      });
      save(KEYS.ORDERS, list);
      return list[idx];
    }
  };

  // ══════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  const notifs = {
    getAll(userId = null) {
      const list = load(KEYS.NOTIFS) || [];
      if (!userId) return list;
      return list.filter(n => n.userId === userId || !n.userId);
    },
    getUnread(userId = null) {
      return notifs.getAll(userId).filter(n => !n.read);
    },
    add(data) {
      const list = load(KEYS.NOTIFS) || [];
      const item = {
        id:        'NOTIF-' + Date.now(),
        createdAt: new Date().toISOString(),
        read:      false,
        ...data
      };
      list.unshift(item);
      save(KEYS.NOTIFS, list);
      return item;
    },
    markRead(id) {
      const list = load(KEYS.NOTIFS) || [];
      const idx  = list.findIndex(n => n.id === id);
      if (idx !== -1) { list[idx].read = true; save(KEYS.NOTIFS, list); }
    },
    markAllRead(userId = null) {
      const list = (load(KEYS.NOTIFS) || []).map(n => {
        if (!userId || n.userId === userId) n.read = true;
        return n;
      });
      save(KEYS.NOTIFS, list);
    },
    delete(id) {
      const list = (load(KEYS.NOTIFS) || []).filter(n => n.id !== id);
      save(KEYS.NOTIFS, list);
    }
  };

  // ══════════════════════════════════════════════════════════
  //  STATS (computed from orders)
  // ══════════════════════════════════════════════════════════
  const stats = {
    async compute() {
      await delay();
      const allOrders  = load(KEYS.ORDERS) || [];
      const delivered  = allOrders.filter(o => o.status === 'DELIVERED');
      const rated      = delivered.filter(o => o.rating);
      const satisfaction = rated.length
        ? Math.round(rated.reduce((s, o) => s + o.rating, 0) / rated.length / 5 * 100)
        : 98;

      // Unique countries
      const countries = new Set(allOrders.map(o => o.country).filter(Boolean));

      const result = [
        { value: Math.max(450, allOrders.length + 440), suffix: '+', label: 'Clients satisfaits',   icon: '👥' },
        { value: Math.max(1200, delivered.length + 1190), suffix: '+', label: 'Commandes livrées', icon: '📦' },
        { value: satisfaction,  suffix: '%', label: 'Taux de satisfaction', icon: '⭐' },
        { value: Math.max(15, countries.size + 12),  suffix: '+', label: 'Pays couverts',          icon: '🌍' }
      ];
      save(KEYS.STATS, result);
      return result;
    },
    get() {
      return load(KEYS.STATS) || STATS;
    }
  };

  
  // ══════════════════════════════════════════════════════════
  //  USERS (profile management)
  // ══════════════════════════════════════════════════════════
  const users = {
    updateProfile(userId, data) {
      // Update session
      const SESSION_KEY = 'namm_session';
      const REMEMBER_KEY = 'namm_remember';
      try {
        const session  = sessionStorage.getItem(SESSION_KEY);
        const remember = localStorage.getItem(REMEMBER_KEY);
        if (session) {
          const u = { ...JSON.parse(session), ...data };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
        }
        if (remember) {
          const u = { ...JSON.parse(remember), ...data };
          localStorage.setItem(REMEMBER_KEY, JSON.stringify(u));
        }
        return true;
      } catch { return false; }
    },
    isProfileComplete(user) {
      return !!(user && user.name && user.phone && user.country && user.city);
    }
  };

  // ── Seed and expose ─────────────────────────────────────────
  seed();

  window.STORE = { waves, gallery, pricing, orders, notifs, stats, users, seed };

})();
