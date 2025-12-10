# GitHub Setup Instructions

Follow these steps to push your blog app to GitHub:

## Step 1: Initialize Git Repository

Run these commands in PowerShell (you're already in the project directory):

```powershell
git init
git add .
git commit -m "Initial commit: Blog app with CRUD, rich text editor, image upload, search, and author field"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `simple-blog-app` (or any name you prefer)
4. Description: "A full-stack blog application with CRUD operations, rich text editor, image upload, and search functionality"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these (replace `YOUR_USERNAME` with your GitHub username):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/simple-blog-app.git
git branch -M main
git push -u origin main
```

## Step 4: Verify

1. Go to your GitHub repository page
2. You should see all your files there
3. The README.md will display automatically

## Future Updates

When you make changes, use these commands:

```powershell
git add .
git commit -m "Description of your changes"
git push
```

## Important Notes

- The `.gitignore` file ensures sensitive data (like `data/posts.json` and uploaded images) won't be pushed to GitHub
- Your blog posts and uploaded images are stored locally and won't be in the repository
- Anyone cloning the repo will need to run `npm install` to install dependencies

