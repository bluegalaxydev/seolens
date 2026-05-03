/**
 * Crawlability checks. Beyond basic robots.txt and sitemap.xml — these look
 * at URL structure, parameter handling, and crawl-budget waste.
 */
import { probe } from '../fetcher.js';

export const crawlabilityChecks = [
  {
    id: 'crawl.url.params',
    category: 'crawlability',
    weight: 2,
    label: 'URL has no excessive query parameters',
    run: ({ url }) => {
      try {
        const u = new URL(url);
        const params = [...u.searchParams.keys()];
        if (params.length === 0) return { passed: true, message: 'Clean URL — no query parameters.' };
        if (params.length <= 2) return { passed: true, message: `${params.length} query parameter(s) — within reason.` };
        const tracking = params.filter((p) => /^(utm_|fbclid|gclid|mc_|ref|source)/i.test(p));
        if (tracking.length > 0) {
          return { passed: false, severity: 'warning', message: `URL contains tracking params: ${tracking.join(', ')}.`, fix: 'Configure rel="canonical" or robots noindex for tracking-param URLs to avoid duplicate indexing.' };
        }
        return { passed: false, severity: 'info', message: `${params.length} query parameters in URL.`, fix: 'Many parameters create crawl-budget waste. Use canonicals to consolidate, or rewrite to clean URLs.' };
      } catch {
        return { passed: false, severity: 'skip', message: 'Could not parse URL.' };
      }
    },
  },
  {
    id: 'crawl.url.length',
    category: 'crawlability',
    weight: 1,
    label: 'URL length is reasonable (<100 chars)',
    run: ({ url }) => {
      const len = url.length;
      if (len < 75) return { passed: true, message: `URL: ${len} chars — concise.` };
      if (len < 100) return { passed: true, message: `URL: ${len} chars — acceptable.` };
      if (len < 200) return { passed: false, severity: 'info', message: `URL is ${len} chars — long.`, fix: 'Long URLs reduce shareability and SERP click-through. Aim for under 100 chars.' };
      return { passed: false, severity: 'warning', message: `URL is ${len} chars — extremely long.`, fix: 'URLs above 200 chars are often a signal of generated/parameter-heavy paths. Restructure routing.' };
    },
  },
  {
    id: 'crawl.sitemap.declared',
    category: 'crawlability',
    weight: 2,
    label: 'Sitemap declared in robots.txt',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        const res = await fetch(`${u.protocol}//${u.host}/robots.txt`);
        if (!res.ok) return { passed: false, severity: 'skip', message: 'No robots.txt to check.' };
        const txt = await res.text();
        if (/^sitemap:/im.test(txt)) return { passed: true, message: 'Sitemap declared in robots.txt.' };
        return { passed: false, severity: 'info', message: 'robots.txt does not declare a Sitemap: directive.', fix: 'Add "Sitemap: https://yoursite.com/sitemap.xml" to robots.txt for discovery.' };
      } catch (err) {
        return { passed: false, severity: 'skip', message: `Could not check: ${err.message}` };
      }
    },
  },
  {
    id: 'crawl.https.redirect',
    category: 'crawlability',
    weight: 2,
    label: 'HTTP version redirects to HTTPS',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return { passed: false, severity: 'skip', message: 'Page already on HTTP — see tech.https.' };
        const httpUrl = `http://${u.host}${u.pathname}`;
        const res = await fetch(httpUrl, { method: 'HEAD', redirect: 'manual' });
        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get('location') || '';
          if (loc.startsWith('https://')) return { passed: true, message: `HTTP redirects to HTTPS (${res.status}).` };
          return { passed: false, severity: 'warning', message: `HTTP redirects but not to HTTPS: ${loc}.`, fix: 'Ensure all HTTP traffic redirects to HTTPS with a 301.' };
        }
        if (res.status >= 200 && res.status < 300) {
          return { passed: false, severity: 'critical', message: 'HTTP version returns 200 — site is dual-served on HTTP and HTTPS.', fix: 'Force HTTPS with a 301 redirect from HTTP. Dual-serving creates duplicate-content issues.' };
        }
        return { passed: true, severity: 'skip', message: `HTTP version returned ${res.status} (likely blocked).` };
      } catch (err) {
        return { passed: true, severity: 'skip', message: `HTTP check failed (likely fine): ${err.message}` };
      }
    },
  },
  {
    id: 'crawl.www.consistency',
    category: 'crawlability',
    weight: 1,
    label: 'www / non-www version consistent',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        const host = u.host;
        const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
        const altUrl = `${u.protocol}//${altHost}${u.pathname}`;
        const res = await fetch(altUrl, { method: 'HEAD', redirect: 'manual' });
        if (res.status >= 300 && res.status < 400) {
          const loc = res.headers.get('location') || '';
          if (loc.includes(host)) return { passed: true, message: `${altHost} redirects to ${host}.` };
          return { passed: false, severity: 'info', message: `${altHost} redirects to ${loc} (different host).`, fix: 'Pick one canonical host (www or apex) and 301-redirect the other.' };
        }
        if (res.status >= 200 && res.status < 300) {
          return { passed: false, severity: 'warning', message: `Both ${host} and ${altHost} return 200 — duplicate content risk.`, fix: 'Choose one as canonical and 301-redirect the other.' };
        }
        return { passed: true, severity: 'skip', message: `${altHost} returned ${res.status}.` };
      } catch {
        return { passed: true, severity: 'skip', message: 'Could not check www variant.' };
      }
    },
  },
];
