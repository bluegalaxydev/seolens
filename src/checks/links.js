/**
 * Link checks: internal links present, anchor text quality, rel attributes.
 */
export const linkChecks = [
  {
    id: 'link.internal.present',
    category: 'links',
    weight: 2,
    label: 'Page has internal links',
    run: ({ $, url }) => {
      const host = safeHost(url);
      const links = $('a[href]').toArray();
      const internal = links.filter((el) => {
        const href = $(el).attr('href') || '';
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return true;
        try {
          const u = new URL(href);
          return u.host === host;
        } catch {
          return false;
        }
      });
      if (internal.length === 0) return { passed: false, severity: 'warning', message: 'No internal links found on page.', fix: 'Add internal links to related pages — helps Google discover and rank your other pages.' };
      return { passed: true, message: `${internal.length} internal links found.` };
    },
  },
  {
    id: 'link.anchor.descriptive',
    category: 'links',
    weight: 2,
    label: 'Anchor text is descriptive',
    run: ({ $ }) => {
      const generic = ['click here', 'here', 'read more', 'more', 'this', 'link'];
      const links = $('a[href]').toArray();
      const bad = links.filter((el) => {
        const text = ($(el).text() || '').trim().toLowerCase();
        return generic.includes(text);
      });
      if (bad.length === 0) return { passed: true, message: 'Anchor text looks descriptive.' };
      return { passed: false, severity: 'info', message: `${bad.length} link(s) use generic anchor text like "click here" or "read more".`, fix: 'Use descriptive anchor text that hints at the destination — better for SEO and accessibility.' };
    },
  },
  {
    id: 'link.external.rel',
    category: 'links',
    weight: 1,
    label: 'External links have rel attributes',
    run: ({ $, url }) => {
      const host = safeHost(url);
      const links = $('a[href]').toArray();
      const external = links.filter((el) => {
        const href = $(el).attr('href') || '';
        if (!href.startsWith('http')) return false;
        try {
          return new URL(href).host !== host;
        } catch {
          return false;
        }
      });
      if (external.length === 0) return { passed: true, message: 'No external links on page.' };
      const missingRel = external.filter((el) => !($(el).attr('rel') || '').includes('noopener'));
      if (missingRel.length === 0) return { passed: true, message: `All ${external.length} external links use rel="noopener".` };
      return { passed: false, severity: 'info', message: `${missingRel.length} external links missing rel="noopener" (security best practice).`, fix: 'Add rel="noopener noreferrer" to external links opened via target="_blank".' };
    },
  },
];

function safeHost(u) {
  try { return new URL(u).host; } catch { return ''; }
}
