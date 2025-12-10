# Fix GitHub Pages - Showing README Instead of App

## Problem
GitHub Pages is showing the README.md file instead of your blog app.

## Solution: Two Options

### Option 1: Move Files to Root (Easiest)

1. **Copy the GitHub Pages version files to root:**
   ```powershell
   Copy-Item public\index-github.html index.html
   Copy-Item public\app-client.js app.js
   Copy-Item public\styles.css styles.css
   ```

2. **Update index.html to fix paths:**
   - The script tag should be: `<script src="app.js"></script>`
   - CSS link should be: `<link rel="stylesheet" href="styles.css">`

3. **Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Move files to root for GitHub Pages"
   git push
   ```

4. **In GitHub Settings → Pages:**
   - Source: **main** branch
   - Folder: **/ (root)**
   - Save

### Option 2: Configure GitHub Pages to Use /public Folder

1. **In GitHub repository:**
   - Go to **Settings** → **Pages**
   - Source: **main** branch
   - Folder: **/public** (not root!)
   - Click **Save**

2. **Wait a few minutes** for GitHub to rebuild

## Quick Fix Script

Run this PowerShell script to automatically fix it:

```powershell
# Copy GitHub Pages files to root
Copy-Item public\index-github.html index.html -Force
Copy-Item public\app-client.js app.js -Force  
Copy-Item public\styles.css styles.css -Force

# Update paths in index.html (if needed)
(Get-Content index.html) -replace 'app-client.js', 'app.js' | Set-Content index.html

Write-Host "Files copied to root. Now push to GitHub!"
```

Then:
```powershell
git add .
git commit -m "Fix GitHub Pages deployment"
git push
```

## Verify

After pushing, wait 1-2 minutes, then visit:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

You should see your blog app, not the README!

