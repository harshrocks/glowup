import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

// Dual-fallback handling for ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_glowup_key_10';

// Use the user's provided Neon database URL as fallback
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_@ep-patient-water-apeiqeuu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

app.use(express.json());

// Rewrite Netlify Functions routing prefix to match local router paths
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

// Initialize PostgreSQL Connection Pool with SSL requirements for Cloud/Neon
let pool: pg.Pool | null = null;
let useDatabaseFallback = false;

// If we fail to connect to DB, fallback to an in-memory database
// so the application never crashes in production or sandbox.
const memoryDatabase: {
  users: any[];
  logs: any[];
  activities: any[];
} = {
  users: [
    { id: 101, username: 'alex_glow', display_name: 'Alex Rivers', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex', streak: 14, best_streak: 21, status_message: 'Deep into writing an essay today! ✍️', is_bot: true },
    { id: 102, username: 'sarah_m', display_name: 'Sarah Miller', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Sarah', streak: 9, best_streak: 9, status_message: 'Hit 10/10 today! Bedtime boundary next 😴', is_bot: true },
    { id: 103, username: 'james_k', display_name: 'James Knight', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=James', streak: 3, best_streak: 5, status_message: 'Struggling to stay off my phone 📱', is_bot: true },
    { id: 104, username: 'emily_growth', display_name: 'Emily Chen', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Emily', streak: 11, best_streak: 12, status_message: 'Cardio session completed! BDNF is flowing 🏃‍♀️', is_bot: true }
  ],
  logs: [],
  activities: [
    { id: 1, user_id: 102, username: 'sarah_m', display_name: 'Sarah Miller', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Sarah', task_name: 'Reading', points: 2, type: 'log', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    { id: 2, user_id: 101, username: 'alex_glow', display_name: 'Alex Rivers', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex', task_name: 'Essays & Journaling', points: 2, type: 'log', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: 3, user_id: 104, username: 'emily_growth', display_name: 'Emily Chen', avatar_url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Emily', task_name: 'Physical Activity', points: 1, type: 'log', timestamp: new Date(Date.now() - 120 * 60000).toISOString() }
  ]
};

const isInvalidFallback = !DATABASE_URL || DATABASE_URL.includes('npg_@') || DATABASE_URL.includes('MY_DATABASE_URL');

if (isInvalidFallback) {
  console.warn('⚠️ No valid DATABASE_URL configured. Falling back to in-memory persistence layer immediately.');
  useDatabaseFallback = true;
} else {
  try {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 5000,
    });

    // Test pool connection
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.warn('⚠️ PostgreSQL database connection failed. Falling back to in-memory persistence layer:', err.message);
        useDatabaseFallback = true;
      } else {
        console.log('✅ Successfully connected to Neon PostgreSQL Database!');
        bootstrapDatabase();
      }
    });
  } catch (error: any) {
    console.warn('⚠️ Database driver error. Falling back to memory storage:', error.message);
    useDatabaseFallback = true;
  }
}

