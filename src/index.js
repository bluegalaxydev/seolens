/**
 * Seolens — public library API.
 *
 * Usage:
 *   import { audit, renderMarkdown } from 'seolens';
 *   const result = await audit('https://example.com');
 *   console.log(renderMarkdown(result));
 */
export { audit } from './audit.js';
export { computeScore } from './scorer.js';
export { renderTerminal, renderMarkdown } from './reporter.js';
export { allChecks, categories } from './checks/index.js';
