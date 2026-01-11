import { DiscoveredJob } from '../types';

// Backend server URL - defaults to localhost for development
// In production (Cloudflare Pages), this should be set via environment variable
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

/**
 * Search jobs using the backend scraping server (bypasses CORS)
 * This uses Puppeteer to scrape real job sites
 */
export const searchRealJobs = async (preferences: any): Promise<DiscoveredJob[]> => {
  try {
    // Extract search parameters
    const keywords = preferences.targetRoles?.join(' ') || preferences.targetRoles?.[0] || 'software engineer';
    const location = preferences.locations?.[0] || '';
    const remote = preferences.remoteOnly || false;
    
    console.log('Searching via scraping server:', { keywords, location, remote });
    
    // Call the backend scraping server
    const response = await fetch(`${SERVER_URL}/api/jobs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords,
        location,
        remote
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Server returned ${data.count} jobs`);
    
    return data.jobs || [];
  } catch (error) {
    console.error('Server search error:', error);
    
    // Fallback to direct job boards if server is unavailable
    console.log('Falling back to direct job board search...');
    return await fallbackSearch(preferences);
  }
};

/**
 * Extract job details from a URL using the backend server
 */
export const extractJobDetailsFromUrl = async (url: string): Promise<{ description: string; company: string; fullHtml: string }> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/jobs/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Job extraction error:', error);
    return { description: '', company: '', fullHtml: '' };
  }
};

/**
 * Fallback search using direct APIs (if server is down)
 */
async function fallbackSearch(preferences: any): Promise<DiscoveredJob[]> {
  const jobs: DiscoveredJob[] = [];
  
  try {
    // Try Adzuna API if available
    const adzunaApiKey = import.meta.env.VITE_ADZUNA_APP_ID;
    const adzunaApiSecret = import.meta.env.VITE_ADZUNA_APP_KEY;
    
    if (adzunaApiKey && adzunaApiSecret) {
      const keywords = preferences.targetRoles?.join(' ') || 'software engineer';
      const location = preferences.locations?.[0] || 'US';
      
      const params = new URLSearchParams({
        app_id: adzunaApiKey,
        app_key: adzunaApiSecret,
        what: keywords,
        where: location,
        results_per_page: '15',
      });
      
      const response = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`);
      if (response.ok) {
        const data = await response.json();
        const adzunaJobs = (data.results || []).map((job: any) => ({
          title: job.title || '',
          company: job.company?.display_name || 'Unknown Company',
          location: job.location?.display_name || location,
          url: job.redirect_url || '#',
          source: 'Adzuna'
        }));
        jobs.push(...adzunaJobs);
      }
    }
  } catch (error) {
    console.error('Fallback search error:', error);
  }
  
  return jobs;
}
