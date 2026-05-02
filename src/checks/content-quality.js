/**
 * Content quality checks. Word count is in advanced.js (Pro). These are
 * lighter heuristics for the free tier — value prop clarity, keyword presence,
 * unique content.
 */
export const contentQualityChecks = [
  {
    id: 'content.value.prop',
    category: 'content',
    weight: 3,
    label: 'Clear value proposition above the fold',
    run: ({ $ }) => {
      const h1 = $('h1').first().text().trim();
      const subhead = $('h2').first().text().trim() || $('h1').first().next('p').text().trim();
      const candidate = (h1 + ' ' + subhead).trim();
      if (candidate.length < 20) {
        return { passed: false, severity: 'warning', message: 'No clear value proposition detected (H1 + subheadline too short).', fix: 'Above the fold, state who you serve and what outcome you deliver in 1-2 sentences. Bad: "Welcome". Good: "Fast SEO audits in 5 seconds — for indie devs and SEO teams."' };
      }
      const generic = ['welcome', 'home', 'homepage', 'untitled'];
      if (generic.includes(candidate.toLowerCase())) {
        return { passed: false, severity: 'warning', message: `Hero is generic ("${candidate}").`, fix: 'Replace generic hero text with a specific value proposition.' };
      }
      return { passed: true, message: `Hero text present (${candidate.length} chars).` };
    },
  },
  {
    id: 'content.headline.length',
    category: 'content',
    weight: 1,
    label: 'H1 headline is concise and meaningful',
    run: ({ $ }) => {
      const h1 = $('h1').first().text().trim();
      if (!h1) return { passed: false, severity: 'skip', message: 'No H1.' };
      if (h1.length > 100) return { passed: false, severity: 'info', message: `H1 is ${h1.length} chars — too long for a hero.`, fix: 'Aim for 30-70 chars. Long H1s look like body copy.' };
      return { passed: true, message: 'H1 length is reasonable.' };
    },
  },
  {
    id: 'content.duplicate.title.h1',
    category: 'content',
    weight: 1,
    label: 'Title tag and H1 differ (or are intentionally aligned)',
    run: ({ $ }) => {
      const title = $('head > title').text().trim();
      const h1 = $('h1').first().text().trim();
      if (!title || !h1) return { passed: true, severity: 'skip', message: 'Missing title or H1.' };
      if (title === h1) return { passed: false, severity: 'info', message: 'Title and H1 are identical. Mild missed opportunity.', fix: 'Keep H1 for users (descriptive), make title for SERP click-through (use brand + benefit).' };
      return { passed: true, message: 'Title and H1 are distinct.' };
    },
  },
  {
    id: 'content.paragraphs',
    category: 'content',
    weight: 1,
    label: 'Page has paragraphs of body copy',
    run: ({ $ }) => {
      const paras = $('p').toArray().filter((el) => $(el).text().trim().length > 50);
      if (paras.length === 0) return { passed: false, severity: 'warning', message: 'No substantive paragraphs (>50 chars) on the page.', fix: 'Pages with no body copy can\'t rank for long-tail queries. Add real prose explaining what you do and why.' };
      return { passed: true, message: `${paras.length} substantive paragraph(s).` };
    },
  },
  {
    id: 'content.keyword.in.title',
    category: 'content',
    weight: 1,
    label: 'H1 keyword appears in <title> (basic alignment)',
    run: ({ $ }) => {
      const title = $('head > title').text().toLowerCase();
      const h1 = $('h1').first().text().toLowerCase();
      if (!title || !h1) return { passed: true, severity: 'skip', message: 'Missing title or H1.' };
      const h1Words = h1.split(/\s+/).filter((w) => w.length > 3);
      if (h1Words.length === 0) return { passed: true, severity: 'skip', message: 'H1 too short.' };
      const overlap = h1Words.filter((w) => title.includes(w)).length;
      if (overlap === 0) {
        return { passed: false, severity: 'warning', message: 'No significant keyword overlap between <title> and H1.', fix: 'The page title and H1 should share at least the primary keyword. Otherwise Google sees mixed signals.' };
      }
      return { passed: true, message: `${overlap} shared keyword(s) between title and H1.` };
    },
  },
];
