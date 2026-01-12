import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from Cloudflare Pages and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
    /\.pages\.dev$/,
    /\.cloudflareapp\.com$/
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

let browser = null;

// Initialize browser instance (reusable)
async function getBrowser() {
  if (!browser) {
    // Try to use system Chrome/Chromium first (much faster)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
      (() => {
        // Common Chrome/Chromium paths
        if (process.platform === 'linux') {
          const paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium'
          ];
          for (const path of paths) {
            try {
              if (fs.existsSync(path)) return path;
            } catch {}
          }
        }
        return null;
      })();

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process', // Faster startup
        '--disable-software-rasterizer'
      ]
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
      console.log(`Using system browser: ${executablePath}`);
    } else {
      console.log('Using bundled Puppeteer browser');
    }

    browser = await puppeteer.launch(launchOptions);
  }
  return browser;
}

/**
 * Scrape jobs from Indeed
 */
async function scrapeIndeed(keywords, location, remote) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(keywords);
    const locationQuery = encodeURIComponent(remote || location || '');
    const url = `https://www.indeed.com/jobs?q=${searchQuery}&l=${locationQuery}${remote ? '&remotejob=1' : ''}`;
    
    console.log(`Scraping Indeed: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for job listings to load
    await page.waitForSelector('.job_seen_beacon, .jobsearch-SerpJobCard', { timeout: 10000 }).catch(() => {});
    
    const jobs = await page.evaluate(() => {
      const jobCards = Array.from(document.querySelectorAll('.job_seen_beacon, .jobsearch-SerpJobCard'));
      
      return jobCards.slice(0, 15).map(card => {
        const titleEl = card.querySelector('h2.jobTitle a, h2 a');
        const companyEl = card.querySelector('.companyName, [data-testid="company-name"]');
        const locationEl = card.querySelector('.companyLocation, [data-testid="job-location"]');
        const linkEl = card.querySelector('h2.jobTitle a, h2 a');
        
        const title = titleEl?.textContent?.trim() || 'Untitled';
        const company = companyEl?.textContent?.trim() || 'Unknown Company';
        const location = locationEl?.textContent?.trim() || '';
        const url = linkEl?.href ? new URL(linkEl.href, window.location.origin).href : '#';
        
        return {
          title,
          company,
          location,
          url: url.startsWith('http') ? url : `https://www.indeed.com${url}`,
          source: 'Indeed'
        };
      }).filter(job => job.title !== 'Untitled' && job.url !== '#');
    });
    
    await page.close();
    return jobs;
  } catch (error) {
    console.error('Indeed scraping error:', error);
    await page.close().catch(() => {});
    return [];
  }
}

/**
 * Scrape jobs from LinkedIn (using search results page)
 */
async function scrapeLinkedIn(keywords, location, remote) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(keywords);
    const locationQuery = encodeURIComponent(remote || location || '');
    const url = `https://www.linkedin.com/jobs/search?keywords=${searchQuery}&location=${locationQuery}${remote ? '&f_WT=2' : ''}`;
    
    console.log(`Scraping LinkedIn: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for job listings
    await page.waitForSelector('.jobs-search__results-list li', { timeout: 10000 }).catch(() => {});
    
    const jobs = await page.evaluate(() => {
      const jobCards = Array.from(document.querySelectorAll('.jobs-search__results-list li'));
      
      return jobCards.slice(0, 15).map(card => {
        const titleEl = card.querySelector('.base-search-card__title a');
        const companyEl = card.querySelector('.base-search-card__subtitle a, .job-search-card__subtitle-link');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('.base-search-card__title a');
        
        const title = titleEl?.textContent?.trim() || '';
        const company = companyEl?.textContent?.trim() || 'Unknown Company';
        const location = locationEl?.textContent?.trim() || '';
        const url = linkEl?.href || '#';
        
        return {
          title,
          company,
          location,
          url: url.startsWith('http') ? url : `https://www.linkedin.com${url}`,
          source: 'LinkedIn'
        };
      }).filter(job => job.title && job.url !== '#');
    });
    
    await page.close();
    return jobs;
  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    await page.close().catch(() => {});
    return [];
  }
}

/**
 * Scrape jobs from Glassdoor
 */
