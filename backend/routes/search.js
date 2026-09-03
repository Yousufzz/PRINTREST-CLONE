const router = require('express').Router();
const axios = require('axios');

// GET /api/search?q=keyword&page=1&per_page=20
router.get('/', async (req, res) => {
  const { q, page = 1, per_page = 20 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Missing search query parameter "q"' });
  }

  const query = q.trim();
  const cacheKey = `search_${query}_${page}_${per_page}`;

  // Check cache first
  const cached = req.app.locals.getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
        'Accept-Version': 'v1'
      },
      params: {
        query,
        page: parseInt(page),
        per_page: Math.min(parseInt(per_page), 30)
      }
    });

    // Map results to consistent format
    const results = response.data.results.map(photo => ({
      id: photo.id,
      width: photo.width,
      height: photo.height,
      color: photo.color,
      blur_hash: photo.blur_hash,
      description: photo.description,
      alt_description: photo.alt_description,
      urls: {
        raw: photo.urls.raw,
        full: photo.urls.full,
        regular: photo.urls.regular,
        small: photo.urls.small,
        thumb: photo.urls.thumb
      },
      links: {
        html: photo.links.html,
        download: photo.links.download,
        download_location: photo.links.download_location
      },
      user: {
        id: photo.user.id,
        name: photo.user.name,
        username: photo.user.username,
        profile_image: photo.user.profile_image,
        links: {
          html: photo.user.links.html
        }
      },
      likes: photo.likes,
      created_at: photo.created_at
    }));

    const payload = {
      results,
      total: response.data.total,
      total_pages: response.data.total_pages
    };

    // Cache the response
    req.app.locals.setCache(cacheKey, payload);

    // Forward rate limit headers
    res.set({
      'X-Ratelimit-Limit': response.headers['x-ratelimit-limit'],
      'X-Ratelimit-Remaining': response.headers['x-ratelimit-remaining']
    });

    res.json(payload);
  } catch (err) {
    console.error('Search API Error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: 'Failed to search photos',
      message: err.response?.data?.errors?.[0] || err.message
    });
  }
});

module.exports = router;
