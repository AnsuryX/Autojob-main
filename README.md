<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AutoJob Cloud - Autonomous Job Application Agent

A professional-grade autonomous agent for job application automation, resume mutation, and strategic job hunting.

## Features

- 🔍 **Real Job Search** - Uses Puppeteer (headless browser) to scrape REAL jobs from Indeed, LinkedIn, Glassdoor
- 🚀 **Actual Applications** - Opens real job application URLs and prepares all materials automatically
- 🤖 AI-powered job discovery and matching
- 📝 Automated resume customization for each application
- 💼 Cover letter generation with multiple styles
- 📊 Application tracking and analytics
- 🔐 Secure cloud-based profile management
- 🎯 Strategic job hunting with AI recommendations
- 📦 Application package generation (downloadable cover letter + resume)
- 🌐 **CORS-Free** - Backend scraping server bypasses all CORS restrictions

## Prerequisites

- Node.js 18+ and npm
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Supabase account (optional - app includes defaults)

## Setup

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Server Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SERVER_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url (optional)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key (optional)
VITE_ADZUNA_APP_ID=your_adzuna_app_id (optional)
VITE_ADZUNA_APP_KEY=your_adzuna_app_key (optional)
VITE_SERP_API_KEY=your_serp_api_key (optional)
```

## Running the Application

### Development Mode (Frontend + Backend)

Run both the frontend and backend together:

```bash
npm run dev:full
```

Or run them separately:

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
# or
cd server && npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the backend server:**
   ```bash
   npm run server
   # or
   cd server && npm start
   ```

3. **Preview (optional):**
   ```bash
   npm run preview
   ```

## How It Works

### Backend Scraping Server

The backend uses **Puppeteer** (headless Chrome) to scrape job listings from:
- **Indeed** - Real-time job listings
- **LinkedIn** - Professional job board
- **Glassdoor** - Company reviews + jobs

This completely bypasses CORS restrictions since scraping happens server-side.

### Job Search Flow

1. User clicks "Scrape Bulk Mission"
2. Frontend sends request to backend API (`/api/jobs/search`)
3. Backend launches headless browser
4. Backend scrapes multiple job sites in parallel
5. Results are deduplicated and returned
6. Frontend displays real job listings

## Deployment

### Option 1: Deploy Backend Separately (Recommended)

**Backend (Railway, Render, Heroku, etc.):**
1. Deploy the `server/` directory
2. Set `PORT` environment variable
3. Ensure Puppeteer dependencies are installed

**Frontend (Vercel, Netlify, etc.):**
1. Set `VITE_SERVER_URL` to your backend URL
2. Deploy as usual

### Option 2: Monorepo Deployment

If deploying both together (e.g., Railway with monorepo):
- Backend runs on one port
- Frontend builds and serves static files
- Configure proxy in deployment settings

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Your Gemini API key for AI features |
| `VITE_SERVER_URL` | No | Backend scraping server URL (default: http://localhost:3001) |
| `VITE_SUPABASE_URL` | No | Your Supabase project URL (has default) |
| `VITE_SUPABASE_ANON_KEY` | No | Your Supabase anonymous key (has default) |
| `VITE_ADZUNA_APP_ID` | No | Adzuna App ID (fallback if server unavailable) |
| `VITE_ADZUNA_APP_KEY` | No | Adzuna App Key (fallback) |
| `VITE_SERP_API_KEY` | No | SerpAPI key (fallback) |

**Backend Variables:**
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |

## Project Structure

```
├── server/                 # Backend scraping server
│   ├── index.js           # Express server with Puppeteer
│   └── package.json       # Backend dependencies
├── components/            # React components
│   ├── Auth.tsx          # Authentication component
│   ├── JobHunter.tsx     # Main job discovery interface
│   └── ...
├── services/             # Service modules
│   ├── gemini.ts         # Gemini AI service
│   ├── jobSearchServer.ts # Frontend API client for backend
│   └── jobApplication.ts  # Application handling
└── App.tsx               # Main application component
```

## Troubleshooting

### Backend Server Not Starting

- Ensure Puppeteer is installed: `cd server && npm install`
- Check if port 3001 is available
- On Linux, you may need: `sudo apt-get install -y chromium-browser`

### No Jobs Found

- Check backend server is running: `http://localhost:3001/health`
- Check browser console for errors
- Verify job sites haven't changed their HTML structure

### CORS Errors

- Ensure backend server is running
- Check `VITE_SERVER_URL` matches your backend URL
- Backend uses CORS middleware to allow frontend requests

## License

Private - All rights reserved