// Bootstrap PostgreSQL DB tables
async function bootstrapDatabase() {
  if (!pool || useDatabaseFallback) return;

  try {
    const client = await pool.connect();
    try {
      // 1. Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/open-peeps/svg?seed=You',
          streak INT DEFAULT 0,
          best_streak INT DEFAULT 0,
          status_message VARCHAR(255) DEFAULT 'Ready to glow up!',
          is_bot BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // 2. Daily Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_logs (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          date VARCHAR(10) NOT NULL,
          completed_task_ids TEXT[] DEFAULT '{}',
          writing_words_count INT DEFAULT 0,
          writing_text TEXT DEFAULT '',
          points_earned INT DEFAULT 0,
          UNIQUE(user_id, date)
        )
      `);

      // 3. Activity Feed Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          username VARCHAR(100) NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          avatar_url TEXT,
          task_name VARCHAR(255),
          points INT DEFAULT 0,
          type VARCHAR(50) NOT NULL, -- 'log' | 'nudge' | 'streak'
          message VARCHAR(255),
          timestamp TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // 4. Seed Standard Peer Bots for Leaderboard if they do not exist (wrapped to isolate errors)
      try {
        const bots = memoryDatabase.users;
        for (const bot of bots) {
          const checkRes = await client.query('SELECT id FROM users WHERE username = $1', [bot.username]);
          if (checkRes.rowCount === 0) {
            await client.query(
              `INSERT INTO users (username, display_name, email, password_hash, avatar_url, streak, best_streak, status_message, is_bot)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
               ON CONFLICT (username) DO NOTHING`,
              [bot.username, bot.display_name, `${bot.username}@glowup10.com`, 'bot_secret_hashed', bot.avatar_url, bot.streak, bot.best_streak, bot.status_message]
            );
          }
        }
      } catch (botErr: any) {
        console.warn('Note: Skiping bot seeding checks due to concurrent insertion:', botErr.message);
      }

      // 5. Seed initial activity logs for bots if empty (wrapped to isolate errors)
      try {
        const actCount = await client.query('SELECT COUNT(*) FROM activities');
        if (parseInt(actCount.rows[0].count) === 0) {
          for (const item of memoryDatabase.activities) {
            // Find bot ID
            const botIdRes = await client.query('SELECT id FROM users WHERE username = $1', [item.username]);
            if (botIdRes.rowCount > 0) {
              const bId = botIdRes.rows[0].id;
              await client.query(
                `INSERT INTO activities (user_id, username, display_name, avatar_url, task_name, points, type, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '30 minutes')`,
                [bId, item.username, item.display_name, item.avatar_url, item.task_name, item.points, item.type]
              );
            }
          }
        }
      } catch (actErr: any) {
        console.warn('Note: Skipping activity log seeding due to concurrent insertion:', actErr.message);
      }

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn('⚠️ Error bootstrapping PostgreSQL tables:', error.message);
    useDatabaseFallback = true;
  }
}

// Authentication Middleware to secure routes
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication token is required.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token.' });
    req.user = user;
    next();
  });
}

// ----------------------------------------------------
// AUTHENTICATION API ROUTES
// ----------------------------------------------------

// Handle Registration
app.post('/api/auth/register', async (req, res) => {
  const { username, displayName, email, password } = req.body;

  if (!username || !displayName || !email || !password) {
    return res.status(400).json({ error: 'All registration parameters are required.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const randAvatar = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${cleanUsername}`;

    if (useDatabaseFallback || !pool) {
      // Memory Store logic
      if (memoryDatabase.users.some(u => u.username === cleanUsername || u.email === cleanEmail)) {
        return res.status(400).json({ error: 'Username or Email is already registered.' });
      }

      const newUser = {
        id: Date.now(),
        username: cleanUsername,
        display_name: displayName.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        avatar_url: randAvatar,
        streak: 0,
        best_streak: 0,
        status_message: 'Ready to glow up!',
        is_bot: false
      };

      memoryDatabase.users.push(newUser);
      
      const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
      return res.json({
        token,
        user: {
          username: newUser.username,
          displayName: newUser.display_name,
          avatarUrl: newUser.avatar_url,
          streak: newUser.streak,
          bestStreak: newUser.best_streak,
          statusMessage: newUser.status_message,
          isCurrentUser: true
        }
      });
    } else {
      // PostgreSQL database logic
      const checkDup = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [cleanUsername, cleanEmail]);
      if (checkDup.rowCount && checkDup.rowCount > 0) {
        return res.status(400).json({ error: 'Username or Email is already registered in GlowUp database.' });
      }

      const result = await pool.query(
        `INSERT INTO users (username, display_name, email, password_hash, avatar_url, streak, best_streak)
         VALUES ($1, $2, $3, $4, $5, 0, 0)
         RETURNING id, username, display_name, avatar_url, streak, best_streak, status_message`,
        [cleanUsername, displayName.trim(), cleanEmail, passwordHash, randAvatar]
      );

      const dbUser = result.rows[0];
      const token = jwt.sign({ id: dbUser.id, username: dbUser.username }, JWT_SECRET);

      return res.json({
        token,
        user: {
          username: dbUser.username,
          displayName: dbUser.display_name,
          avatarUrl: dbUser.avatar_url,
          streak: dbUser.streak,
          bestStreak: dbUser.best_streak,
          statusMessage: dbUser.status_message,
          isCurrentUser: true
        }
      });
    }
  } catch (err: any) {
    console.error('Registration processing failure:', err);
    res.status(500).json({ error: 'Failed to process registration securely.' });
  }
});

