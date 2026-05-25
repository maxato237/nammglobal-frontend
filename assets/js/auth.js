import jwt_decode from "https://cdn.jsdelivr.net/npm/jwt-decode/build/jwt-decode.esm.js";

// ============================================================
// NAMM GLOBAL – Auth System (mock localStorage)
// ============================================================

const AUTH_KEY = "namm_user";
const REMEMBER_KEY = "namm_remember";
const SESSION_KEY = "namm_session";
const apiUrl = "http://127.0.0.1:5000/api/auth";

// ── Mock "base de données" utilisateurs ─────────────────────

// ── Helpers ──────────────────────────────────────────────────

/**
 * Valide un mot de passe selon la règle backend : min 8 caractères, 1 chiffre, 1 caractère spécial.
 * @returns {{ok:boolean, error?:string}}
 */
function validatePassword(p) {
  if (!p || p.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (!/\d/.test(p))      return { ok: false, error: "Le mot de passe doit contenir au moins un chiffre." };
  if (!/[^A-Za-z0-9]/.test(p)) return { ok: false, error: "Le mot de passe doit contenir au moins un caractère spécial." };
  return { ok: true };
}

/**
 * Normalise un numéro : retire espaces, tirets, +, indicatifs courants
 */
function normalizePhone(raw) {
  let n = raw.replace(/[\s\-\.\(\)]/g, "");
  // Retirer indicatifs : +237, 00237, +225, 00225…
  n = n.replace(/^\+\d{3}/, "").replace(/^00\d{3}/, "");
  // Retirer un 0 initial restant
  n = n.replace(/^0/, "");
  return n;
}

/**
 * Retourne l'objet utilisateur connecté, ou null.
 * Tente un refresh automatique si l'access token est expiré (401).
 */
async function getCurrentUser() {
  let accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;

  try {
    let response = await fetch(`${apiUrl}/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    // Access token expiré → tenter un refresh puis réessayer une fois
    if (response.status === 401) {
      const refreshed = await _tryRefresh();
      if (!refreshed) return null;
      accessToken = localStorage.getItem("accessToken");
      response = await fetch(`${apiUrl}/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
    }

    if (!response.ok) return null;

    const data = await response.json();
    const u = data.data;        // déballe l'enveloppe { success, message, data }
    if (!u) return null;

    // Normalisation : alias des champs backend (camelCase) vers les noms
    // attendus par le front (nav.js, dashboard.js, profile.html…)
    return {
      ...u,
      name:    u.fullName ?? "",
      avatar:  u.initials ?? "",      // initiales affichées comme texte (ex. "MD")
      avatarUrl: u.avatarUrl ?? null, // URL image conservée à part si besoin
      country: u.countryCode ?? "",
      joined:  u.createdAt ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est connecté (asynchrone).
 */
async function isLoggedIn() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Connecte un utilisateur
 */
async function loginUser(phone, password, remember = false) {
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, remember }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { ok: false, error: result.message || "Erreur de connexion." };
    }

    return {
      ok: true,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      user: result.data,
    };
  } catch (e) {
    return { ok: false, error: "Impossible de joindre le serveur (réseau/CORS)." };
  }
}

/**
 * Inscrit un nouvel utilisateur (mock)
 */
async function registerUser(data) {
  const pwCheck = validatePassword(data.password);
  if (!pwCheck.ok) {
    return { ok: false, error: pwCheck.error };
  }
  if (data.password !== data.passwordConfirm) {
    return { ok: false, error: "Les mots de passe ne correspondent pas." };
  }

  const initials = data.name
    .trim()
    .split(" ")
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  const newUser = {
    phone: data.phone || "",
    whatsapp: data.phone || "",
    name: data.name.trim(),
    email: data.email?.trim() || "",
    country: data.country || "",
    city: data.city?.trim() || "",
    password: data.password,
    avatar: initials,
  };

  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: result.message || "Erreur lors de l'inscription. Veuillez réessayer.",
      };
    }

    return {
      ok: true,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      user: result.data,
    };
  } catch (e) {
    return { ok: false, error: "Impossible de joindre le serveur (réseau/CORS)." };
  }
}

/**
 * Déconnexion — blackliste l'access token et révoque le refresh token côté serveur
 */
