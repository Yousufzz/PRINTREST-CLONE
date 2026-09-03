/* ═══════════════════════════════════════════════════════════════
   PinAI — Saved Pins Page Logic
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const grid = document.getElementById('savedGrid');
  const emptyState = document.getElementById('emptyState');
  const clearBtn = document.getElementById('clearAllBtn');
  const countEl = document.getElementById('savedCount');

  function init() {
    if (!grid) return;
    renderSavedPins();
    setupClearButton();
  }

  // ─── Render Saved Pins ───────────────────────────────────
  function renderSavedPins() {
    const saved = getSavedPins();
    grid.innerHTML = '';

    if (saved.length === 0) {
      showEmpty();
      return;
    }

    hideEmpty();
    updateCount(saved.length);

    const cards = [];
    saved.forEach(photo => {
      const card = createSavedPinCard(photo);
      grid.appendChild(card);
      cards.push(card);
    });

    animateCards(cards);
  }

  // ─── Create Saved Pin Card (with Remove) ─────────────────
  function createSavedPinCard(photo) {
    const card = document.createElement('div');
    card.className = 'pin-card';
    card.dataset.photoId = photo.id;

    const aspectRatio = (photo.height / photo.width) * 100;

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
            <button class="pin-card__save-btn saved" data-action="remove" title="Remove">
              ✕ Remove
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
              <a href="${photo.links.html}" target="_blank" rel="noopener" class="pin-card__icon-btn" title="View on Unsplash" onclick="event.stopPropagation();">
                ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

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

    // Remove button
    const removeBtn = card.querySelector('[data-action="remove"]');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      unsavePin(photo.id);

      // Animate removal
      if (typeof gsap !== 'undefined') {
        gsap.to(card, {
          scale: 0.8,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            card.remove();
            const remaining = getSavedPins();
            updateCount(remaining.length);
            if (remaining.length === 0) showEmpty();
          }
        });
      } else {
        card.remove();
        const remaining = getSavedPins();
        updateCount(remaining.length);
        if (remaining.length === 0) showEmpty();
      }
    });

    // Card click → open modal
    card.addEventListener('click', () => {
      if (typeof openModal === 'function') {
        openModal(photo);
      }
    });

    return card;
  }

  // ─── Clear All ───────────────────────────────────────────
  function setupClearButton() {
    if (!clearBtn) return;
    clearBtn.addEventListener('click', () => {
      const saved = getSavedPins();
      if (saved.length === 0) return;

      if (confirm(`Remove all ${saved.length} saved pins?`)) {
        clearAllSaved();

        if (typeof gsap !== 'undefined') {
          gsap.to('.pin-card', {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            stagger: 0.03,
            ease: 'power2.in',
            onComplete: () => {
              grid.innerHTML = '';
              showEmpty();
              updateCount(0);
            }
          });
        } else {
          grid.innerHTML = '';
          showEmpty();
          updateCount(0);
        }
      }
    });
  }

  // ─── Empty State ─────────────────────────────────────────
  function showEmpty() {
    if (emptyState) emptyState.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
  }

  function hideEmpty() {
    if (emptyState) emptyState.classList.add('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');
  }

  function updateCount(count) {
    if (countEl) countEl.textContent = count;
  }

  // ─── Navbar Search Redirect ──────────────────────────────
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && navSearch.value.trim().length >= 2) {
        window.location.href = `search.html?q=${encodeURIComponent(navSearch.value.trim())}`;
      }
    });
  }

  // ─── Start ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
