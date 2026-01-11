# Complete Deployment Guide

## Overview

This app uses a **hybrid deployment**:
- **Frontend** → Cloudflare Pages (static hosting)
- **Backend** → Railway/Render (Node.js server with Puppeteer)

## Quick Start

### 1. Deploy Backend First

Choose one:

#### Option A: Railway (Easiest) ⭐

1. Go to https://railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. **Important**: Set Root Directory to `server`
6. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   ```
7. Deploy! Railway gives you a URL like: `https://your-app.up.railway.app`
8. Copy this URL - you'll need it for step 2

#### Option B: Render

1. Go to https://render.com
2. Sign in with GitHub
3. New → Web Service
4. Connect repo
5. Configure:
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
6. Deploy and get URL

### 2. Deploy Frontend to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Pages → Create a project
3. Connect to GitHub → Select your repo
4. Build settings (auto-detected):
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output: `dist`
5. Add environment variables:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_SERVER_URL=https://your-backend.railway.app  ← Your backend URL from step 1
   VITE_SUPABASE_URL=your_supabase_url (optional)
   VITE_SUPABASE_ANON_KEY=your_supabase_key (optional)
   ```
6. Deploy!

### 3. Update CORS (if needed)

The backend already allows Cloudflare Pages domains. If you have issues:

1. Go to your backend dashboard (Railway/Render)
2. Find your Cloudflare Pages URL (e.g., `your-app.pages.dev`)
3. Add to backend environment variables:
   ```
   FRONTEND_URL=https://your-app.pages.dev
   ```

## Verification

### Test Backend
```bash
curl https://your-backend.railway.app/health
```
Should return: `{"status":"ok","browser":"connected",...}`

### Test Frontend
1. Visit your Cloudflare Pages URL
2. Open console (F12)
3. Click "Scrape Bulk Mission"
4. Should see API calls to your backend

## Automatic Deployments

Both services auto-deploy on git push:
- Push to `main` → Both frontend and backend deploy automatically
- No manual steps needed after initial setup!

## Troubleshooting

### "Cannot connect to backend"
- Check `VITE_SERVER_URL` in Cloudflare Pages env vars
- Verify backend is running: `curl https://your-backend.railway.app/health`
- Check backend logs for errors

### CORS Errors
- Backend already allows Cloudflare Pages domains
- Verify `VITE_SERVER_URL` has no trailing slash
- Check browser console for actual error

### Puppeteer Not Working
- Railway/Render have Puppeteer pre-installed
- Check backend logs for Puppeteer errors
- May need to add `--no-sandbox` flag (already in code)

## File Structure for Deployment

```
your-repo/
├── server/              ← Backend (Railway/Render)
│   ├── index.js
│   ├── package.json
│   └── railway.json
├── dist/                ← Frontend build output (Cloudflare Pages)
├── package.json         ← Frontend
└── vite.config.ts
```

## Environment Variables Checklist

### Cloudflare Pages (Frontend)
- [ ] `VITE_GEMINI_API_KEY`
- [ ] `VITE_SERVER_URL` ← **Important: Your backend URL**
- [ ] `VITE_SUPABASE_URL` (optional)
- [ ] `VITE_SUPABASE_ANON_KEY` (optional)

### Railway/Render (Backend)
- [ ] `PORT=3001`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (optional, for specific CORS)

## Cost

- **Cloudflare Pages**: Free (unlimited requests)
- **Railway Free Tier**: 500 hours/month
- **Render Free Tier**: 750 hours/month

Perfect for MVP/testing! 🚀
