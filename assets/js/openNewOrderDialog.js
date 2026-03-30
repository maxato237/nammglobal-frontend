/* ============================================================
   openNewOrderDialog — v2
   • 95 % largeur × 95 % hauteur
   • Tab "Demande unique"  /  "Demandes multiples"
   • Multi : accordion auto-collapse, toggle regroupement
   ============================================================ */

/* ── Helpers photo upload ──────────────────────────────────── */
function _noPhotoSelect(
  event,
  filesArr,
  previewGridId,
  counterSpanId,
  dropPlaceholderId,
  maxPhotos = 5,
) {
  const files = Array.from(event.target.files);
  for (const f of files) {
    if (filesArr.length >= maxPhotos) break;
    if (!f.type.startsWith("image/")) continue;
    filesArr.push(f);
  }
  _noRenderPreviews(filesArr, previewGridId, counterSpanId, dropPlaceholderId);
}

function _noRenderPreviews(
  filesArr,
  previewGridId,
  counterSpanId,
  dropPlaceholderId,
  maxPhotos = 5,
) {
  const grid = document.getElementById(previewGridId);
  const counter = document.getElementById(counterSpanId);
  const placeholder = document.getElementById(dropPlaceholderId);
  if (!grid) return;
  if (filesArr.length === 0) {
    grid.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (counter) counter.style.display = "none";
    return;
  }
  grid.style.display = "grid";
  if (placeholder) placeholder.style.display = "none";
  grid.innerHTML = "";
  filesArr.forEach((f, i) => {
    const url = URL.createObjectURL(f);
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;";
    wrap.innerHTML = `
      <img src="${url}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid #E8DDD0;">
      <button type="button"
              onclick="window._noRemoveFile('${previewGridId}','${counterSpanId}','${dropPlaceholderId}',${i})"
              style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;
                     background:#D62828;color:white;border:none;cursor:pointer;font-size:10px;line-height:1;">x</button>`;
    grid.appendChild(wrap);
  });
  if (counter) {
    counter.textContent = `${filesArr.length}/${maxPhotos} photo(s)`;
    counter.style.display = "block";
  }
}

window._noRemoveFile = function (
  previewGridId,
  counterSpanId,
  dropPlaceholderId,
  idx,
) {
  /* single tab */
  if (previewGridId === "noPreviewGrid") {
    window._noFiles?.splice(idx, 1);
    _noRenderPreviews(
      window._noFiles || [],
      previewGridId,
      counterSpanId,
      dropPlaceholderId,
    );
    return;
  }
  /* multi tab: derive uid from previewGridId pattern "mfN_grid" */
  const uid = previewGridId.replace("_grid", "");
  window._noFilesMap?.[uid]?.splice(idx, 1);
  _noRenderPreviews(
    window._noFilesMap?.[uid] || [],
    previewGridId,
    counterSpanId,
    dropPlaceholderId,
  );
};

