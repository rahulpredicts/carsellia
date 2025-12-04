# Carsellia Deployment Guide

## Quick Start (Render - Recommended)

### Step 1: Push to GitHub
```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/carsellia.git
git branch -M main
git push -u origin main
```

### Step 2: Create PostgreSQL Database on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click **New +** → **PostgreSQL**
3. Name: `carsellia-db`
4. Plan: **Free**
5. Click **Create Database**
6. Wait for creation, then copy the **Internal Database URL**

### Step 3: Create Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `carsellia`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### Step 4: Set Environment Variables
Add these in the **Environment** tab:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste from step 2) |
| `SESSION_SECRET` | (click "Generate" for random string) |
| `CLAUDE_API_KEY` | `sk-ant-api03-...` (your API key) |
| `NODE_ENV` | `production` |

### Step 5: Create First Admin User
After deployment completes, run locally:
```bash
DATABASE_URL="your-render-database-url" node scripts/init-admin.js
```

### Step 6: Access Your App
Your app will be live at `https://carsellia.onrender.com`

---

## Alternative: Railway Deployment

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### Step 3: Add PostgreSQL
1. Click **New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL`

### Step 4: Set Environment Variables
Click on your service → **Variables** tab:
- `SESSION_SECRET`: Generate a random string
- `CLAUDE_API_KEY`: Your Claude API key
- `NODE_ENV`: `production`

### Step 5: Generate Domain
Click **Settings** → **Generate Domain**

### Step 6: Create Admin User
```bash
DATABASE_URL="your-railway-database-url" node scripts/init-admin.js
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Random string for session encryption |
| `CLAUDE_API_KEY` | ✅ | Anthropic API key for AI features |
| `NODE_ENV` | ✅ | Set to `production` |
| `SCRAPINGDOG_API_KEY` | ❌ | Optional: for web scraping features |

---

## Using Existing Database

If you already have a Neon database with data:
1. Just use your existing `DATABASE_URL` in the environment variables
2. Skip creating a new database on Render/Railway
3. Your existing dealerships and cars will be available immediately

---

## Troubleshooting

**Build fails with bcrypt error?**
- This is normal on some platforms. The app will fall back to bcryptjs automatically.

**Session errors?**
- Make sure `SESSION_SECRET` is set
- Check that `DATABASE_URL` is correct

**Can't login?**
- Run the `scripts/init-admin.js` script to create your first user
