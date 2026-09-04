# 📌 Pinterest Clone

A modern full-stack Pinterest Clone featuring an Apple OS-inspired dark glassmorphism design, dynamic masonry grid layouts, real-time photo search, topic exploration, and personal pin collections powered by the Unsplash API.

---

## ✨ Features

- **Dynamic Masonry Layout**: Pinterest-style fluid responsive grid for photographs of any aspect ratio.
- **Unsplash API Integration**: Server-side proxy protecting client credentials while providing instant photo searches and curated topics.
- **Visual Search & Discovery**: Keyword auto-complete and multi-category filtering.
- **User Authentication & Personalization**: Register and sign in with password hashing, custom profile settings, and persistent preferences.
- **Saved Pins Collection**: Save favorites locally and to user profile.
- **Glassmorphic UI**: Apple OS inspired dark theme with interactive modal previews and responsive design.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- An Unsplash Developer Access Key (free at [unsplash.com/developers](https://unsplash.com/developers))

### 2. Setup Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and add your Unsplash key:
```env
UNSPLASH_KEY=your_unsplash_access_key_here
PORT=5000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Project
```bash
# Start server
npm start

# Or start in development mode with auto-reload:
npm run dev
```

Visit the application in your browser:
**`http://localhost:5000`**

---

## 🔒 Security
- Secret environment variables (`.env`) and user account databases are excluded via `.gitignore`.
- Password hashing using secure scrypt algorithms.
- Server-side rate limiting and in-memory caching to optimize API quota usage.
