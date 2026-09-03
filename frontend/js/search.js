/* ═══════════════════════════════════════════════════════════════
   PinAI — Search Page Logic
   ═══════════════════════════════════════════════════════════════ */

(function () {
  let currentQuery = '';
  let currentPage = 1;
  let totalPages = 0;
  let isLoading = false;
  let observer = null;

  const searchInput = document.getElementById('searchInput');
  const grid = document.getElementById('searchGrid');
  const sentinel = document.getElementById('scrollSentinel');
  const loadingSection = document.getElementById('searchLoading');
  const resultsHeader = document.getElementById('resultsHeader');
  const emptyState = document.getElementById('emptyState');

  // ─── Initialize ──────────────────────────────────────────
  function init() {
    if (!searchInput || !grid) return;

    // Check for URL query param
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      searchInput.value = q;
      performSearch(q);
    }

    // Debounced live search
    const debouncedSearch = debounce((value) => {
      if (value.trim().length >= 2) {
        performSearch(value.trim());
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('q', value.trim());
        window.history.replaceState({}, '', url);
      } else if (value.trim().length === 0) {
        clearResults();
      }
    }, 400);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    // Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim().length >= 2) {
        performSearch(searchInput.value.trim());
      }
    });

    // Trending chip clicks
    document.querySelectorAll('.trending-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query || chip.textContent;
        searchInput.value = query;
        performSearch(query);
        // Scroll to results
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Focus search input
    searchInput.focus();
  }

  // ─── Perform Search ──────────────────────────────────────
  async function performSearch(query) {
    if (query === currentQuery && currentPage > 1) return;

    currentQuery = query;
    currentPage = 1;
    totalPages = 0;

    // Clear previous results
    clearResults();

    // Show skeleton
    showSkeletons(grid, 12);
    if (emptyState) emptyState.classList.add('hidden');

    const data = await searchPhotos(query, 1);

    // Remove skeletons
    removeSkeletons(grid);

    if (data && data.results && data.results.length > 0) {
      totalPages = data.total_pages;

      // Show results header
      if (resultsHeader) {
        resultsHeader.classList.remove('hidden');
        resultsHeader.innerHTML = `Showing results for <strong>"${escapeHtml(query)}"</strong> — ${formatNumber(data.total)} photos found`;
      }

      renderResults(data.results);
      currentPage = 2;

      // Setup infinite scroll for more results
      setupInfiniteScroll();
    } else if (data && data.results && data.results.length === 0) {
      showEmptyState(query);
    } else {
      showErrorBanner(grid, 'Search failed. Please try again.', () => performSearch(query));
    }
  }

  // ─── Render Results ──────────────────────────────────────
  function renderResults(photos) {
    const cards = [];
    photos.forEach(photo => {
      const card = createPinCard(photo);
      grid.appendChild(card);
      cards.push(card);
    });
    animateCards(cards);
  }

  // ─── Clear Results ───────────────────────────────────────
  function clearResults() {
    grid.innerHTML = '';
    if (resultsHeader) resultsHeader.classList.add('hidden');
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // ─── Empty State ─────────────────────────────────────────
  function showEmptyState(query) {
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const text = emptyState.querySelector('.empty-state__text');
      if (text) {
        text.textContent = `We couldn't find any photos for "${query}". Try a different search term.`;
      }
    }
  }

  // ─── Infinite Scroll ─────────────────────────────────────
  function setupInfiniteScroll() {
    if (!sentinel || observer) return;

    observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !isLoading && currentPage <= totalPages) {
        await loadMore();
      }
    }, { rootMargin: '400px' });

    observer.observe(sentinel);
  }

  async function loadMore() {
    if (isLoading || currentPage > totalPages) return;
    isLoading = true;

    if (loadingSection) loadingSection.classList.remove('hidden');

    const data = await searchPhotos(currentQuery, currentPage);

    if (loadingSection) loadingSection.classList.add('hidden');

    if (data && data.results && data.results.length > 0) {
      renderResults(data.results);
      currentPage++;
    }

    isLoading = false;
  }

  // ─── Escape HTML ─────────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Navbar Search Sync ──────────────────────────────────
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch) {
    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && navSearch.value.trim().length >= 2) {
        searchInput.value = navSearch.value.trim();
        performSearch(navSearch.value.trim());
        searchInput.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ─── Start ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
