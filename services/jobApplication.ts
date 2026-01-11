import { Job, UserProfile, ApplicationLog, ApplicationStatus, CoverLetterStyle, ResumeMutation } from '../types';
import { generateCoverLetter, mutateResume } from './gemini';

/**
 * Real job application service
 * Actually applies to jobs by opening application URLs and providing materials
 */

export interface ApplicationMaterials {
  coverLetter: string;
  resume: any; // ResumeJson
  mutationReport?: ResumeMutation['report'];
  profileData: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    portfolio: string;
  };
}

/**
 * Prepares application materials and opens the job application URL
 * This actually applies to real jobs by:
 * 1. Generating tailored cover letter and resume
 * 2. Opening the job application URL in a new window
 * 3. Providing materials in a format ready to copy/paste
 */
export const applyToJob = async (
  job: Job,
  profile: UserProfile,
  style: CoverLetterStyle
): Promise<{ success: boolean; materials: ApplicationMaterials; applicationUrl: string }> => {
  try {
    // Step 1: Generate cover letter
    const coverLetter = await generateCoverLetter(job, profile, style);
    
    // Step 2: Mutate resume for this specific job
    const mutationResult = await mutateResume(job, profile);
    
    // Step 3: Prepare application materials
    const materials: ApplicationMaterials = {
      coverLetter,
      resume: mutationResult.mutatedResume,
      mutationReport: mutationResult.report,
      profileData: {
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        linkedin: profile.linkedin,
        portfolio: profile.portfolio
      }
    };

    // Step 4: Open the actual job application URL in a new tab
    if (job.applyUrl && job.applyUrl !== '#' && job.applyUrl.startsWith('http')) {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }

    return {
      success: true,
      materials,
      applicationUrl: job.applyUrl || '#'
    };
  } catch (error) {
    console.error('Application preparation failed:', error);
    throw error;
  }
};

/**
 * Format resume as text for easy copy/paste
 */
export const formatResumeForApplication = (resume: any): string => {
  let formatted = `\n${resume.summary || ''}\n\n`;
  
  formatted += 'SKILLS:\n';
  formatted += resume.skills?.join(', ') || '';
  formatted += '\n\n';
  
  formatted += 'EXPERIENCE:\n';
  resume.experience?.forEach((exp: any) => {
    formatted += `\n${exp.role} at ${exp.company} (${exp.duration})\n`;
    exp.achievements?.forEach((ach: string) => {
      formatted += `  • ${ach}\n`;
    });
  });
  
  formatted += '\n\nPROJECTS:\n';
  resume.projects?.forEach((proj: any) => {
    formatted += `\n${proj.name}\n`;
    formatted += `${proj.description}\n`;
    formatted += `Technologies: ${proj.technologies?.join(', ')}\n`;
  });
  
  return formatted;
};

/**
 * Create a downloadable application package
 */
export const createApplicationPackage = async (
  job: Job,
  materials: ApplicationMaterials
): Promise<Blob> => {
  const packageContent = `
AUTOJOB APPLICATION PACKAGE
===========================

Job: ${job.title}
Company: ${job.company}
Application URL: ${job.applyUrl}

DATE: ${new Date().toLocaleString()}

---

COVER LETTER
============

${materials.coverLetter}

---

RESUME
======

${formatResumeForApplication(materials.resume)}

---

CONTACT INFORMATION
===================

Name: ${materials.profileData.fullName}
Email: ${materials.profileData.email}
Phone: ${materials.profileData.phone}
LinkedIn: ${materials.profileData.linkedin}
Portfolio: ${materials.profileData.portfolio}

---

RESUME MUTATION REPORT
======================

Track Used: ${materials.mutationReport?.selectedTrackName || 'N/A'}
ATS Score Estimate: ${materials.mutationReport?.atsScoreEstimate || 'N/A'}%
Keywords Injected: ${materials.mutationReport?.keywordsInjected?.join(', ') || 'N/A'}
`;

  return new Blob([packageContent], { type: 'text/plain' });
};