async function scrapeGlassdoor(keywords, location, remote) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchQuery = encodeURIComponent(keywords);
    const locationQuery = encodeURIComponent(remote || location || '');
    const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${searchQuery}&locT=C&locId=${locationQuery}`;
    
    console.log(`Scraping Glassdoor: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('[data-test="job-listing"]', { timeout: 10000 }).catch(() => {});
    
    const jobs = await page.evaluate(() => {
      const jobCards = Array.from(document.querySelectorAll('[data-test="job-listing"]'));
      
      return jobCards.slice(0, 15).map(card => {
        const titleEl = card.querySelector('a[data-test="job-link"]');
        const companyEl = card.querySelector('[data-test="employer-name"]');
        const locationEl = card.querySelector('[data-test="job-location"]');
        
        const title = titleEl?.textContent?.trim() || '';
        const company = companyEl?.textContent?.trim() || 'Unknown Company';
        const location = locationEl?.textContent?.trim() || '';
        const url = titleEl?.href || '#';
        
        return {
          title,
          company,
          location,
          url: url.startsWith('http') ? url : `https://www.glassdoor.com${url}`,
          source: 'Glassdoor'
        };
      }).filter(job => job.title && job.url !== '#');
    });
    
    await page.close();
    return jobs;
  } catch (error) {
    console.error('Glassdoor scraping error:', error);
    await page.close().catch(() => {});
    return [];
  }
}

/**
 * Extract job details from a URL with enhanced parsing
 */
async function extractJobDetails(jobUrl) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`Extracting job details from: ${jobUrl}`);
    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for dynamic content
    await page.waitForTimeout(3000);
    
    const jobData = await page.evaluate(() => {
      // Try to extract job description from common selectors
      const selectors = [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-testid="job-description"]',
        '.description__text',
        '#job-description',
        '.job-details',
        'div[class*="description"]',
        '.jobsearch-jobDescriptionText-content',
        '.job-details-content'
      ];
      
      let description = '';
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          description = el.textContent || el.innerText || '';
          if (description.length > 100) break; // Found substantial description
        }
      }
      
      // Extract company name
      const companySelectors = [
        '[data-testid="inlineHeader-companyName"]',
        '.jobsearch-InlineCompanyRating',
        '.company-name',
        '[data-testid="job-poster"]',
        '.jobsearch-companyReview',
        'a[data-testid="job-poster"]'
      ];
      
      let company = '';
      for (const selector of companySelectors) {
        const el = document.querySelector(selector);
        if (el) {
          company = el.textContent?.trim() || '';
          if (company) break;
        }
      }
      
      // Extract job title
      const titleSelectors = [
        'h1[data-testid="job-posting-header"]',
        '.jobsearch-JobInfoHeader-title',
        'h1.jobsearch-JobInfoHeader-title',
        'h1'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          title = el.textContent?.trim() || '';
          if (title && title.length < 100) break;
        }
      }
      
      // Extract location
      const locationSelectors = [
        '[data-testid="job-location"]',
        '.jobsearch-JobInfoHeader-subtitle',
        '.jobsearch-InlineCompanyRating-companyHeader'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          location = el.textContent?.trim() || '';
          if (location) break;
        }
      }
      
      // Extract apply URL
      let applyUrl = jobUrl; // Default to job URL
      const applySelectors = [
        'a[data-testid="job-apply-button"]',
        'a[href*="apply"]',
        'button[data-testid="job-apply-button"]',
        '.jobsearch-JobComponent-actions a'
      ];
      
      for (const selector of applySelectors) {
        const el = document.querySelector(selector);
        if (el?.href) {
          applyUrl = el.href;
          break;
        }
      }
      
      return {
        title: title.trim(),
        description: description.trim(),
        company: company.trim(),
        location: location.trim(),
        applyUrl: applyUrl || jobUrl,
        fullHtml: document.body.innerHTML.substring(0, 100000) // More HTML for better AI processing
      };
    });
    
    await page.close();
    return jobData;
  } catch (error) {
    console.error('Job extraction error:', error);
    await page.close().catch(() => {});
    return { description: '', company: '', fullHtml: '', title: '', location: '', applyUrl: jobUrl };
  }
}

/**
 * Automatically fill and submit a job application using Puppeteer
 * This is an advanced feature that can fill forms automatically
 */
