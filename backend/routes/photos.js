const router = require('express').Router();
const axios = require('axios');

// GET /api/photos?page=1&per_page=20&order_by=latest
router.get('/', async (req, res) => {
  const { page = 1, per_page = 20, order_by = 'latest' } = req.query;
  const cacheKey = `photos_${page}_${per_page}_${order_by}`;

  // Check cache first
  const cached = req.app.locals.getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.unsplash.com/photos', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
        'Accept-Version': 'v1'
      },
      params: {
        page: parseInt(page),
        per_page: Math.min(parseInt(per_page), 30),
        order_by
      }
    });

    // Strip unnecessary fields to reduce payload
    const photos = response.data.map(photo => ({
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

    // Cache the response
    req.app.locals.setCache(cacheKey, photos);

    // Forward rate limit headers
    res.set({
      'X-Ratelimit-Limit': response.headers['x-ratelimit-limit'],
      'X-Ratelimit-Remaining': response.headers['x-ratelimit-remaining']
    });

    res.json(photos);
  } catch (err) {
    console.error('Photos API Error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: 'Failed to fetch photos',
      message: err.response?.data?.errors?.[0] || err.message
    });
  }
});

// GET /api/photos/:id/download — Track download per Unsplash guidelines
router.get('/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`https://api.unsplash.com/photos/${id}/download`, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
        'Accept-Version': 'v1'
      }
    });

    res.json({ url: response.data.url });
  } catch (err) {
    console.error('Download tracking error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to track download' });
  }
});

module.exports = router;