// Handle Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body; // username or email

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required.' });
  }

  const cleanId = identifier.trim().toLowerCase();

  try {
    if (useDatabaseFallback || !pool) {
      const user = memoryDatabase.users.find(u => u.username === cleanId || u.email === cleanId);
      if (!user || user.is_bot) {
        return res.status(401).json({ error: 'Invalid identification credentials.' });
      }

      const validWord = await bcrypt.compare(password, user.password_hash);
      if (!validWord) return res.status(401).json({ error: 'Invalid authentication credentials.' });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      return res.json({
        token,
        user: {
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          streak: user.streak,
          bestStreak: user.best_streak,
          statusMessage: user.status_message,
          isCurrentUser: true
        }
      });
    } else {
      // PostgreSQL authentication lookup
      const result = await pool.query(
        `SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_bot = FALSE`,
        [cleanId]
      );

      if (result.rowCount === 0) {
        return res.status(401).json({ error: 'Profile not found. Please sign up.' });
      }

      const dbUser = result.rows[0];
      const valid = await bcrypt.compare(password, dbUser.password_hash);
      if (!valid) return res.status(401).json({ error: 'Incorrect credentials.' });

      const token = jwt.sign({ id: dbUser.id, username: dbUser.username }, JWT_SECRET);
      return res.json({
        token,
        user: {
          username: dbUser.username,
          displayName: dbUser.display_name,
          avatarUrl: dbUser.avatar_url,
          streak: dbUser.streak,
          bestStreak: dbUser.best_streak,
          statusMessage: dbUser.status_message,
          isCurrentUser: true
        }
      });
    }
  } catch (err: any) {
    console.error('Login authorization error:', err);
    res.status(500).json({ error: 'Security validation failure.' });
  }
});

// Fetch Current Profile verification session
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    if (useDatabaseFallback || !pool) {
      const user = memoryDatabase.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'Session user expired.' });

      return res.json({
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        streak: user.streak,
        bestStreak: user.best_streak,
        statusMessage: user.status_message,
        isCurrentUser: true
      });
    } else {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'User does not exist.' });

      const dbUser = result.rows[0];
      return res.json({
        username: dbUser.username,
        displayName: dbUser.display_name,
        avatarUrl: dbUser.avatar_url,
        streak: dbUser.streak,
        bestStreak: dbUser.best_streak,
        statusMessage: dbUser.status_message,
        isCurrentUser: true
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Token validation failure.' });
  }
});


// ----------------------------------------------------
// TRANSACTIONAL DAILY LOGS & ANALYTICS API ROUTES
// ----------------------------------------------------

// Fetch all logged days for current authenticated user
app.get('/api/user/logs', authenticateToken, async (req: any, res) => {
  try {
    if (useDatabaseFallback || !pool) {
      const userLogs = memoryDatabase.logs.filter(l => l.user_id === req.user.id);
      return res.json(userLogs.map(l => ({
        date: l.date,
        completedTaskIds: l.completed_task_ids,
        writingWordsCount: l.writing_words_count,
        writingText: l.writing_text,
        pointsEarned: l.points_earned
      })));
    } else {
      const result = await pool.query(
        'SELECT date, completed_task_ids as "completedTaskIds", writing_words_count as "writingWordsCount", writing_text as "writingText", points_earned as "pointsEarned" FROM daily_logs WHERE user_id = $1',
        [req.user.id]
      );
      return res.json(result.rows);
    }
  } catch (err: any) {
    console.error('Failed to query user history logs:', err.message);
    res.status(500).json({ error: 'Error pulling activity logs.' });
  }
});

