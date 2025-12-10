# Deploy to GitHub Pages - Instructions

## Two Versions Available

### 1. Local Server Version (Current)
- Uses Express backend
- Stores data in `data/posts.json`
- Images in `public/uploads/`
- Run with: `npm start`

### 2. GitHub Pages Version (Client-Side)
- Uses localStorage (browser storage)
- Images stored as base64
- No backend needed
- Works on GitHub Pages

## To Deploy to GitHub Pages:

### Step 1: Switch to Client-Side Version

1. **Rename files for GitHub Pages:**
   ```powershell
   # Backup current files
   Move-Item public\index.html public\index-server.html
   Move-Item public\app.js public\app-server.js
   
   # Use GitHub Pages versions
   Move-Item public\index-github.html public\index.html
   # app-client.js is already created
   ```

2. **Update index.html to use app-client.js:**
   - The `index-github.html` already uses `app-client.js`
   - Just rename it to `index.html`

### Step 2: Push to GitHub

```powershell
git add .
git commit -m "Add GitHub Pages client-side version"
git push
```

### Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select **main** branch
4. Select **/ (root)** or **/public** folder
5. Click **Save**

### Step 4: Access Your Site

Your blog will be available at:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

## Important Notes

### Client-Side Version (GitHub Pages):
- ✅ Data stored in browser's localStorage
- ✅ Images stored as base64 (embedded in posts)
- ✅ No backend needed
- ⚠️ Data is per-browser (not shared)
- ⚠️ If user clears browser data, posts are lost
- ⚠️ Base64 images increase storage size

### Server Version (Local):
- ✅ Data stored in JSON file
- ✅ Images stored as files
- ✅ Shared across all users
- ⚠️ Requires Node.js server

## Quick Switch Script

Create a script to easily switch between versions:

**switch-to-github.ps1:**
```powershell
# Backup server version
Copy-Item public\index.html public\index-server.html -Force
Copy-Item public\app.js public\app-server.js -Force

# Use GitHub Pages version
Copy-Item public\index-github.html public\index.html -Force
Copy-Item public\app-client.js public\app.js -Force

Write-Host "Switched to GitHub Pages version"
```

**switch-to-server.ps1:**
```powershell
# Restore server version
Copy-Item public\index-server.html public\index.html -Force
Copy-Item public\app-server.js public\app.js -Force

Write-Host "Switched to server version"
```

