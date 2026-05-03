<div align="center">

# Seolens

**The fastest, most thorough on-page SEO auditor — runs as a Claude Code skill, a CLI, or a VS Code extension.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)]()
[![Checks](https://img.shields.io/badge/checks-106-blue.svg)]()
[![Categories](https://img.shields.io/badge/categories-22-blue.svg)]()
[![Stars](https://img.shields.io/github/stars/bluegalaxydev/seolens?style=social)](https://github.com/bluegalaxydev/seolens)

```
/seolens https://your-site.com           →  audit + chat summary
/seolens-pdf https://your-site.com       →  audit + 8-page PDF report
```

![Seolens demo](demo.svg)

</div>

---

## 🚀 Quick Start (60 seconds)

**Already using Claude Code in VS Code, Cursor, or JetBrains?**

```bash
# 1. Install the skill
mkdir -p ~/.claude/skills && cd ~/.claude/skills && \
  git clone https://github.com/bluegalaxydev/seolens.git && \
  cd seolens && npm install

# 2. Register the slash commands
mkdir -p ~/.claude/commands && \
  cp ~/.claude/skills/seolens/commands/*.md ~/.claude/commands/

# 3. Quit your IDE (Cmd+Q), reopen, then in any Claude Code chat:
#    /seolens https://your-site.com
#    /seolens-pdf https://your-site.com
```

That's it. Three commands. The PDF lands on your Desktop.

> **Using the Claude Code CLI in your terminal instead?** Just run `/plugin install github:bluegalaxydev/seolens` from inside `claude`.

---

## What is Seolens?

Seolens audits any URL across **106 SEO checks in 22 categories** and produces:

1. **A chat summary** in Claude Code with score, top issues, and what's working — perfect for quick iteration
2. **An 8-page PDF report** with editorial-grade design — perfect for client deliverables, board reviews, or portfolio audits

It runs in **5–10 seconds**, requires no signup, no dashboard, and no API keys. The only thing it doesn't do is full-site crawling and backlink analysis — those live in [Seolens Pro](https://github.com/bluegalaxydev/seolens-pro).

## How it works (the two-command workflow)

Seolens uses two slash commands designed to work together:

```
/seolens <url>          ← run this FIRST
                          • Runs all 106 checks (5-10 seconds)
                          • Shows summary in chat
                          • Caches results to /tmp/seolens-last-audit.json

/seolens-pdf <url>      ← run this SECOND (within 1 hour)
                          • Reads the cached audit (1-2 seconds, no re-running)
                          • Generates 8-page PDF
                          • Saves to ~/Desktop/seolens-<host>-<timestamp>.pdf
```

This is intentional — `/seolens-pdf` cannot run by itself. You must always do a `/seolens` audit first. This avoids accidentally re-running 106 checks just to regenerate a PDF.

If you try `/seolens-pdf` without a fresh `/seolens` audit, you'll get a clear error telling you what to do.

## What gets checked

**106 checks across 22 categories**, organized into 6 marketing-grade scoring buckets:

<table>
<tr>
<td valign="top" width="50%">

### SEO & Discoverability (20%)
- **Meta Tags** — title, description, viewport, charset, lang
- **Headings** — H1 presence, single H1, hierarchy, length
- **Indexability** — meta robots, X-Robots-Tag, robots.txt, canonical
- **Crawlability** — URL params, length, sitemap, www, HTTPS redirect
- **Structured Data** — JSON-LD presence and validity
- **Schema Deep** — Organization, WebSite SearchBox, FAQ, Article
- **Links** — internal links, anchor text, rel attributes

### Technical & Performance (20%)
- **Technical** — HTTPS, canonical, status, response time, robots.txt, sitemap
- **Performance** — TTFB, page weight, inline CSS, render-blocking, gzip/brotli, resource hints, font preload, DOM size
- **HTML Compliance** — DOCTYPE, deprecated tags, semantic landmarks, duplicate metas
- **Mobile** — viewport scalable, srcset, font size, tap targets
- **Page Experience** — CLS risk factors, popups, lazy-loading

### Content & Messaging (15%)
- **Content Quality** — value prop, headline length, title↔H1 alignment, paragraphs
- **Social** — Open Graph title/description/image, Twitter card
- **Internationalization** — hreflang, x-default, lang/content matching, RTL

</td>
<td valign="top" width="50%">

### Conversion Optimization (15%)
- **Conversion** — CTAs, action verbs, lead capture, contact info, social proof, urgency
- **E-commerce** — Product schema, Review schema, BreadcrumbList, pricing visibility

### Brand & Trust (15%)
- **Trust & Legitimacy** — privacy policy, terms, about page, copyright, security badges, business identifiers
- **Accessibility** — form labels, button text, alt-text quality, ARIA validity, skip links, tabindex
- **Security Headers** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, mixed content

### Off-page Authority (15%)
- **Images** — alt text coverage, dimensions
- **Backlinks & Authority** — backlink profile note (Pro), social profile links, outbound authority

</td>
</tr>
</table>

Every failed check comes with a **one-line "how to fix"** so you (or your AI assistant) can immediately act on it.

## The 8-page PDF report

Each `/seolens-pdf` run produces a polished, editorial-grade PDF with:

| # | Page | Contains |
|---|------|----------|
| 1 | Cover | Big donut score gauge, executive summary card, navy + gold premium design |
| 2 | Score Breakdown | 6 marketing-bucket bar chart + detailed weights table |
| 3 | Key Findings | Top 10 issues with severity badges, navy-header table |
| 4 | What's Working Well | 12 strength cards (2-column grid, green accent) |
| 5 | Action Plan — Quick Wins | This-week priorities, green theme |
| 6 | Action Plan — Medium Term | 1-3 month items, blue theme |
| 7 | Action Plan — Strategic | 3-6 month items, navy theme |
| 8 | Methodology | Category weights + scoring legend |

Cream background (not flat white), subtle gold accent rules, severity-coded badges, and editorial typography. Send it to a client without modification.

## Other ways to use Seolens

### Plain CLI (no Claude required)

```bash
npx seolens https://example.com                  # one-off
npm install -g seolens && seolens example.com    # global
```

CLI flags:
```
seolens <url>              → colored terminal report
seolens <url> --json       → full JSON
seolens <url> --markdown   → Markdown
seolens <url> --pdf FILE   → 8-page PDF
seolens <url> --pptx FILE  → PowerPoint deck
```

### As a JS library

```js
import { audit, renderPdf, renderMarkdown } from 'seolens';

const result = await audit('https://example.com');
console.log(`Score: ${result.score.value}/100`);

// Generate a PDF
await renderPdf(result, '/tmp/report.pdf');
```

### In your CI pipeline

```yaml
- run: npx seolens https://staging.example.com
  # Exit code is 0 if score >= 70, else 1 — gate deploys on SEO regressions
```

### As a VS Code extension (separate from Claude Code)

A standalone extension in [`vscode/`](./vscode) — adds a "Seolens: Audit URL…" command palette entry with a webview results panel and PPT/MD export buttons.

## Troubleshooting

**❌ `/plugin isn't available in this environment`**
You're using the Claude Code IDE extension (VS Code/Cursor/JetBrains), which doesn't yet support `/plugin install`. Use the Quick Start at the top — manually clone the skill and copy commands.

**❌ `/seolens-pdf` returns "No cached audit found"**
You need to run `/seolens <url>` first. The PDF command builds on top of a recent audit. Re-run the same URL with `/seolens`, then immediately run `/seolens-pdf`.

**❌ `/seolens-pdf` returns "Cached audit is for X, not Y"**
The cache is for a different URL. Run `/seolens <new-url>` first to refresh.

**❌ `/seolens-pdf` returns "Cached audit is N minutes old"**
The cache expires after 1 hour. Re-run `/seolens <url>` for fresh data.

**❌ Slash commands `/seolens-pdf` etc. don't show up in autocomplete**
You probably skipped step 2 of the Quick Start (copying commands to `~/.claude/commands/`). Run:
```bash
mkdir -p ~/.claude/commands && \
  cp ~/.claude/skills/seolens/commands/*.md ~/.claude/commands/
```
Then **fully quit and reopen** your IDE (Cmd+Q, not just Reload Window).

**❌ "Could not load Seolens" error**
Run `npm install` inside `~/.claude/skills/seolens/`:
```bash
cd ~/.claude/skills/seolens && npm install
```

**❌ Audit fails on local files (`file://...`)**
Currently Seolens fetches over HTTP/HTTPS only. For local development, run a dev server (e.g. `python3 -m http.server`) and audit `http://localhost:8000`.

**❌ The audit is slow**
106 checks normally take 5-10 seconds. If it's slower, the target site is slow to respond (server TTFB). The audit waits up to 15 seconds before timing out — pass `--timeout 30000` for slow sites.

## Updating Seolens

To pull the latest checks and PDF improvements:

```bash
cd ~/.claude/skills/seolens && git pull && npm install && \
  cp ~/.claude/skills/seolens/commands/*.md ~/.claude/commands/
```

Then `Cmd+Q` your IDE and reopen.

## Want more? → Seolens Pro

The free version covers single-URL auditing with 106 checks. **[Seolens Pro](https://github.com/bluegalaxydev/seolens-pro)** adds:

- 🕷️ **Full-site crawl** — audit up to 50,000 pages with one command
- ⚡ **Core Web Vitals** — real LCP, CLS, INP measurements
- 🤖 **AI-powered fix suggestions** — not just "title is missing", but "recommended title: 'Independent Insurance Agency in Huntington Beach, CA'"
- 🔗 **Real backlink data** — referring domains, domain authority, anchor text (via DataForSEO/Ahrefs API)
- 📊 **White-label PDF reports** with your logo and brand colors
- 🔔 **Scheduled monitoring** — get alerts when scores drop
- 🌍 **hreflang validation** at full scale
- 🧠 **80+ additional advanced checks**

Pricing starts at $29/month. → **[Learn more](https://github.com/bluegalaxydev/seolens-pro)**

## Roadmap

- [x] 106 on-page checks across 22 categories
- [x] CLI with colored terminal output
- [x] Markdown + JSON + PDF + PPTX outputs
- [x] Claude Code plugin (skills + slash commands)
- [x] VS Code extension wrapper
- [x] Premium 8-page PDF report
- [ ] Sitemap-driven multi-page audit (in Pro)
- [ ] Real Core Web Vitals via headless browser (in Pro)
- [ ] Live monitoring + change alerts (in Pro)

## Contributing

Pull requests welcome. To add a new check:

1. Pick the right category file in `src/checks/` (or create a new one)
2. Add an entry to the exported array following the existing pattern
3. Register it in `src/checks/index.js` if it's a new category
4. Run `node bin/seolens.js https://example.com --json` to verify it executes

By contributing, you agree to the [Contributor License Agreement](CONTRIBUTING.md).

## License

MIT © 2026 [bluegalaxydev](https://github.com/bluegalaxydev)

---

<div align="center">

⭐ If Seolens saves you time, **star the repo** — it's the single best way to support the project.

[Report a bug](https://github.com/bluegalaxydev/seolens/issues) · [Request a check](https://github.com/bluegalaxydev/seolens/issues/new) · [Seolens Pro](https://github.com/bluegalaxydev/seolens-pro)

</div>
