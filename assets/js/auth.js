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
 * Retourne l'utilisateur connecté (session ou remember)
 */
async function getCurrentUser() {
  try {
    const accessToken = localStorage.getItem("accessToken");
    
    response = await fetch(`${apiUrl}/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    console.log(data);
    
    return data 
    
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est connecté
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Connecte un utilisateur
 */
async function loginUser(phone, password, remember = false) {
  const response = await fetch(`${apiUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "phone":phone, "password": password, "remember": remember }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.log(errorData);
    return { ok: false, error: errorData.message || "Erreur de connexion." };
  }

  const result = await response.json();
  
  return { ok: true, token: result.data.accessToken };
}

/**
 * Inscrit un nouvel utilisateur (mock)
 */
async function registerUser(data) {
  if (data.password.length < 6) {
    return {
      ok: false,
      error: "Le mot de passe doit contenir au moins 6 caractères.",
    };
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

  const response = await fetch(`${apiUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "Erreur lors de l'inscription. Veuillez réessayer.",
    };
  }

  const result = await response.json();
  console.log(result);

  return { ok: true, token: result.data.accessToken };
}

/**
 * Déconnexion
 */
function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  window.location.href = "login.html";
}

/**
 * Garde la page : redirige vers login si non connecté
 */
function requireAuth(redirectTo = "login.html") {
  if (!isLoggedIn()) {
    // Sauvegarder la page demandée pour rediriger après connexion
    sessionStorage.setItem(
      "namm_redirect",
      window.location.pathname.split("/").pop(),
    );
    window.location.href = redirectTo;
  }
}

/**
 * Redirige si déjà connecté (depuis login/register)
 */
function redirectIfLoggedIn(to = "dashboard.html") {
  if (isLoggedIn()) window.location.href = to;
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
  setupAdmin,
  loginAdmin,
  isAdminLoggedIn,
  logoutAdmin,
  getAdmin,
  adminExists
};
