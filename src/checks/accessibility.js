/**
 * Accessibility checks (a11y). Often overlapping with SEO — Google rewards
 * accessible sites because they're easier for users (and crawlers) to parse.
 */
export const accessibilityChecks = [
  {
    id: 'a11y.form.labels',
    category: 'accessibility',
    weight: 2,
    label: 'Form inputs have labels',
    run: ({ $ }) => {
      const inputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').toArray();
      if (inputs.length === 0) return { passed: true, severity: 'skip', message: 'No form inputs on page.' };
      const unlabeled = inputs.filter((el) => {
        const $el = $(el);
        const id = $el.attr('id');
        const aria = $el.attr('aria-label') || $el.attr('aria-labelledby');
        const placeholder = $el.attr('placeholder');
        if (aria) return false;
        if (id && $(`label[for="${id}"]`).length) return false;
        if ($el.parents('label').length) return false;
        return true;
      });
      if (unlabeled.length === 0) return { passed: true, message: `All ${inputs.length} form inputs are labeled.` };
      return { passed: false, severity: 'warning', message: `${unlabeled.length} of ${inputs.length} form inputs lack accessible labels.`, fix: 'Wrap inputs in <label> or use aria-label / aria-labelledby for screen reader support.' };
    },
  },
  {
    id: 'a11y.button.text',
    category: 'accessibility',
    weight: 2,
    label: 'Buttons have accessible text',
    run: ({ $ }) => {
      const buttons = $('button, input[type="button"], input[type="submit"]').toArray();
      if (buttons.length === 0) return { passed: true, severity: 'skip', message: 'No buttons on page.' };
      const empty = buttons.filter((el) => {
        const $el = $(el);
        const text = ($el.text() || $el.attr('value') || $el.attr('aria-label') || $el.attr('title') || '').trim();
        return text.length === 0;
      });
      if (empty.length === 0) return { passed: true, message: `All ${buttons.length} buttons have accessible text.` };
      return { passed: false, severity: 'warning', message: `${empty.length} button(s) have no accessible text.`, fix: 'Add visible text, aria-label, or title attribute to every button.' };
    },
  },
  {
    id: 'a11y.image.alt.quality',
    category: 'accessibility',
    weight: 2,
    label: 'Image alt text is descriptive (not just filename)',
    run: ({ $ }) => {
      const imgs = $('img[alt]').toArray();
      if (imgs.length === 0) return { passed: true, severity: 'skip', message: 'No alt-tagged images.' };
      const lazy = imgs.filter((el) => {
        const alt = ($(el).attr('alt') || '').toLowerCase().trim();
        if (!alt) return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(alt) || /^(image|img|photo|picture|icon|graphic)$/i.test(alt);
      });
      if (lazy.length === 0) return { passed: true, message: 'Alt text looks descriptive.' };
      return { passed: false, severity: 'info', message: `${lazy.length} image(s) have low-quality alt text (filename or generic word).`, fix: 'Replace with descriptive alt text that explains what the image conveys, not what file it is.' };
    },
  },
  {
    id: 'a11y.aria.roles.valid',
    category: 'accessibility',
    weight: 1,
    label: 'ARIA roles are valid',
    run: ({ $ }) => {
      const validRoles = new Set([
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
        'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
        'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
        'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
        'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
        'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup',
        'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
        'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
      ]);
      const elements = $('[role]').toArray();
      if (elements.length === 0) return { passed: true, severity: 'skip', message: 'No ARIA roles in use.' };
      const bad = [];
      for (const el of elements) {
        const role = ($(el).attr('role') || '').trim();
        if (role && !validRoles.has(role)) bad.push(role);
      }
      if (bad.length === 0) return { passed: true, message: `${elements.length} ARIA roles, all valid.` };
      return { passed: false, severity: 'warning', message: `Invalid ARIA roles: ${[...new Set(bad)].slice(0, 4).join(', ')}.`, fix: 'Use only standard WAI-ARIA roles. See https://www.w3.org/TR/wai-aria/#role_definitions.' };
    },
  },
  {
    id: 'a11y.skip.link',
    category: 'accessibility',
    weight: 1,
    label: 'Skip-to-content link present',
    run: ({ $ }) => {
      const links = $('a[href^="#"]').toArray();
      const skip = links.find((el) => {
        const text = ($(el).text() || '').toLowerCase();
        return /skip\s+to\s+(main|content)/.test(text) || /skip\s+navigation/.test(text);
      });
      if (skip) return { passed: true, message: 'Skip-to-content link found.' };
      return { passed: false, severity: 'info', message: 'No skip-to-content link detected.', fix: 'Add a skip link as the first focusable element so keyboard users can bypass navigation.' };
    },
  },
  {
    id: 'a11y.tabindex.misuse',
    category: 'accessibility',
    weight: 1,
    label: 'No positive tabindex values',
    run: ({ $ }) => {
      const positive = $('[tabindex]').filter((_, el) => {
        const v = parseInt($(el).attr('tabindex'), 10);
        return v > 0;
      }).length;
      if (positive === 0) return { passed: true, message: 'No positive tabindex values.' };
      return { passed: false, severity: 'warning', message: `${positive} element(s) use positive tabindex values, which break keyboard nav order.`, fix: 'Use tabindex="0" or "-1" only. Positive values create unpredictable focus order.' };
    },
  },
];
