/**
 * Structured data checks: JSON-LD presence and basic validity.
 */
export const structuredDataChecks = [
  {
    id: 'schema.jsonld.present',
    category: 'structured-data',
    weight: 3,
    label: 'JSON-LD structured data present',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      if (scripts.length === 0) return { passed: false, severity: 'warning', message: 'No JSON-LD structured data found.', fix: 'Add Schema.org JSON-LD (e.g. Organization, Article, Product) to enable rich results in Google.' };
      return { passed: true, message: `${scripts.length} JSON-LD block(s) found.` };
    },
  },
  {
    id: 'schema.jsonld.valid',
    category: 'structured-data',
    weight: 2,
    label: 'JSON-LD parses correctly',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      if (scripts.length === 0) return { passed: false, severity: 'skip', message: 'No JSON-LD — see schema.jsonld.present.' };
      const broken = [];
      const types = [];
      for (const s of scripts) {
        const txt = $(s).contents().text() || $(s).html() || '';
        try {
          const parsed = JSON.parse(txt);
          if (parsed['@type']) types.push(parsed['@type']);
          else if (Array.isArray(parsed)) parsed.forEach((p) => p['@type'] && types.push(p['@type']));
        } catch (err) {
          broken.push(err.message.slice(0, 80));
        }
      }
      if (broken.length) return { passed: false, severity: 'critical', message: `${broken.length} JSON-LD block(s) failed to parse.`, fix: 'Validate your JSON-LD with the Google Rich Results Test.' };
      const flatTypes = types.flat();
      return { passed: true, message: `Valid JSON-LD types: ${flatTypes.join(', ') || 'unknown'}.` };
    },
  },
];
