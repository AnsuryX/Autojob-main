# AutoJob Scraping Server

Backend server using Puppeteer to scrape job listings and automate applications.

## Features

- 🕷️ **Headless Browser Scraping** - Uses Puppeteer to scrape Indeed, LinkedIn, Glassdoor
- 🤖 **Automated Form Filling** - Automatically fills job application forms
- 🚫 **CORS-Free** - Server-side scraping bypasses all CORS restrictions
- ⚡ **Parallel Scraping** - Scrapes multiple job sites simultaneously

## Installation

```bash
cd server
npm install
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### POST /api/jobs/search
Search for jobs across multiple platforms.

**Request:**
```json
{
  "keywords": "software engineer",
  "location": "Remote",
  "remote": true
}
```

**Response:**
```json
{
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "Remote",
      "url": "https://...",
      "source": "Indeed"
    }
  ],
  "count": 15
}
```

### POST /api/jobs/extract
Extract detailed job information from a URL.

**Request:**
```json
{
  "url": "https://indeed.com/viewjob?jk=..."
}
```

**Response:**
```json
{
  "title": "Job Title",
  "description": "Full job description...",
  "company": "Company Name",
  "location": "Location",
  "applyUrl": "https://...",
  "fullHtml": "..."
}
```

### POST /api/jobs/apply
Automatically fill job application form (doesn't auto-submit for safety).

**Request:**
```json
{
  "jobUrl": "https://...",
  "profile": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "linkedin": "linkedin.com/in/johndoe",
    "portfolio": "johndoe.dev"
  },
  "coverLetter": "Cover letter text...",
  "resume": { /* Resume JSON */ }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form partially filled. Fields filled: email, name, phone",
  "filledFields": ["email", "name", "phone"],
  "screenshot": "data:image/png;base64,..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "browser": "connected",
  "timestamp": "2024-01-11T18:00:00.000Z"
}
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## Notes

- Browser instance is reused across requests for performance
- Screenshots are taken for verification (not auto-submitted for safety)
- Form filling is conservative - only fills when fields are clearly identified
- Supports Indeed, LinkedIn, and Glassdoor scraping
