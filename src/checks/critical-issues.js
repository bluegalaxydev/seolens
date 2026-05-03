/**
 * "Critical issues" — patterns that small business sites consistently fail.
 * These are aggressive heuristics meant to catch the absent fundamentals
 * (clear value prop, brand consistency, quantified claims) that separate
 * professional sites from amateur ones.
 */
export const criticalIssueChecks = [
  {
    id: 'crit.title.generic',
    category: 'critical-issues',
    weight: 4,
    label: 'Title tag is not generic ("Home", "Welcome", "Untitled")',
    run: ({ $ }) => {
      const title = $('head > title').text().trim().toLowerCase();
      if (!title) return { passed: false, severity: 'skip', message: 'No title tag.' };
      const generic = ['home', 'welcome', 'untitled', 'index', 'page', 'website', 'my site', 'home page', 'homepage'];
      if (generic.includes(title)) {
        return { passed: false, severity: 'critical', message: `Title is "${title}" — completely generic.`, fix: 'Replace with a keyword-rich title like "Independent Insurance Agency in Huntington Beach, CA · J G Petit". Generic titles destroy SERP CTR.' };
      }
      // Detect "site name only" pattern
      if (title.length < 15 && !/[A-Z]{2,}/.test(title) && !/[a-z]+ (in|for|with|by) /.test(title)) {
        return { passed: false, severity: 'warning', message: `Title "${title}" is very short — likely just brand name.`, fix: 'Add a descriptor: "Brand · what you do · location/benefit". Titles should answer "why click?".' };
      }
      return { passed: true, message: `Title is specific.` };
    },
  },
  {
    id: 'crit.brand.consistency',
    category: 'critical-issues',
    weight: 3,
    label: 'Brand name consistent across title, OG, and content',
    run: ({ $, url }) => {
      const title = $('head > title').text().trim();
      const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      const h1 = $('h1').first().text().trim();
      let domainBrand = '';
      try { domainBrand = new URL(url).hostname.replace(/^www\./, '').split('.')[0]; } catch {}

      const candidates = [title, ogSiteName, ogTitle, h1, domainBrand].filter(Boolean);
      if (candidates.length < 2) return { passed: true, severity: 'skip', message: 'Not enough brand surfaces to compare.' };
      // Extract brand-like words (capitalized, >3 chars) from each
      const brandHints = new Set();
      for (const c of candidates) {
        const matches = c.match(/[A-Z][a-zA-Z]{2,}/g) || [];
        for (const m of matches) brandHints.add(m.toLowerCase());
      }
      // If there are >5 distinct brand-ish strings, that's a smell
      if (brandHints.size > 6) {
        return { passed: false, severity: 'warning', message: 'Many distinct brand-like names detected. Possible identity inconsistency (different brand names across title/OG/H1/domain).', fix: 'Pick ONE master brand and align logo, page titles, og:site_name, email signature. Inconsistency confuses Google and visitors.' };
      }
      return { passed: true, message: 'Brand identity surfaces look aligned.' };
    },
  },
  {
    id: 'crit.value.quantified',
    category: 'critical-issues',
    weight: 2,
    label: 'Hero copy includes a quantified benefit (number, %, $)',
    run: ({ $ }) => {
      const heroText = ($('h1').text() + ' ' + $('h2').first().text() + ' ' + $('main p, article p, p').first().text()).toLowerCase();
      if (!heroText.trim()) return { passed: false, severity: 'skip', message: 'No hero text detected.' };
      const quantified = /\b(\d+%|\$\d+|\d+x|\d+\s*(years?|hours?|days?|customers?|clients?|reviews?|times?))\b/.test(heroText) ||
                          /\b(saves?|cuts?|reduces?|increases?)\s+\w+\s+by\s+\d+/.test(heroText);
      if (!quantified) {
        return { passed: false, severity: 'warning', message: 'Hero copy has no quantified benefit (no numbers, percentages, dollars).', fix: 'Replace vague claims like "We help businesses grow" with quantified proof: "We helped 200+ insurance agencies cut quote time by 40%."' };
      }
      return { passed: true, message: 'Hero contains quantified benefit.' };
    },
  },
  {
    id: 'crit.cta.above.fold',
    category: 'critical-issues',
    weight: 3,
    label: 'Primary CTA appears in first ~600px of HTML (above the fold)',
    run: ({ html }) => {
      const aboveFold = html.slice(0, 8000).toLowerCase();
      const ctaPatterns = [
        /\b(get started|sign up|book a call|book demo|schedule|contact us|get a quote|request a quote|free quote|buy now|shop now|order now|start free trial|try free|join now)\b/,
      ];
      if (ctaPatterns.some((p) => p.test(aboveFold))) {
        return { passed: true, message: 'CTA copy detected above the fold.' };
      }
      return { passed: false, severity: 'warning', message: 'No clear CTA copy in the top of the page.', fix: 'Place a primary CTA (button + verb) in the hero. Visitors who scroll without seeing a CTA usually leave.' };
    },
  },
  {
    id: 'crit.thin.homepage',
    category: 'critical-issues',
    weight: 3,
    label: 'Homepage is not thin (substantial body content)',
    run: ({ $, url }) => {
      try {
        const u = new URL(url);
        const isHome = u.pathname === '/' || u.pathname === '';
        if (!isHome) return { passed: true, severity: 'skip', message: 'Not the homepage.' };
      } catch { return { passed: true, severity: 'skip', message: 'Cannot parse URL.' }; }

      const text = $('body').clone().find('script,style,noscript,nav,footer,header').remove().end().text().replace(/\s+/g, ' ').trim();
      const words = text.split(' ').filter(Boolean).length;
      if (words < 150) return { passed: false, severity: 'critical', message: `Homepage has only ${words} words — extremely thin.`, fix: 'Homepages with <150 words rarely rank. Add a clear value prop, services overview, and proof section above the fold.' };
      if (words < 300) return { passed: false, severity: 'warning', message: `Homepage has ${words} words — borderline thin.`, fix: 'Aim for 300+ words on the homepage with clear value prop, services, and proof.' };
      return { passed: true, message: `Homepage has ${words} words.` };
    },
  },
  {
    id: 'crit.pricing.transparency',
    category: 'critical-issues',
    weight: 1,
    label: 'Service/product pricing or pricing page accessible',
    run: ({ $ }) => {
      const text = $('body').text();
      const looksCommercial = /\b(buy|purchase|order|book|hire|quote|service|pricing|plans?|packages?)\b/i.test(text);
      if (!looksCommercial) return { passed: true, severity: 'skip', message: 'No commercial intent detected.' };

      const hasPriceText = /[\$€£¥₹]\s*\d/.test(text) || /\b\d+\s*(USD|EUR|GBP)\b/i.test(text);
      const hasPricingPage = $('a[href]').toArray().some((el) => /pricing|plans|packages/i.test($(el).attr('href') || $(el).text() || ''));

      if (!hasPriceText && !hasPricingPage) {
        return { passed: false, severity: 'warning', message: 'No pricing visible and no pricing page link.', fix: 'Show pricing or link to a pricing page. "Contact for pricing" loses you 30-50% of would-be leads who self-qualify by budget.' };
      }
      return { passed: true, message: hasPriceText ? 'Pricing visible.' : 'Pricing page link present.' };
    },
  },
];
