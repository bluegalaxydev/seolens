/**
 * Performance / page-experience checks. Lightweight heuristics that don't
 * require a headless browser — measured from the HTML response itself.
 */
export const performanceChecks = [
  {
    id: 'perf.ttfb',
    category: 'performance',
    weight: 4,
    label: 'Server response time (TTFB) under 800ms',
    run: ({ elapsedMs }) => {
      if (elapsedMs < 400) return { passed: true, message: `Excellent TTFB (${elapsedMs}ms).` };
      if (elapsedMs < 800) return { passed: true, message: `Good TTFB (${elapsedMs}ms).` };
      if (elapsedMs < 1500) return { passed: false, severity: 'warning', message: `TTFB is ${elapsedMs}ms (target: <800ms).`, fix: 'Investigate server processing time. Add edge caching (Cloudflare/Fastly) or upgrade hosting.' };
      return { passed: false, severity: 'critical', message: `Slow TTFB: ${elapsedMs}ms.`, fix: 'TTFB above 1.5s heavily impacts Core Web Vitals. Audit DB queries, enable caching, consider CDN.' };
    },
  },
  {
    id: 'perf.page.weight',
    category: 'performance',
    weight: 3,
    label: 'HTML response under 100KB',
    run: ({ bytes }) => {
      const kb = bytes / 1024;
      if (kb < 50) return { passed: true, message: `HTML is ${kb.toFixed(1)}KB — excellent.` };
      if (kb < 100) return { passed: true, message: `HTML is ${kb.toFixed(1)}KB — acceptable.` };
      if (kb < 250) return { passed: false, severity: 'warning', message: `HTML is ${kb.toFixed(1)}KB — large.`, fix: 'Minify HTML, defer non-critical inline scripts, lazy-load below-the-fold content.' };
      return { passed: false, severity: 'critical', message: `HTML is ${kb.toFixed(1)}KB — way too large.`, fix: 'Above 250KB of HTML signals inline scripts or base64 images. Move to external resources.' };
    },
  },
  {
    id: 'perf.inline.css',
    category: 'performance',
    weight: 1,
    label: 'Inline CSS within reasonable size',
    run: ({ $ }) => {
      let total = 0;
      $('style').each((_, el) => { total += ($(el).text() || '').length; });
      if (total === 0) return { passed: true, message: 'No inline CSS.' };
      const kb = total / 1024;
      if (kb < 14) return { passed: true, message: `Inline CSS: ${kb.toFixed(1)}KB (within critical CSS budget).` };
      if (kb < 50) return { passed: false, severity: 'info', message: `Inline CSS is ${kb.toFixed(1)}KB.`, fix: 'Critical CSS should be under 14KB to fit in the first round-trip. Move non-critical CSS to external files.' };
      return { passed: false, severity: 'warning', message: `Inline CSS is ${kb.toFixed(1)}KB — bloats HTML.`, fix: 'Move large stylesheets to external files. Inline only above-the-fold critical CSS.' };
    },
  },
  {
    id: 'perf.render.blocking',
    category: 'performance',
    weight: 3,
    label: 'No render-blocking external scripts in <head>',
    run: ({ $ }) => {
      const blocking = $('head script[src]').filter((_, el) => {
        const $el = $(el);
        return !$el.attr('async') && !$el.attr('defer') && $el.attr('type') !== 'module';
      }).length;
      if (blocking === 0) return { passed: true, message: 'No render-blocking <script> tags in <head>.' };
      return { passed: false, severity: 'warning', message: `${blocking} render-blocking <script> tag(s) in <head>.`, fix: 'Add async or defer attributes, or move scripts to the end of <body>.' };
    },
  },
  {
    id: 'perf.compression',
    category: 'performance',
    weight: 2,
    label: 'Response is compressed (gzip/brotli)',
    run: ({ headers }) => {
      const enc = (headers['content-encoding'] || '').toLowerCase();
      if (!enc) return { passed: false, severity: 'warning', message: 'No Content-Encoding header — response is uncompressed.', fix: 'Enable gzip or brotli compression at the server/CDN. Reduces transfer size 60-80%.' };
      if (/br/.test(enc)) return { passed: true, message: 'Brotli compression in use (best).' };
      if (/gzip/.test(enc)) return { passed: true, message: 'Gzip compression in use.' };
      return { passed: false, severity: 'info', message: `Compression: ${enc} (consider brotli for ~15% better than gzip).`, fix: 'Brotli (br) compresses better than gzip. Enable on your CDN if available.' };
    },
  },
  {
    id: 'perf.resource.hints',
    category: 'performance',
    weight: 1,
    label: 'Uses preconnect/preload/dns-prefetch hints',
    run: ({ $ }) => {
      const hints = $('link[rel="preconnect"], link[rel="preload"], link[rel="dns-prefetch"]').length;
      if (hints === 0) return { passed: false, severity: 'info', message: 'No resource hints (preconnect/preload/dns-prefetch).', fix: 'Add <link rel="preconnect"> for critical third-party origins (fonts, analytics) to save 100-300ms per origin.' };
      return { passed: true, message: `${hints} resource hint(s) in use.` };
    },
  },
  {
    id: 'perf.fonts.preload',
    category: 'performance',
    weight: 1,
    label: 'Web fonts are preloaded',
    run: ({ $ }) => {
      const usesFonts = $('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"], link[href*="typekit"], style:contains("@font-face"), link[rel="stylesheet"][href*="font"]').length > 0;
      if (!usesFonts) return { passed: true, severity: 'skip', message: 'No web fonts detected.' };
      const preloaded = $('link[rel="preload"][as="font"]').length;
      if (preloaded === 0) return { passed: false, severity: 'info', message: 'Web fonts in use but none preloaded.', fix: 'Preload your primary web font with <link rel="preload" as="font" crossorigin> to avoid FOIT/FOUT.' };
      return { passed: true, message: `${preloaded} font(s) preloaded.` };
    },
  },
  {
    id: 'perf.dom.size',
    category: 'performance',
    weight: 2,
    label: 'DOM size is reasonable (<1500 nodes)',
    run: ({ $ }) => {
      const count = $('*').length;
      if (count < 800) return { passed: true, message: `${count} DOM nodes — lean.` };
      if (count < 1500) return { passed: true, message: `${count} DOM nodes — within target.` };
      if (count < 3000) return { passed: false, severity: 'warning', message: `${count} DOM nodes — exceeds Lighthouse threshold (1500).`, fix: 'Large DOM trees slow rendering. Reduce nesting, lazy-load lists, virtualize long collections.' };
      return { passed: false, severity: 'critical', message: `${count} DOM nodes — extremely large.`, fix: 'Above 3000 nodes severely degrades performance. Audit your component structure.' };
    },
  },
];
