/**
 * E-E-A-T checks (Experience, Expertise, Authoritativeness, Trust).
 * Google's quality raters explicitly look for these signals. Sites without
 * them get suppressed in YMYL (Your Money or Your Life) categories like
 * insurance, finance, health, legal — exactly the kinds of clients SEO
 * consultants pitch.
 */
export const eeatChecks = [
  {
    id: 'eeat.author.byline',
    category: 'eeat',
    weight: 2,
    label: 'Author byline visible on content',
    run: ({ $ }) => {
      const looksLikeContent = $('article, main p').length > 3;
      if (!looksLikeContent) return { passed: true, severity: 'skip', message: 'Not a content page.' };
      const bylinePatterns = $('[rel="author"], [class*="author" i], [itemprop="author"]').length > 0;
      const text = $('body').text();
      const bylineText = /\bby\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text);
      if (!bylinePatterns && !bylineText) {
        return { passed: false, severity: 'warning', message: 'No author byline detected.', fix: 'Display author name, photo, and credentials. E-E-A-T signals heavily affect ranking in YMYL niches (health, finance, legal, insurance).' };
      }
      return { passed: true, message: 'Author byline present.' };
    },
  },
  {
    id: 'eeat.last.updated',
    category: 'eeat',
    weight: 2,
    label: 'Content shows last-updated or published date',
    run: ({ $ }) => {
      const looksLikeContent = $('article, main p').length > 3;
      if (!looksLikeContent) return { passed: true, severity: 'skip', message: 'Not a content page.' };
      const hasTime = $('time[datetime]').length > 0;
      const hasMeta = $('meta[property="article:published_time"], meta[property="article:modified_time"], meta[name="last-modified"]').length > 0;
      const text = $('body').text();
      const datePattern = /\b(updated|published|posted|written)\s+(?:on\s+)?(?:[A-Z][a-z]+\s+\d+,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i;
      const hasDateText = datePattern.test(text);
      if (!hasTime && !hasMeta && !hasDateText) {
        return { passed: false, severity: 'warning', message: 'No publication or last-updated date detected.', fix: 'Show "Last updated: [date]" on every content page. Freshness is a ranking factor and a trust signal for users.' };
      }
      return { passed: true, message: 'Date metadata present.' };
    },
  },
  {
    id: 'eeat.about.depth',
    category: 'eeat',
    weight: 2,
    label: 'About page link present',
    run: ({ $ }) => {
      const links = $('a[href]').toArray();
      const aboutLinks = links.filter((el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        const text = ($(el).text() || '').toLowerCase();
        return /\babout\b/.test(href) || /\babout\s+(us|me|the company)\b/.test(text);
      });
      if (aboutLinks.length === 0) {
        return { passed: false, severity: 'warning', message: 'No About page link.', fix: 'Every site needs an About page with founder/team info, founding year, and credentials. Critical for trust in YMYL niches.' };
      }
      return { passed: true, message: 'About page link present.' };
    },
  },
  {
    id: 'eeat.contact.access',
    category: 'eeat',
    weight: 2,
    label: 'Multiple contact methods (phone + email + form)',
    run: ({ $ }) => {
      const phone = /\b(\+?\d[\d\s().-]{6,}\d)\b/.test($('body').text()) || $('a[href^="tel:"]').length > 0;
      const email = $('a[href^="mailto:"]').length > 0 || /\b[\w.-]+@[\w.-]+\.\w+\b/.test($('body').text());
      const form = $('form input[type="email"], form input[name*="email" i]').length > 0;
      const count = [phone, email, form].filter(Boolean).length;
      if (count === 0) return { passed: false, severity: 'critical', message: 'No phone, email, or contact form found.', fix: 'Add multiple contact methods. Pages without contact info can be suppressed by Google as low-quality / scammy.' };
      if (count === 1) return { passed: false, severity: 'warning', message: `Only ${count} contact method(s) detected.`, fix: 'Provide phone + email + form. Multiple contact methods are a basic trust signal.' };
      return { passed: true, message: `${count} contact methods present.` };
    },
  },
  {
    id: 'eeat.outbound.citations',
    category: 'eeat',
    weight: 1,
    label: 'Page cites authoritative external sources',
    run: ({ $, url }) => {
      let host;
      try { host = new URL(url).host; } catch { return { passed: true, severity: 'skip', message: 'Cannot parse URL.' }; }
      const externalLinks = $('a[href^="http"]').toArray().filter((el) => {
        try { return new URL($(el).attr('href') || '').host !== host; } catch { return false; }
      });
      const looksLikeContent = $('article, main p').length > 3;
      if (!looksLikeContent) return { passed: true, severity: 'skip', message: 'Not a content page.' };
      if (externalLinks.length === 0) {
        return { passed: false, severity: 'warning', message: 'No outbound citations to external sources.', fix: 'Content pages without citations look thin and unauthoritative. Link to gov, edu, or established industry sources where appropriate.' };
      }
      return { passed: true, message: `${externalLinks.length} outbound link(s).` };
    },
  },
  {
    id: 'eeat.testimonials',
    category: 'eeat',
    weight: 2,
    label: 'Customer testimonials or reviews visible',
    run: ({ $ }) => {
      const text = $('body').text().toLowerCase();
      const indicators = [
        /\btestimonials?\b/, /\bclient (reviews?|stories?)\b/, /\bcase stud(?:y|ies)\b/,
        /\b(\d+\s+star|⭐|★){2,}\b/, /\b\d{2,}\s+(reviews?|customers? love|trusted)\b/,
        /\b(what (?:our|customers?|clients?) say|customer testimonials)\b/,
      ];
      const hits = indicators.filter((p) => p.test(text)).length;
      const reviewsBlock = $('[class*="testimonial" i], [class*="review" i], [class*="quote" i]').length;
      if (hits === 0 && reviewsBlock < 2) {
        return { passed: false, severity: 'warning', message: 'No testimonials, reviews, or case studies detected.', fix: 'Add 3-5 customer testimonials with names and photos. Social proof lifts conversion 15-30% and signals trust to Google.' };
      }
      return { passed: true, message: 'Customer testimonials/reviews present.' };
    },
  },
];