/* ── Générateur HTML d'un bloc formulaire produit ───────────── */
function _buildProductForm(idx, waves) {
  const uid = `mf${idx}`;
  const label = `Demande n\u00b0${idx + 1}`;
  return `
  <div class="mf-item" id="${uid}_item"
       style="border:1px solid #E8DDD0;border-radius:14px;overflow:hidden;margin-bottom:8px;">

    <!-- Accordion header -->
    <div id="${uid}_header"
         onclick="window._noToggleAccordion('${uid}')"
         style="display:flex;align-items:center;justify-content:space-between;
                padding:11px 16px;cursor:pointer;user-select:none;
                background:#F5F0E8;border-bottom:1px solid #E8DDD0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:26px;height:26px;border-radius:50%;
                    background:linear-gradient(135deg,#D62828,#E8A020);
                    color:white;font-size:12px;font-weight:700;
                    display:flex;align-items:center;justify-content:center;">${idx + 1}</div>
        <span id="${uid}_title"
              style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#1A1A2E;">${label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="${uid}_arrow"
              style="font-size:12px;color:#8C7B6B;transition:transform .25s;display:inline-block;">v</span>
        <button type="button"
                onclick="event.stopPropagation();window._noRemoveItem('${uid}')"
                style="width:22px;height:22px;border-radius:50%;background:transparent;
                       border:1px solid #E8DDD0;cursor:pointer;font-size:11px;color:#D62828;line-height:1;">x</button>
      </div>
    </div>

    <!-- Accordion body -->
    <div id="${uid}_body" style="padding:16px;display:block;">

      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">
          Lien ou description du produit *
          <span style="font-weight:400;color:#8C7B6B;">(1688, Taobao, Alibaba...)</span>
        </label>
        <textarea id="${uid}_link" class="input" rows="2"
                  placeholder="https://detail.1688.com/offer/..."
                  oninput="window._noUpdateItemTitle('${uid}')"
                  required style="resize:none;"></textarea>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div>
          <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Quantite *</label>
          <input id="${uid}_qty" type="number" class="input" min="1" placeholder="ex: 10" required>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Categorie</label>
          <select id="${uid}_cat" class="input">
            <option value="">-- Categorie --</option>
            ${[
              "Textile",
              "Electronique",
              "Chaussures",
              "Cosmetiques",
              "Maison",
              "Bijoux",
              "Alimentaire",
              "Autres",
            ]
              .map((c) => `<option>${c}</option>`)
              .join("")}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div>
          <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Transport</label>
          <select id="${uid}_transport" class="input">
            <option value="">Selon recommandation NAMM</option>
            <option>Avion (rapide)</option>
            <option>Mer (economique)</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Vague</label>
          <select id="${uid}_wave" class="input">
            <option value="">Prochaine disponible</option>
            ${waves
              .map((w) => {
                const deadline = new Date(w.deadline);
                const isPast = deadline < new Date();
                return `<option value="${w.id}" ${isPast ? "disabled" : ""}>
                ${w.wave} - ${deadline.toLocaleDateString("fr-FR")}${isPast ? " (passee)" : ""}
              </option>`;
              })
              .join("")}
          </select>
        </div>
      </div>

      <!-- Photos -->
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">
          Photos <span style="font-weight:400;color:#8C7B6B;">(optionnel - 5 max)</span>
        </label>
        <div id="${uid}_drop"
             style="border:2px dashed #E8DDD0;border-radius:10px;background:#FEFCF8;cursor:pointer;"
             onclick="document.getElementById('${uid}_photoInput').click()">
          <div id="${uid}_ph"
               style="display:flex;align-items:center;gap:10px;padding:12px;">
             <label
                    class="text-xs font-semibold block mb-1"
                    style="color: #5c5c6e"
                  >
                    📸 Photos du produit
                    <span class="font-normal" style="color: #8c7b6b">
                      (optionnel – 5 max)</span
                    >
                  </label>
          </div>
          <div id="${uid}_grid"
               style="display:none;padding:8px;grid-template-columns:repeat(5,1fr);gap:6px;"></div>
          <input id="${uid}_photoInput" type="file" accept="image/*" multiple style="display:none;"
                 onchange="window._noPhotoSelectMF(event,'${uid}')">
        </div>
        <div id="${uid}_counter" style="display:none;margin-top:5px;font-size:11px;font-weight:700;color:#D62828;"></div>
      </div>

      <div>
        <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Message complementaire</label>
        <textarea id="${uid}_msg" class="input" rows="2"
                  placeholder="Precisions couleur, taille, modele..." style="resize:none;"></textarea>
      </div>
    </div>
  </div>`;
}

/* ── Callbacks globaux pour le mode multi ───────────────────── */
window._noFilesMap = {};

window._noPhotoSelectMF = function (event, uid) {
  if (!window._noFilesMap[uid]) window._noFilesMap[uid] = [];
  _noPhotoSelect(
    event,
    window._noFilesMap[uid],
    `${uid}_grid`,
    `${uid}_counter`,
    `${uid}_ph`,
  );
};

window._noToggleAccordion = function (uid) {
  const body = document.getElementById(`${uid}_body`);
  const arrow = document.getElementById(`${uid}_arrow`);
  if (!body) return;
  const isOpen = body.style.display !== "none";
  body.style.display = isOpen ? "none" : "block";
  if (arrow) arrow.style.transform = isOpen ? "rotate(-90deg)" : "rotate(0deg)";
};

window._noCollapseAllItems = function () {
  document.querySelectorAll(".mf-item").forEach((item) => {
    const uid = item.id.replace("_item", "");
    const body = document.getElementById(`${uid}_body`);
    const arr = document.getElementById(`${uid}_arrow`);
    if (body) body.style.display = "none";
    if (arr) arr.style.transform = "rotate(-90deg)";
  });
};

window._noRemoveItem = function (uid) {
  document.getElementById(`${uid}_item`)?.remove();
  delete window._noFilesMap[uid];
  _noUpdateMultiCount();
};

