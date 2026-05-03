/**
 * Check registry — assembles all free-tier checks (100+ across 22 categories).
 * Pro version adds 60+ more in a separate package.
 */
import { metaChecks } from './meta.js';
import { headingChecks } from './headings.js';
import { imageChecks } from './images.js';
import { linkChecks } from './links.js';
import { technicalChecks } from './technical.js';
import { socialChecks } from './social.js';
import { structuredDataChecks } from './structured-data.js';
import { htmlComplianceChecks } from './html-compliance.js';
import { accessibilityChecks } from './accessibility.js';
import { mobileChecks } from './mobile.js';
import { indexabilityChecks } from './indexability.js';
import { backlinkChecks } from './backlinks.js';
import { conversionChecks } from './conversion.js';
import { trustChecks } from './trust.js';
import { ecommerceChecks } from './ecommerce.js';
import { contentQualityChecks } from './content-quality.js';
import { performanceChecks } from './performance.js';
import { securityChecks } from './security.js';
import { i18nChecks } from './i18n.js';
import { schemaDeepChecks } from './schema-deep.js';
import { crawlabilityChecks } from './crawlability.js';
import { pageExperienceChecks } from './page-experience.js';

export const allChecks = [
  // Indexability runs first — if blocked, nothing else matters
  ...indexabilityChecks,
  ...crawlabilityChecks,
  // Core on-page
  ...metaChecks,
  ...headingChecks,
  ...contentQualityChecks,
  ...htmlComplianceChecks,
  ...imageChecks,
  ...linkChecks,
  ...accessibilityChecks,
  ...mobileChecks,
  ...i18nChecks,
  // Technical & performance & security
  ...technicalChecks,
  ...performanceChecks,
  ...securityChecks,
  ...pageExperienceChecks,
  // Marketing layer
  ...conversionChecks,
  ...trustChecks,
  ...ecommerceChecks,
  // Discoverability + structured data + off-page
  ...socialChecks,
  ...structuredDataChecks,
  ...schemaDeepChecks,
  ...backlinkChecks,
];

export const categories = {
  indexability: 'Indexability',
  crawlability: 'Crawlability',
  meta: 'Meta Tags',
  headings: 'Headings',
  content: 'Content Quality',
  'html-compliance': 'HTML Compliance',
  images: 'Images',
  links: 'Links',
  accessibility: 'Accessibility',
  mobile: 'Mobile',
  i18n: 'Internationalization',
  technical: 'Technical',
  performance: 'Performance',
  security: 'Security Headers',
  'page-experience': 'Page Experience',
  conversion: 'Conversion',
  trust: 'Trust & Legitimacy',
  ecommerce: 'E-commerce',
  social: 'Social',
  'structured-data': 'Structured Data',
  'schema-deep': 'Schema (Deep)',
  backlinks: 'Backlinks & Authority',
};

/**
 * Top-level "marketing" categories (mirrors the premium audit format).
 * Used for score-by-category breakdown in the PDF report.
 */
export const marketingCategories = {
  'SEO & Discoverability': {
    weight: 0.20,
    sources: ['meta', 'headings', 'indexability', 'crawlability', 'structured-data', 'schema-deep', 'links'],
  },
  'Technical & Performance': {
    weight: 0.20,
    sources: ['technical', 'performance', 'html-compliance', 'mobile', 'page-experience'],
  },
  'Content & Messaging': {
    weight: 0.15,
    sources: ['content', 'social', 'i18n'],
  },
  'Conversion Optimization': {
    weight: 0.15,
    sources: ['conversion', 'ecommerce'],
  },
  'Brand & Trust': {
    weight: 0.15,
    sources: ['trust', 'accessibility', 'security'],
  },
  'Off-page Authority': {
    weight: 0.15,
    sources: ['backlinks', 'images'],
  },
};
