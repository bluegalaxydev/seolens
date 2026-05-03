/**
 * Page experience checks. Measures user-perceived friction and quality
 * signals that overlap with Core Web Vitals and Google's page experience update.
 */
export const pageExperienceChecks = [
  {
    id: 'pe.layout.shift.causes',
    category: 'page-experience',
    weight: 2,
    label: 'No common Cumulative Layout Shift causes',
    run: ({ $ }) => {
      const issues = [];
      // Images without dimensions
      const imgs = $('img').toArray();
      const noDims = imgs.filter((el) => !($(el).attr('width') && $(el).attr('height'))).length;
      if (noDims > 0) issues.push(`${noDims} image(s) missing width/height`);
      // Embeds without dimensions
      const embeds = $('iframe, video, embed').toArray();
      const embedNoDims = embeds.filter((el) => !($(el).attr('width') && $(el).attr('height'))).length;
      if (embedNoDims > 0) issues.push(`${embedNoDims} embed(s) missing dimensions`);
      // Web fonts without font-display
      const fontStyles = $('style').filter((_, el) => /@font-face/i.test($(el).text() || '')).toArray();
      const fontDisplay = fontStyles.some((el) => /font-display\s*:/i.test($(el).text() || ''));
      if (fontStyles.length > 0 && !fontDisplay) issues.push('font-face declared without font-display');

      if (issues.length === 0) return { passed: true, message: 'No common CLS causes detected.' };
      return { passed: false, severity: 'warning', message: `CLS risk factors: ${issues.join(', ')}.`, fix: 'Add explicit width/height to all media. Set font-display: swap for web fonts.' };
    },
  },
  {
    id: 'pe.popup.intrusive',
    category: 'page-experience',
    weight: 1,
    label: 'No intrusive interstitials detected',
    run: ({ $, html }) => {
      const lower = (html || '').toLowerCase();
      const popupSignals = [
        /class=["'][^"']*(modal|popup|overlay|interstitial|lightbox)[^"']*["']/g,
        /\bz-index\s*:\s*9{2,}/g,
        /position\s*:\s*fixed[^;]*top\s*:\s*0/g,
      ];
      const matches = popupSignals.reduce((acc, p) => acc + ((lower.match(p) || []).length), 0);
      if (matches === 0) return { passed: true, message: 'No popup/modal markup detected in initial HTML.' };
      if (matches < 3) return { passed: true, message: 'Some modal/popup elements present — likely user-triggered.' };
      return { passed: false, severity: 'info', message: `${matches} popup/modal signals in HTML — may load on entry.`, fix: 'Google penalizes intrusive interstitials on mobile. Avoid full-screen overlays on page load.' };
    },
  },
  {
    id: 'pe.iframe.lazyload',
    category: 'page-experience',
    weight: 1,
    label: 'iframes use loading="lazy"',
    run: ({ $ }) => {
      const iframes = $('iframe').toArray();
      if (iframes.length === 0) return { passed: true, severity: 'skip', message: 'No iframes on page.' };
      const lazy = iframes.filter((el) => $(el).attr('loading') === 'lazy').length;
      if (lazy === iframes.length) return { passed: true, message: `All ${iframes.length} iframe(s) lazy-loaded.` };
      return { passed: false, severity: 'info', message: `${iframes.length - lazy} iframe(s) loading eagerly.`, fix: 'Add loading="lazy" to off-screen iframes (videos, maps, embeds) to improve LCP.' };
    },
  },
  {
    id: 'pe.image.lazyload',
    category: 'page-experience',
    weight: 1,
    label: 'Below-the-fold images use loading="lazy"',
    run: ({ $ }) => {
      const imgs = $('img').toArray();
      if (imgs.length < 5) return { passed: true, severity: 'skip', message: 'Few images on page.' };
      const lazy = imgs.filter((el) => $(el).attr('loading') === 'lazy').length;
      const ratio = lazy / imgs.length;
      if (ratio === 0) return { passed: false, severity: 'warning', message: `${imgs.length} images, none lazy-loaded.`, fix: 'Add loading="lazy" to images below the fold. First-contentful-paint and bandwidth gains.' };
      if (ratio < 0.5) return { passed: false, severity: 'info', message: `Only ${lazy} of ${imgs.length} images lazy-loaded.`, fix: 'Consider lazy-loading more below-the-fold images.' };
      return { passed: true, message: `${lazy} of ${imgs.length} images lazy-loaded.` };
    },
  },
];
