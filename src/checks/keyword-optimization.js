/**
 * Keyword optimization checks. These detect whether the page is targeting a
 * primary keyword consistently across critical surfaces (URL, title, H1, body,
 * meta description). Small business sites typically fail multiple of these.
 */
export const keywordOptimizationChecks = [
  {
    id: 'keyword.h1.in.title',
    category: 'keyword-optimization',
    weight: 3,
    label: 'Primary keyword appears in both <title> and <h1>',
    run: ({ $ }) => {
      const title = ($('head > title').text() || '').toLowerCase();
      const h1 = ($('h1').first().text() || '').toLowerCase();
      if (!title || !h1) return { passed: false, severity: 'skip', message: 'Title or H1 missing.' };
      // Extract significant words from H1 (>3 chars, not stopwords)
      const stopwords = new Set(['the', 'and', 'for', 'with', 'your', 'our', 'this', 'that', 'from', 'are', 'have', 'has', 'was']);
      const h1Words = h1.split(/\s+/).filter((w) => w.length > 3 && !stopwords.has(w));
      if (h1Words.length === 0) return { passed: true, severity: 'skip', message: 'H1 too short to evaluate.' };
      const overlap = h1Words.filter((w) => title.includes(w));
      if (overlap.length === 0) {
        return { passed: false, severity: 'warning', message: 'No significant keyword overlap between <title> and H1.', fix: 'The page title and H1 should share the primary keyword. Mismatched signals confuse Google about page topic.' };
      }
      return { passed: true, message: `${overlap.length} shared keyword(s) between title and H1.` };
    },
  },
  {
    id: 'keyword.in.url',
    category: 'keyword-optimization',
    weight: 2,
    label: 'Page URL contains primary keyword (slug)',
    run: ({ $, url }) => {
      try {
        const u = new URL(url);
        const slug = u.pathname.replace(/^\//, '').replace(/\.[a-z]+$/, '');
        if (!slug) return { passed: true, severity: 'skip', message: 'Homepage — no slug to evaluate.' };
        const h1 = ($('h1').first().text() || '').toLowerCase();
        const slugWords = slug.toLowerCase().split(/[-_/]+/).filter((w) => w.length > 3);
        const stopwords = new Set(['the', 'and', 'for', 'with', 'your', 'our']);
        const h1Words = h1.split(/\s+/).filter((w) => w.length > 3 && !stopwords.has(w));
        if (h1Words.length === 0) return { passed: true, severity: 'skip', message: 'No H1 to compare.' };
        const overlap = h1Words.filter((w) => slugWords.some((sw) => sw.includes(w) || w.includes(sw)));
        if (overlap.length === 0) {
          return { passed: false, severity: 'warning', message: `URL slug "${slug}" doesn't contain H1 keywords.`, fix: 'Rewrite URL to include the primary keyword (e.g. /seo-audit-tool not /page-3). URL keywords boost ranking and CTR.' };
        }
        return { passed: true, message: 'URL slug contains H1 keyword(s).' };
      } catch {
        return { passed: true, severity: 'skip', message: 'Could not parse URL.' };
      }
    },
  },
  {
    id: 'keyword.first.paragraph',
    category: 'keyword-optimization',
    weight: 2,
    label: 'Primary keyword appears in first paragraph',
    run: ({ $ }) => {
      const h1 = ($('h1').first().text() || '').toLowerCase();
      const firstP = ($('main p, article p, p').first().text() || '').toLowerCase().slice(0, 500);
      if (!h1 || !firstP) return { passed: false, severity: 'skip', message: 'No H1 or paragraph.' };
      const stopwords = new Set(['the', 'and', 'for', 'with', 'your', 'our', 'this', 'that']);
      const h1Words = h1.split(/\s+/).filter((w) => w.length > 4 && !stopwords.has(w));
      if (h1Words.length === 0) return { passed: true, severity: 'skip', message: 'H1 too short.' };
      const found = h1Words.some((w) => firstP.includes(w));
      if (!found) {
        return { passed: false, severity: 'warning', message: 'No H1 keywords in first paragraph.', fix: 'Mention the primary topic in the first 100 words. Google heavily weights early body content.' };
      }
      return { passed: true, message: 'Primary keyword present in first paragraph.' };
    },
  },
  {
    id: 'keyword.density.healthy',
    category: 'keyword-optimization',
    weight: 1,
    label: 'No keyword stuffing (unhealthy density)',
    run: ({ $ }) => {
      const text = $('body').text().toLowerCase();
      const words = text.split(/\s+/).filter((w) => w.length > 4);
      if (words.length < 100) return { passed: true, severity: 'skip', message: 'Too little body text to evaluate.' };
      const counts = {};
      for (const w of words) counts[w] = (counts[w] || 0) + 1;
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const top = entries[0];
      if (!top) return { passed: true, message: 'OK.' };
      const density = top[1] / words.length;
      if (density > 0.04) {
        return { passed: false, severity: 'warning', message: `Word "${top[0]}" appears ${top[1]}× (${(density * 100).toFixed(1)}% density) — looks like stuffing.`, fix: 'Keyword density above 3-4% triggers Google penalties. Rewrite with synonyms and natural variation.' };
      }
      return { passed: true, message: 'Keyword density healthy (no stuffing).' };
    },
  },
  {
    id: 'keyword.in.meta.description',
    category: 'keyword-optimization',
    weight: 2,
    label: 'Primary keyword appears in meta description',
    run: ({ $ }) => {
      const desc = ($('meta[name="description"]').attr('content') || '').toLowerCase();
      const h1 = ($('h1').first().text() || '').toLowerCase();
      if (!desc || !h1) return { passed: false, severity: 'skip', message: 'No meta description or H1.' };
      const stopwords = new Set(['the', 'and', 'for', 'with', 'your', 'our']);
      const h1Words = h1.split(/\s+/).filter((w) => w.length > 4 && !stopwords.has(w));
      if (h1Words.length === 0) return { passed: true, severity: 'skip', message: 'H1 too short.' };
      const found = h1Words.some((w) => desc.includes(w));
      if (!found) {
        return { passed: false, severity: 'warning', message: 'Meta description does not contain primary keyword.', fix: 'Bold-keyword in meta description boosts SERP CTR by 5-15%. Include the primary keyword Google will bold for the user\'s query.' };
      }
      return { passed: true, message: 'Primary keyword in meta description.' };
    },
  },
  {
    id: 'keyword.heading.diversity',
    category: 'keyword-optimization',
    weight: 1,
    label: 'Subheadings use keyword variations (not just primary)',
    run: ({ $ }) => {
      const subs = $('h2, h3').toArray().map((el) => $(el).text().toLowerCase());
      if (subs.length < 2) return { passed: true, severity: 'skip', message: 'Too few subheadings.' };
      const h1 = ($('h1').first().text() || '').toLowerCase();
      const h1Words = h1.split(/\s+/).filter((w) => w.length > 4);
      const repetitive = subs.filter((s) => h1Words.some((w) => s.includes(w))).length;
      const ratio = repetitive / subs.length;
      if (ratio > 0.8 && subs.length >= 4) {
        return { passed: false, severity: 'info', message: `${repetitive} of ${subs.length} subheadings repeat the primary keyword.`, fix: 'Use semantic variations (related terms, LSI keywords) in subheadings. Repeating primary keyword in every H2/H3 looks unnatural to Google.' };
      }
      return { passed: true, message: 'Subheadings use natural variation.' };
    },
  },
];
