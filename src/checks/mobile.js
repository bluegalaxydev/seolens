/**
 * Mobile / responsive checks. Critical for SEO since Google uses mobile-first indexing.
 */
export const mobileChecks = [
  {
    id: 'mobile.viewport.scalable',
    category: 'mobile',
    weight: 2,
    label: 'Viewport allows user scaling',
    run: ({ $ }) => {
      const v = $('head > meta[name="viewport"]').attr('content') || '';
      if (!v) return { passed: false, severity: 'skip', message: 'No viewport — see meta.viewport.' };
      const blocksScale = /user-scalable\s*=\s*no/i.test(v) || /maximum-scale\s*=\s*1(\.0)?\b/i.test(v);
      if (blocksScale) {
        return { passed: false, severity: 'warning', message: 'Viewport blocks user-scaling (zoom). Hurts accessibility.', fix: 'Remove "user-scalable=no" and "maximum-scale=1" from the viewport meta tag.' };
      }
      return { passed: true, message: 'Viewport allows zoom.' };
    },
  },
  {
    id: 'mobile.responsive.images',
    category: 'mobile',
    weight: 2,
    label: 'Images use srcset or modern formats',
    run: ({ $ }) => {
      const imgs = $('img').toArray();
      if (imgs.length === 0) return { passed: true, severity: 'skip', message: 'No images.' };
      const responsive = imgs.filter((el) => {
        const $el = $(el);
        return $el.attr('srcset') || $el.attr('sizes') || ($el.parent('picture').length > 0);
      }).length;
      const ratio = responsive / imgs.length;
      if (imgs.length >= 5 && ratio < 0.3) {
        return { passed: false, severity: 'info', message: `Only ${responsive} of ${imgs.length} images use srcset/<picture> for responsive loading.`, fix: 'Use srcset and <picture> to serve appropriately-sized images on mobile.' };
      }
      return { passed: true, message: `${responsive}/${imgs.length} images are responsive.` };
    },
  },
  {
    id: 'mobile.font.size',
    category: 'mobile',
    weight: 1,
    label: 'No tiny inline font-sizes',
    run: ({ $ }) => {
      const tiny = $('[style]').filter((_, el) => {
        const style = $(el).attr('style') || '';
        const m = style.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i);
        return m && parseFloat(m[1]) < 12;
      }).length;
      if (tiny === 0) return { passed: true, message: 'No tiny inline fonts (<12px).' };
      return { passed: false, severity: 'info', message: `${tiny} element(s) use inline font-size below 12px.`, fix: 'Body text should be at least 16px on mobile for readability.' };
    },
  },
  {
    id: 'mobile.tap.targets',
    category: 'mobile',
    weight: 1,
    label: 'No tiny tap targets in inline styles',
    run: ({ $ }) => {
      const tappable = $('a, button, input, select').toArray();
      const tiny = tappable.filter((el) => {
        const style = $(el).attr('style') || '';
        const w = style.match(/(?:^|\s|;)width\s*:\s*(\d+(?:\.\d+)?)px/i);
        const h = style.match(/(?:^|\s|;)height\s*:\s*(\d+(?:\.\d+)?)px/i);
        return (w && parseFloat(w[1]) < 24) || (h && parseFloat(h[1]) < 24);
      }).length;
      if (tiny === 0) return { passed: true, message: 'No obviously tiny tap targets in inline styles.' };
      return { passed: false, severity: 'info', message: `${tiny} interactive element(s) sized below 24px in inline styles.`, fix: 'Tap targets should be at least 44x44px (Apple) or 48x48px (Google) for mobile usability.' };
    },
  },
];
