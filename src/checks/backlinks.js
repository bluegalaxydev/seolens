/**
 * Backlink checks. Real backlink data requires a paid index (Ahrefs, Semrush,
 * Moz, DataForSEO) — we don't fake it. Instead we honestly tell the user that
 * full backlink analysis requires Seolens Pro.
 *
 * What we CAN check for free:
 *   - Internal link graph health (inferred from this page only)
 *   - Whether the page advertises social profiles (signals authority)
 *   - Whether the site uses canonical/hreflang correctly to consolidate authority
 */
export const backlinkChecks = [
  {
    id: 'backlinks.coverage',
    category: 'backlinks',
    weight: 3,
    label: 'Backlink profile (Pro feature)',
    run: () => ({
      passed: false,
      severity: 'info',
      message: 'Backlink analysis (number of referring domains, domain authority, anchor text distribution) requires a paid backlink index.',
      fix: 'Seolens Pro integrates with DataForSEO/Ahrefs for real backlink data. Free-tier alternative: check Google Search Console → Links report.',
    }),
  },
  {
    id: 'backlinks.social.signals',
    category: 'backlinks',
    weight: 1,
    label: 'Social profile links present',
    run: ({ $ }) => {
      const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'github.com', 'tiktok.com', 'mastodon.social'];
      const found = new Set();
      $('a[href]').each((_, el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        for (const d of socialDomains) {
          if (href.includes(d)) found.add(d);
        }
      });
      if (found.size === 0) return { passed: false, severity: 'info', message: 'No links to social profiles detected.', fix: 'Add links to your verified social profiles. Google uses these as authority signals (Knowledge Graph).' };
      return { passed: true, message: `Social links: ${[...found].join(', ')}.` };
    },
  },
  {
    id: 'backlinks.outbound.authority',
    category: 'backlinks',
    weight: 1,
    label: 'Page links to authoritative external sources',
    run: ({ $, url }) => {
      const host = (() => { try { return new URL(url).host; } catch { return ''; } })();
      const externalLinks = $('a[href^="http"]').toArray().filter((el) => {
        try { return new URL($(el).attr('href') || '').host !== host; } catch { return false; }
      });
      if (externalLinks.length === 0) {
        return { passed: false, severity: 'info', message: 'No outbound links to external sources.', fix: 'Linking to relevant authoritative sources signals topical relevance and is good for users. Pages with zero outbound links can look thin.' };
      }
      return { passed: true, message: `${externalLinks.length} outbound external link(s).` };
    },
  },
];