// Post/Submit or Update a Daily Log
app.post('/api/user/log', authenticateToken, async (req: any, res) => {
  const { date, completedTaskIds, writingWordsCount, writingText, pointsEarned, streak, bestStreak, taskToggledName } = req.body;

  if (!date) return res.status(400).json({ error: 'Parameter date is required.' });

  try {
    // 1. Save / Update Daily Log
    if (useDatabaseFallback || !pool) {
      // Find dynamic memory logs
      const idx = memoryDatabase.logs.findIndex(l => l.user_id === req.user.id && l.date === date);
      const logData = {
        id: idx >= 0 ? memoryDatabase.logs[idx].id : Date.now(),
        user_id: req.user.id,
        date,
        completed_task_ids: completedTaskIds || [],
        writing_words_count: writingWordsCount || 0,
        writing_text: writingText || '',
        points_earned: pointsEarned || 0
      };

      if (idx >= 0) {
        memoryDatabase.logs[idx] = logData;
      } else {
        memoryDatabase.logs.push(logData);
      }

      // Update basic streak states on User profile
      const userIdx = memoryDatabase.users.findIndex(u => u.id === req.user.id);
      if (userIdx >= 0) {
        if (streak !== undefined) memoryDatabase.users[userIdx].streak = streak;
        if (bestStreak !== undefined) memoryDatabase.users[userIdx].best_streak = bestStreak;
      }

      // Create activity feed if actual task toggler triggered
      if (taskToggledName && req.user) {
        const u = memoryDatabase.users.find(u => u.id === req.user.id);
        const newAct = {
          id: Date.now(),
          user_id: req.user.id,
          username: req.user.username,
          display_name: u?.display_name || req.user.username,
          avatar_url: u?.avatar_url,
          task_name: taskToggledName,
          points: pointsEarned,
          type: 'log',
          timestamp: new Date().toISOString()
        };
        memoryDatabase.activities.unshift(newAct);
      }
    } else {
      // PostgreSQL database flow
      await pool.query(
        `INSERT INTO daily_logs (user_id, date, completed_task_ids, writing_words_count, writing_text, points_earned)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, date)
         DO UPDATE SET 
           completed_task_ids = EXCLUDED.completed_task_ids,
           writing_words_count = EXCLUDED.writing_words_count,
           writing_text = EXCLUDED.writing_text,
           points_earned = EXCLUDED.points_earned`,
        [req.user.id, date, completedTaskIds || [], writingWordsCount || 0, writingText || '', pointsEarned || 0]
      );

      // Update User profile streaks
      if (streak !== undefined && bestStreak !== undefined) {
        await pool.query(
          `UPDATE users SET streak = $1, best_streak = $2 WHERE id = $3`,
          [streak, bestStreak, req.user.id]
        );
      }

      // Record completed task toggle into live Activity Feed
      if (taskToggledName) {
        const userRes = await pool.query('SELECT display_name, avatar_url FROM users WHERE id = $1', [req.user.id]);
        if (userRes.rowCount > 0) {
          const profile = userRes.rows[0];
          await pool.query(
            `INSERT INTO activities (user_id, username, display_name, avatar_url, task_name, points, type)
             VALUES ($1, $2, $3, $4, $5, $6, 'log')`,
            [req.user.id, req.user.username, profile.display_name, profile.avatar_url, taskToggledName, pointsEarned]
          );
        }
      }
    }

    return res.json({ success: true, date, pointsEarned });
  } catch (err: any) {
    console.error('Error logging daily metrics:', err.message);
    res.status(500).json({ error: 'Failed logging progress details.' });
  }
});


// ----------------------------------------------------
// SOCIAL HUBS, LEADBOARD, & LIVE ACTIVITIES
// ----------------------------------------------------

