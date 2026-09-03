/* ═══════════════════════════════════════════════════════════════
   PinAI — Feed Page Logic
   ═══════════════════════════════════════════════════════════════ */

(function () {
  let currentPage = 1;
  let isLoading = false;
  let hasMore = true;
  let observer = null;

  const grid = document.getElementById('feedGrid');
  const sentinel = document.getElementById('scrollSentinel');
  const loadingSection = document.getElementById('feedLoading');
  const categoriesBar = document.getElementById('categoriesBar');

  // ─── Initial Load ────────────────────────────────────────
  async function init() {
    if (!grid) return;

    // Show skeleton loading
    showSkeletons(grid, 15);

    // Load topics and photos in parallel
    const [photos, topics] = await Promise.all([
      fetchPhotos(1),
      fetchTopics()
    ]);

    // Remove skeletons
    removeSkeletons(grid);

    // Render topics
    if (topics && categoriesBar) {
      renderTopics(topics);
    }

    // Render photos
    if (photos && photos.length > 0) {
      renderPhotos(photos);
      currentPage = 2;
      setupInfiniteScroll();
    } else if (!photos) {
      showErrorBanner(grid, 'Could not load photos. Check your API key and try again.', init);
    }
  }

  // ─── Render Topics as Category Chips ─────────────────────
  function renderTopics(topics) {
    categoriesBar.innerHTML = '';

    // Add "All" chip
    const allChip = document.createElement('button');
    allChip.className = 'category-chip active';
    allChip.textContent = '✨ For You';
    categoriesBar.appendChild(allChip);

    topics.forEach(topic => {
      const chip = document.createElement('button');
      chip.className = 'category-chip';
      chip.textContent = topic.title;
      chip.addEventListener('click', () => {
        window.location.href = `search.html?q=${encodeURIComponent(topic.title)}`;
      });
      categoriesBar.appendChild(chip);
    });
  }

  // ─── Render Photos into Grid ─────────────────────────────
  function renderPhotos(photos) {
    const cards = [];
    photos.forEach(photo => {
      const card = createPinCard(photo);
      grid.appendChild(card);
      cards.push(card);
    });

    // Animate new cards
    animateCards(cards);
  }

  // ─── Infinite Scroll ─────────────────────────────────────
  function setupInfiniteScroll() {
    if (!sentinel) return;

    observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoading && hasMore) {
        await loadMore();
      }
    }, {
      rootMargin: '400px'
    });

    observer.observe(sentinel);
  }

  async function loadMore() {
    if (isLoading || !hasMore) return;
    isLoading = true;

    // Show loading spinner
    if (loadingSection) loadingSection.classList.remove('hidden');

    const photos = await fetchPhotos(currentPage);

    if (loadingSection) loadingSection.classList.add('hidden');

    if (photos && photos.length > 0) {
      renderPhotos(photos);
      currentPage++;
      isLoading = false;

      // Unsplash caps at ~500 pages for /photos
      if (photos.length < 20) {
        hasMore = false;
      }
    } else {
      hasMore = false;
      isLoading = false;
    }
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
