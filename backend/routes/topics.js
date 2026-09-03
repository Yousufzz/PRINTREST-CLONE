const router = require('express').Router();
const axios = require('axios');

// GET /api/topics?per_page=12
router.get('/', async (req, res) => {
  const { per_page = 12 } = req.query;
  const cacheKey = `topics_${per_page}`;

  // Check cache first
  const cached = req.app.locals.getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.unsplash.com/topics', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
        'Accept-Version': 'v1'
      },
      params: {
        per_page: Math.min(parseInt(per_page), 30),
        order_by: 'featured'
      }
    });

    const topics = response.data.map(topic => ({
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      total_photos: topic.total_photos,
      cover_photo: topic.cover_photo ? {
        urls: {
          small: topic.cover_photo.urls.small,
          thumb: topic.cover_photo.urls.thumb
        }
      } : null
    }));

    // Cache the response
    req.app.locals.setCache(cacheKey, topics);

    res.json(topics);
  } catch (err) {
    console.error('Topics API Error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: 'Failed to fetch topics',
      message: err.response?.data?.errors?.[0] || err.message
    });
  }
});

module.exports = router;
