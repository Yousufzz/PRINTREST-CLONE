/* ═══════════════════════════════════════════════════════════════
   PinAI — API Client
   All requests go through the Node.js backend proxy.
   The Unsplash API key NEVER touches the frontend.
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = window.location.origin + '/api';

// Request deduplication tracker
const pendingRequests = new Map();

// ─── Fetch Photos (Feed) ─────────────────────────────────────
async function fetchPhotos(page = 1, perPage = 20) {
  const key = `photos_${page}_${perPage}`;

  // Prevent duplicate requests
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/photos?page=${page}&per_page=${perPage}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('fetchPhotos error:', err);
      showToast('Failed to load photos', 'error');
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

// ─── Search Photos ───────────────────────────────────────────
async function searchPhotos(query, page = 1, perPage = 20) {
  if (!query || query.trim().length < 2) return null;

  const key = `search_${query}_${page}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `${API_BASE}/search?q=${encodeURIComponent(query.trim())}&page=${page}&per_page=${perPage}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error('searchPhotos error:', err);
      showToast('Search failed', 'error');
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

// ─── Fetch Topics ────────────────────────────────────────────
async function fetchTopics(perPage = 12) {
  try {
    const res = await fetch(`${API_BASE}/topics?per_page=${perPage}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('fetchTopics error:', err);
    return null;
  }
}

// ─── Trigger & Track Download (Unsplash Guidelines) ──────────
async function triggerDownload(photoId) {
  try {
    showToast('Preparing download...', 'info');
    const res = await fetch(`${API_BASE}/photos/${photoId}/download`);
    if (!res.ok) throw new Error('Download failed');
    const data = await res.json();
    if (data.url) {
      const a = document.createElement('a');
      a.href = data.url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('📥 Download started!', 'success');
    }
  } catch (err) {
    console.error('Download error:', err);
    showToast('Could not download image', 'error');
  }
}
