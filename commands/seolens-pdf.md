---
name: seolens-pdf
description: Generate a polished, multi-page PDF report from the most recent /seolens audit. Requires that /seolens has already been run on the same URL within the last hour. Saves the PDF to the user's Desktop with editorial-grade design — navy header, gold accent, donut score gauge, severity-coded findings, and prioritized action plan.
argument-hint: <url>
---

You are generating a premium PDF deliverable from a Seolens audit that the user has already run via `/seolens`.

**Argument:** $ARGUMENTS

## Workflow

### Step 1: Verify a recent /seolens audit exists

The PDF command builds on top of `/seolens` results — it does NOT re-run the audit. Check that a cached audit is available:

```bash
ls -la /tmp/seolens-last-audit.json 2>/dev/null
```

If the file does not exist, **stop and tell the user**:

> "Please run `/seolens <url>` first — `/seolens-pdf` builds the PDF from your most recent audit. This avoids re-running 70+ checks unnecessarily."

### Step 2: Verify the URL matches

The cached audit was for a specific URL. Confirm it matches the URL the user passed (or use the cached URL if user didn't specify one):

```bash
CACHED_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/seolens-last-audit.json')).url)")
echo "Cached audit URL: $CACHED_URL"
```

If the user passed a URL that doesn't match the cached one, ask them whether to:
- (a) Re-run `/seolens <new-url>` first, or
- (b) Generate the PDF for the cached URL.

### Step 3: Compute output path

```bash
DATE=$(date +%Y%m%d-%H%M%S)
HOST=$(echo "$CACHED_URL" | sed -E 's|https?://||; s|/.*||; s|/$||')
OUT="$HOME/Desktop/seolens-$HOST-$DATE.pdf"
```

### Step 4: Generate the PDF from cache

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" "$CACHED_URL" --from-cache --pdf "$OUT"
```

The `--from-cache` flag tells the CLI to load the audit from `/tmp/seolens-last-audit.json` rather than re-running it. This is fast (1-2 seconds) and guarantees the PDF reflects exactly what was shown in the previous chat audit.

### Step 5: Reply with file path + offer to open

```
✅ PDF report generated

📄 Saved to:
   <full path>

The report includes:
• Cover with score gauge and executive summary
• Score breakdown across 6 marketing categories
• Top 10 findings with severity badges
• Prioritized action plan (Quick Wins / Medium Term / Strategic)
• Methodology and scoring legend

Open it now? Run: open "<full path>"
```

### Step 6: Handle errors

- **`/tmp/seolens-last-audit.json` missing** → Tell user to run `/seolens <url>` first.
- **Cached audit too old (>1 hour)** → CLI exits 4. Tell user to re-run `/seolens` for fresh data.
- **PDF generation throws** → Likely missing `pdfkit` — instruct user to run `npm install` inside `${CLAUDE_PLUGIN_ROOT}`.
