// ============================================================
// NAMM GLOBAL – Payment (Flutterwave simulation)
// Replace window.PAYMENT.open() body with real FlutterwaveCheckout()
// when API keys are available.
// ============================================================

(function () {
  'use strict';

  const METHODS = [
    { id: 'mtn',    label: 'MTN Mobile Money',  icon: '📱', color: '#FFC300', countries: ['CM','CI','GH','UG','RW'] },
    { id: 'orange', label: 'Orange Money',       icon: '🟠', color: '#FF6600', countries: ['CM','CI','SN','ML','BF'] },
    { id: 'wave',   label: 'Wave',               icon: '🌊', color: '#1A85FF', countries: ['SN','CI','ML','BF'] },
    { id: 'moov',   label: 'Moov Money',         icon: '💙', color: '#0055A4', countries: ['CI','BJ','TG','NE','BF'] },
    { id: 'airtel', label: 'Airtel Money',       icon: '❤️', color: '#E40000', countries: ['CD','CG','GH','NG'] },
    { id: 'card',   label: 'Carte Bancaire',     icon: '💳', color: '#6366F1', countries: ['*'] },
    { id: 'bank',   label: 'Virement Bancaire',  icon: '🏦', color: '#374151', countries: ['*'] },
  ];

  // Inject modal HTML once
  function injectModal() {
    if (document.getElementById('paymentOverlay')) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <div id="paymentOverlay" class="fixed inset-0 z-[200] hidden items-center justify-center p-4"
           style="background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);">
        <div id="paymentCard"
             class="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
             style="background:white;">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4" style="background:linear-gradient(135deg,#1A1A2E,#2d1b1b);">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                     style="background:linear-gradient(135deg,#D62828,#E8A020);">NG</div>
                <div>
                  <div class="text-white font-bold text-sm" style="font-family:'Syne',sans-serif;">NAMM GLOBAL</div>
                  <div class="text-xs" style="color:rgba(255,255,255,0.5);">Paiement sécurisé</div>
                </div>
              </div>
              <button onclick="window.PAYMENT.close()"
                      class="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
                      style="color:rgba(255,255,255,0.7);">✕</button>
            </div>
            <div class="rounded-2xl p-3" style="background:rgba(255,255,255,0.08);">
              <div class="text-xs mb-0.5" style="color:rgba(255,255,255,0.5);">Montant à payer</div>
              <div id="payAmount" class="text-2xl font-black text-white" style="font-family:'Syne',sans-serif;">—</div>
              <div id="payRef" class="text-xs mt-0.5" style="color:rgba(255,255,255,0.4);">—</div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            <div id="payStep1">
              <p class="text-sm font-semibold mb-4" style="color:#5C5C6E;">Choisissez votre mode de paiement :</p>
              <div id="payMethodList" class="space-y-2"></div>
            </div>

            <div id="payStep2" class="hidden text-center">
              <div id="payMethodIcon" class="text-5xl mb-3"></div>
              <div id="payMethodName" class="text-lg font-bold mb-1" style="color:#1A1A2E;font-family:'Syne',sans-serif;"></div>
              <div id="payPhoneBox" class="mb-4">
                <label class="text-xs font-semibold block mb-1.5" style="color:#5C5C6E;">Numéro de compte</label>
                <input id="payPhone" class="input text-center" placeholder="XXX XXX XXX" type="tel">
              </div>
              <button id="payConfirmBtn" onclick="window.PAYMENT._processPayment()"
                      class="btn-primary w-full justify-center" style="padding:13px;font-size:15px;">
                Payer maintenant
              </button>
              <button onclick="window.PAYMENT._backToMethods()"
                      class="btn-ghost w-full justify-center mt-2" style="font-size:13px;">
                ← Changer de méthode
              </button>
            </div>

            <div id="payStep3" class="hidden text-center py-4">
              <div class="text-5xl mb-3 animate-pulse">⏳</div>
              <div class="text-lg font-bold mb-1" style="color:#1A1A2E;font-family:'Syne',sans-serif;">Traitement en cours…</div>
              <div class="text-sm" style="color:#8C7B6B;">Veuillez confirmer sur votre téléphone</div>
              <div class="mt-4">
                <div class="h-1.5 rounded-full overflow-hidden" style="background:#E8DDD0;">
                  <div id="payProgressBar" class="h-full rounded-full transition-all duration-300"
                       style="background:linear-gradient(90deg,#D62828,#E8A020);width:0%;"></div>
                </div>
              </div>
            </div>

            <div id="payStep4" class="hidden text-center py-4">
              <div class="text-6xl mb-4">✅</div>
              <div class="text-xl font-black mb-1" style="color:#2D7D46;font-family:'Syne',sans-serif;">Paiement confirmé !</div>
              <div id="paySuccessRef" class="text-sm mb-4" style="color:#8C7B6B;"></div>
              <button onclick="window.PAYMENT._onSuccess()"
                      class="btn-primary w-full justify-center" style="padding:13px;">
                Continuer →
              </button>
            </div>
          </div>

          <!-- Sécurité -->
          <div class="px-6 pb-5">
            <div class="flex items-center justify-center gap-4 text-xs" style="color:#8C7B6B;">
              <span>🔒 Connexion SSL</span>
              <span>·</span>
              <span>⚡ Flutterwave</span>
              <span>·</span>
              <span>🛡️ 3D Secure</span>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el.firstElementChild);
  }

  let _resolve = null;
  let _reject  = null;
  let _amount  = 0;
  let _orderId = '';
  let _selectedMethod = null;

  const PAYMENT = {
    /**
     * Open payment modal
     * Returns a Promise that resolves with { success: true, ref } or rejects
     */
    open(opts = {}) {
      injectModal();
      _amount  = opts.amount  || 0;
      _orderId = opts.orderId || '';
      _selectedMethod = null;

      // Set header info
      document.getElementById('payAmount').textContent =
        Number(_amount).toLocaleString('fr-FR') + ' FCFA';
      document.getElementById('payRef').textContent = 'Commande : ' + _orderId;

      // Reset to step 1
      PAYMENT._showStep(1);
      PAYMENT._renderMethods();

      // Show overlay
      const ov = document.getElementById('paymentOverlay');
      ov.classList.remove('hidden');
      ov.classList.add('flex');

      return new Promise((res, rej) => { _resolve = res; _reject = rej; });
    },

    close() {
      const ov = document.getElementById('paymentOverlay');
      ov.classList.add('hidden');
      ov.classList.remove('flex');
      if (_reject) _reject({ cancelled: true });
      _resolve = _reject = null;
    },

    _showStep(n) {
      [1,2,3,4].forEach(i => {
        document.getElementById('payStep' + i)?.classList.toggle('hidden', i !== n);
      });
    },

    _renderMethods() {
      const list = document.getElementById('payMethodList');
      if (!list) return;
      list.innerHTML = METHODS.map(m => `
        <button
          onclick="window.PAYMENT._selectMethod('${m.id}')"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.01]"
          style="border-color:#E8DDD0;background:white;"
          onmouseenter="this.style.borderColor='${m.color}';this.style.background='${m.color}15';"
          onmouseleave="this.style.borderColor='#E8DDD0';this.style.background='white';">
          <span class="text-2xl">${m.icon}</span>
          <span class="font-semibold text-sm" style="color:#1A1A2E;">${m.label}</span>
          <svg class="ml-auto w-4 h-4 flex-shrink-0" fill="none" stroke="#8C7B6B" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>`).join('');
    },

    _selectMethod(id) {
      _selectedMethod = METHODS.find(m => m.id === id);
      if (!_selectedMethod) return;
      document.getElementById('payMethodIcon').textContent = _selectedMethod.icon;
      document.getElementById('payMethodName').textContent = _selectedMethod.label;

      // Card / bank: no phone needed
      const noPhone = ['card','bank'].includes(id);
      document.getElementById('payPhoneBox').classList.toggle('hidden', noPhone);
      if (noPhone) {
        document.getElementById('payConfirmBtn').textContent =
          id === 'card' ? '💳 Payer par carte' : '🏦 Confirmer le virement';
      } else {
        document.getElementById('payConfirmBtn').textContent = 'Payer maintenant';
      }

      PAYMENT._showStep(2);
    },

    _backToMethods() {
      PAYMENT._showStep(1);
    },

    _processPayment() {
      PAYMENT._showStep(3);
      // Animate progress
      let pct = 0;
      const bar = document.getElementById('payProgressBar');
      const interval = setInterval(() => {
        pct += 3;
        if (bar) bar.style.width = Math.min(pct, 95) + '%';
        if (pct >= 95) clearInterval(interval);
      }, 80);

      // Simulate 2.5s processing
      setTimeout(() => {
        clearInterval(interval);
        if (bar) bar.style.width = '100%';
        const ref = 'FLW-' + Math.random().toString(36).slice(2, 10).toUpperCase();
        document.getElementById('paySuccessRef').textContent = 'Référence : ' + ref;
        PAYMENT._pendingRef = ref;
        setTimeout(() => PAYMENT._showStep(4), 400);
      }, 2500);
    },

    _onSuccess() {
      const ref = PAYMENT._pendingRef || 'FLW-DEMO';
      const ov  = document.getElementById('paymentOverlay');
      ov.classList.add('hidden');
      ov.classList.remove('flex');
      if (_resolve) _resolve({ success: true, ref });
      _resolve = _reject = null;
    }
  };

  window.PAYMENT = PAYMENT;

})();
