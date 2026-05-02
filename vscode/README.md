# Seolens — SEO Auditor for VS Code

Run a fast on-page SEO audit on any URL right from VS Code. Powered by [Seolens](https://github.com/bluegalaxydev/seolens).

![Seolens demo](https://raw.githubusercontent.com/bluegalaxydev/seolens/main/demo.svg)

## Features

- **`Seolens: Audit URL…`** — Audit any URL, see results in a side panel
- **`Seolens: Audit Current HTML File`** — Right-click any `.html` in the explorer
- **0–100 score** with letter grade
- **28 on-page checks** across meta tags, headings, images, links, technical SEO, Open Graph, and JSON-LD
- **Export to PowerPoint (.pptx)** for client deliverables
- **Export to Markdown** for issue tracking
- **Theme-aware** results panel (matches your VS Code theme)

## Install

This extension wraps the `seolens` npm package. You need to install it once globally:

```bash
npm install -g seolens
```

Then install this extension from the VS Code Marketplace, or from the `.vsix` file:

```bash
code --install-extension seolens-vscode-0.1.0.vsix
```

## Usage

1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **`Seolens: Audit URL…`**
3. Enter the URL (e.g. `https://example.com`)
4. Wait ~5 seconds — results open in a side panel

From the results panel you can export the report as:
- **📊 PowerPoint (.pptx)** — branded slide deck for client review
- **📝 Markdown** — paste into a GitHub issue or doc

## Settings

| Setting | Default | Description |
|---|---|---|
| `seolens.timeout` | `15000` | Audit timeout in milliseconds |

## What gets checked

**Meta Tags** · title presence/length, description presence/length, viewport, charset, lang attribute
**Headings** · H1 presence, single H1, hierarchy, content quality
**Images** · alt text coverage, width/height attributes
**Links** · internal links, anchor text quality, external `rel`
**Technical** · HTTPS, canonical, status code, response time, robots.txt, sitemap.xml
**Social** · Open Graph title/description/image, Twitter card
**Structured Data** · JSON-LD presence and validity

## Want more?

The free version handles single-URL audits. **[Seolens Pro](https://github.com/bluegalaxydev/seolens-pro)** adds:
- Full-site crawl (up to 50,000 pages)
- Core Web Vitals (LCP, CLS, INP)
- Hreflang validation
- AI fix suggestions
- White-label HTML/PDF reports
- Scheduled monitoring

## License

MIT — see [LICENSE](https://github.com/bluegalaxydev/seolens/blob/main/LICENSE)
