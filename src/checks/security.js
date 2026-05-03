/**
 * Security header checks. Google has confirmed HTTPS is a ranking signal,
 * and security headers protect users from XSS, clickjacking, and downgrade attacks.
 */
export const securityChecks = [
  {
    id: 'sec.hsts',
    category: 'security',
    weight: 3,
    label: 'Strict-Transport-Security (HSTS) header set',
    run: ({ headers, url }) => {
      if (!url.startsWith('https://')) return { passed: false, severity: 'skip', message: 'HSTS only applies to HTTPS sites.' };
      const v = headers['strict-transport-security'];
      if (!v) return { passed: false, severity: 'warning', message: 'No HSTS header — browsers can be tricked into HTTP downgrade.', fix: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains.' };
      const m = v.match(/max-age=(\d+)/i);
      const ageDays = m ? parseInt(m[1], 10) / 86400 : 0;
      if (ageDays < 180) return { passed: false, severity: 'info', message: `HSTS max-age is ${Math.round(ageDays)} days — short.`, fix: 'Increase max-age to at least 31536000 (1 year) for strong protection.' };
      return { passed: true, message: `HSTS active (${Math.round(ageDays)} days).` };
    },
  },
  {
    id: 'sec.csp',
    category: 'security',
    weight: 2,
    label: 'Content-Security-Policy header set',
    run: ({ headers }) => {
      const csp = headers['content-security-policy'];
      const cspReport = headers['content-security-policy-report-only'];
      if (!csp && !cspReport) return { passed: false, severity: 'info', message: 'No Content-Security-Policy header.', fix: 'Add a CSP header to mitigate XSS. Start with Content-Security-Policy-Report-Only to test before enforcing.' };
      if (cspReport && !csp) return { passed: false, severity: 'info', message: 'CSP is in report-only mode.', fix: 'Once you have no violations, switch from Report-Only to Content-Security-Policy.' };
      return { passed: true, message: 'CSP header active.' };
    },
  },
  {
    id: 'sec.x-frame-options',
    category: 'security',
    weight: 2,
    label: 'X-Frame-Options or CSP frame-ancestors set',
    run: ({ headers }) => {
      const xfo = headers['x-frame-options'];
      const csp = headers['content-security-policy'] || '';
      if (xfo) return { passed: true, message: `X-Frame-Options: ${xfo}.` };
      if (/frame-ancestors/i.test(csp)) return { passed: true, message: 'CSP frame-ancestors directive present.' };
      return { passed: false, severity: 'warning', message: 'No clickjacking protection (no X-Frame-Options or CSP frame-ancestors).', fix: 'Add X-Frame-Options: SAMEORIGIN, or use CSP frame-ancestors directive.' };
    },
  },
  {
    id: 'sec.x-content-type-options',
    category: 'security',
    weight: 1,
    label: 'X-Content-Type-Options: nosniff',
    run: ({ headers }) => {
      const v = headers['x-content-type-options'];
      if (v !== 'nosniff') return { passed: false, severity: 'info', message: 'Missing X-Content-Type-Options: nosniff.', fix: 'Add the header to prevent MIME-type sniffing attacks.' };
      return { passed: true, message: 'X-Content-Type-Options set.' };
    },
  },
  {
    id: 'sec.referrer.policy',
    category: 'security',
    weight: 1,
    label: 'Referrer-Policy declared',
    run: ({ headers, $ }) => {
      const headerPolicy = headers['referrer-policy'];
      const metaPolicy = $('meta[name="referrer"]').attr('content');
      if (!headerPolicy && !metaPolicy) {
        return { passed: false, severity: 'info', message: 'No Referrer-Policy declared (uses browser default).', fix: 'Add Referrer-Policy: strict-origin-when-cross-origin to control what referrer info leaks to third parties.' };
      }
      return { passed: true, message: `Referrer policy: ${headerPolicy || metaPolicy}.` };
    },
  },
  {
    id: 'sec.mixed.content',
    category: 'security',
    weight: 3,
    label: 'No mixed content (HTTP resources on HTTPS page)',
    run: ({ $, url, html }) => {
      if (!url.startsWith('https://')) return { passed: true, severity: 'skip', message: 'Page is HTTP — mixed content not applicable.' };
      // Look for explicit http:// references in src/href attributes
      const httpRefs = [];
      $('img[src^="http://"], script[src^="http://"], link[href^="http://"], iframe[src^="http://"]').each((_, el) => {
        const tag = el.tagName.toLowerCase();
        const attr = $(el).attr('src') || $(el).attr('href');
        httpRefs.push({ tag, url: attr });
      });
      if (httpRefs.length === 0) return { passed: true, message: 'No mixed content detected.' };
      return { passed: false, severity: 'critical', message: `${httpRefs.length} HTTP resource(s) on HTTPS page (mixed content).`, fix: 'Change all http:// URLs to https:// or protocol-relative //. Browsers block mixed active content.' };
    },
  },
];
