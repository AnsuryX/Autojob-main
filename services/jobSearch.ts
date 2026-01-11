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
  
  try {
    // Try Adzuna API first (requires API key but has free tier)
    const adzunaApiKey = import.meta.env.VITE_ADZUNA_APP_ID;
    const adzunaApiSecret = import.meta.env.VITE_ADZUNA_APP_KEY;
    
    if (adzunaApiKey && adzunaApiSecret) {
      const adzunaJobs = await searchAdzuna(keywords, location, remote, adzunaApiKey, adzunaApiSecret);
      jobs.push(...adzunaJobs);
    }
  } catch (error) {
    console.error('Adzuna search failed:', error);
  }

  // Fallback: Use Google Jobs Search via SerpAPI if available
  try {
    const serpApiKey = import.meta.env.VITE_SERP_API_KEY;
    if (serpApiKey && jobs.length < 10) {
      const googleJobs = await searchGoogleJobs(keywords, location, remote, serpApiKey);
      jobs.push(...googleJobs);
    }
  } catch (error) {
    console.error('Google Jobs search failed:', error);
  }

  // If no API keys, search public job boards directly
  if (jobs.length === 0) {
    const directJobs = await searchDirectJobBoards(keywords, location, remote);
    jobs.push(...directJobs);
  }

  // Deduplicate and limit results
  const uniqueJobs = Array.from(
    new Map(jobs.map(job => [job.url, job])).values()
  ).slice(0, 15);

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

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params}`);
  
  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.results || []).map((job: AdzunaJobResult) => ({
    title: job.title,
    company: job.company?.display_name || 'Unknown Company',
    location: job.location?.display_name || location,
    url: job.redirect_url,
    source: 'Adzuna'
  }));
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
  try {
    const indeedUrl = `https://rss.indeed.com/rss?q=${searchQuery}&l=${locationQuery}&sort=date`;
    const response = await fetch(indeedUrl);
    const xml = await response.text();
    
    // Parse RSS feed (simplified)
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');
    
    items.forEach((item, index) => {
      if (index < 10) { // Limit to 10 from Indeed
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        
        // Extract company from description
        const companyMatch = description.match(/company[:\s]+([^<]+)/i);
        const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';
        
        jobs.push({
          title: title.replace(/^\s*-\s*/, ''), // Remove leading dash from Indeed titles
          company,
          location: locationQuery,
          url: link,
          source: 'Indeed'
        });
      }
    });
  } catch (error) {
    console.error('Indeed RSS parsing failed:', error);
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
