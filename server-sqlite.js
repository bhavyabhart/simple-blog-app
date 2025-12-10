const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'blog.db');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database instance (will be initialized asynchronously)
let db = null;
let SQL = null;

// Initialize SQLite database
async function initializeDatabase() {
  try {
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_FILE)) {
      const buffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(buffer);
      console.log('Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('Created new database');
    }

    // Create posts table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Anonymous',
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Save database to file
    saveDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

// Initialize database on startup
initializeDatabase();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware to ensure database is ready
function ensureDbReady(req, res, next) {
  if (!db) {
    return res.status(503).json({ error: 'Database not ready yet' });
  }
  next();
}

// API Routes

// GET /api/posts - List all posts with pagination
app.get('/api/posts', ensureDbReady, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countResult = db.exec('SELECT COUNT(*) as count FROM posts');
    const totalPosts = countResult[0]?.values[0]?.[0] || 0;
    const totalPages = Math.ceil(totalPosts / limit);

    // Get paginated posts
    const result = db.exec(`
      SELECT * FROM posts 
      ORDER BY createdAt DESC 
      LIMIT ${limit} OFFSET ${offset}
    `);

    const posts = result[0]?.values.map(row => ({
      id: row[0],
      title: row[1],
      content: row[2],
      author: row[3],
      date: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    })) || [];

    res.json({
      posts: posts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: totalPosts,
        limit: limit,
        hasNext: offset + limit < totalPosts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id - Get a specific post by ID
app.get('/api/posts/:id', ensureDbReady, (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const result = db.exec(`SELECT * FROM posts WHERE id = ${id}`);
    
    if (!result[0] || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const row = result[0].values[0];
    const post = {
      id: row[0],
      title: row[1],
      content: row[2],
      author: row[3],
      date: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts - Create a new post
app.post('/api/posts', ensureDbReady, (req, res) => {
  const { title, content, author } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const now = new Date().toISOString();
  
  try {
    db.run(`
      INSERT INTO posts (title, content, author, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      content.trim(),
      author ? author.trim() : 'Anonymous',
      now,
      now,
      now
    ]);

    // Get the last inserted ID
    const result = db.exec('SELECT last_insert_rowid() as id');
    const newId = result[0]?.values[0]?.[0];

    // Get the created post
    const postResult = db.exec(`SELECT * FROM posts WHERE id = ${newId}`);
    const row = postResult[0].values[0];
    const newPost = {
      id: row[0],
      title: row[1],
      content: row[2],
      author: row[3],
      date: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };

    saveDatabase();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id - Update a post
app.put('/api/posts/:id', ensureDbReady, (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    // Check if post exists
    const checkResult = db.exec(`SELECT * FROM posts WHERE id = ${id}`);
    if (!checkResult[0] || checkResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingRow = checkResult[0].values[0];
    const existingPost = {
      id: existingRow[0],
      title: existingRow[1],
      content: existingRow[2],
      author: existingRow[3],
      date: existingRow[4],
      createdAt: existingRow[5],
      updatedAt: existingRow[6]
    };

    const { title, content, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    db.run(`
      UPDATE posts 
      SET title = ?, content = ?, author = ?, updatedAt = ?
      WHERE id = ?
    `, [
      title.trim(),
      content.trim(),
      author ? author.trim() : (existingPost.author || 'Anonymous'),
      new Date().toISOString(),
      id
    ]);

    // Get updated post
    const postResult = db.exec(`SELECT * FROM posts WHERE id = ${id}`);
    const row = postResult[0].values[0];
    const updatedPost = {
      id: row[0],
      title: row[1],
      content: row[2],
      author: row[3],
      date: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };

    saveDatabase();
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id - Delete a post
app.delete('/api/posts/:id', ensureDbReady, (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    // Get post before deleting
    const result = db.exec(`SELECT * FROM posts WHERE id = ${id}`);
    
    if (!result[0] || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const row = result[0].values[0];
    const post = {
      id: row[0],
      title: row[1],
      content: row[2],
      author: row[3],
      date: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    };

    db.run(`DELETE FROM posts WHERE id = ${id}`);
    saveDatabase();

    res.json({ message: 'Post deleted successfully', post: post });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/upload-image - Upload an image
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Error handling for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Blog App server running on http://localhost:${PORT}`);
  console.log(`Using SQLite database: ${DB_FILE}`);
  console.log('Waiting for database initialization...');
});
