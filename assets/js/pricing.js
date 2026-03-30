// ============================================================
// NAMM GLOBAL – Pricing (dynamic)
// ============================================================

async function initPricing() {
  const data = await window.STORE.pricing.get();
  renderServiceFees(data.serviceFees);
  renderShipping(data.shippingByKg);
  renderProductTypes(data.byProductType);
  initCalculator(data);
}

function renderServiceFees(fees) {
  const el = document.getElementById('serviceFeesTable');
  if (!el) return;
  el.innerHTML = fees.map((f, i) => `
    <tr style="${i % 2 === 0 ? 'background:#FEFCF8;' : 'background:white;'}">
      <td class="px-4 py-3 text-sm" style="color:#1A1A2E;">${f.label}</td>
      <td class="px-4 py-3 text-center">
        <span class="text-lg font-black" style="color:#D62828;">${f.pct}%</span>
      </td>
      <td class="px-4 py-3 text-xs text-right" style="color:#8C7B6B;">
        ${f.min > 0 ? 'Sur ' + Number(f.min).toLocaleString('fr-FR') + ' FCFA et plus' : 'Minimum'}
      </td>
    </tr>`).join('');
}

function renderShipping(shipping) {
  const el = document.getElementById('shippingTable');
  if (!el) return;
  el.innerHTML = shipping.map((s, i) => `
    <div class="card p-5 reveal ${i > 0 ? 'delay-' + (i * 100) : ''}">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">${s.icon}</span>
        <div>
          <div class="font-bold text-sm" style="color:#1A1A2E;">${s.transport}</div>
          <div class="text-xs" style="color:#8C7B6B;">${s.timeframe}</div>
        </div>
      </div>
      <div class="text-2xl font-black" style="color:#D62828;font-family:'Syne',sans-serif;">
        ${Number(s.pricePerKg).toLocaleString('fr-FR')} <span class="text-sm font-medium" style="color:#8C7B6B;">FCFA/kg</span>
      </div>
      ${s.maxKg ? `<div class="mt-2 text-xs px-2 py-1 rounded-full inline-block" style="background:#FEF3C7;color:#D97706;">Max ${s.maxKg} kg</div>` : '<div class="mt-2 text-xs px-2 py-1 rounded-full inline-block" style="background:#ECFDF5;color:#2D7D46;">Sans limite</div>'}
    </div>`).join('');
}

function renderProductTypes(types) {
  const el = document.getElementById('productTypesTable');
  if (!el) return;
  el.innerHTML = types.map((t, i) => `
    <tr style="${i % 2 === 0 ? 'background:#FEFCF8;' : 'background:white;'}">
      <td class="px-4 py-3">
        <span class="text-lg mr-2">${t.icon}</span>
        <span class="text-sm font-medium" style="color:#1A1A2E;">${t.category}</span>
      </td>
      <td class="px-4 py-3 text-center">
        <span class="text-xs font-bold px-2 py-1 rounded-full"
              style="${t.surcharge === 'Standard' ? 'background:#ECFDF5;color:#2D7D46;' : 'background:#FEF3C7;color:#D97706;'}">
          ${t.surcharge}
        </span>
      </td>
      <td class="px-4 py-3 text-xs" style="color:#8C7B6B;">${t.note}</td>
    </tr>`).join('');
}

function initCalculator(data) {
  const input = document.getElementById('cartValue');
  if (!input) return;
  input.addEventListener('input', () => calcFees(data));
  calcFees(data);
}

function calcFees(data) {
  const val   = parseFloat(document.getElementById('cartValue')?.value) || 0;
  const fees  = data.serviceFees || [];
  const ship  = data.shippingByKg || [];

  const bracket = fees.find(f => val >= f.min && val <= f.max) || fees[fees.length - 1];
  const pct     = bracket ? bracket.pct : 0;
  const fee     = Math.round(val * pct / 100);

  const resultEl = document.getElementById('calcResult');
  if (!resultEl) return;

  if (val <= 0) {
    resultEl.innerHTML = `<div class="text-sm" style="color:#8C7B6B;">Entrez un montant pour voir le calcul.</div>`;
    return;
  }

  resultEl.innerHTML = `
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span style="color:#5C5C6E;">Valeur panier</span>
        <span class="font-bold" style="color:#1A1A2E;">${Number(val).toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="flex justify-between text-sm">
        <span style="color:#5C5C6E;">Frais service NAMM (${pct}%)</span>
        <span class="font-bold" style="color:#D62828;">${Number(fee).toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="pt-2 mt-2" style="border-top:1px solid #E8DDD0;">
        ${ship.map(s => {
          const shipping = 0; // needs kg
          return `<div class="text-xs" style="color:#8C7B6B;">${s.icon} ${s.transport} : ${Number(s.pricePerKg).toLocaleString('fr-FR')} FCFA/kg</div>`;
        }).join('')}
      </div>
      <div class="p-3 rounded-xl mt-2" style="background:#FFF5F5;">
        <div class="text-xs font-bold" style="color:#D62828;">💡 Frais de service minimum :</div>
        <div class="text-xl font-black mt-1" style="color:#D62828;font-family:'Syne',sans-serif;">
          ${Number(fee).toLocaleString('fr-FR')} FCFA
        </div>
        <div class="text-xs mt-0.5" style="color:#8C7B6B;">+ Transport + Douane selon mode choisi</div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initPricing);
