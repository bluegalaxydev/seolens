/**
 * Trust & legitimacy checks. Privacy policy, terms, business identifiers,
 * security badges — the signals that make a visitor feel safe transacting.
 */
export const trustChecks = [
  {
    id: 'trust.privacy.policy',
    category: 'trust',
    weight: 3,
    label: 'Privacy policy link present',
    run: ({ $ }) => {
      const found = $('a[href]').toArray().some((el) => {
        const t = ($(el).text() || '').toLowerCase();
        return /privacy/.test(t);
      });
      if (!found) {
        return { passed: false, severity: 'warning', message: 'No privacy policy link found.', fix: 'Add a privacy policy link in the footer. Required by GDPR/CCPA and a basic trust signal.' };
      }
      return { passed: true, message: 'Privacy policy link present.' };
    },
  },
  {
    id: 'trust.terms',
    category: 'trust',
    weight: 2,
    label: 'Terms of service / conditions link present',
    run: ({ $ }) => {
      const found = $('a[href]').toArray().some((el) => {
        const t = ($(el).text() || '').toLowerCase();
        return /\b(terms|conditions|legal)\b/.test(t);
      });
      if (!found) {
        return { passed: false, severity: 'info', message: 'No terms of service / conditions link.', fix: 'Add a terms of service link in the footer alongside the privacy policy.' };
      }
      return { passed: true, message: 'Terms link present.' };
    },
  },
  {
    id: 'trust.about.page',
    category: 'trust',
    weight: 2,
    label: 'About / company link present',
    run: ({ $ }) => {
      const found = $('a[href]').toArray().some((el) => {
        const t = ($(el).text() || '').toLowerCase();
        const h = ($(el).attr('href') || '').toLowerCase();
        return /\babout\b/.test(t) || /\babout\b/.test(h) || /\bteam\b/.test(t) || /\bcompany\b/.test(t);
      });
      if (!found) {
        return { passed: false, severity: 'info', message: 'No About / Team / Company link detected.', fix: 'Add an About page with founder/team info. Critical for B2B and trust-sensitive categories.' };
      }
      return { passed: true, message: 'About / company link present.' };
    },
  },
  {
    id: 'trust.copyright.year',
    category: 'trust',
    weight: 1,
    label: 'Copyright year is current',
    run: ({ $ }) => {
      const text = $('footer').text() || $('body').text();
      const matches = [...text.matchAll(/©\s*(\d{4})|copyright\s*(?:\([cC]\))?\s*(\d{4})/gi)];
      if (matches.length === 0) return { passed: false, severity: 'info', message: 'No copyright year found.', fix: 'Add © <year> in the footer. Stale or missing copyright signals an abandoned site.' };
      const years = matches.map((m) => parseInt(m[1] || m[2], 10)).filter(Boolean);
      const latest = Math.max(...years);
      const thisYear = new Date().getFullYear();
      if (thisYear - latest > 1) {
        return { passed: false, severity: 'warning', message: `Copyright year is ${latest} (current year is ${thisYear}). Site may look abandoned.`, fix: 'Auto-update with <script>document.write(new Date().getFullYear())</script> or update manually.' };
      }
      return { passed: true, message: `Copyright current (${latest}).` };
    },
  },
  {
    id: 'trust.security.badge',
    category: 'trust',
    weight: 1,
    label: 'Security/trust badges (Trustpilot, BBB, McAfee, etc.)',
    run: ({ $, html }) => {
      const text = (html || '').toLowerCase();
      const badges = ['trustpilot', 'trustedsite', 'mcafee secure', 'norton secured', 'bbb.org', 'better business bureau', 'verisign', 'shopify secure', 'g2.com', 'capterra'];
      const found = badges.filter((b) => text.includes(b));
      if (found.length === 0) {
        return { passed: false, severity: 'info', message: 'No third-party trust badges detected.', fix: 'Display badges from Trustpilot, BBB, G2, Capterra, etc. — third-party validation lifts conversion.' };
      }
      return { passed: true, message: `Trust badges detected: ${found.join(', ')}.` };
    },
  },
  {
    id: 'trust.business.identifiers',
    category: 'trust',
    weight: 1,
    label: 'Business identifiers (address, registration)',
    run: ({ $ }) => {
      const footer = $('footer').text() + ' ' + $('address').text();
      const text = footer || $('body').text();
      const hasAddress = /\b\d+\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Drive|Dr|Lane|Ln)\b/i.test(text);
      const hasZip = /\b\d{5}(-\d{4})?\b/.test(text);
      const hasCompanyId = /\b(LLC|Inc\.?|Ltd\.?|Corp\.?|Corporation|GmbH|SARL|S\.A\.)\b/.test(text);
      if (!hasAddress && !hasCompanyId) {
        return { passed: false, severity: 'info', message: 'No business address or company designation (LLC, Inc., Ltd) found.', fix: 'Add a real-world address or legal entity name in the footer for legitimacy.' };
      }
      return { passed: true, message: `Business signals present (${hasAddress ? 'address ' : ''}${hasZip ? 'zip ' : ''}${hasCompanyId ? 'entity' : ''}).` };
    },
  },
];
