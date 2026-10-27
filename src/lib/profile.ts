/** Everything factual about Ali lives here, so the playful pages and the plain résumé never drift apart. */

export const person = {
  name: 'Ali Konain',
  fullName: 'Syed Ali Konain',
  title: 'Senior Full-Stack Engineer',
  location: 'Lahore, Pakistan',
  email: 'alikonain.official@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ali-konain/',
  github: 'https://github.com/alikonainofficial',
  source: 'https://github.com/alikonainofficial/alikonainofficial.github.io',
  careerStart: new Date('2021-06-01T00:00:00Z'),
};

export const summary =
  'Senior full-stack engineer with 5+ years building SaaS products, internal platforms, content workflows, automation tools and production web applications across AI, AdTech and FinTech. I turn complex operational workflows into reliable software across frontend, backend, data ingestion, QA and AI-assisted automation.';

export interface Act {
  numeral: string;
  company: string;
  role: string;
  start: string;
  end: string;
  line: string;
  bullets: string[];
}

/** Most recent first. */
export const acts: Act[] = [
  {
    numeral: 'IV',
    company: 'Speechify',
    role: 'Senior Software Engineer',
    start: 'June 2024',
    end: 'now',
    line: 'Reader features, audiobook ingestion, AI ad generation, and tooling that processed 300,000+ public-domain books.',
    bullets: [
      'Led full-stack development across reader experiences, mobile audio workflows, book and audiobook ingestion, internal dashboards, automation tooling and AI-assisted media workflows.',
      'Built AI-powered ad generation and creative automation workflows that produce concepts, prompts, images, videos, captions, demos and campaign-ready assets using LLMs, media-generation APIs, Google Sheets, Google Drive and batch pipelines.',
      'Restored Android background audiobook playback with native audio file handling and decryption, fewer unnecessary UI updates, and guards against chapter-transition race conditions.',
      'Engineered reader features including highlights, notes, bookmarks, editable note boxes, content sections, book links, reader state, podcast episode flows and backend persistence for reading data.',
      'Developed backend APIs, DTOs, services, database migrations, E2E tests and Supabase integrations for content lists, library services, book clubs, highlights, notes, bookmarks, podcast episodes and metadata workflows.',
      'Built Python automation for 300,000+ public-domain books: metadata scraping, audiobook processing, subtitle generation, topic and category assignment, genre conversion, Supabase file uploads and recommendation experiments.',
      'Contributed to book and audiobook ingestion infrastructure: Supabase connectivity, audiobook asset handling, SFTP workflows, cover image metadata, orchestration logic, CI build verification and Docker/Gradle caching.',
      'Reviewed PRs, managed Linear tasks, ran QA and E2E testing, debugged production issues and supported teammates across frontend, backend, mobile, data ingestion, automation and AI pipelines.',
    ],
  },
  {
    numeral: 'III',
    company: 'MonetizeMore',
    role: 'Software Engineer',
    start: 'January 2023',
    end: 'July 2024',
    line: 'Rebuilt a publisher ad-inspection tool from a Figma redesign and added an ad overlay for debugging.',
    bullets: [
      'Upgraded an ad inspection tool with a redesigned Figma-based UI and new React and JavaScript features for publisher-facing ad operations.',
      'Resolved recurring bugs in publisher ad setups, reducing reported setup errors and improving tool reliability.',
      'Designed and implemented a rating and feedback system for publishers and clients to report product issues.',
      'Implemented an ad overlay module in React to expose ad rendering information for internal debugging and performance analysis.',
      'Used Docker to replicate production environments for debugging and local testing, improving CI reliability.',
    ],
  },
  {
    numeral: 'II',
    company: 'i2c',
    role: 'Full-Stack Developer',
    start: 'June 2021',
    end: 'December 2022',
    line: 'Card-management modules for client-facing fintech apps, in Java, Spring Boot and React.',
    bullets: [
      'Built card management modules using Java, Spring Boot, React, CSS and Bootstrap for fintech web applications.',
      'Developed frontend and backend features for client-facing financial systems, integrating Java services with database-driven workflows.',
      'Configured MySQL workflows, HTTP routing and backend services for application setup, integration and deployment.',
      'Containerized backend services with Docker to improve local development, integration testing and deployment consistency.',
    ],
  },
  {
    numeral: 'I',
    company: 'AI and Multidisciplinary Research Lab',
    role: 'Full-Stack Developer Intern',
    start: 'November 2020',
    end: 'March 2021',
    line: 'Angular front end, Django back end, deployed and maintained on a remote server.',
    bullets: [
      'Led the frontend of a report submission system in Angular, CSS and TypeScript.',
      'Handled data flow between the frontend and a Python/Django backend on PostgreSQL.',
      'Deployed and maintained the application on a remote server using Git.',
    ],
  },
];

export const skills: { group: string; items: string }[] = [
  { group: 'Frontend', items: 'React, Next.js, Angular, TypeScript, JavaScript, Tailwind, HTML/CSS, Figma' },
  { group: 'Backend', items: 'Node.js, NestJS, Java, Spring Boot, REST APIs, Supabase, PostgreSQL, MySQL' },
  { group: 'Automation and data', items: 'Python, web scraping, metadata ingestion, recommendation systems, podcast and audiobook processing, Google Sheets and Drive automation' },
  { group: 'AI and workflow automation', items: 'AI ad generation, media pipeline automation, AI-assisted metadata enrichment, subtitle generation, content categorization, n8n' },
  { group: 'DevOps and tools', items: 'Docker, AWS, Terraform, GitHub Actions, CI/CD, Linux, Linear, Jira' },
  { group: 'Leadership and QA', items: 'E2E testing, PR reviews, debugging, technical leadership' },
];

export const education = [
  { degree: 'Master of Business Administration', school: 'Istanbul Gelisim University, Istanbul', period: 'August 2023 to February 2025' },
  { degree: 'BS Information Technology', school: 'PUCIT, University of the Punjab, Lahore', period: 'September 2017 to May 2021' },
];

/** Full years and months since the first professional role, for the "time in production" line. */
export function timeInProduction(now: Date = new Date()): { years: number; months: number } {
  const start = person.careerStart;
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  return { years: Math.floor(months / 12), months: months % 12 };
}
