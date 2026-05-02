/**
 * HTML compliance / validation checks.
 * Catches structural problems that confuse search engines and break parsers.
 */
export const htmlComplianceChecks = [
  {
    id: 'html.doctype',
    category: 'html-compliance',
    weight: 3,
    label: 'DOCTYPE declared',
    run: ({ html }) => {
      const top = html.slice(0, 200).toLowerCase().trim();
      if (!top.startsWith('<!doctype')) {
        return { passed: false, severity: 'warning', message: 'No <!DOCTYPE html> declaration at top of file. Browsers fall back to quirks mode.', fix: 'Add <!DOCTYPE html> as the first line of the HTML document.' };
      }
      if (!top.startsWith('<!doctype html>') && !top.startsWith('<!doctype html ')) {
        return { passed: false, severity: 'info', message: 'Non-standard DOCTYPE detected.', fix: 'Use the modern HTML5 DOCTYPE: <!DOCTYPE html>.' };
      }
      return { passed: true, message: 'HTML5 DOCTYPE declared.' };
    },
  },
  {
    id: 'html.head.charset.position',
    category: 'html-compliance',
    weight: 2,
    label: 'Charset declared in first 1024 bytes',
    run: ({ html }) => {
      const head = html.slice(0, 1024);
      if (!/<meta[^>]+charset/i.test(head)) {
        return { passed: false, severity: 'warning', message: 'Charset not declared in first 1024 bytes — some browsers may misinterpret encoding.', fix: 'Place <meta charset="utf-8"> as the first child of <head>.' };
      }
      return { passed: true, message: 'Charset declared early in <head>.' };
    },
  },
  {
    id: 'html.deprecated.tags',
    category: 'html-compliance',
    weight: 2,
    label: 'No deprecated HTML elements',
    run: ({ $ }) => {
      const deprecated = ['center', 'font', 'marquee', 'blink', 'big', 'tt', 'frame', 'frameset'];
      const found = [];
      for (const tag of deprecated) {
        const count = $(tag).length;
        if (count) found.push(`${tag}(${count})`);
      }
      if (found.length === 0) return { passed: true, message: 'No deprecated HTML elements.' };
      return { passed: false, severity: 'warning', message: `Deprecated elements in use: ${found.join(', ')}.`, fix: 'Replace with modern HTML/CSS — these elements are not supported in HTML5.' };
    },
  },
  {
    id: 'html.semantic.landmarks',
    category: 'html-compliance',
    weight: 3,
    label: 'Semantic landmarks present (header/main/footer/nav)',
    run: ({ $ }) => {
      const present = [];
      if ($('main').length) present.push('main');
      if ($('header').length) present.push('header');
      if ($('footer').length) present.push('footer');
      if ($('nav').length) present.push('nav');
      if ($('article').length) present.push('article');
      if ($('section').length) present.push('section');
      if (present.length < 2) {
        return { passed: false, severity: 'warning', message: `Only ${present.length} semantic landmark(s) found. Page relies on <div>s for structure.`, fix: 'Use <header>, <main>, <footer>, <nav> — Google uses these to understand page structure.' };
      }
      return { passed: true, message: `Semantic landmarks: ${present.join(', ')}.` };
    },
  },
  {
    id: 'html.inline.styles',
    category: 'html-compliance',
    weight: 1,
    label: 'Limited inline styles',
    run: ({ $ }) => {
      const count = $('[style]').length;
      if (count > 50) return { passed: false, severity: 'info', message: `${count} elements use inline styles. Increases HTML size and hurts cacheability.`, fix: 'Move inline styles to a stylesheet for better performance and maintainability.' };
      return { passed: true, message: count === 0 ? 'No inline styles.' : `${count} inline-styled element(s) — within reason.` };
    },
  },
  {
    id: 'html.script.count',
    category: 'html-compliance',
    weight: 2,
    label: 'Reasonable script tag count',
    run: ({ $ }) => {
      const total = $('script').length;
      const inline = $('script:not([src])').length;
      const external = total - inline;
      if (total > 30) return { passed: false, severity: 'warning', message: `${total} script tags (${external} external, ${inline} inline). Consider bundling.`, fix: 'Bundle scripts to reduce request count and parser overhead.' };
      return { passed: true, message: `${total} script tags — within reason.` };
    },
  },
  {
    id: 'html.meta.duplicates',
    category: 'html-compliance',
    weight: 2,
    label: 'No duplicate meta tags',
    run: ({ $ }) => {
      const seen = new Map();
      const duplicates = [];
      $('head meta').each((_, el) => {
        const $el = $(el);
        const key = $el.attr('name') || $el.attr('property') || $el.attr('http-equiv');
        if (!key) return;
        const count = (seen.get(key) || 0) + 1;
        seen.set(key, count);
        if (count === 2) duplicates.push(key);
      });
      if (duplicates.length === 0) return { passed: true, message: 'No duplicate meta tags.' };
      return { passed: false, severity: 'warning', message: `Duplicate meta tags: ${duplicates.slice(0, 4).join(', ')}.`, fix: 'Remove duplicates. Search engines may pick whichever they prefer, leading to inconsistent SERP display.' };
    },
  },
  {
    id: 'html.title.in.head',
    category: 'html-compliance',
    weight: 2,
    label: '<title> is inside <head>',
    run: ({ $ }) => {
      const inHead = $('head > title').length;
      const total = $('title').length;
      if (total === 0) return { passed: false, severity: 'skip', message: 'No <title> at all.' };
      if (inHead === 0) return { passed: false, severity: 'critical', message: '<title> exists but is not inside <head>.', fix: 'Move <title> into <head>. Some browsers and crawlers ignore titles outside head.' };
      if (total > 1) return { passed: false, severity: 'warning', message: `${total} <title> tags found — only the first is used.`, fix: 'Remove all but one <title> from the document.' };
      return { passed: true, message: '<title> properly placed in <head>.' };
    },
  },
];