// Fetch Active Leaderboard (combined real and bots scores dynamically on date parameter)
app.get('/api/leaderboard', async (req, res) => {
  const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];

  try {
    if (useDatabaseFallback || !pool) {
      // Memory Store Dynamic computation
      const combinedUsers = memoryDatabase.users.map((user) => {
        // Find if this user has points logged for this specific queried date
        let points = 0;
        if (user.is_bot) {
          // Bots have standard static simulator/fallback targets
          if (user.username === 'sarah_m') points = 10;
          else if (user.username === 'alex_glow') points = 8;
          else if (user.username === 'emily_growth') points = 6;
          else if (user.username === 'james_k') points = 2;
        } else {
          const myLog = memoryDatabase.logs.find(l => l.user_id === user.id && l.date === dateParam);
          if (myLog) points = myLog.points_earned;
        }

        return {
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          streak: user.streak,
          bestStreak: user.best_streak,
          isCurrentUser: false, // will label explicitly in UI based on authenticated state
          todayPoints: points,
          statusMessage: user.status_message
        };
      });

      return res.json(combinedUsers);
    } else {
      // PostgreSQL database dynamic query
      // Retrieve all users
      const usersRes = await pool.query(`
        SELECT id, username, display_name as "displayName", avatar_url as "avatarUrl", streak, best_streak as "bestStreak", status_message as "statusMessage", is_bot
        FROM users
      `);

      // Retrieve points for all users on this matching date
      const logsRes = await pool.query(`
        SELECT user_id, points_earned FROM daily_logs WHERE date = $1
      `, [dateParam]);

      const pointsMap = new Map();
      logsRes.rows.forEach(r => pointsMap.set(r.user_id, r.points_earned));

      const leaderboard = usersRes.rows.map(user => {
        let pts = 0;
        if (user.is_bot) {
          // Standard bot offsets
          if (user.username === 'sarah_m') pts = 10;
          else if (user.username === 'alex_glow') pts = 8;
          else if (user.username === 'emily_growth') pts = 6;
          else if (user.username === 'james_k') pts = 2;
        } else {
          pts = pointsMap.get(user.id) || 0;
        }

        return {
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          streak: user.streak,
          bestStreak: user.bestStreak,
          isCurrentUser: false,
          todayPoints: pts,
          statusMessage: user.statusMessage
        };
      });

      return res.json(leaderboard);
    }
  } catch (err: any) {
    console.error('Leaderboard calculation failed:', err.message);
    res.status(500).json({ error: 'Server leaderboard failure.' });
  }
});

