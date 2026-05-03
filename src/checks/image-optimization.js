/**
 * Image optimization checks. Small-business sites almost universally fail these
 * — they upload phone photos at 3000px and serve them as JPEGs.
 */
export const imageOptimizationChecks = [
  {
    id: 'imgopt.modern.formats',
    category: 'image-optimization',
    weight: 3,
    label: 'Images use modern formats (WebP/AVIF)',
    run: ({ $ }) => {
      const imgs = $('img[src], source[srcset], img[srcset]').toArray();
      if (imgs.length === 0) return { passed: true, severity: 'skip', message: 'No images on page.' };
      const modern = imgs.filter((el) => {
        const src = ($(el).attr('src') || $(el).attr('srcset') || '').toLowerCase();
        return /\.(webp|avif)\b/.test(src);
      }).length;
      const ratio = modern / imgs.length;
      if (ratio === 0) {
        return { passed: false, severity: 'warning', message: `0 of ${imgs.length} images use WebP/AVIF.`, fix: 'Convert images to WebP (or AVIF). Saves 25-50% bytes vs JPEG/PNG with no quality loss. Most CDNs do this automatically.' };
      }
      if (ratio < 0.5) return { passed: false, severity: 'info', message: `Only ${modern} of ${imgs.length} images use modern formats.`, fix: 'Migrate remaining images to WebP/AVIF for further byte savings.' };
      return { passed: true, message: `${modern}/${imgs.length} images use WebP/AVIF.` };
    },
  },
  {
    id: 'imgopt.descriptive.filenames',
    category: 'image-optimization',
    weight: 1,
    label: 'Image filenames are descriptive (not IMG_1234)',
    run: ({ $ }) => {
      const imgs = $('img[src]').toArray();
      if (imgs.length === 0) return { passed: true, severity: 'skip', message: 'No images.' };
      const generic = imgs.filter((el) => {
        const src = $(el).attr('src') || '';
        const filename = src.split('/').pop() || '';
        return /^(img|image|photo|pic|dsc|untitled)[-_]?\d+\.(jpg|jpeg|png|gif|webp)/i.test(filename) || /^[\d-_]{8,}\.(jpg|jpeg|png|gif|webp)/i.test(filename);
      }).length;
      if (generic === 0) return { passed: true, message: 'Image filenames look descriptive.' };
      const ratio = generic / imgs.length;
      if (ratio > 0.5) return { passed: false, severity: 'warning', message: `${generic} of ${imgs.length} images have generic filenames (IMG_1234.jpg, DSC_001.jpg).`, fix: 'Rename images to descriptive slugs like "huntington-beach-insurance-office.jpg". Image filenames are a ranking signal.' };
      return { passed: false, severity: 'info', message: `${generic} image(s) with generic filenames.`, fix: 'Use descriptive filenames for SEO. Phone-camera defaults like IMG_1234.jpg waste an SEO opportunity.' };
    },
  },
  {
    id: 'imgopt.alt.length',
    category: 'image-optimization',
    weight: 2,
    label: 'Alt text is meaningful length (not too short, not stuffed)',
    run: ({ $ }) => {
      const imgs = $('img[alt]').toArray().filter((el) => ($(el).attr('alt') || '').length > 0);
      if (imgs.length === 0) return { passed: true, severity: 'skip', message: 'No alt-tagged images.' };
      const tooShort = imgs.filter((el) => ($(el).attr('alt') || '').trim().length < 5).length;
      const tooLong = imgs.filter((el) => ($(el).attr('alt') || '').length > 125).length;
      const issues = [];
      if (tooShort > 0) issues.push(`${tooShort} too short (<5 chars)`);
      if (tooLong > 0) issues.push(`${tooLong} too long (>125 chars, likely stuffed)`);
      if (issues.length === 0) return { passed: true, message: `Alt text length looks healthy on ${imgs.length} images.` };
      return { passed: false, severity: 'info', message: `Alt text length issues: ${issues.join(', ')}.`, fix: 'Aim for 8-100 character alt text that describes the image meaningfully. Single-word or stuffed alt text both hurt rankings.' };
    },
  },
  {
    id: 'imgopt.responsive.density',
    category: 'image-optimization',
    weight: 2,
    label: 'Hero/large images use srcset for responsive loading',
    run: ({ $ }) => {
      const imgs = $('img').toArray();
      if (imgs.length < 3) return { passed: true, severity: 'skip', message: 'Few images.' };
      const responsive = imgs.filter((el) => $(el).attr('srcset') || $(el).parent('picture').length).length;
      const ratio = responsive / imgs.length;
      if (ratio === 0) {
        return { passed: false, severity: 'warning', message: `${imgs.length} images, none use srcset/<picture>.`, fix: 'Use srcset to serve smaller images on mobile. Critical for Core Web Vitals — a 3000px image on a 400px screen wastes 90% of bandwidth.' };
      }
      if (ratio < 0.3) return { passed: false, severity: 'info', message: `Only ${responsive} of ${imgs.length} images responsive.`, fix: 'Add srcset to remaining hero/content images.' };
      return { passed: true, message: `${responsive}/${imgs.length} images responsive.` };
    },
  },
  {
    id: 'imgopt.image.count',
    category: 'image-optimization',
    weight: 1,
    label: 'Image count is reasonable for page weight',
    run: ({ $ }) => {
      const count = $('img').length;
      if (count === 0) return { passed: true, severity: 'skip', message: 'No images.' };
      if (count <= 30) return { passed: true, message: `${count} images — within reason.` };
      if (count <= 60) return { passed: false, severity: 'info', message: `${count} images on page.`, fix: 'High image counts can impact page weight. Verify all are necessary and lazy-loaded.' };
      return { passed: false, severity: 'warning', message: `${count} images on page — heavy.`, fix: 'Consider pagination, lazy loading below the fold, or removing decorative images.' };
    },
  },
  {
    id: 'imgopt.decorative.alt',
    category: 'image-optimization',
    weight: 1,
    label: 'Decorative images use empty alt (alt="")',
    run: ({ $ }) => {
      // Hard to detect without context; flag if NO images use empty alt — possible they should
      const total = $('img[alt]').length;
      const emptyAlt = $('img[alt=""]').length;
      const informativeAlt = total - emptyAlt;
      if (total === 0) return { passed: true, severity: 'skip', message: 'No alt-tagged images.' };
      if (informativeAlt > 10 && emptyAlt === 0) {
        return { passed: false, severity: 'info', message: 'No images use alt="" — likely some decorative images are over-described.', fix: 'Pure decoration (icons, dividers) should use alt="" so screen readers skip them. Saves user friction.' };
      }
      return { passed: true, message: `${emptyAlt} decorative + ${informativeAlt} informative — looks balanced.` };
    },
  },
];
