# Cloudflare Pages Deployment Guide

## Quick Setup (5 minutes)

Since Cloudflare Pages only hosts **static files**, you need to deploy the backend separately. Here's the complete setup:

### Step 1: Deploy Backend to Railway (Recommended)

1. **Go to [Railway.app](https://railway.app)** and sign in with GitHub

2. **Create New Project** → "Deploy from GitHub repo"

3. **Select your repository**

4. **Configure the service:**
   - Click on the service
   - Go to **Settings** → **Root Directory**
   - Set to: `server`
   - Save

5. **Add Environment Variables:**
   - Click **Variables** tab
   - Add:
     ```
     PORT=3001
     NODE_ENV=production
     ```

6. **Deploy!** Railway will automatically:
   - Install dependencies
   - Start the server
   - Give you a URL like: `https://your-app.up.railway.app`

7. **Copy the URL** - you'll need it for Cloudflare!

### Step 2: Deploy Frontend to Cloudflare Pages

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com)**

2. **Pages** → **Create a project** → **Connect to Git**

3. **Connect GitHub** and select your repository

4. **Configure build:**
   - Framework preset: **Vite** (or leave auto-detect)
   - Build command: `npm run build` (should be auto-detected)
   - Build output directory: `dist` (should be auto-detected)
   - Root directory: `/` (root)

5. **Add Environment Variables:**
   - Scroll down to **Environment variables**
   - Add these:
     ```
     VITE_GEMINI_API_KEY = your_gemini_api_key
     VITE_SERVER_URL = https://your-app.up.railway.app  ← Your Railway URL!
     VITE_SUPABASE_URL = your_supabase_url (optional)
     VITE_SUPABASE_ANON_KEY = your_supabase_key (optional)
     ```
   
   ⚠️ **Important**: Use your Railway backend URL from Step 1!

6. **Save and Deploy**

7. Cloudflare will:
   - Build your app
   - Deploy to a URL like: `https://your-app.pages.dev`

### Step 3: Update Backend CORS (if needed)

The backend already allows Cloudflare Pages domains, but if you have issues:

1. Go to Railway dashboard
2. Add environment variable:
   ```
   FRONTEND_URL = https://your-app.pages.dev
   ```
3. Redeploy

### Step 4: Test Everything

1. **Test Backend:**
   ```bash
   curl https://your-app.up.railway.app/health
   ```
   Should return: `{"status":"ok","browser":"connected",...}`

2. **Test Frontend:**
   - Visit your Cloudflare Pages URL
   - Open browser console (F12)
   - Click "Scrape Bulk Mission"
   - Should see API calls to your Railway backend

## ✅ You're Done!

Now your app is fully deployed:
- ✅ Frontend on Cloudflare Pages
- ✅ Backend on Railway with Puppeteer
- ✅ Automatic deployments on git push
- ✅ CORS configured correctly

## Troubleshooting

### "Cannot connect to backend"
- Verify `VITE_SERVER_URL` in Cloudflare matches your Railway URL
- Check Railway logs: Dashboard → Your Service → Deployments → View Logs
- Test backend health endpoint manually

### CORS Errors
- Backend already allows Cloudflare domains
- Make sure `VITE_SERVER_URL` has **no trailing slash**
- Check browser console for exact error message

### Build Failures
- **Cloudflare**: Check build logs in Cloudflare dashboard
- **Railway**: Check deployment logs in Railway dashboard
- Common issue: Missing environment variables

## Environment Variables Checklist

### ✅ Cloudflare Pages
- [x] `VITE_GEMINI_API_KEY`
- [x] `VITE_SERVER_URL` ← Your Railway backend URL
- [ ] `VITE_SUPABASE_URL` (optional)
- [ ] `VITE_SUPABASE_ANON_KEY` (optional)

### ✅ Railway (Backend)
- [x] `PORT=3001`
- [x] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (optional, for specific CORS)

## Automatic Deployments

Both services auto-deploy:
- **Push to `main` branch** → Both deploy automatically
- No manual steps needed after initial setup!

## Cost

- **Cloudflare Pages**: 💰 **FREE** (unlimited)
- **Railway Free Tier**: 💰 **FREE** (500 hours/month)

Perfect for MVP! 🚀

## Alternative Backend Hosting

If Railway doesn't work for you:

### Render
- Same setup as Railway
- Free tier: 750 hours/month
- See `server/render.yaml` for configuration

### Fly.io
- More complex setup
- Free tier available
- Requires Docker knowledge
