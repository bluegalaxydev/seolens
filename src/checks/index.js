/**
 * Check registry — assembles all free-tier checks (~50 across 12 categories).
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

export const allChecks = [
  // Indexability runs first — if blocked, nothing else matters
  ...indexabilityChecks,
  // Core on-page
  ...metaChecks,
  ...headingChecks,
  ...htmlComplianceChecks,
  ...imageChecks,
  ...linkChecks,
  ...accessibilityChecks,
  ...mobileChecks,
  ...technicalChecks,
  ...socialChecks,
  ...structuredDataChecks,
  // Off-page (mostly Pro upsell)
  ...backlinkChecks,
];

export const categories = {
  indexability: 'Indexability',
  meta: 'Meta Tags',
  headings: 'Headings',
  'html-compliance': 'HTML Compliance',
  images: 'Images',
  links: 'Links',
  accessibility: 'Accessibility',
  mobile: 'Mobile',
  technical: 'Technical',
  social: 'Social',
  'structured-data': 'Structured Data',
  backlinks: 'Backlinks & Authority',
};
