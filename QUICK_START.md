# Quick Start Guide - AutoJob with Puppeteer

## 🚀 Setup Steps

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend Server:**
```bash
cd server
npm install
cd ..
```

> ⚠️ **Note:** Puppeteer installation may take a few minutes as it downloads Chromium (~170MB)

### 2. Start the Backend Server

**Terminal 1:**
```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
🚀 Scraping server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### 3. Start the Frontend

**Terminal 2:**
```bash
npm run dev
```

Or use the combined command (if you installed concurrently):
```bash
npm run dev:full
```

### 4. Verify Setup

1. Check backend: http://localhost:3001/health
   - Should return: `{"status":"ok","browser":"connected"}`

2. Open frontend: http://localhost:3000

3. Click "Scrape Bulk Mission" - should now work with real job scraping!

## 🎯 Features Now Available

### ✅ Real Job Scraping (CORS-Free)
- Scrapes **Indeed** in real-time
- Scrapes **LinkedIn** jobs
- Scrapes **Glassdoor** listings
- All done server-side - **no CORS issues!**

### ✅ Automated Form Filling
When you click "Execute Apply Cycle":
1. Opens the job application URL
2. **Automatically fills** form fields (email, name, phone, cover letter)
3. Takes a screenshot for verification
4. Prepares all materials for download

### ✅ Enhanced Job Extraction
- Extracts full job descriptions
- Gets company names and locations
- Finds apply URLs automatically
- Returns structured data for AI processing

## 🛠️ Troubleshooting

### Backend Server Won't Start

**Windows:**
- Puppeteer should work out of the box
- If issues, try: `npm install puppeteer --force`

**Linux:**
```bash
sudo apt-get install -y \
  chromium-browser \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0
```

**macOS:**
- Should work out of the box

### Port Already in Use

Change the port in `server/index.js`:
```javascript
const PORT = process.env.PORT || 3002; // Change to 3002 or any available port
```

Update `.env.local`:
```
VITE_SERVER_URL=http://localhost:3002
```

### No Jobs Found

1. Check backend is running: http://localhost:3001/health
2. Check browser console for errors
3. Try searching with different keywords
4. Job sites may have changed their HTML structure

### Form Filling Not Working

- Form filling is conservative - only fills when fields are clearly identified
- Check the screenshot to see what was filled
- Manual review is always recommended before submitting

## 📝 Environment Variables

Your `.env.local` should now have:
```env
VITE_GEMINI_API_KEY=your_key_here
VITE_SERVER_URL=http://localhost:3001
VITE_ADZUNA_APP_ID=your_adzuna_id (optional)
VITE_ADZUNA_APP_KEY=your_adzuna_key (optional)
VITE_SERP_API_KEY=your_serp_key (optional)
```

## 🎉 You're Ready!

Now your app can:
- ✅ Search REAL jobs from actual job boards
- ✅ Bypass CORS completely
- ✅ Automatically fill application forms
- ✅ Extract detailed job information
- ✅ Prepare application materials

Happy job hunting! 🚀
