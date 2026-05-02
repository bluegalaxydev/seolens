/**
 * Technical SEO checks: HTTPS, canonical, robots, sitemap, response time.
 */
import { probe } from '../fetcher.js';

export const technicalChecks = [
  {
    id: 'tech.https',
    category: 'technical',
    weight: 4,
    label: 'Page served over HTTPS',
    run: ({ url }) => {
      try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return { passed: false, severity: 'critical', message: `Page served over ${u.protocol} — not HTTPS.`, fix: 'Migrate the site to HTTPS. Modern browsers and Google rank HTTPS sites higher.' };
        return { passed: true, message: 'HTTPS enabled.' };
      } catch {
        return { passed: false, severity: 'warning', message: 'Could not parse URL.' };
      }
    },
  },
  {
    id: 'tech.canonical',
    category: 'technical',
    weight: 3,
    label: 'Canonical URL declared',
    run: ({ $, url }) => {
      const canonical = $('link[rel="canonical"]').attr('href');
      if (!canonical) return { passed: false, severity: 'warning', message: 'No canonical link declared.', fix: 'Add <link rel="canonical" href="..."> to prevent duplicate-content issues.' };
      return { passed: true, message: `Canonical: ${canonical}` };
    },
  },
  {
    id: 'tech.status',
    category: 'technical',
    weight: 5,
    label: 'Page returns 200 OK',
    run: ({ status }) => {
      if (status === 200) return { passed: true, message: 'Status 200 OK.' };
      if (status >= 300 && status < 400) return { passed: false, severity: 'warning', message: `Page returned ${status} (redirect). Consider linking directly to the final URL.`, fix: 'Update internal links to point to the final URL instead of relying on redirects.' };
      return { passed: false, severity: 'critical', message: `Page returned status ${status}.`, fix: 'Investigate the server response — non-200 status codes hurt SEO.' };
    },
  },
  {
    id: 'tech.response.time',
    category: 'technical',
    weight: 2,
    label: 'Server response time under 1.5s',
    run: ({ elapsedMs }) => {
      if (elapsedMs < 800) return { passed: true, message: `Fast response (${elapsedMs}ms).` };
      if (elapsedMs < 1500) return { passed: true, message: `Acceptable response (${elapsedMs}ms).` };
      if (elapsedMs < 3000) return { passed: false, severity: 'warning', message: `Slow response (${elapsedMs}ms).`, fix: 'Investigate server-side performance. Target TTFB under 800ms for best results.' };
      return { passed: false, severity: 'critical', message: `Very slow response (${elapsedMs}ms).`, fix: 'Server is too slow — investigate hosting, database queries, and caching.' };
    },
  },
  {
    id: 'tech.robots.txt',
    category: 'technical',
    weight: 2,
    label: 'robots.txt is reachable',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
        const res = await probe(robotsUrl);
        if (res.ok) return { passed: true, message: `robots.txt found at ${robotsUrl}` };
        return { passed: false, severity: 'warning', message: `robots.txt not found at ${robotsUrl} (status ${res.status}).`, fix: 'Add a /robots.txt file at the root of your domain.' };
      } catch (err) {
        return { passed: false, severity: 'warning', message: `Could not check robots.txt: ${err.message}` };
      }
    },
  },
  {
    id: 'tech.sitemap',
    category: 'technical',
    weight: 2,
    label: 'sitemap.xml is reachable',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        const sitemapUrl = `${u.protocol}//${u.host}/sitemap.xml`;
        const res = await probe(sitemapUrl);
        if (res.ok) return { passed: true, message: `sitemap.xml found at ${sitemapUrl}` };
        return { passed: false, severity: 'warning', message: `sitemap.xml not found at ${sitemapUrl} (status ${res.status}).`, fix: 'Add a /sitemap.xml file listing all your indexable pages.' };
      } catch (err) {
        return { passed: false, severity: 'warning', message: `Could not check sitemap.xml: ${err.message}` };
      }
    },
  },
];
