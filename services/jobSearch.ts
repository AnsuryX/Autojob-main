import { DiscoveredJob } from '../types';

/**
 * Real job search using multiple sources
 * This searches actual job listings from real platforms
 */

interface AdzunaJobResult {
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  redirect_url: string;
  created: string;
}

/**
 * Search real jobs using Adzuna API (free tier)
 * Falls back to web scraping via SerpAPI if available
 */
export const searchRealJobs = async (preferences: any): Promise<DiscoveredJob[]> => {
  const jobs: DiscoveredJob[] = [];
  
  // Extract search parameters
  const keywords = preferences.targetRoles?.join(' ') || preferences.targetRoles?.[0] || 'software engineer';
  const location = preferences.locations?.[0] || 'US';
  const remote = preferences.remoteOnly ? 'remote' : '';
  
  console.log('Searching jobs with:', { keywords, location, remote });
  
  // Try direct job boards first (no API needed, most reliable)
  try {
    console.log('Trying direct job boards...');
    const directJobs = await searchDirectJobBoards(keywords, location, remote);
    console.log('Direct job boards found:', directJobs.length);
    jobs.push(...directJobs);
  } catch (error) {
    console.error('Direct job board search failed:', error);
  }

  // Try Adzuna API if we have keys and need more results
  if (jobs.length < 10) {
    try {
      const adzunaApiKey = import.meta.env.VITE_ADZUNA_APP_ID;
      const adzunaApiSecret = import.meta.env.VITE_ADZUNA_APP_KEY;
      
      console.log('Adzuna API keys present:', !!adzunaApiKey && !!adzunaApiSecret);
      
      if (adzunaApiKey && adzunaApiSecret) {
        console.log('Trying Adzuna API...');
        const adzunaJobs = await searchAdzuna(keywords, location, remote, adzunaApiKey, adzunaApiSecret);
        console.log('Adzuna found:', adzunaJobs.length);
        jobs.push(...adzunaJobs);
      }
    } catch (error) {
      console.error('Adzuna search failed:', error);
    }
  }

  // Fallback: Use Google Jobs Search via SerpAPI if available
  if (jobs.length < 10) {
    try {
      const serpApiKey = import.meta.env.VITE_SERP_API_KEY;
      console.log('SerpAPI key present:', !!serpApiKey);
      
      if (serpApiKey) {
        console.log('Trying SerpAPI...');
        const googleJobs = await searchGoogleJobs(keywords, location, remote, serpApiKey);
        console.log('SerpAPI found:', googleJobs.length);
        jobs.push(...googleJobs);
      }
    } catch (error) {
      console.error('Google Jobs search failed:', error);
    }
  }

  console.log('Total jobs found:', jobs.length);

  // Deduplicate and limit results
  const uniqueJobs = Array.from(
    new Map(jobs.map(job => [job.url, job])).values()
  ).slice(0, 15);

  console.log('Unique jobs after deduplication:', uniqueJobs.length);

  return uniqueJobs;
};

/**
 * Search Adzuna job board API
 */
async function searchAdzuna(
  keywords: string,
  location: string,
  remote: string,
  appId: string,
  appKey: string
): Promise<DiscoveredJob[]> {
  try {
    const countryCode = location === 'Remote' ? 'us' : getCountryCode(location);
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: keywords,
      where: remote || location,
      results_per_page: '15',
      content_type: 'job',
      sort_by: 'date',
    });

    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params}`;
    console.log('Adzuna API URL:', url.replace(appKey, '***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Adzuna API error response:', errorText);
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Adzuna API response:', data);
    
    if (!data.results || !Array.isArray(data.results)) {
      console.warn('Adzuna API returned unexpected format:', data);
      return [];
    }
    
    return data.results.map((job: AdzunaJobResult) => ({
      title: job.title || 'Untitled Position',
      company: job.company?.display_name || 'Unknown Company',
      location: job.location?.display_name || location,
      url: job.redirect_url || '#',
      source: 'Adzuna'
    }));
  } catch (error) {
    console.error('Adzuna search error:', error);
    throw error;
  }
}

/**
 * Search Google Jobs via SerpAPI
 */
async function searchGoogleJobs(
  keywords: string,
  location: string,
  remote: string,
  apiKey: string
): Promise<DiscoveredJob[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_jobs',
    q: keywords,
    location: remote || location,
    num: '15'
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.jobs_results || []).map((job: any) => ({
    title: job.title || '',
    company: job.company_name || 'Unknown Company',
    location: job.location || location,
    url: job.apply_options?.[0]?.link || job.related_links?.[0]?.link || '#',
    source: 'Google Jobs'
  }));
}

/**
 * Direct job board search using public endpoints
 */
async function searchDirectJobBoards(
  keywords: string,
  location: string,
  remote: string
): Promise<DiscoveredJob[]> {
  const jobs: DiscoveredJob[] = [];
  
  // Construct search queries for popular job boards
  const searchQuery = encodeURIComponent(keywords);
  const locationQuery = encodeURIComponent(remote || location);
  
  // Indeed RSS feed (public, no API key needed)
  // Use CORS proxy if direct fetch fails
  try {
    const indeedUrl = `https://rss.indeed.com/rss?q=${searchQuery}&l=${locationQuery}&sort=date`;
    console.log('Fetching Indeed RSS:', indeedUrl);
    
    let response;
    try {
      // Try direct fetch first
      response = await fetch(indeedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });
    } catch (corsError) {
      console.log('Direct fetch failed (CORS?), trying proxy...');
      // Use CORS proxy as fallback
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(indeedUrl)}`;
      response = await fetch(proxyUrl);
    }
    
    if (!response.ok) {
      throw new Error(`Indeed RSS error: ${response.status}`);
    }
    
    const xml = await response.text();
    console.log('Indeed RSS response received, length:', xml.length);
    
    // Parse RSS feed
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');
    
    console.log('Found Indeed RSS items:', items.length);
    
    items.forEach((item, index) => {
      if (index < 15) { // Limit to 15 from Indeed
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        
        // Extract company from description - try multiple patterns
        let company = 'Unknown Company';
        const companyPatterns = [
          /company[:\s]+([^<]+)/i,
          /<b>([^<]+)<\/b>/i,
          /at\s+([^<,]+)/i
        ];
        
        for (const pattern of companyPatterns) {
          const match = description.match(pattern);
          if (match) {
            company = match[1].trim();
            break;
          }
        }
        
        if (title && link) {
          jobs.push({
            title: title.replace(/^\s*-\s*/, '').trim(),
            company: company.substring(0, 100), // Limit length
            location: locationQuery,
            url: link.trim(),
            source: 'Indeed'
          });
        }
      }
    });
    
    console.log('Parsed Indeed jobs:', jobs.length);
  } catch (error) {
    console.error('Indeed RSS parsing failed:', error);
    // Don't throw, just log - we want to try other sources
  }

  return jobs;
}

/**
 * Helper to get country code from location
 */
function getCountryCode(location: string): string {
  const countryMap: Record<string, string> = {
    'US': 'us', 'United States': 'us', 'USA': 'us',
    'UK': 'gb', 'United Kingdom': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
  };
  
  for (const [key, code] of Object.entries(countryMap)) {
    if (location.includes(key)) return code;
  }
  
  return 'us'; // Default
}
