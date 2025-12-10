# Simple Blog App

A simple full-stack blog application with CRUD operations and pagination.

## Features

- ✅ Create blog posts with title, content, author, and date
- ✅ Read specific blog posts by ID
- ✅ List all blog posts with pagination
- ✅ Edit blog posts (update title/content/author)
- ✅ Delete blog posts
- ✅ Rich text editor with formatting (bold, italic, headers, lists, links, colors)
- ✅ Image upload support (JPEG, PNG, GIF, WebP)
- ✅ Author field for each post
- ✅ Search functionality (search by title, content, or author)
- ✅ Beautiful, modern UI with custom notifications

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript
- **Rich Text Editor**: Quill.js
- **File Upload**: Multer
- **Storage**: JSON file-based storage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### GET /api/posts
List all posts with pagination
- Query parameters:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Posts per page (default: 10)

### GET /api/posts/:id
Get a specific post by ID

### POST /api/posts
Create a new post
- Body: `{ "title": "string", "content": "string", "author": "string" }`

### PUT /api/posts/:id
Update a post
- Body: `{ "title": "string", "content": "string", "author": "string" }`

### POST /api/upload-image
Upload an image for blog posts
- Form data: `image` (file)
- Returns: `{ "url": "/uploads/filename.jpg" }`

### DELETE /api/posts/:id
Delete a post

## Project Structure

```
assignment/
├── server.js          # Express server and API routes
├── package.json       # Dependencies
├── data/
│   └── posts.json    # Blog posts storage (auto-created)
└── public/
    ├── index.html    # Frontend HTML
    ├── styles.css    # Styling
    └── app.js        # Frontend JavaScript
```

## Usage

1. Click "New Post" to create a blog post
2. Fill in the title and content
3. Click "Create Post" to save
4. View posts in the list
5. Use "View" to see full post details
6. Use "Edit" to modify a post
7. Use "Delete" to remove a post
8. Navigate between pages using Previous/Next buttons

Enjoy your blog app! 🎉


