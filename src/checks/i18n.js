/**
 * Internationalization & localization checks. Critical for sites targeting
 * multiple regions or languages.
 */
export const i18nChecks = [
  {
    id: 'i18n.hreflang.present',
    category: 'i18n',
    weight: 2,
    label: 'hreflang annotations (multi-region/language)',
    run: ({ $ }) => {
      const links = $('link[rel="alternate"][hreflang]').toArray();
      // Detect if site looks multi-region — has language switcher, multiple lang URLs, etc.
      const langSwitcher = $('a[href*="/en/"], a[href*="/es/"], a[href*="/fr/"], a[href*="/de/"], a[href*="/zh/"], a[href*="/ja/"]').length > 0;
      if (links.length === 0) {
        if (langSwitcher) return { passed: false, severity: 'warning', message: 'Multi-language URLs detected but no hreflang annotations.', fix: 'Add <link rel="alternate" hreflang="LANG" href="..."> for every language version of this page.' };
        return { passed: true, severity: 'skip', message: 'Single-locale page (no hreflang needed).' };
      }
      return { passed: true, message: `${links.length} hreflang annotation(s) found.` };
    },
  },
  {
    id: 'i18n.hreflang.x-default',
    category: 'i18n',
    weight: 1,
    label: 'hreflang x-default declared',
    run: ({ $ }) => {
      const any = $('link[rel="alternate"][hreflang]').length;
      if (!any) return { passed: true, severity: 'skip', message: 'No hreflang annotations.' };
      const xdef = $('link[rel="alternate"][hreflang="x-default"]').length;
      if (!xdef) return { passed: false, severity: 'info', message: 'hreflang annotations present but no x-default fallback.', fix: 'Add <link rel="alternate" hreflang="x-default" href="..."> as the fallback for unmatched locales.' };
      return { passed: true, message: 'x-default hreflang declared.' };
    },
  },
  {
    id: 'i18n.lang.matches.content',
    category: 'i18n',
    weight: 1,
    label: 'HTML lang attribute matches content',
    run: ({ $ }) => {
      const lang = ($('html').attr('lang') || '').slice(0, 2).toLowerCase();
      if (!lang) return { passed: false, severity: 'skip', message: 'No lang attribute — see meta.lang.' };
      // Heuristic: sample body text and check for ASCII vs CJK
      const bodyText = $('body').text().slice(0, 1000);
      const hasCJK = /[㐀-鿿가-힯]/.test(bodyText);
      const hasArabic = /[؀-ۿ]/.test(bodyText);
      const hasCyrillic = /[Ѐ-ӿ]/.test(bodyText);
      if (hasCJK && !['zh', 'ja', 'ko'].includes(lang)) {
        return { passed: false, severity: 'warning', message: `lang="${lang}" but content appears to be CJK.`, fix: 'Set lang to "zh", "ja", or "ko" depending on actual content language.' };
      }
      if (hasArabic && lang !== 'ar') {
        return { passed: false, severity: 'warning', message: `lang="${lang}" but content appears to be Arabic.`, fix: 'Set lang="ar" and add dir="rtl" to <html>.' };
      }
      if (hasCyrillic && !['ru', 'uk', 'bg', 'sr'].includes(lang)) {
        return { passed: false, severity: 'info', message: `lang="${lang}" but content uses Cyrillic.`, fix: 'Verify lang attribute matches actual content language.' };
      }
      return { passed: true, message: `lang="${lang}" appears consistent with content.` };
    },
  },
  {
    id: 'i18n.dir.rtl',
    category: 'i18n',
    weight: 1,
    label: 'RTL languages have dir="rtl"',
    run: ({ $ }) => {
      const lang = ($('html').attr('lang') || '').slice(0, 2).toLowerCase();
      const rtlLangs = ['ar', 'he', 'fa', 'ur'];
      if (!rtlLangs.includes(lang)) return { passed: true, severity: 'skip', message: 'Not an RTL language.' };
      const dir = ($('html').attr('dir') || '').toLowerCase();
      if (dir !== 'rtl') return { passed: false, severity: 'warning', message: `lang="${lang}" but dir is not "rtl".`, fix: 'Add dir="rtl" to <html> for proper Right-to-Left rendering.' };
      return { passed: true, message: 'RTL direction declared.' };
    },
  },
];
