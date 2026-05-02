/**
 * Check registry — assembles all free-tier checks (~70 across 16 categories).
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

export const allChecks = [
  // Indexability runs first — if blocked, nothing else matters
  ...indexabilityChecks,
  // Core on-page
  ...metaChecks,
  ...headingChecks,
  ...contentQualityChecks,
  ...htmlComplianceChecks,
  ...imageChecks,
  ...linkChecks,
  ...accessibilityChecks,
  ...mobileChecks,
  ...technicalChecks,
  // Marketing layer (matches premium audit reports)
  ...conversionChecks,
  ...trustChecks,
  ...ecommerceChecks,
  // Discoverability + off-page
  ...socialChecks,
  ...structuredDataChecks,
  ...backlinkChecks,
];

export const categories = {
  indexability: 'Indexability',
  meta: 'Meta Tags',
  headings: 'Headings',
  content: 'Content Quality',
  'html-compliance': 'HTML Compliance',
  images: 'Images',
  links: 'Links',
  accessibility: 'Accessibility',
  mobile: 'Mobile',
  technical: 'Technical',
  conversion: 'Conversion',
  trust: 'Trust & Legitimacy',
  ecommerce: 'E-commerce',
  social: 'Social',
  'structured-data': 'Structured Data',
  backlinks: 'Backlinks & Authority',
};

/**
 * Top-level "marketing" categories (mirrors the premium audit format).
 * Used for score-by-category breakdown in the PDF report.
 */
export const marketingCategories = {
  'SEO & Discoverability': {
    weight: 0.25,
    sources: ['meta', 'headings', 'indexability', 'structured-data', 'links'],
  },
  'Technical & Performance': {
    weight: 0.20,
    sources: ['technical', 'html-compliance', 'mobile'],
  },
  'Content & Messaging': {
    weight: 0.15,
    sources: ['content', 'social'],
  },
  'Conversion Optimization': {
    weight: 0.15,
    sources: ['conversion', 'ecommerce'],
  },
  'Brand & Trust': {
    weight: 0.15,
    sources: ['trust', 'accessibility'],
  },
  'Off-page Authority': {
    weight: 0.10,
    sources: ['backlinks', 'images'],
  },
};
