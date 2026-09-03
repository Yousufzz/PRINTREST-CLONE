/* ═══════════════════════════════════════════════════════════════
   PinAI — Shared Utilities
   ═══════════════════════════════════════════════════════════════ */

// ─── Debounce ────────────────────────────────────────────────
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ─── Format Numbers ──────────────────────────────────────────
function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// ─── LocalStorage Save/Unsave ────────────────────────────────
const STORAGE_KEY = 'pinai_saved';

function getSavedPins() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePin(photo) {
  const saved = getSavedPins();
  if (!saved.find(p => p.id === photo.id)) {
    saved.unshift(photo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    showToast('📌 Pin saved!', 'success');
    return true;
  }
  return false;
}

function unsavePin(photoId) {
  const saved = getSavedPins().filter(p => p.id !== photoId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  showToast('🗑️ Pin removed', 'info');
}

function isSaved(photoId) {
  return getSavedPins().some(p => p.id === photoId);
}

function clearAllSaved() {
  localStorage.removeItem(STORAGE_KEY);
  showToast('🧹 All pins cleared', 'info');
}

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Create Pin Card HTML ────────────────────────────────────
function createPinCard(photo) {
  const card = document.createElement('div');
  card.className = 'pin-card';
  card.dataset.photoId = photo.id;

  const aspectRatio = (photo.height / photo.width) * 100;
  const saved = isSaved(photo.id);

  card.innerHTML = `
    <div class="pin-card__image-wrapper" style="padding-bottom: ${aspectRatio}%; position: relative;">
      <img
        class="pin-card__image"
        src="${photo.urls.small}"
        alt="${photo.alt_description || photo.description || 'Photo by ' + photo.user.name}"
        loading="lazy"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
      />
      <div class="pin-card__overlay">
        <div class="pin-card__actions-top">
          <button class="pin-card__save-btn ${saved ? 'saved' : ''}" data-action="save" title="${saved ? 'Unsave' : 'Save'}">
            ${saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <div class="pin-card__actions-bottom">
          <div class="pin-card__author">
            <img class="pin-card__avatar" src="${photo.user.profile_image?.medium || photo.user.profile_image?.small || ''}" alt="${photo.user.name}" />
            <span class="pin-card__name">${photo.user.name}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="${photo.links.download}?force=true" target="_blank" rel="noopener" class="pin-card__icon-btn" data-action="download" title="Download" onclick="event.stopPropagation();">
              ⬇
            </a>
            <a href="${photo.links.html}" target="_blank" rel="noopener" class="pin-card__icon-btn" data-action="external" title="View on Unsplash" onclick="event.stopPropagation();">
              ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Save button click
  const saveBtn = card.querySelector('[data-action="save"]');
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isSaved(photo.id)) {
      unsavePin(photo.id);
      saveBtn.textContent = 'Save';
      saveBtn.classList.remove('saved');
    } else {
      savePin(photo);
      saveBtn.textContent = 'Saved';
      saveBtn.classList.add('saved');
    }
  });

  // Download button click (tracks per Unsplash guidelines)
  const downloadBtn = card.querySelector('[data-action="download"]');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof triggerDownload === 'function') {
        triggerDownload(photo.id);
      }
    });
  }

  // Card click → open modal
  card.addEventListener('click', () => {
    if (typeof openModal === 'function') {
      openModal(photo);
    }
  });

  return card;
}

// ─── Create Skeleton Card ────────────────────────────────────
function createSkeletonCard() {
  const heights = [200, 250, 300, 350, 280, 320, 220, 260];
  const height = heights[Math.floor(Math.random() * heights.length)];

  const card = document.createElement('div');
  card.className = 'skeleton-card';
  card.innerHTML = `
    <div class="skeleton-image" style="height: ${height}px;"></div>
    <div class="skeleton-info">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
  return card;
}

// ─── Show Skeletons ──────────────────────────────────────────
function showSkeletons(container, count = 12) {
  for (let i = 0; i < count; i++) {
    container.appendChild(createSkeletonCard());
  }
}

// ─── Remove Skeletons ────────────────────────────────────────
function removeSkeletons(container) {
  container.querySelectorAll('.skeleton-card').forEach(s => s.remove());
}

// ─── Scroll Progress Bar ─────────────────────────────────────
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
}

// ─── Navbar Scroll Effect ────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── GSAP Stagger Animation ─────────────────────────────────
function animateCards(cards) {
  if (typeof gsap !== 'undefined') {
    gsap.from(cards, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: 'power3.out'
    });
  }
}

// ─── Error Banner ────────────────────────────────────────────
function showErrorBanner(container, message, retryFn) {
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.innerHTML = `
    <div class="error-banner__title">⚠️ Something went wrong</div>
    <div class="error-banner__text">${message}</div>
    ${retryFn ? '<button class="error-banner__retry">Try Again</button>' : ''}
  `;

  if (retryFn) {
    banner.querySelector('.error-banner__retry').addEventListener('click', () => {
      banner.remove();
      retryFn();
    });
  }

  container.appendChild(banner);
}

// ─── Init Common Features ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initNavbarScroll();
});
