import { UserProfile, CoverLetterStyle } from '../types';
import { generateCoverLetter, mutateResume } from './gemini';

// Backend server URL - defaults to localhost for development
// In production (Cloudflare Pages), this should be set via environment variable
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

/**
 * Application profile data structure for form filling
 */
export interface ApplicationProfile {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  resume: any; // ResumeJson
}

/**
 * Automated application submission result
 */
export interface ApplicationResult {
  success: boolean;
  message: string;
  filledFields: string[];
  screenshot: string | null;
}

/**
 * Automatically fill and submit a job application using Puppeteer
 * This uses the backend server to control a headless browser
 */
export const automateApplication = async (
  jobUrl: string,
  profile: UserProfile,
  coverLetterStyle: CoverLetterStyle,
  jobTitle?: string,
  company?: string
): Promise<ApplicationResult> => {
  try {
    console.log('Starting automated application for:', jobUrl);
    
    // Generate cover letter
    const coverLetter = await generateCoverLetter(
      {
        id: '',
        title: jobTitle || 'Position',
        company: company || 'Company',
        location: '',
        skills: [],
        description: '',
        applyUrl: jobUrl,
        scrapedAt: new Date().toISOString(),
        platform: 'Other',
        intent: {
          type: 'REAL_HIRE' as any,
          confidence: 1,
          reasoning: ''
        }
      },
      profile,
      coverLetterStyle
    );
    
    // Prepare application profile
    const applicationProfile: ApplicationProfile = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      linkedin: profile.linkedin,
      portfolio: profile.portfolio,
      resume: profile.resumeTracks[0]?.content || null
    };
    
    // Call backend automation endpoint
    const response = await fetch(`${SERVER_URL}/api/jobs/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobUrl,
        profile: applicationProfile,
        coverLetter,
        resume: applicationProfile.resume
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result: ApplicationResult = await response.json();
    console.log('Application automation result:', result);
    
    return result;
  } catch (error) {
    console.error('Application automation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      filledFields: [],
      screenshot: null
    };
  }
};
