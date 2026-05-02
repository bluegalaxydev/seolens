/**
 * Heading structure checks: H1 presence, single H1, hierarchy, content length.
 */
export const headingChecks = [
  {
    id: 'heading.h1.present',
    category: 'headings',
    weight: 5,
    label: 'H1 heading present',
    run: ({ $ }) => {
      const h1s = $('h1');
      if (h1s.length === 0) return { passed: false, severity: 'critical', message: 'Page has no <h1>.', fix: 'Add a single <h1> with the primary topic of the page.' };
      return { passed: true, message: `Found ${h1s.length} <h1> heading(s).` };
    },
  },
  {
    id: 'heading.h1.single',
    category: 'headings',
    weight: 3,
    label: 'Single H1 per page',
    run: ({ $ }) => {
      const count = $('h1').length;
      if (count === 0) return { passed: false, severity: 'skip', message: 'No H1 — see heading.h1.present.' };
      if (count > 1) return { passed: false, severity: 'warning', message: `Found ${count} <h1> tags. Best practice is exactly one.`, fix: 'Demote secondary <h1> tags to <h2> to keep a single page topic.' };
      return { passed: true, message: 'Exactly one <h1>.' };
    },
  },
  {
    id: 'heading.hierarchy',
    category: 'headings',
    weight: 2,
    label: 'Heading hierarchy is well-formed',
    run: ({ $ }) => {
      const headings = $('h1, h2, h3, h4, h5, h6').toArray();
      let lastLevel = 0;
      const skipped = [];
      for (const h of headings) {
        const level = parseInt(h.tagName.slice(1), 10);
        if (lastLevel > 0 && level > lastLevel + 1) {
          skipped.push(`<h${lastLevel}> → <h${level}>`);
        }
        lastLevel = level;
      }
      if (skipped.length) return { passed: false, severity: 'warning', message: `Heading levels skipped at: ${skipped.slice(0, 3).join(', ')}${skipped.length > 3 ? `, +${skipped.length - 3} more` : ''}.`, fix: 'Use heading levels sequentially (h1 → h2 → h3) without skipping levels.' };
      return { passed: true, message: 'Heading hierarchy is well-formed.' };
    },
  },
  {
    id: 'heading.h1.length',
    category: 'headings',
    weight: 2,
    label: 'H1 content is meaningful (≥ 10 chars)',
    run: ({ $ }) => {
      const h1 = $('h1').first().text().trim();
      if (!h1) return { passed: false, severity: 'skip', message: 'No H1 — see heading.h1.present.' };
      if (h1.length < 10) return { passed: false, severity: 'warning', message: `H1 is only "${h1}" (${h1.length} chars).`, fix: 'Use a descriptive H1 of 10-70 characters.' };
      if (h1.length > 70) return { passed: false, severity: 'info', message: `H1 is ${h1.length} chars — consider shortening.`, fix: 'Tighten the H1 to under 70 characters for clarity.' };
      return { passed: true, message: `H1: "${h1}"` };
    },
  },
];
