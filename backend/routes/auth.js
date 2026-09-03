const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// ─── In-Memory Session Store ─────────────────────────────────────
// token -> { userId, createdAt }
const sessions = new Map();

// Helper: Read users safely
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading users.json:', err);
    return [];
  }
}

// Helper: Save users safely
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users.json:', err);
  }
}

// Helper: Hash password using scrypt
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Helper: Sanitize user object (remove hash & salt)
function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio || '',
    createdAt: user.createdAt,
    preferences: user.preferences || {}
  };
}

// ─── POST /api/auth/register ────────────────────────────────────
router.post('/register', (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = readUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const displayName = name ? name.trim() : cleanUsername;

    // Generate colorful Apple-style SVG avatar as fallback
    const initials = displayName.substring(0, 2).toUpperCase();
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUsername)}&backgroundColor=e60023,0071e3,af52de,34c759&textColor=ffffff`;

    const newUser = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      name: displayName,
      avatar,
      bio: 'PinAI visual curator',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        accent: '#E60023',
        density: 'standard'
      }
    };

    users.push(newUser);
    saveUsers(users);

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: newUser.id, createdAt: Date.now() });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const users = readUsers();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const hashCheck = hashPassword(password, user.salt);
    if (hashCheck !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: user.id, createdAt: Date.now() });

    res.json({
      message: 'Signed in successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const users = readUsers();
  const user = users.find(u => u.id === session.userId);

  if (!user) {
    sessions.delete(token);
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: sanitizeUser(user) });
});

// ─── POST /api/auth/logout ──────────────────────────────────────
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    sessions.delete(token);
  }
  res.json({ message: 'Signed out successfully' });
});

// ─── PUT /api/auth/profile ──────────────────────────────────────
router.put('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Session expired' });

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === session.userId);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const { name, bio, preferences } = req.body;
  if (name) users[userIndex].name = name.trim();
  if (bio !== undefined) users[userIndex].bio = bio.trim();
  if (preferences) {
    users[userIndex].preferences = { ...users[userIndex].preferences, ...preferences };
  }

  saveUsers(users);
  res.json({ user: sanitizeUser(users[userIndex]) });
});

module.exports = router;
