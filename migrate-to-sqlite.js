const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const JSON_FILE = path.join(__dirname, 'data', 'posts.json');
const DB_FILE = path.join(__dirname, 'data', 'blog.db');

async function migrate() {
  // Check if JSON file exists
  if (!fs.existsSync(JSON_FILE)) {
    console.log('No posts.json file found. Nothing to migrate.');
    process.exit(0);
  }

  // Read existing JSON data
  let posts = [];
  try {
    const data = fs.readFileSync(JSON_FILE, 'utf8');
    posts = JSON.parse(data);
    console.log(`Found ${posts.length} posts in JSON file.`);
  } catch (error) {
    console.error('Error reading posts.json:', error);
    process.exit(1);
  }

  // Initialize SQLite database
  const SQL = await initSqlJs();
  let db;

  // Check if database already exists
  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
    const existingCount = db.exec('SELECT COUNT(*) as count FROM posts');
    const count = existingCount[0]?.values[0]?.[0] || 0;
    
    if (count > 0) {
      console.log(`Database already has ${count} posts.`);
      console.log('Do you want to migrate anyway? This will add duplicate posts.');
      console.log('To proceed, delete the existing database file first: data/blog.db');
      db.close();
      process.exit(0);
    }
  } else {
    db = new SQL.Database();
  }

  // Create posts table
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

  // Insert all posts
  for (const post of posts) {
    db.run(`
      INSERT INTO posts (id, title, content, author, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      post.id,
      post.title,
      post.content,
      post.author || 'Anonymous',
      post.date || post.createdAt,
      post.createdAt,
      post.updatedAt || post.createdAt
    ]);
  }

  // Save database to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
  db.close();

  console.log(`Successfully migrated ${posts.length} posts to SQLite database!`);
  console.log(`Database file: ${DB_FILE}`);
  console.log('Migration complete!');
}

migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