async function logoutUser() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (accessToken) {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (e) {
    // Erreur réseau : on purge quand même le localStorage
    console.warn("Logout backend échoué, purge locale.", e);
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  window.location.href = "login.html";
}

/**
 * Garde la page : redirige vers login si non connecté (asynchrone).
 */
async function requireAuth(redirectTo = "login.html") {
  const logged = await isLoggedIn();
  if (!logged) {
    // Sauvegarder la page demandée pour rediriger après connexion
    sessionStorage.setItem(
      "namm_redirect",
      window.location.pathname.split("/").pop(),
    );
    window.location.href = redirectTo;
  }
}

/**
 * Redirige si déjà connecté (depuis login/register) (asynchrone).
 */
async function redirectIfLoggedIn(to = "dashboard.html") {
  const logged = await isLoggedIn();
  if (logged) window.location.href = to;
}

/**
 * Après connexion réussie, redirige vers la page d'origine ou dashboard
 */
function redirectAfterLogin() {
  const target = sessionStorage.getItem("namm_redirect") || "dashboard.html";
  sessionStorage.removeItem("namm_redirect");
  window.location.href = target;
}

// ══════════════════════════════════════════════════════════
//  RÉINITIALISATION DU MOT DE PASSE (OTP)
// ══════════════════════════════════════════════════════════

/**
 * Étape 1 — Demande un OTP envoyé par SMS/WhatsApp.
 * @returns {Promise<{ok:boolean, tokenId?:number, error?:string}>}
 */
async function requestPasswordReset(phone, channel = "sms") {
  try {
    const response = await fetch(`${apiUrl}/password/reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, channel }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { ok: false, error: result.message || "Échec de l'envoi du code." };
    }
    return { ok: true, tokenId: result.data?.tokenId };
  } catch (e) {
    return { ok: false, error: "Erreur réseau. Réessayez." };
  }
}

/**
 * Étape 2 — Vérifie l'OTP (6 chiffres) et récupère un resetToken à usage unique.
 * @returns {Promise<{ok:boolean, resetToken?:string, error?:string}>}
 */
async function verifyResetOtp(tokenId, otp) {
  try {
    const response = await fetch(`${apiUrl}/password/reset/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, otp }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { ok: false, error: result.message || "Code invalide ou expiré." };
    }
    return { ok: true, resetToken: result.data?.resetToken };
  } catch (e) {
    return { ok: false, error: "Erreur réseau. Réessayez." };
  }
}

/**
 * Étape 3 — Applique le nouveau mot de passe via le resetToken.
 * @returns {Promise<{ok:boolean, error?:string}>}
 */
async function confirmPasswordReset(resetToken, newPassword) {
  try {
    const response = await fetch(`${apiUrl}/password/reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { ok: false, error: result.message || "Échec de la réinitialisation." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Erreur réseau. Réessayez." };
  }
}

// ══════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════

function getAdmin() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = jwt_decode(token);
    if (!payload || !_isTokenAlive(token)) return null;

    return {
      id: payload.sub,
      role: payload.role,
    };
  } catch {
    return null; // token invalide
  }
}
// auth.js
async function adminExists() {
  try {
    const token = localStorage.getItem("accessToken"); // optionnel, si tu veux authentifier la requête
    const res = await fetch(`${apiUrl}/admin/exists`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return false;

    const data = await res.json();
    return data?.data?.exists ?? false; // selon ta fonction success() côté backend
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function setupAdmin(data) {
  const adminUser = {
    name: data.name,
    phone: data.phone,
    password: data.password,
  };

  const response = await fetch(`${apiUrl}/admin/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminUser),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la configuration de l'administrateur.");
  }
  const d = await response.json();

  return d.data;
}

async function loginAdmin(phone, password) {
  const response = await fetch(`${apiUrl}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { ok: false, error: data.message || "Identifiants incorrects." };
  }

  localStorage.setItem("accessToken", data.data.accessToken);
  localStorage.setItem("refreshToken", data.data.refreshToken);
  return { ok: true };
}

async function _isTokenAlive(token) {
  try {
    const res = await fetch(`${apiUrl}/verify`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (res.ok) return true;

    if (res.status === 401) {
      return await _tryRefresh();
    }

    return false;
  } catch {
    return false;
  }
}

async function _tryRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${apiUrl}/refresh`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${refreshToken}` },
    });

    if (!res.ok) return false;

    const response = await res.json();
    console.log(response.data);
    
    localStorage.setItem("accessToken", response.data.accessToken);
    return true;
  } catch {
    return false;
  }
}


function isAdminLoggedIn() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;
  return _isTokenAlive(token);
}

function logoutAdmin() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "admin.html";
}

// ── Expose globalement ───────────────────────────────────────
window.AUTH = {
  getCurrentUser,
  isLoggedIn,
  loginUser,
  registerUser,
  logoutUser,
  requireAuth,
  redirectIfLoggedIn,
  redirectAfterLogin,
  normalizePhone,
  validatePassword,
  requestPasswordReset,
  verifyResetOtp,
  confirmPasswordReset,
  setupAdmin,
  loginAdmin,
  isAdminLoggedIn,
  logoutAdmin,
  getAdmin,
  adminExists
};
