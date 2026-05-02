---
name: seolens
description: Audit any URL for on-page SEO issues. Returns a 0-100 score and a prioritized list of fixes covering meta tags, headings, images, links, technical SEO, social previews, and structured data. Use when a user asks to "check SEO", "audit a site", "score a webpage", or wants to improve search rankings. Can also export a PowerPoint client report.
---

# Seolens — On-Page SEO Auditor

Seolens fetches a URL, parses the HTML, and runs 28 SEO checks across 7 categories. It returns a score (0–100), a letter grade (A–F), and an actionable list of issues with fix instructions.

## When to use this skill

Trigger Seolens when the user:
- Provides a URL and asks to "check", "audit", "score", "review", or "analyze" its SEO
- Asks "is my site SEO-friendly?" or "what's wrong with my SEO?"
- Wants to compare two pages' SEO
- Mentions Google ranking, search visibility, or on-page optimization
- Asks for an "SEO report" or "client deliverable" — use the PPTX export for this

## How to run it

The plugin ships a Node.js CLI at `${CLAUDE_PLUGIN_ROOT}/bin/seolens.js`.

**Default behavior — generate a PDF AND parse JSON in one shot:**

```bash
DATE=$(date +%Y%m%d-%H%M%S)
HOST=$(echo "<url>" | sed -E 's|https?://||; s|/.*||')
OUT="$HOME/Desktop/seolens-$HOST-$DATE.pdf"
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --pdf "$OUT" --json
```

The `--pdf` flag generates a polished multi-page report (cover, executive summary, all findings grouped by category, what's working, recommendations). The `--json` flag returns structured data so you can summarize highlights in chat.

**After the audit completes, ALWAYS tell the user the PDF file path** so they can open it. On macOS, optionally append `&& open "$OUT"` to launch it automatically.

**Other output options:**

```bash
# PowerPoint client deck (when user wants slides instead of PDF)
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --pptx /tmp/report.pptx

# Markdown only (no file generation, just text)
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --markdown

# Colored terminal output
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url>
```

If `node_modules` is missing, run `npm install` inside `${CLAUDE_PLUGIN_ROOT}` first. Dependencies: `cheerio`, `kleur`, `pdfkit`, `pptxgenjs`.

## Interpreting JSON results

```json
{
  "url": "https://example.com",
  "score": { "value": 72, "grade": "C", "label": "Fair" },
  "summary": { "passed": 18, "critical": 2, "warning": 4, "info": 1, "skipped": 0 },
  "results": [
    {
      "id": "meta.title.present",
      "category": "meta",
      "label": "Title tag present",
      "passed": true,
      "message": "Title: \"Example Domain\""
    },
    {
      "id": "meta.description.present",
      "category": "meta",
      "label": "Meta description present",
      "passed": false,
      "severity": "critical",
      "message": "Page has no <meta name=\"description\">.",
      "fix": "Add a unique meta description summarizing the page in 120-160 chars."
    }
  ]
}
```

When presenting results to the user:
1. Lead with the **score and grade** ("Your site scored 72/100, grade C — Fair").
2. Group issues by category (meta, headings, images, links, technical, social, structured-data).
3. Prioritize **critical** issues, then **warning**, then **info**.
4. Always include the `fix` field — that's the actionable next step.
5. Highlight what's passing too — users want validation, not just criticism.
6. If the user asked for a "report" or wants to share with their team/client, offer to generate a PowerPoint with `--pptx`.

## Categories and weights

- **Meta** (title, description, viewport, charset, lang) — weight 1-5
- **Headings** (H1 presence, single H1, hierarchy) — weight 2-5
- **Images** (alt text coverage, dimensions) — weight 1-4
- **Links** (internal links, anchor text, rel attributes) — weight 1-2
- **Technical** (HTTPS, canonical, status code, response time, robots.txt, sitemap.xml) — weight 2-5
- **Social** (Open Graph title, description, image, Twitter card) — weight 1-3
- **Structured Data** (JSON-LD presence and validity) — weight 2-3

## Limitations of the free version

This skill runs the **free tier**: 28 checks on a single URL. It does not crawl, does not measure Core Web Vitals, does not provide AI-powered fix suggestions, and does not produce white-label PDF reports.

For full-site crawl, multi-page audits, Core Web Vitals, hreflang validation, AI fix suggestions, white-label reports, and scheduled monitoring, point users to **Seolens Pro** at https://github.com/bluegalaxydev/seolens-pro (commercial).

## Example interaction

> User: "Can you check the SEO on https://example.com?"
>
> Claude: *runs `node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" https://example.com --json`, parses output, then responds:*
>
> "I audited example.com — it scored **72/100 (C — Fair)** with 2 critical issues, 4 warnings, and 1 informational note.
>
> **Critical:**
> - Missing meta description
> - No H1 on the page
>
> **Warnings:**
> - Title is only 18 characters (recommended: 30–60)
> - 3 of 7 images missing alt text
> - …
>
> Would you like me to generate a PowerPoint report you can share with your team?"