window._noUpdateItemTitle = function (uid) {
  const link = document.getElementById(`${uid}_link`)?.value?.trim();
  const title = document.getElementById(`${uid}_title`);
  if (!title) return;
  const num = parseInt(uid.replace("mf", ""), 10);
  title.textContent = link
    ? `Demande n\u00b0${num + 1} \u2013 ${link.slice(0, 38)}${link.length > 38 ? "\u2026" : ""}`
    : `Demande n\u00b0${num + 1}`;
};

function _noUpdateMultiCount() {
  const count = document.querySelectorAll(".mf-item").length;
  const el = document.getElementById("noMultiCount");
  if (el)
    el.textContent =
      count > 0 ? `(${count} demande${count > 1 ? "s" : ""})` : "";
}

/* ═══════════════════════════════════════════════════════════════
   Dialog principal
   ═══════════════════════════════════════════════════════════════ */
async function openNewOrderDialog(opts = {}) {
  const user = window.AUTH.getCurrentUser();
  if (!user) return;

  if (!window.STORE.users.isProfileComplete(user)) {
    showProfileIncompleteDialog();
    return;
  }

  const waves = await window.STORE.waves.getAll();
  const prefill = opts.prefill || null;
  const preWaveId =
    sessionStorage.getItem("namm_preselect_wave") || opts.waveId || null;
  if (preWaveId) sessionStorage.removeItem("namm_preselect_wave");

  let modal = document.getElementById("newOrderModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "newOrderModal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
  <div style="position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;
              padding:2.5vh 2.5vw;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);">
    <div style="width:90vw;height:90vh;border-radius:24px;overflow:hidden;
                background:white;display:flex;flex-direction:column;
                box-shadow:0 25px 60px rgba(0,0,0,.35);">

      <!-- ══ Header ══ -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:16px 24px;border-bottom:1px solid #E8DDD0;flex-shrink:0;">
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#1A1A2E;">
          ${prefill ? "\uD83D\uDD01 Repeter la commande" : "\uD83D\uDCE6 Nouvelle demande de devis"}
        </div>
        <button onclick="document.getElementById('newOrderModal').remove()"
                style="width:32px;height:32px;border-radius:50%;border:none;background:#F5F0E8;
                       cursor:pointer;font-size:16px;color:#8C7B6B;display:flex;align-items:center;justify-content:center;">x</button>
      </div>

      <!-- ══ Info client ══ -->
      <div style="display:flex;align-items:center;gap:12px;margin:12px 24px 0;
                  padding:10px 14px;border-radius:12px;background:#F5F0E8;flex-shrink:0;">
        <div style="width:36px;height:36px;border-radius:10px;flex-shrink:0;
                    background:linear-gradient(135deg,#D62828,#E8A020);
                    color:white;font-size:13px;font-weight:700;
                    display:flex;align-items:center;justify-content:center;">${user.avatar}</div>
        <div style="font-size:12px;flex:1;">
          <div style="font-weight:700;color:#1A1A2E;">${user.name}</div>
          <div style="color:#8C7B6B;">${user.phone} - ${user.city}, ${user.country}</div>
        </div>
        <div style="font-size:11px;padding:4px 10px;border-radius:8px;
                    background:#ECFDF5;color:#2D7D46;white-space:nowrap;">Profil complet</div>
      </div>

      <!-- ══ Tab bar ══ -->
      <div style="display:flex;gap:4px;padding:12px 24px 0;flex-shrink:0;">
        <button id="tabSingle" onclick="window._noSwitchTab('single')"
                style="flex:1;padding:10px 0;border-radius:12px 12px 0 0;
                       border:1px solid #E8DDD0;border-bottom:none;
                       font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;
                       background:#1A1A2E;color:white;">
          + Demande unique
        </button>
        <button id="tabMulti" onclick="window._noSwitchTab('multi')"
                style="flex:1;padding:10px 0;border-radius:12px 12px 0 0;
                       border:1px solid #E8DDD0;border-bottom:none;
                       font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;
                       background:#F5F0E8;color:#8C7B6B;">
          Demandes multiples
        </button>
      </div>

      <!-- ══ Panels (scrollables) ══ -->
      <div style="flex:1;overflow:hidden;border-top:1px solid #E8DDD0;position:relative;">

        <!-- ─ Panel Single ─ -->
        <div id="panelSingle" style="height:100%;overflow-y:auto;padding:20px 24px 24px;box-sizing:border-box;">
          <form id="newOrderForm" style="display:flex;flex-direction:column;gap:14px;">

            <div>
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">
                Lien ou description du produit *
                <span style="font-weight:400;color:#8C7B6B;">(1688, Taobao, Alibaba...)</span>
              </label>
              <textarea id="noProductLink" class="input" rows="3"
                        placeholder="https://detail.1688.com/offer/..."
                        required style="resize:none;">${prefill?.productLink || ""}</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Quantite *</label>
                <input id="noQty" type="number" class="input" min="1" placeholder="ex: 10" required
                       value="${prefill?.quantity || ""}">
              </div>
              <div>
                <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Categorie</label>
                <select id="noCategory" class="input">
                  <option value="">-- Categorie --</option>
                  ${[
                    "Textile",
                    "Electronique",
                    "Chaussures",
                    "Cosmetiques",
                    "Maison",
                    "Bijoux",
                    "Alimentaire",
                    "Autres",
                  ]
                    .map(
                      (c) =>
                        `<option ${prefill?.category === c ? "selected" : ""}>${c}</option>`,
                    )
                    .join("")}
                </select>
              </div>
            </div>

            <div>
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Transport prefere</label>
              <select id="noTransport" class="input">
                <option value="">Selon recommandation NAMM</option>
                <option ${prefill?.transport === "Avion" ? "selected" : ""}>Avion (rapide)</option>
                <option ${prefill?.transport === "Mer" ? "selected" : ""}>Mer (economique)</option>
              </select>
            </div>

            <div>
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">
                Vague souhaitee
                <span style="font-weight:400;color:#8C7B6B;">(optionnel)</span>
              </label>
              <select id="noWave" class="input">
                <option value="">NAMM choisira la prochaine vague disponible</option>
                ${waves
                  .map((w) => {
                    const deadline = new Date(w.deadline);
                    const isPast = deadline < new Date();
                    const selected =
                      preWaveId === w.id || prefill?.waveId === w.id
                        ? "selected"
                        : "";
                    return `<option value="${w.id}" ${isPast ? "disabled" : ""} ${selected}>
                    ${w.wave} - avant le ${deadline.toLocaleDateString("fr-FR")}${isPast ? " (passee)" : ""}
                  </option>`;
                  })
                  .join("")}
              </select>
            </div>

            <!-- Photos demande unique -->
            <div>
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">
                Photos du produit <span style="font-weight:400;color:#8C7B6B;">(optionnel - 5 max)</span>
              </label>
              <div id="noDropZone"
                   style="border-radius:14px;border:2px dashed #E8DDD0;background:#FEFCF8;cursor:pointer;"
                   onclick="document.getElementById('noPhotoInput').click()">
                <div id="noDropPlaceholder"
                     style="display:flex;align-items:center;gap:12px;padding:16px;">
                   <label
                    class="text-xs font-semibold block mb-1"
                    style="color: #5c5c6e"
                  >
                    📸 Photos du produit
                    <span class="font-normal" style="color: #8c7b6b">
                      (optionnel – 5 max)</span
                    >
                  </label>
                </div>
                <div id="noPreviewGrid"
                     style="display:none;padding:10px;grid-template-columns:repeat(5,1fr);gap:8px;"></div>
                <input id="noPhotoInput" type="file" accept="image/*" multiple style="display:none;"
                       onchange="window._noPhotoSingle(event)">
              </div>
              <div id="noPhotoCounter" style="display:none;margin-top:6px;font-size:11px;font-weight:700;color:#D62828;"></div>
            </div>

            <div>
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:6px;color:#5C5C6E;">Message complementaire</label>
              <textarea id="noMessage" class="input" rows="2"
                        placeholder="Precisions couleur, taille, modele..." style="resize:none;"></textarea>
            </div>

            <div style="padding:12px 14px;border-radius:12px;font-size:12px;background:#EFF6FF;color:#3B82F6;">
              Info : Apres validation, NAMM GLOBAL prepare votre devis sous <strong>24h</strong>.
              Vous serez notifie des qu'il est disponible.
            </div>

            <button type="submit" class="btn-primary w-full justify-center"
                    style="padding:14px;font-size:15px;border-radius:14px;">
              Envoyer ma demande
            </button>
          </form>
        </div>

        <!-- ─ Panel Multi ─ -->
        <div id="panelMulti"
             style="height:100%;overflow-y:auto;padding:20px 24px 24px;display:none;box-sizing:border-box;">

          <!-- ─ Toggle regroupement ─ -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;
                      padding:14px 16px;border-radius:14px;background:#F5F0E8;
                      border:1px solid #E8DDD0;margin-bottom:16px;">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:#1A1A2E;">Mode de traitement</div>
              <div id="modeLabel" style="font-size:11px;color:#8C7B6B;margin-top:3px;">
                Un seul devis groupe pour toutes les demandes
              </div>
            </div>
            <!-- Custom toggle switch -->
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
              <span style="font-size:11px;font-weight:700;color:#D62828;" id="modeTagLeft">1 devis groupe</span>
              <div id="toggleTrack"
                   onclick="window._noToggleMode()"
                   style="position:relative;width:52px;height:28px;border-radius:28px;
                          background:#D62828;cursor:pointer;transition:background .3s;flex-shrink:0;">
                <div id="toggleThumb"
                     style="position:absolute;left:3px;top:3px;width:22px;height:22px;
                            border-radius:50%;background:white;transition:left .3s;"></div>
              </div>
              <span style="font-size:11px;font-weight:700;color:#8C7B6B;" id="modeTagRight">Devis separes</span>
            </div>
          </div>
          <input type="checkbox" id="noGroupToggle" style="display:none;">

          <!-- Pile des formulaires -->
          <div id="mfStack"></div>

          <!-- Bouton ajouter -->
          <button type="button" id="noAddItemBtn"
                  onclick="window._noAddMultiItem()"
                  style="width:100%;padding:12px;border-radius:14px;
                         border:2px dashed #E8A020;background:transparent;
                         color:#E8A020;font-family:'Syne',sans-serif;
                         font-size:13px;font-weight:700;cursor:pointer;
                         display:flex;align-items:center;justify-content:center;gap:8px;
                         margin-top:4px;transition:background .2s;">
            <span style="font-size:18px;line-height:1;">+</span>
            Ajouter une demande
            <span id="noMultiCount" style="font-size:11px;color:#8C7B6B;font-weight:400;"></span>
          </button>

          <!-- Info -->
          <div style="padding:12px 14px;border-radius:12px;font-size:12px;
                      background:#EFF6FF;color:#3B82F6;margin-top:14px;">
            Info : Les demandes sont envoyees simultanement.
            Chaque devis sera pret sous <strong>24h</strong>.
          </div>

          <!-- Envoyer toutes -->
          <button type="button" onclick="window._noSubmitMulti()"
                 class="btn-primary w-full justify-center mt-4">
            Envoyer toutes les demandes
          </button>
        </div>

      </div>
    </div>
  </div>`;

  /* ── Init etat ─────────────────────────────────────────────── */
  window._noFiles = [];
  window._noFilesMap = {};
  window._noMultiIndex = 0;
  window._noModeGrouped = true; /* true = 1 devis groupe, false = devis separes */

  /* Photo upload (onglet unique) */
  window._noPhotoSingle = function (event) {
    _noPhotoSelect(
      event,
      window._noFiles,
      "noPreviewGrid",
      "noPhotoCounter",
      "noDropPlaceholder",
    );
  };

  /* ── Tab switch ──────────────────────────────────────────────── */
  window._noSwitchTab = function (tab) {
    const isSingle = tab === "single";
    document.getElementById("panelSingle").style.display = isSingle
      ? "block"
      : "none";
    document.getElementById("panelMulti").style.display = isSingle
      ? "none"
      : "block";
    const btnS = document.getElementById("tabSingle");
    const btnM = document.getElementById("tabMulti");
    if (btnS) {
      btnS.style.background = isSingle ? "#1A1A2E" : "#F5F0E8";
      btnS.style.color = isSingle ? "white" : "#8C7B6B";
    }
    if (btnM) {
      btnM.style.background = isSingle ? "#F5F0E8" : "#1A1A2E";
      btnM.style.color = isSingle ? "#8C7B6B" : "white";
    }
  };

  /* ── Toggle mode grouped / separe ───────────────────────────── */
  window._noToggleMode = function () {
    window._noModeGrouped = !window._noModeGrouped;
    const grouped = window._noModeGrouped;
    const thumb = document.getElementById("toggleThumb");
    const track = document.getElementById("toggleTrack");
    const tagL = document.getElementById("modeTagLeft");
    const tagR = document.getElementById("modeTagRight");
    const lbl = document.getElementById("modeLabel");
    if (thumb) thumb.style.left = grouped ? "3px" : "27px";
    if (track) track.style.background = grouped ? "#D62828" : "#2D7D46";
    if (tagL) {
      tagL.style.color = grouped ? "#D62828" : "#8C7B6B";
      tagL.style.fontWeight = grouped ? "700" : "400";
    }
    if (tagR) {
      tagR.style.color = grouped ? "#8C7B6B" : "#2D7D46";
      tagR.style.fontWeight = grouped ? "400" : "700";
    }
    if (lbl)
      lbl.textContent = grouped
        ? "Un seul devis groupe pour toutes les demandes"
        : "Un devis individuel par demande";
  };

  /* ── Ajouter un item multi ───────────────────────────────────── */
  window._noAddMultiItem = function () {
    window._noCollapseAllItems();
    const stack = document.getElementById("mfStack");
    if (!stack) return;
    const idx = window._noMultiIndex++;
    window._noFilesMap[`mf${idx}`] = [];
    stack.insertAdjacentHTML("beforeend", _buildProductForm(idx, waves));
    _noUpdateMultiCount();
    /* scroll vers le nouveau item */
    setTimeout(() => {
      document
        .getElementById(`mf${idx}_item`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  /* Premier item par defaut */
  window._noAddMultiItem();

  /* ── Soumission multi ─────────────────────────────────────────── */
  window._noSubmitMulti = async function () {
    const items = document.querySelectorAll(".mf-item");
    if (items.length === 0) {
      window.showToast?.("Ajoutez au moins une demande.", "warning");
      return;
    }

    const orders = [];
    let valid = true;

    items.forEach((item) => {
      const uid = item.id.replace("_item", "");
      const link = document.getElementById(`${uid}_link`)?.value?.trim();
      const qty = document.getElementById(`${uid}_qty`)?.value;
      if (!link || !qty) {
        valid = false;
        return;
      }
      orders.push({
        userId: user.id,
        product: link.slice(0, 80) || "Commande sans titre",
        category: document.getElementById(`${uid}_cat`)?.value || "Autres",
        transport: document.getElementById(`${uid}_transport`)?.value || null,
        quantity: parseInt(qty) || 1,
        waveId: document.getElementById(`${uid}_wave`)?.value || null,
        productLink: link,
        country: user.country,
        city: user.city,
        grouped: window._noModeGrouped,
        message: document.getElementById(`${uid}_msg`)?.value?.trim() || "",
      });
    });

    if (!valid) {
      window.showToast?.(
        "Remplissez le lien et la quantite de chaque demande.",
        "warning",
      );
      return;
    }

    const btn = document.querySelector(
      '#panelMulti button[onclick="window._noSubmitMulti()"]',
    );
    const orig = btn?.innerHTML;
    if (btn) {
      btn.innerHTML = "Envoi en cours...";
      btn.disabled = true;
    }

    try {
      /* -- Quand Flask est pret : boucle fetch('/api/orders', { method:'POST', body: FormData }) */
      for (const o of orders) {
        await window.STORE.orders.create(o);
      }
      document.getElementById("newOrderModal")?.remove();
      await loadOrders(user);
      renderStats();
      const msg = window._noModeGrouped
        ? `${orders.length} demandes envoyees en 1 devis groupe !`
        : `${orders.length} demandes envoyees - ${orders.length} devis individuels en cours !`;
      window.showToast?.(msg, "success");
    } catch (err) {
      console.error(err);
      window.showToast?.("Erreur lors de l'envoi. Reessayez.", "error");
      if (btn) {
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    }
  };

  /* ── Soumission unique ────────────────────────────────────────── */
  document
    .getElementById("newOrderForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = this.querySelector("button[type=submit]");
      const orig = btn.innerHTML;
      btn.innerHTML = "Envoi en cours...";
      btn.disabled = true;

      try {
        await window.STORE.orders.create({
          userId: user.id,
          product:
            document
              .getElementById("noProductLink")
              .value.trim()
              .slice(0, 80) || "Commande sans titre",
          category: document.getElementById("noCategory").value || "Autres",
          transport: document.getElementById("noTransport").value || null,
          quantity: parseInt(document.getElementById("noQty").value) || 1,
          waveId: document.getElementById("noWave").value || null,
          productLink: document.getElementById("noProductLink").value.trim(),
          message: document.getElementById("noMessage").value.trim(),
          country: user.country,
          city: user.city,
        });
        document.getElementById("newOrderModal")?.remove();
        await loadOrders(user);
        renderStats();
        window.showToast?.("Demande envoyee ! Devis sous 24h.", "success");
      } catch (err) {
        console.error(err);
        window.showToast?.("Erreur lors de l'envoi. Reessayez.", "error");
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    });
}
