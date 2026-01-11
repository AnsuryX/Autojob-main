# Cloudflare Pages Deployment Guide

## Architecture

Since Cloudflare Pages only hosts static files, we need a **hybrid deployment**:

- **Frontend**: Deployed to Cloudflare Pages (static React app)
- **Backend**: Deployed separately to a Node.js hosting service (Railway, Render, etc.)

## Frontend Deployment (Cloudflare Pages)

### 1. Build Configuration

Cloudflare Pages will automatically detect Vite and build your app. The build is already configured in `package.json`.

### 2. Environment Variables in Cloudflare

In Cloudflare Pages dashboard → Your Project → Settings → Environment Variables, add:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SERVER_URL=https://your-backend-url.railway.app
VITE_SUPABASE_URL=your_supabase_url (optional)
VITE_SUPABASE_ANON_KEY=your_supabase_key (optional)
```

**⚠️ Important:** Update `VITE_SERVER_URL` to your deployed backend URL after backend deployment.

### 3. Build Settings (Auto-detected)

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (root of repo)

### 4. GitHub Integration

1. Connect your GitHub repo to Cloudflare Pages
2. Select the branch to deploy (usually `main` or `master`)
3. Cloudflare will auto-deploy on every push

## Backend Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Free tier available
- ✅ Supports Puppeteer out of the box
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Environment variable management

**Steps:**

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js
6. Set **Root Directory** to `server`
7. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   ```
8. Deploy!
9. Railway will give you a URL like: `https://your-app.railway.app`
10. Update `VITE_SERVER_URL` in Cloudflare Pages with this URL

### Option 2: Render

**Steps:**

1. Go to [Render.com](https://render.com)
2. Sign in with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: `autojob-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   ```
7. Deploy!
8. Update `VITE_SERVER_URL` in Cloudflare Pages

### Option 3: Fly.io

**Steps:**

1. Install Fly CLI: `npm install -g @fly/cli`
2. In `server/` directory: `fly launch`
3. Follow prompts
4. Deploy: `fly deploy`

## Testing the Deployment

### 1. Test Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","browser":"connected","timestamp":"..."}
```

### 2. Test Frontend

1. Visit your Cloudflare Pages URL
2. Open browser console (F12)
3. Click "Scrape Bulk Mission"
4. Check console for API calls to your backend

## Troubleshooting

### Backend Not Responding

1. Check backend logs (Railway/Render dashboard)
2. Verify `VITE_SERVER_URL` is set correctly in Cloudflare
3. Check CORS - backend should allow requests from Cloudflare Pages domain

### CORS Errors

The backend already includes CORS middleware. If you see errors, check:
- Backend `cors()` configuration allows your Cloudflare Pages domain
- `VITE_SERVER_URL` is correct (no trailing slash)

### Puppeteer Issues

If Puppeteer fails on Railway/Render:
- These platforms usually have Puppeteer pre-installed
- If not, add to `server/package.json` build script:
  ```json
  "scripts": {
    "postinstall": "node install-puppeteer.js"
  }
  ```

## Environment Variables Summary

### Cloudflare Pages (Frontend)
```env
VITE_GEMINI_API_KEY=...
VITE_SERVER_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Backend (Railway/Render)
```env
PORT=3001
NODE_ENV=production
```

## Continuous Deployment

Both services support automatic deployments:
- **Cloudflare Pages**: Auto-deploys on git push
- **Railway/Render**: Auto-deploys on git push (if configured)

Make sure both are connected to the same GitHub repo!

## Cost

- **Cloudflare Pages**: Free (unlimited)
- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (750 hours/month)

Both free tiers should be sufficient for testing/development!
