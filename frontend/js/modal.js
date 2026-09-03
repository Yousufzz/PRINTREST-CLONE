/* ═══════════════════════════════════════════════════════════════
   PinAI — Image Modal Component
   Shared across all pages
   ═══════════════════════════════════════════════════════════════ */

let modalBackdrop = null;
let currentPhoto = null;
let bodyScrollY = 0;

// ─── Initialize Modal ────────────────────────────────────────
function initModal() {
  // Create backdrop if not exists
  if (!document.querySelector('.modal-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'imageModal';
    backdrop.innerHTML = `
      <button class="modal__close" id="modalClose" title="Close">✕</button>
      <div class="modal" id="modalContent">
        <div class="modal__image-section" id="modalImageSection"></div>
        <div class="modal__info" id="modalInfo"></div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  modalBackdrop = document.getElementById('imageModal');

  // Close on backdrop click
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Close button
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });
}

// ─── Open Modal ──────────────────────────────────────────────
function openModal(photo) {
  if (!modalBackdrop) initModal();
  currentPhoto = photo;

  const imageSection = document.getElementById('modalImageSection');
  const infoSection = document.getElementById('modalInfo');

  const saved = isSaved(photo.id);

  imageSection.innerHTML = `
    <img
      class="modal__image"
      src="${photo.urls.regular}"
      alt="${photo.alt_description || photo.description || 'Photo by ' + photo.user.name}"
    />
  `;

  infoSection.innerHTML = `
    <div class="modal__author-section">
      <img class="modal__author-avatar" src="${photo.user.profile_image?.medium || photo.user.profile_image?.small || ''}" alt="${photo.user.name}" />
      <div class="modal__author-info">
        <a href="${photo.user.links.html}?utm_source=pinai&utm_medium=referral" target="_blank" rel="noopener" class="modal__author-name">${photo.user.name}</a>
        <span class="modal__author-username">@${photo.user.username}</span>
      </div>
    </div>

    ${photo.description || photo.alt_description ? `
      <p class="modal__description">${photo.description || photo.alt_description}</p>
    ` : ''}

    <div class="modal__stats">
      <div class="modal__stat">
        <span class="modal__stat-value">${formatNumber(photo.likes)}</span>
        <span class="modal__stat-label">Likes</span>
      </div>
      <div class="modal__stat">
        <span class="modal__stat-value">${photo.width} × ${photo.height}</span>
        <span class="modal__stat-label">Resolution</span>
      </div>
    </div>

    <div class="modal__actions">
      <a href="${photo.links.download}?force=true" target="_blank" rel="noopener" class="modal__btn modal__btn--primary" id="modalDownloadBtn">
        ⬇ Download
      </a>
      <button class="modal__btn modal__btn--secondary ${saved ? 'saved' : ''}" id="modalSaveBtn">
        ${saved ? '✓ Saved' : '📌 Save'}
      </button>
    </div>

    <div class="modal__unsplash-credit">
      Photo by <a href="${photo.user.links.html}?utm_source=pinai&utm_medium=referral" target="_blank" rel="noopener">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=pinai&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>
    </div>
  `;

  // Download button handler (tracks per Unsplash guidelines)
  const downloadBtn = document.getElementById('modalDownloadBtn');
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerDownload(photo.id);
  });

  // Save button handler
  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.addEventListener('click', () => {
    if (isSaved(photo.id)) {
      unsavePin(photo.id);
      saveBtn.textContent = '📌 Save';
      saveBtn.classList.remove('saved');
      // Update card save button if visible
      updateCardSaveState(photo.id, false);
    } else {
      savePin(photo);
      saveBtn.textContent = '✓ Saved';
      saveBtn.classList.add('saved');
      updateCardSaveState(photo.id, true);
    }
  });

  // Lock body scroll
  bodyScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${bodyScrollY}px`;
  document.body.style.width = '100%';

  // Show modal with animation
  modalBackdrop.classList.add('active');

  if (typeof gsap !== 'undefined') {
    gsap.fromTo('#modalContent', 
      { scale: 0.85, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
  }
}

// ─── Close Modal ─────────────────────────────────────────────
function closeModal() {
  if (!modalBackdrop) return;

  if (typeof gsap !== 'undefined') {
    gsap.to('#modalContent', {
      scale: 0.9,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        modalBackdrop.classList.remove('active');
        restoreBodyScroll();
      }
    });
  } else {
    modalBackdrop.classList.remove('active');
    restoreBodyScroll();
  }

  currentPhoto = null;
}

function restoreBodyScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, bodyScrollY);
}

// ─── Update card save button state ───────────────────────────
function updateCardSaveState(photoId, saved) {
  const card = document.querySelector(`.pin-card[data-photo-id="${photoId}"]`);
  if (!card) return;
  const btn = card.querySelector('[data-action="save"]');
  if (!btn) return;
  btn.textContent = saved ? 'Saved' : 'Save';
  btn.classList.toggle('saved', saved);
}

// ─── Initialize on DOM ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', initModal);
