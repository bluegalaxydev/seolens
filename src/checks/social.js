/**
 * Social / Open Graph / Twitter card checks.
 */
export const socialChecks = [
  {
    id: 'social.og.title',
    category: 'social',
    weight: 2,
    label: 'Open Graph title (og:title)',
    run: ({ $ }) => {
      const v = $('meta[property="og:title"]').attr('content');
      if (!v) return { passed: false, severity: 'warning', message: 'Missing og:title — link previews will look bad.', fix: 'Add <meta property="og:title" content="...">.' };
      return { passed: true, message: `og:title: "${v}"` };
    },
  },
  {
    id: 'social.og.description',
    category: 'social',
    weight: 2,
    label: 'Open Graph description (og:description)',
    run: ({ $ }) => {
      const v = $('meta[property="og:description"]').attr('content');
      if (!v) return { passed: false, severity: 'warning', message: 'Missing og:description.', fix: 'Add <meta property="og:description" content="...">.' };
      return { passed: true, message: 'og:description present.' };
    },
  },
  {
    id: 'social.og.image',
    category: 'social',
    weight: 3,
    label: 'Open Graph image (og:image)',
    run: ({ $ }) => {
      const v = $('meta[property="og:image"]').attr('content');
      if (!v) return { passed: false, severity: 'warning', message: 'Missing og:image — link previews will have no image.', fix: 'Add <meta property="og:image" content="https://..."> with a 1200x630 image.' };
      return { passed: true, message: `og:image: ${v}` };
    },
  },
  {
    id: 'social.twitter.card',
    category: 'social',
    weight: 1,
    label: 'Twitter card type declared',
    run: ({ $ }) => {
      const v = $('meta[name="twitter:card"]').attr('content');
      if (!v) return { passed: false, severity: 'info', message: 'Missing twitter:card meta tag.', fix: 'Add <meta name="twitter:card" content="summary_large_image">.' };
      return { passed: true, message: `twitter:card: ${v}` };
    },
  },
];
