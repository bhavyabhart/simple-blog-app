# GitHub Pages Deployment Guide

## Important: Client-Side Only Version

This version uses **localStorage** for data storage and **base64** for images, so everything works on GitHub Pages (static hosting only).

### How It Works:
- ✅ Blog posts stored in browser's localStorage
- ✅ Images converted to base64 and stored with posts
- ✅ No backend server needed
- ✅ Works on GitHub Pages
- ✅ Data persists in your browser

### Limitations:
- ⚠️ Data is stored locally in each browser (not shared across devices/users)
- ⚠️ If user clears browser data, posts will be lost
- ⚠️ Images stored as base64 (larger file size)

## Deployment Steps

### Step 1: Convert to Client-Side Version
The code has been updated to use localStorage instead of API calls.

### Step 2: Push to GitHub
```powershell
git add .
git commit -m "Convert to client-side version for GitHub Pages"
git push
```

### Step 3: Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select **main** branch
4. Select **/ (root)** folder
5. Click **Save**

### Step 4: Access Your Site
Your blog will be available at:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

## Note
This is a different version from your local server version. The local version uses Express backend, while this GitHub Pages version uses localStorage.

