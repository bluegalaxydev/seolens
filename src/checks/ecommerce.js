/**
 * E-commerce specific checks. These run on every site but skip gracefully
 * if the page isn't a product/store page.
 */
export const ecommerceChecks = [
  {
    id: 'ec.product.schema',
    category: 'ecommerce',
    weight: 3,
    label: 'Product schema (Schema.org/Product) on product pages',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      let hasProduct = false;
      let hasOffer = false;
      for (const s of scripts) {
        try {
          const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
          const objs = Array.isArray(data) ? data : [data];
          for (const o of objs) {
            const t = o['@type'];
            if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
              hasProduct = true;
              if (o.offers) hasOffer = true;
            }
          }
        } catch { /* ignore */ }
      }
      // Detect if this page looks like a product page
      const looksLikeProduct = $('[itemprop="price"], .price, [class*="add-to-cart"], [class*="buy-now"], button[name="add-to-cart"]').length > 0;
      if (!looksLikeProduct) return { passed: true, severity: 'skip', message: 'Page does not appear to be a product page.' };
      if (!hasProduct) return { passed: false, severity: 'warning', message: 'Product page detected but no Product Schema.org markup found.', fix: 'Add JSON-LD Product schema with name, description, image, offers (price + currency), brand, and aggregateRating.' };
      if (!hasOffer) return { passed: false, severity: 'info', message: 'Product schema present but missing "offers" property.', fix: 'Add the offers field with price and priceCurrency to enable Google Shopping rich results.' };
      return { passed: true, message: 'Product schema with offers present.' };
    },
  },
  {
    id: 'ec.review.schema',
    category: 'ecommerce',
    weight: 2,
    label: 'Review/aggregateRating schema',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      let hasReview = false;
      for (const s of scripts) {
        try {
          const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
          const json = JSON.stringify(data);
          if (/"aggregateRating"|"@type"\s*:\s*"Review"/.test(json)) hasReview = true;
        } catch { /* ignore */ }
      }
      const looksLikeProduct = $('[itemprop="price"], .price, [class*="add-to-cart"]').length > 0;
      if (!looksLikeProduct) return { passed: true, severity: 'skip', message: 'Not a product page.' };
      if (!hasReview) return { passed: false, severity: 'info', message: 'No review or aggregateRating schema on this product page.', fix: 'Add Review or aggregateRating JSON-LD to surface star ratings in Google search results.' };
      return { passed: true, message: 'Review/rating schema present.' };
    },
  },
  {
    id: 'ec.breadcrumb.schema',
    category: 'ecommerce',
    weight: 2,
    label: 'BreadcrumbList schema',
    run: ({ $ }) => {
      const scripts = $('script[type="application/ld+json"]').toArray();
      const hasBreadcrumb = scripts.some((s) => {
        try {
          const data = JSON.parse($(s).contents().text() || $(s).html() || '{}');
          const json = JSON.stringify(data);
          return /"@type"\s*:\s*"BreadcrumbList"/.test(json);
        } catch { return false; }
      });
      if (hasBreadcrumb) return { passed: true, message: 'BreadcrumbList schema present.' };
      const visualBreadcrumb = $('[class*="breadcrumb" i], nav[aria-label*="breadcrumb" i]').length > 0;
      if (!visualBreadcrumb) return { passed: false, severity: 'info', message: 'No breadcrumb navigation or BreadcrumbList schema.', fix: 'Add visible breadcrumbs with BreadcrumbList JSON-LD — improves Google SERP appearance and UX.' };
      return { passed: false, severity: 'info', message: 'Visible breadcrumbs found but no BreadcrumbList schema.', fix: 'Mirror your visible breadcrumbs in JSON-LD for richer search results.' };
    },
  },
  {
    id: 'ec.price.visible',
    category: 'ecommerce',
    weight: 2,
    label: 'Pricing visible on commercial pages',
    run: ({ $ }) => {
      const looksCommercial = $('[itemprop="price"], .price, [class*="add-to-cart"], [class*="buy-now"], [class*="pricing"]').length > 0;
      if (!looksCommercial) return { passed: true, severity: 'skip', message: 'Not a commercial page.' };
      const text = $('body').text();
      const hasPrice = /[\$€£¥₹]\s*\d+(?:[.,]\d{1,2})?/.test(text) || /\b\d+(?:[.,]\d{2})\s*(USD|EUR|GBP|CNY|JPY)\b/i.test(text);
      if (!hasPrice) return { passed: false, severity: 'warning', message: 'Commercial page detected but no clear price visible.', fix: 'Show pricing transparently. "Contact for pricing" hurts conversion vs. listed prices.' };
      return { passed: true, message: 'Pricing visible.' };
    },
  },
];
