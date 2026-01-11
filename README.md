<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AutoJob Cloud - Autonomous Job Application Agent

A professional-grade autonomous agent for job application automation, resume mutation, and strategic job hunting.

## Features

- 🔍 **Real Job Search** - Searches actual job listings from real job boards (Indeed, Adzuna, Google Jobs)
- 🚀 **Actual Applications** - Opens real job application URLs and prepares all materials automatically
- 🤖 AI-powered job discovery and matching
- 📝 Automated resume customization for each application
- 💼 Cover letter generation with multiple styles
- 📊 Application tracking and analytics
- 🔐 Secure cloud-based profile management
- 🎯 Strategic job hunting with AI recommendations
- 📦 Application package generation (downloadable cover letter + resume)

## Prerequisites

- Node.js 18+ and npm
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- Supabase account (optional - app includes defaults)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url (optional)
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key (optional)
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Building for Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview
   ```

   The built files will be in the `dist` directory.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Import your repository in [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard (same as above)
6. Deploy!

### Other Platforms

The app is a standard Vite React application and can be deployed to any static hosting service:
- AWS S3 + CloudFront
- GitHub Pages
- Cloudflare Pages
- Azure Static Web Apps

Make sure to set the environment variables appropriately for each platform.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Your Gemini API key for AI features ([Get one here](https://aistudio.google.com/app/apikey)) |
| `VITE_SUPABASE_URL` | No | Your Supabase project URL (has default) |
| `VITE_SUPABASE_ANON_KEY` | No | Your Supabase anonymous key (has default) |
| `VITE_ADZUNA_APP_ID` | No | Adzuna App ID for enhanced job search ([Get one here](https://developer.adzuna.com/)) |
| `VITE_ADZUNA_APP_KEY` | No | Adzuna App Key for enhanced job search |
| `VITE_SERP_API_KEY` | No | SerpAPI key for Google Jobs search ([Get one here](https://serpapi.com/)) |

**Note:** 
- Environment variables must be prefixed with `VITE_` to be accessible in the browser when using Vite.
- The app works without job API keys (uses free RSS feeds), but adding Adzuna or SerpAPI keys provides better job search results.
- The app now searches **REAL jobs** from actual job boards and opens real application URLs when you apply!

## Project Structure

```
├── components/          # React components
│   ├── Auth.tsx        # Authentication component
│   ├── JobHunter.tsx   # Main job discovery interface
│   ├── ProfileEditor.tsx # User profile management
│   └── ...
├── lib/                # Library files
│   └── supabase.ts     # Supabase client configuration
├── services/           # Service modules
│   └── gemini.ts       # Gemini AI service integration
├── types.ts            # TypeScript type definitions
├── constants.tsx       # App constants and defaults
└── App.tsx             # Main application component
```

## License

Private - All rights reserved
