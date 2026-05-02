/**
 * Meta tag checks: title, description, charset, viewport, lang.
 */
export const metaChecks = [
  {
    id: 'meta.title.present',
    category: 'meta',
    weight: 5,
    label: 'Title tag present',
    run: ({ $ }) => {
      const title = $('head > title').first().text().trim();
      if (!title) {
        return { passed: false, severity: 'critical', message: 'Page has no <title> tag.', fix: 'Add a unique, descriptive <title> tag to <head>.' };
      }
      return { passed: true, message: `Title: "${title}"`, value: title };
    },
  },
  {
    id: 'meta.title.length',
    category: 'meta',
    weight: 3,
    label: 'Title length is 30-60 characters',
    run: ({ $ }) => {
      const title = $('head > title').first().text().trim();
      if (!title) return { passed: false, severity: 'skip', message: 'No title tag — see meta.title.present.' };
      const len = title.length;
      if (len < 30) return { passed: false, severity: 'warning', message: `Title is only ${len} chars (recommended: 30-60).`, fix: 'Expand the title to 30-60 characters with primary keywords near the front.' };
      if (len > 60) return { passed: false, severity: 'warning', message: `Title is ${len} chars — likely truncated in SERPs (recommended: 30-60).`, fix: 'Tighten the title to 60 characters or fewer.' };
      return { passed: true, message: `Title length OK (${len} chars).` };
    },
  },
  {
    id: 'meta.description.present',
    category: 'meta',
    weight: 4,
    label: 'Meta description present',
    run: ({ $ }) => {
      const desc = $('head > meta[name="description"]').attr('content')?.trim();
      if (!desc) return { passed: false, severity: 'critical', message: 'Page has no <meta name="description">.', fix: 'Add a unique meta description summarizing the page in 120-160 chars.' };
      return { passed: true, message: `Description: "${desc.slice(0, 80)}${desc.length > 80 ? '…' : ''}"`, value: desc };
    },
  },
  {
    id: 'meta.description.length',
    category: 'meta',
    weight: 2,
    label: 'Meta description is 120-160 characters',
    run: ({ $ }) => {
      const desc = $('head > meta[name="description"]').attr('content')?.trim();
      if (!desc) return { passed: false, severity: 'skip', message: 'No description — see meta.description.present.' };
      const len = desc.length;
      if (len < 120) return { passed: false, severity: 'warning', message: `Description is only ${len} chars (recommended: 120-160).`, fix: 'Expand the description with relevant context and a soft CTA.' };
      if (len > 160) return { passed: false, severity: 'warning', message: `Description is ${len} chars — likely truncated in SERPs.`, fix: 'Tighten the description to 160 characters or fewer.' };
      return { passed: true, message: `Description length OK (${len} chars).` };
    },
  },
  {
    id: 'meta.viewport',
    category: 'meta',
    weight: 3,
    label: 'Mobile viewport meta tag',
    run: ({ $ }) => {
      const v = $('head > meta[name="viewport"]').attr('content');
      if (!v) return { passed: false, severity: 'critical', message: 'Missing <meta name="viewport"> — page is not mobile-optimized.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' };
      return { passed: true, message: `Viewport: ${v}` };
    },
  },
  {
    id: 'meta.charset',
    category: 'meta',
    weight: 1,
    label: 'Character encoding declared',
    run: ({ $ }) => {
      const charset = $('head > meta[charset]').attr('charset') || $('head > meta[http-equiv="Content-Type"]').attr('content');
      if (!charset) return { passed: false, severity: 'warning', message: 'No charset declared in <head>.', fix: 'Add <meta charset="utf-8"> as the first child of <head>.' };
      return { passed: true, message: `Charset: ${charset}` };
    },
  },
  {
    id: 'meta.lang',
    category: 'meta',
    weight: 2,
    label: 'HTML lang attribute',
    run: ({ $ }) => {
      const lang = $('html').attr('lang');
      if (!lang) return { passed: false, severity: 'warning', message: '<html> has no lang attribute.', fix: 'Add lang="en" (or the appropriate language code) to <html>.' };
      return { passed: true, message: `Language: ${lang}` };
    },
  },
];
