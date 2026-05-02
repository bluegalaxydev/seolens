/**
 * Image checks: alt text coverage, dimensions.
 */
export const imageChecks = [
  {
    id: 'image.alt.coverage',
    category: 'images',
    weight: 4,
    label: 'All images have alt text',
    run: ({ $ }) => {
      const imgs = $('img').toArray();
      if (imgs.length === 0) return { passed: true, message: 'No <img> tags on page.' };
      const missing = imgs.filter((el) => {
        const alt = $(el).attr('alt');
        return alt === undefined;
      });
      if (missing.length === 0) return { passed: true, message: `All ${imgs.length} images have alt attributes.` };
      const ratio = missing.length / imgs.length;
      const severity = ratio > 0.3 ? 'critical' : 'warning';
      const examples = missing.slice(0, 3).map((el) => $(el).attr('src') || '(no src)').join(', ');
      return { passed: false, severity, message: `${missing.length} of ${imgs.length} images missing alt attribute. Examples: ${examples}.`, fix: 'Add descriptive alt text to all <img> tags. Use alt="" for purely decorative images.' };
    },
  },
  {
    id: 'image.dimensions',
    category: 'images',
    weight: 1,
    label: 'Images have width/height attributes',
    run: ({ $ }) => {
      const imgs = $('img').toArray();
      if (imgs.length === 0) return { passed: true, message: 'No images on page.' };
      const missing = imgs.filter((el) => {
        const w = $(el).attr('width');
        const h = $(el).attr('height');
        return !w || !h;
      });
      if (missing.length === 0) return { passed: true, message: 'All images declare width and height.' };
      return { passed: false, severity: 'info', message: `${missing.length} of ${imgs.length} images missing width/height — can cause CLS (layout shift).`, fix: 'Add explicit width and height attributes to <img> tags to prevent layout shift.' };
    },
  },
];