async function submitApplication(applicationData) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    const { jobUrl, profile, coverLetter, resume } = applicationData;
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`Submitting application to: ${jobUrl}`);
    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to find and click apply button
    const applyButtonSelectors = [
      'button[data-testid="job-apply-button"]',
      'a[data-testid="job-apply-button"]',
      'button:has-text("Apply")',
      'a:has-text("Apply")',
      '.jobsearch-JobComponent-actions button',
      '[aria-label*="Apply"]'
    ];
    
    let applyButtonClicked = false;
    for (const selector of applyButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          applyButtonClicked = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!applyButtonClicked) {
      return {
        success: false,
        message: 'Could not find apply button. Manual application required.',
        screenshot: null
      };
    }
    
    // Try to fill common form fields
    const filledFields = [];
    
    // Fill email
    const emailSelectors = ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'];
    for (const selector of emailSelectors) {
      try {
        const field = await page.$(selector);
        if (field) {
          await field.type(profile.email, { delay: 100 });
          filledFields.push('email');
          break;
        }
      } catch (e) {}
    }
    
    // Fill name
    const nameSelectors = ['input[name*="name"]', 'input[id*="name"]', 'input[placeholder*="name"]'];
    for (const selector of nameSelectors) {
      try {
        const field = await page.$(selector);
        if (field && !filledFields.includes('name')) {
          await field.type(profile.fullName, { delay: 100 });
          filledFields.push('name');
        }
      } catch (e) {}
    }
    
    // Fill phone
    const phoneSelectors = ['input[type="tel"]', 'input[name*="phone"]', 'input[id*="phone"]'];
    for (const selector of phoneSelectors) {
      try {
        const field = await page.$(selector);
        if (field) {
          await field.type(profile.phone, { delay: 100 });
          filledFields.push('phone');
          break;
        }
      } catch (e) {}
    }
    
    // Fill cover letter textarea
    const coverLetterSelectors = ['textarea[name*="cover"]', 'textarea[id*="cover"]', 'textarea[placeholder*="cover"]', 'textarea'];
    for (const selector of coverLetterSelectors) {
      try {
        const field = await page.$(selector);
        if (field && coverLetter) {
          await field.type(coverLetter, { delay: 50 });
          filledFields.push('coverLetter');
          break;
        }
      } catch (e) {}
    }
    
    // Take screenshot for verification
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
    
    // Note: We don't actually submit the form automatically for safety
    // This returns the state so user can review before submitting
    
    await page.close();
    
    return {
      success: true,
      message: `Form partially filled. Fields filled: ${filledFields.join(', ')}`,
      filledFields,
      screenshot: `data:image/png;base64,${screenshot}`
    };
    
  } catch (error) {
    console.error('Application submission error:', error);
    await page.close().catch(() => {});
    return {
      success: false,
      message: `Error: ${error.message}`,
      screenshot: null
    };
  }
}

// API Routes

app.post('/api/jobs/search', async (req, res) => {
  try {
    const { keywords, location, remote } = req.body;
    
    if (!keywords) {
      return res.status(400).json({ error: 'Keywords are required' });
    }
    
    console.log(`Job search request: ${keywords} in ${location || 'any location'} ${remote ? '(remote)' : ''}`);
    
    // Scrape from multiple sources in parallel
    const [indeedJobs, linkedInJobs, glassdoorJobs] = await Promise.allSettled([
      scrapeIndeed(keywords, location, remote),
      scrapeLinkedIn(keywords, location, remote),
      scrapeGlassdoor(keywords, location, remote)
    ]);
    
    const allJobs = [];
    
    if (indeedJobs.status === 'fulfilled') allJobs.push(...indeedJobs.value);
    if (linkedInJobs.status === 'fulfilled') allJobs.push(...linkedInJobs.value);
    if (glassdoorJobs.status === 'fulfilled') allJobs.push(...glassdoorJobs.value);
    
    // Deduplicate by URL
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.url, job])).values()
    ).slice(0, 20);
    
    console.log(`Found ${uniqueJobs.length} unique jobs`);
    
    res.json({ jobs: uniqueJobs, count: uniqueJobs.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs/extract', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const jobData = await extractJobDetails(url);
    res.json(jobData);
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit a job application (fills form but doesn't auto-submit for safety)
 */
app.post('/api/jobs/apply', async (req, res) => {
  try {
    const { jobUrl, profile, coverLetter, resume } = req.body;
    
    if (!jobUrl || !profile) {
      return res.status(400).json({ error: 'jobUrl and profile are required' });
    }
    
    const result = await submitApplication({
      jobUrl,
      profile,
      coverLetter,
      resume
    });
    
    res.json(result);
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    browser: browser ? 'connected' : 'not initialized',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Scraping server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
