/**
 * Check registry — assembles all free-tier checks.
 * Pro version adds 60+ more in a separate package.
 */
import { metaChecks } from './meta.js';
import { headingChecks } from './headings.js';
import { imageChecks } from './images.js';
import { linkChecks } from './links.js';
import { technicalChecks } from './technical.js';
import { socialChecks } from './social.js';
import { structuredDataChecks } from './structured-data.js';

export const allChecks = [
  ...metaChecks,
  ...headingChecks,
  ...imageChecks,
  ...linkChecks,
  ...technicalChecks,
  ...socialChecks,
  ...structuredDataChecks,
];

export const categories = {
  meta: 'Meta Tags',
  headings: 'Headings',
  images: 'Images',
  links: 'Links',
  technical: 'Technical',
  social: 'Social',
  'structured-data': 'Structured Data',
};
