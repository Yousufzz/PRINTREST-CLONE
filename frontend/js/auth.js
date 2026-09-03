/* ═══════════════════════════════════════════════════════════════
   PinAI — Authentication & Profile Controller
   Handles user registration, sign in, session persistence,
   and injects the Apple OS profile menu into the navigation bar.
   ═══════════════════════════════════════════════════════════════ */

const Auth = (function () {
  const TOKEN_KEY = 'pinai_token';
  const USER_KEY = 'pinai_user';
  const API_BASE = window.location.origin + '/api/auth';

  // ─── Local State Getters ───────────────────────────────────────
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    return !!getToken() && !!getUser();
  }

  // ─── API Methods ───────────────────────────────────────────────
  async function register(username, password, name) {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showToast(`Welcome to PinAI, ${data.user.name}!`, 'success');
      updateNavbarUI();
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }

  async function login(username, password) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      updateNavbarUI();
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }

  async function logout() {
    const token = getToken();
    if (token) {
      fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    showToast('Signed out successfully', 'info');
    updateNavbarUI();
    closeDropdown();
    
    // If on saved pins or settings page, refresh
    if (window.location.pathname.includes('saved.html') || window.location.pathname.includes('settings.html')) {
      setTimeout(() => window.location.reload(), 500);
    }
  }

  async function syncSession() {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        updateNavbarUI();
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        updateNavbarUI();
      }
    } catch {
      // Offline fallback: keep local data
    }
  }

  // ─── Navbar Apple OS Profile Menu Injection (Corner) ───────────
  function updateNavbarUI() {
    let authSlot = document.getElementById('navbarAuthSlot');
    if (!authSlot) {
      const corner = document.querySelector('.navbar__corner') || document.querySelector('.navbar__inner');
      if (!corner) return;
      authSlot = document.createElement('div');
      authSlot.id = 'navbarAuthSlot';
      authSlot.className = 'navbar__auth-slot';
      corner.appendChild(authSlot);
    }


    const user = getUser();

    if (user) {
      authSlot.innerHTML = `
        <div class="user-menu-wrapper" id="userMenuWrapper">
          <button class="user-pill" id="userMenuBtn" title="${user.name}">
            <img class="user-pill__avatar" src="${user.avatar}" alt="${user.name}" />
            <span class="user-pill__name">${user.name.split(' ')[0]}</span>
            <span class="user-pill__chevron">▾</span>
          </button>
          
          <div class="apple-dropdown hidden" id="userDropdown">
            <div class="apple-dropdown__header">
              <img class="apple-dropdown__avatar" src="${user.avatar}" alt="${user.name}" />
              <div class="apple-dropdown__user-info">
                <div class="apple-dropdown__name">${user.name}</div>
                <div class="apple-dropdown__username">@${user.username}</div>
              </div>
            </div>
            <div class="apple-dropdown__divider"></div>
            <a href="saved.html" class="apple-dropdown__item">
              <span class="apple-dropdown__icon">📌</span> My Saved Pins
            </a>
            <a href="settings.html" class="apple-dropdown__item">
              <span class="apple-dropdown__icon">⚙️</span> System Settings
            </a>
            <a href="about.html" class="apple-dropdown__item">
              <span class="apple-dropdown__icon">ℹ️</span> About PinAI
            </a>
            <div class="apple-dropdown__divider"></div>
            <button class="apple-dropdown__item apple-dropdown__item--danger" id="logoutBtn">
              <span class="apple-dropdown__icon">⏻</span> Sign Out
            </button>
          </div>
        </div>
      `;

      const menuBtn = document.getElementById('userMenuBtn');
      const dropdown = document.getElementById('userDropdown');
      const logoutBtn = document.getElementById('logoutBtn');

      if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('hidden');
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          logout();
        });
      }
    } else {
      authSlot.innerHTML = `
        <button class="apple-btn apple-btn--primary apple-btn--pill" id="navSignInBtn">
          Sign In
        </button>
      `;

      const signInBtn = document.getElementById('navSignInBtn');
      if (signInBtn) {
        signInBtn.addEventListener('click', () => openAuthModal('login'));
      }
    }
  }

  function closeDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }

  // ─── Modal Auth Experience ─────────────────────────────────────
  function initAuthModal() {
    if (document.getElementById('authModalBackdrop')) return;

    const modal = document.createElement('div');
    modal.id = 'authModalBackdrop';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="apple-modal" id="authModal">
        <button class="modal__close" id="authModalClose">✕</button>

        <div class="auth-box">
          <div class="auth-box__logo">
            <div class="navbar__logo-icon" style="width: 48px; height: 48px; font-size: 1.5rem; margin: 0 auto 12px;">P</div>
            <h2 class="auth-box__title">Welcome to PinAI</h2>
            <p class="auth-box__subtitle">Your personal space for visual inspiration</p>
          </div>

          <!-- Apple OS Segmented Control -->
          <div class="segmented-control" id="authTabs">
            <button class="segmented-btn active" data-tab="login">Sign In</button>
            <button class="segmented-btn" data-tab="register">Register</button>
          </div>

          <!-- Login Form -->
          <form class="auth-form" id="loginForm">
            <div class="auth-field">
              <label class="auth-label">Username</label>
              <input type="text" class="auth-input" id="loginUsername" placeholder="username" required autocomplete="username" />
            </div>
            <div class="auth-field">
              <label class="auth-label">Password</label>
              <input type="password" class="auth-input" id="loginPassword" placeholder="••••••••" required autocomplete="current-password" />
            </div>
            <button type="submit" class="apple-btn apple-btn--primary apple-btn--block" style="margin-top: 16px;">
              Sign In
            </button>
          </form>

          <!-- Register Form -->
          <form class="auth-form hidden" id="registerForm">
            <div class="auth-field">
              <label class="auth-label">Full Name</label>
              <input type="text" class="auth-input" id="regName" placeholder="e.g. Alex Rivera" required />
            </div>
            <div class="auth-field">
              <label class="auth-label">Username</label>
              <input type="text" class="auth-input" id="regUsername" placeholder="choose a username" required autocomplete="username" />
            </div>
            <div class="auth-field">
              <label class="auth-label">Password</label>
              <input type="password" class="auth-input" id="regPassword" placeholder="at least 6 characters" required autocomplete="new-password" />
            </div>
            <button type="submit" class="apple-btn apple-btn--primary apple-btn--block" style="margin-top: 16px;">
              Create Account
            </button>
          </form>

          <p class="auth-footer-note">
            Protected by PinAI &bull; No cookies or trackers
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });

    // Segmented tab switching
    modal.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const isLogin = btn.dataset.tab === 'login';
        document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
        document.getElementById('registerForm').classList.toggle('hidden', isLogin);
      });
    });

    // Form submit handlers
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value;
      const res = await login(u, p);
      if (res.success) closeAuthModal();
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const n = document.getElementById('regName').value.trim();
      const u = document.getElementById('regUsername').value.trim();
      const p = document.getElementById('regPassword').value;
      const res = await register(u, p, n);
      if (res.success) closeAuthModal();
    });
  }

  function openAuthModal(initialTab = 'login') {
    initAuthModal();
    const modal = document.getElementById('authModalBackdrop');
    if (!modal) return;

    // Set active tab
    modal.querySelectorAll('.segmented-btn').forEach(btn => {
      const match = btn.dataset.tab === initialTab;
      btn.classList.toggle('active', match);
    });
    document.getElementById('loginForm').classList.toggle('hidden', initialTab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', initialTab !== 'register');

    modal.classList.add('active');
  }

  function closeAuthModal() {
    const modal = document.getElementById('authModalBackdrop');
    if (modal) modal.classList.remove('active');
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userMenuWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // ─── Initialize on DOM Ready ───────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    updateNavbarUI();
    syncSession();
  });

  return {
    getToken,
    getUser,
    isAuthenticated,
    register,
    login,
    logout,
    openAuthModal,
    closeAuthModal,
    updateNavbarUI
  };
})();

// Global expose
window.Auth = Auth;