// Fetch Live Activities
app.get('/api/activities', async (req, res) => {
  try {
    if (useDatabaseFallback || !pool) {
      // Map memory structure back cleanly to Frontend expectations
      const frontendActs = memoryDatabase.activities.map((item, idx) => {
        // Calculate dynamic timing label representation
        return {
          id: item.id.toString(),
          username: item.username,
          displayName: item.display_name,
          avatarUrl: item.avatar_url,
          taskName: item.task_name,
          points: item.points,
          timestamp: 'Live now',
          type: item.type,
          message: item.message
        };
      });
      return res.json(frontendActs.slice(0, 16));
    } else {
      const result = await pool.query(`
        SELECT id::text, username, display_name as "displayName", avatar_url as "avatarUrl", task_name as "taskName", points, type, message, timestamp
        FROM activities
        ORDER BY id DESC
        LIMIT 20
      `);

      // Render nice friendly standard format for recent database activities
      const mapped = result.rows.map(row => {
        const mins = Math.floor((Date.now() - new Date(row.timestamp).getTime()) / 60000);
        let timeLabel = 'Now';
        if (mins > 0 && mins < 60) timeLabel = `${mins}m ago`;
        else if (mins >= 60 && mins < 1440) timeLabel = `${Math.floor(mins / 60)}h ago`;
        else if (mins >= 1440) timeLabel = `${Math.floor(mins / 1440)}d ago`;

        return {
          ...row,
          timestamp: timeLabel
        };
      });

      return res.json(mapped);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Pulling live feeds error.' });
  }
});

// Nudge friend or send messages
app.post('/api/activities/nudge', authenticateToken, async (req: any, res) => {
  const { friendUsername, nudgeMessage } = req.body;

  if (!friendUsername || !nudgeMessage) {
    return res.status(400).json({ error: 'Nudge receiver and message are required.' });
  }

  try {
    if (useDatabaseFallback || !pool) {
      const user = memoryDatabase.users.find(u => u.id === req.user.id);
      const newAct = {
        id: Date.now(),
        user_id: req.user.id,
        username: req.user.username,
        display_name: user?.display_name || req.user.username,
        avatar_url: user?.avatar_url,
        task_name: 'Nudged peer',
        points: 0,
        type: 'nudge',
        message: nudgeMessage,
        timestamp: new Date().toISOString()
      };
      memoryDatabase.activities.unshift(newAct);
    } else {
      const userRes = await pool.query('SELECT display_name, avatar_url FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rowCount > 0) {
        const u = userRes.rows[0];
        await pool.query(
          `INSERT INTO activities (user_id, username, display_name, avatar_url, task_name, points, type, message)
           VALUES ($1, $2, $3, $4, 'Nudge', 0, 'nudge', $5)`,
          [req.user.id, req.user.username, u.display_name, u.avatar_url, nudgeMessage]
        );
      }
    }

    return res.json({ success: true, message: nudgeMessage });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed sending nudge.' });
  }
});

// Update profile status message
app.post('/api/user/status', authenticateToken, async (req: any, res) => {
  const { statusMessage } = req.body;

  if (statusMessage === undefined) return res.status(400).json({ error: 'Status message is required.' });

  try {
    if (useDatabaseFallback || !pool) {
      const userIdx = memoryDatabase.users.findIndex(u => u.id === req.user.id);
      if (userIdx >= 0) {
        memoryDatabase.users[userIdx].status_message = statusMessage;
      }
    } else {
      await pool.query('UPDATE users SET status_message = $1 WHERE id = $2', [statusMessage, req.user.id]);
    }
    return res.json({ success: true, statusMessage });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed updating status message.' });
  }
});

// Update profile avatar url
app.post('/api/user/avatar', authenticateToken, async (req: any, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) return res.status(400).json({ error: 'Avatar URL is required.' });

  try {
    if (useDatabaseFallback || !pool) {
      const userIdx = memoryDatabase.users.findIndex(u => u.id === req.user.id);
      if (userIdx >= 0) {
        memoryDatabase.users[userIdx].avatar_url = avatarUrl;
      }
    } else {
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    }
    return res.json({ success: true, avatarUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed updating avatar URL.' });
  }
});

// Hard reset data endpoint
app.post('/api/user/reset', authenticateToken, async (req: any, res) => {
  try {
    if (useDatabaseFallback || !pool) {
      memoryDatabase.logs = memoryDatabase.logs.filter(l => l.user_id !== req.user.id);
      const idx = memoryDatabase.users.findIndex(u => u.id === req.user.id);
      if (idx >= 0) {
        memoryDatabase.users[idx].streak = 0;
        memoryDatabase.users[idx].best_streak = 0;
      }
    } else {
      await pool.query('DELETE FROM daily_logs WHERE user_id = $1', [req.user.id]);
      await pool.query('UPDATE users SET streak = 0, best_streak = 0 WHERE id = $1', [req.user.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed executing database reset.' });
  }
});

// ----------------------------------------------------
// VITE AND STATIC WEB ASSETS MIDDLEWARE
// ----------------------------------------------------
async function startStandaloneServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve single index.html SPA for unmatched browser page requests
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server port listeners
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GlowUp 10 Applet Node Server listening on port ${PORT}`);
  });
}

if (!process.env.NETLIFY) {
  startStandaloneServer().catch((err) => {
    console.error('⚠️ Failed to start standalone local server:', err);
  });
}

export { app };
