/* ═══════════════════════════════════════════════════════════════
   PinAI — Settings & Theme Engine
   Handles dynamic themes, custom accent colors, layout density,
   3D hero preferences, and persistent macOS-style settings controls.
   ═══════════════════════════════════════════════════════════════ */

const Settings = (function () {
  // Storage keys
  const THEME_KEY = 'pinai_theme';
  const ACCENT_KEY = 'pinai_accent';
  const DENSITY_KEY = 'pinai_density';
  const HERO3D_KEY = 'pinai_hero3d';

  // Default values
  const DEFAULTS = {
    theme: 'dark',
    accent: '#E60023',
    density: 'standard',
    hero3d: 'true'
  };

  // ─── Theme Application Engine ──────────────────────────────────
  function applyCurrentSettings() {
    const theme = localStorage.getItem(THEME_KEY) || DEFAULTS.theme;
    const accent = localStorage.getItem(ACCENT_KEY) || DEFAULTS.accent;
    const density = localStorage.getItem(DENSITY_KEY) || DEFAULTS.density;

    // Apply to <html> root
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', density);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-hover', adjustBrightness(accent, -15));
    document.documentElement.style.setProperty('--accent-glow', hexToRgba(accent, 0.35));

    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      if (theme === 'titanium') metaTheme.setAttribute('content', '#1c1c1e');
      else if (theme === 'midnight') metaTheme.setAttribute('content', '#0b0f19');
      else if (theme === 'spacegray') metaTheme.setAttribute('content', '#161618');
      else metaTheme.setAttribute('content', '#000000');
    }
  }

  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyCurrentSettings();
    showToast(`Theme updated to ${capitalize(theme)}`, 'info');
  }

  function setAccent(color) {
    localStorage.setItem(ACCENT_KEY, color);
    applyCurrentSettings();
    showToast('Accent color updated', 'info');
  }

  function setDensity(density) {
    localStorage.setItem(DENSITY_KEY, density);
    applyCurrentSettings();
    showToast(`Grid density set to ${capitalize(density)}`, 'info');
  }

  function setHero3D(enabled) {
    localStorage.setItem(HERO3D_KEY, enabled ? 'true' : 'false');
    showToast(`3D Intro ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }

  function getHero3D() {
    return localStorage.getItem(HERO3D_KEY) !== 'false';
  }

  // ─── Settings Page Controller (for settings.html) ─────────────
  function initSettingsPage() {
    const settingsRoot = document.getElementById('settingsPageRoot');
    if (!settingsRoot) return;

    const currentTheme = localStorage.getItem(THEME_KEY) || DEFAULTS.theme;
    const currentAccent = localStorage.getItem(ACCENT_KEY) || DEFAULTS.accent;
    const currentDensity = localStorage.getItem(DENSITY_KEY) || DEFAULTS.density;
    const currentHero3D = getHero3D();

    // 1. Highlight active theme card
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.theme === currentTheme);
      card.addEventListener('click', () => {
        themeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        setTheme(card.dataset.theme);
      });
    });

    // 2. Highlight active accent swatch
    const swatches = document.querySelectorAll('.accent-swatch');
    swatches.forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === currentAccent.toLowerCase());
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        setAccent(swatch.dataset.color);
      });
    });

    // 3. Highlight active density button
    const densityBtns = document.querySelectorAll('.density-btn');
    densityBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.density === currentDensity);
      btn.addEventListener('click', () => {
        densityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setDensity(btn.dataset.density);
      });
    });

    // 4. Hero 3D Toggle
    const heroSwitch = document.getElementById('hero3dSwitch');
    if (heroSwitch) {
      heroSwitch.checked = currentHero3D;
      heroSwitch.addEventListener('change', (e) => {
        setHero3D(e.target.checked);
      });
    }

    // 5. Account details population
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const userCard = document.getElementById('settingsUserCard');
    if (userCard) {
      if (user) {
        userCard.innerHTML = `
          <div class="settings-user-profile">
            <img class="settings-user-profile__avatar" src="${user.avatar}" alt="${user.name}" />
            <div class="settings-user-profile__info">
              <h3 class="settings-user-profile__name">${user.name}</h3>
              <p class="settings-user-profile__handle">@${user.username} &bull; Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <button class="apple-btn apple-btn--danger" id="settingsSignOutBtn">
              Sign Out
            </button>
          </div>
        `;
        document.getElementById('settingsSignOutBtn')?.addEventListener('click', () => {
          if (typeof Auth !== 'undefined') Auth.logout();
        });
      } else {
        userCard.innerHTML = `
          <div class="settings-user-guest">
            <div style="font-size: 2rem; margin-bottom: 8px;">👤</div>
            <h3>Not Signed In</h3>
            <p>Sign in to sync your visual collection across devices and customize your profile.</p>
            <button class="apple-btn apple-btn--primary" id="settingsSignInBtn" style="margin-top: 12px;">
              Sign In to PinAI
            </button>
          </div>
        `;
        document.getElementById('settingsSignInBtn')?.addEventListener('click', () => {
          if (typeof Auth !== 'undefined') Auth.openAuthModal('login');
        });
      }
    }

    // 6. Data management buttons
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportSavedPins);
    }

    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllSettings);
    }
  }

  function exportSavedPins() {
    const saved = JSON.parse(localStorage.getItem('pinai_saved') || '[]');
    if (saved.length === 0) {
      showToast('No saved pins to export', 'info');
      return;
    }
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinai-saved-pins-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${saved.length} pins successfully`, 'success');
  }

  function resetAllSettings() {
    if (confirm('Reset all theme, visual preferences, and saved layout density to defaults?')) {
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem(ACCENT_KEY);
      localStorage.removeItem(DENSITY_KEY);
      localStorage.removeItem(HERO3D_KEY);
      applyCurrentSettings();
      showToast('Settings reset to defaults', 'info');
      setTimeout(() => window.location.reload(), 500);
    }
  }

  // ─── Color & String Helpers ────────────────────────────────────
  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function adjustBrightness(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Apply instantly so page doesn't flicker
  applyCurrentSettings();

  document.addEventListener('DOMContentLoaded', () => {
    applyCurrentSettings();
    initSettingsPage();
  });

  return {
    setTheme,
    setAccent,
    setDensity,
    setHero3D,
    getHero3D,
    applyCurrentSettings
  };
})();

window.Settings = Settings;
