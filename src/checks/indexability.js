/**
 * Indexability checks — what's preventing Google from indexing this page?
 * Often the difference between ranking and not ranking at all.
 */
import { probe } from '../fetcher.js';

export const indexabilityChecks = [
  {
    id: 'index.meta.robots',
    category: 'indexability',
    weight: 5,
    label: 'Page is not blocked by meta robots',
    run: ({ $ }) => {
      const v = ($('head > meta[name="robots"]').attr('content') || '').toLowerCase();
      if (!v) return { passed: true, message: 'No robots meta — defaults to index, follow.' };
      const noindex = /\bnoindex\b/.test(v);
      const nofollow = /\bnofollow\b/.test(v);
      if (noindex) return { passed: false, severity: 'critical', message: `Meta robots: "${v}" — page is blocked from indexing.`, fix: 'Remove "noindex" if you want this page to appear in search results.' };
      if (nofollow) return { passed: false, severity: 'warning', message: `Meta robots: "${v}" — links on this page won't pass authority.`, fix: 'Remove "nofollow" unless you intentionally want to block link equity flow.' };
      return { passed: true, message: `Meta robots: "${v}".` };
    },
  },
  {
    id: 'index.x-robots-tag',
    category: 'indexability',
    weight: 4,
    label: 'No X-Robots-Tag header blocking indexing',
    run: ({ headers }) => {
      const v = (headers['x-robots-tag'] || '').toLowerCase();
      if (!v) return { passed: true, message: 'No X-Robots-Tag header.' };
      if (/noindex/.test(v)) return { passed: false, severity: 'critical', message: `X-Robots-Tag: "${v}" — page is blocked at HTTP layer.`, fix: 'Remove the X-Robots-Tag noindex directive in your server/CDN configuration.' };
      return { passed: true, message: `X-Robots-Tag: "${v}".` };
    },
  },
  {
    id: 'index.robots.disallow',
    category: 'indexability',
    weight: 4,
    label: 'URL not blocked by robots.txt',
    run: async ({ url }) => {
      try {
        const u = new URL(url);
        const res = await fetch(`${u.protocol}//${u.host}/robots.txt`);
        if (!res.ok) return { passed: true, severity: 'skip', message: 'No robots.txt — see tech.robots.txt.' };
        const txt = (await res.text()).toLowerCase();
        const path = u.pathname || '/';
        const lines = txt.split('\n').map((l) => l.trim());
        let inGeneral = false;
        const disallows = [];
        for (const line of lines) {
          if (/^user-agent:\s*\*/i.test(line)) inGeneral = true;
          else if (/^user-agent:/i.test(line)) inGeneral = false;
          else if (inGeneral && /^disallow:/i.test(line)) {
            const p = line.slice(9).trim();
            if (p) disallows.push(p);
          }
        }
        const blocking = disallows.find((d) => path.startsWith(d));
        if (blocking) return { passed: false, severity: 'critical', message: `URL ${path} matches robots.txt Disallow: ${blocking}`, fix: 'Update robots.txt if this page should be indexable. Disallow rules block crawlers entirely.' };
        return { passed: true, message: 'URL is not blocked by robots.txt.' };
      } catch (err) {
        return { passed: true, severity: 'skip', message: `Could not check robots.txt: ${err.message}` };
      }
    },
  },
  {
    id: 'index.canonical.self',
    category: 'indexability',
    weight: 3,
    label: 'Canonical URL points to itself (or intentionally elsewhere)',
    run: ({ $, url }) => {
      const canonical = $('link[rel="canonical"]').attr('href');
      if (!canonical) return { passed: false, severity: 'skip', message: 'No canonical — see tech.canonical.' };
      try {
        const target = new URL(canonical, url).href.replace(/\/$/, '');
        const current = url.replace(/\/$/, '');
        if (target !== current) {
          return { passed: false, severity: 'warning', message: `Canonical points to a different URL: ${target}.`, fix: 'If this page should rank on its own, set canonical to itself. Otherwise this signals to Google that the other URL is the master.' };
        }
        return { passed: true, message: 'Canonical points to self.' };
      } catch {
        return { passed: false, severity: 'warning', message: 'Canonical URL is malformed.', fix: 'Use an absolute URL (e.g. https://example.com/page) for canonical.' };
      }
    },
  },
];
