/**
 * Deep Schema.org / structured data checks. Augments structured-data.js
 * with type-specific validation that drives Google rich results.
 */
export const schemaDeepChecks = [
  {
    id: 'schema.organization',
    category: 'schema-deep',
    weight: 2,
    label: 'Organization schema declared',
    run: ({ $ }) => {
      const types = collectSchemaTypes($);
      if (types.has('Organization') || types.has('Corporation') || types.has('LocalBusiness')) {
        return { passed: true, message: `Organization-class schema present (${[...types].filter((t) => /Organization|Corporation|Business/.test(t)).join(', ')}).` };
      }
      return { passed: false, severity: 'info', message: 'No Organization schema found.', fix: 'Add Organization JSON-LD with name, url, logo, sameAs (social profiles). Powers Google Knowledge Panel.' };
    },
  },
  {
    id: 'schema.website.searchbox',
    category: 'schema-deep',
    weight: 1,
    label: 'WebSite schema with SearchAction',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      let hasWebsite = false;
      let hasSearchAction = false;
      for (const s of scripts) {
        try {
          const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
          const json = JSON.stringify(data);
          if (/"@type"\s*:\s*"WebSite"/.test(json)) hasWebsite = true;
          if (/"@type"\s*:\s*"SearchAction"/.test(json) || /"potentialAction"/.test(json)) hasSearchAction = true;
        } catch { /* ignore */ }
      }
      if (!hasWebsite) return { passed: false, severity: 'info', message: 'No WebSite schema. Misses out on sitelinks searchbox.', fix: 'Add WebSite JSON-LD with potentialAction → SearchAction so Google can show a sitelinks search box.' };
      if (!hasSearchAction) return { passed: false, severity: 'info', message: 'WebSite schema present but no SearchAction.', fix: 'Add potentialAction with SearchAction inside the WebSite schema for sitelinks search.' };
      return { passed: true, message: 'WebSite + SearchAction schema present.' };
    },
  },
  {
    id: 'schema.faq',
    category: 'schema-deep',
    weight: 1,
    label: 'FAQ schema (when applicable)',
    run: ({ $ }) => {
      const types = collectSchemaTypes($);
      // Detect if page has FAQ-like content: many <details>/<summary> or "Q:"/"A:" patterns
      const hasFaqMarkup = $('details, summary').length >= 3 || /\bFAQ\b|frequently asked/i.test($('body').text());
      if (!hasFaqMarkup) return { passed: true, severity: 'skip', message: 'No FAQ-like content on this page.' };
      if (types.has('FAQPage')) return { passed: true, message: 'FAQPage schema present.' };
      return { passed: false, severity: 'info', message: 'FAQ-like content detected but no FAQPage schema.', fix: 'Wrap FAQ items in FAQPage JSON-LD to qualify for Google FAQ rich results.' };
    },
  },
  {
    id: 'schema.article',
    category: 'schema-deep',
    weight: 1,
    label: 'Article schema (for blog/news content)',
    run: ({ $ }) => {
      const types = collectSchemaTypes($);
      const looksLikeArticle = $('article').length > 0 || $('time[datetime]').length > 0 || $('meta[property="article:published_time"]').length > 0;
      if (!looksLikeArticle) return { passed: true, severity: 'skip', message: 'Page is not an article.' };
      if (types.has('Article') || types.has('BlogPosting') || types.has('NewsArticle')) {
        return { passed: true, message: 'Article schema present.' };
      }
      return { passed: false, severity: 'info', message: 'Article-like page but no Article/BlogPosting schema.', fix: 'Add Article JSON-LD with headline, author, datePublished, image. Required for Google News and Top Stories.' };
    },
  },
  {
    id: 'schema.required.fields',
    category: 'schema-deep',
    weight: 2,
    label: 'Schema.org required fields populated',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      if (scripts.length === 0) return { passed: true, severity: 'skip', message: 'No JSON-LD on page.' };
      const issues = [];
      for (const s of scripts) {
        try {
          const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
          const objs = Array.isArray(data) ? data : [data];
          for (const obj of objs) {
            const t = obj['@type'];
            if (t === 'Article' || t === 'BlogPosting' || t === 'NewsArticle') {
              if (!obj.headline) issues.push(`${t}: missing headline`);
              if (!obj.author) issues.push(`${t}: missing author`);
              if (!obj.datePublished) issues.push(`${t}: missing datePublished`);
            } else if (t === 'Product') {
              if (!obj.name) issues.push('Product: missing name');
              if (!obj.offers) issues.push('Product: missing offers');
            } else if (t === 'Organization') {
              if (!obj.name) issues.push('Organization: missing name');
              if (!obj.url) issues.push('Organization: missing url');
            } else if (t === 'LocalBusiness') {
              if (!obj.address) issues.push('LocalBusiness: missing address');
              if (!obj.telephone) issues.push('LocalBusiness: missing telephone');
            }
          }
        } catch { /* ignore */ }
      }
      if (issues.length) return { passed: false, severity: 'warning', message: `Schema.org issues: ${issues.slice(0, 3).join('; ')}.`, fix: 'Validate with Google Rich Results Test. Required fields must be present for rich results.' };
      return { passed: true, message: 'Required Schema.org fields look good.' };
    },
  },
];

function collectSchemaTypes($) {
  const types = new Set();
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
      const objs = Array.isArray(data) ? data : [data];
      for (const o of objs) {
        const t = o['@type'];
        if (typeof t === 'string') types.add(t);
        else if (Array.isArray(t)) t.forEach((x) => types.add(x));
      }
    } catch { /* ignore */ }
  });
  return types;
}
