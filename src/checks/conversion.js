/**
 * Conversion optimization checks. Looks for the elements that turn visitors
 * into leads/customers — CTAs, lead capture, urgency, social proof.
 */
export const conversionChecks = [
  {
    id: 'conv.cta.present',
    category: 'conversion',
    weight: 4,
    label: 'Primary call-to-action present',
    run: ({ $ }) => {
      const ctaPatterns = [
        /\b(buy|shop|order|purchase|add to cart|get started|sign up|subscribe|book|schedule|try|start|join|download|request|contact us|get a quote|learn more|see plans)\b/i,
      ];
      const candidates = $('a.btn, a.button, button, a[class*="cta"], a[class*="button"], input[type="submit"]').toArray();
      const visible = candidates.filter((el) => {
        const text = ($(el).text() || $(el).attr('value') || '').trim();
        return text && ctaPatterns.some((p) => p.test(text));
      });
      if (visible.length === 0) {
        return { passed: false, severity: 'critical', message: 'No primary CTA detected (no button-styled link with action verb).', fix: 'Add a clear, action-oriented button above the fold: "Get Started", "Shop Now", "Book a Demo".' };
      }
      return { passed: true, message: `${visible.length} CTA-style element(s) detected.` };
    },
  },
  {
    id: 'conv.cta.text.quality',
    category: 'conversion',
    weight: 2,
    label: 'CTA text is action-oriented (not "Submit")',
    run: ({ $ }) => {
      const generic = ['submit', 'click', 'go', 'next', 'ok', 'yes'];
      const buttons = $('button, input[type="submit"], a.btn, a.button').toArray();
      if (buttons.length === 0) return { passed: true, severity: 'skip', message: 'No buttons to evaluate.' };
      const lazy = buttons.filter((el) => {
        const t = ($(el).text() || $(el).attr('value') || '').trim().toLowerCase();
        return t && generic.includes(t);
      });
      if (lazy.length === 0) return { passed: true, message: 'CTA text looks action-oriented.' };
      return { passed: false, severity: 'warning', message: `${lazy.length} button(s) use generic text like "Submit" or "Click".`, fix: 'Replace with verbs that hint at outcome: "Get my quote", "Start free trial", "Send message".' };
    },
  },
  {
    id: 'conv.lead.capture',
    category: 'conversion',
    weight: 4,
    label: 'Email lead-capture form present',
    run: ({ $ }) => {
      const emailFields = $('input[type="email"], input[name*="email" i], input[id*="email" i]').toArray();
      if (emailFields.length === 0) {
        return { passed: false, severity: 'warning', message: 'No email capture field on the page.', fix: 'Add a newsletter signup, lead magnet, or contact form. Email is the highest-ROI growth channel for most sites.' };
      }
      return { passed: true, message: `${emailFields.length} email field(s) detected.` };
    },
  },
  {
    id: 'conv.contact.info',
    category: 'conversion',
    weight: 2,
    label: 'Contact info visible (phone, email, or address)',
    run: ({ $ }) => {
      const text = $('body').text();
      const hasPhone = /\b(\+?\d[\d\s().-]{6,}\d)\b/.test(text) || $('a[href^="tel:"]').length > 0;
      const hasEmail = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(text) || $('a[href^="mailto:"]').length > 0;
      if (!hasPhone && !hasEmail) {
        return { passed: false, severity: 'warning', message: 'No phone, email, or contact link found in page content.', fix: 'Add visible contact info — even a single email or phone number boosts trust significantly.' };
      }
      return { passed: true, message: `Contact info present (${hasPhone ? 'phone' : ''}${hasPhone && hasEmail ? ', ' : ''}${hasEmail ? 'email' : ''}).` };
    },
  },
  {
    id: 'conv.social.proof',
    category: 'conversion',
    weight: 3,
    label: 'Social proof signals (reviews, testimonials, ratings)',
    run: ({ $ }) => {
      const text = $('body').text().toLowerCase();
      const indicators = [
        /\bratings?\b/, /\breviews?\b/, /\btestimonials?\b/, /\bcustomers?\b/, /\bclients?\b/,
        /\b\d{2,}[\s,]*(stars?|⭐|★)/, /\b(trusted by|used by|loved by)\b/, /\btrustpilot\b/, /\bg2 (review|crowd)\b/,
      ];
      const hits = indicators.filter((p) => p.test(text)).length;
      if (hits < 2) {
        return { passed: false, severity: 'warning', message: 'Little or no social proof detected (no review/testimonial/rating language).', fix: 'Add customer testimonials, star ratings, "trusted by X companies" badges, or review counts. Social proof lifts conversion 15-30%.' };
      }
      return { passed: true, message: `Social proof signals detected (${hits} indicator types).` };
    },
  },
  {
    id: 'conv.urgency.scarcity',
    category: 'conversion',
    weight: 1,
    label: 'Urgency or scarcity elements (optional)',
    run: ({ $ }) => {
      const text = $('body').text().toLowerCase();
      const patterns = [/limited time/, /only \d+ left/, /\d+ in stock/, /sale ends/, /today only/, /expires?\b/, /while supplies last/, /\bcountdown\b/];
      const found = patterns.filter((p) => p.test(text)).length;
      if (found === 0) {
        return { passed: true, severity: 'skip', message: 'No urgency elements (this is fine for non-commerce sites).' };
      }
      return { passed: true, message: `${found} urgency/scarcity signal(s) detected.` };
    },
  },
];
