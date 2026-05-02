---
name: seolens-pdf
description: Run a Seolens SEO audit and generate a polished PDF report saved to the user's Desktop. Use this when the user wants a deliverable they can share with clients or a team. Page count adapts to the audit findings.
argument-hint: <url>
---

You are running the Seolens SEO auditor on the URL the user provided AND generating a PDF report file as the primary deliverable.

**Argument:** $ARGUMENTS

## Workflow

### Step 1: Parse the URL

Extract the URL from `$ARGUMENTS`. If no URL is given, ask the user for one.

### Step 2: Compute a PDF output path

Default location is the user's Desktop:

```bash
DATE=$(date +%Y%m%d-%H%M%S)
HOST=$(echo "<url>" | sed -E 's|https?://||; s|/.*||; s|/$||')
OUT="$HOME/Desktop/seolens-$HOST-$DATE.pdf"
```

### Step 3: Run audit + PDF generation in one command

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" "<url>" --pdf "$OUT" --json
```

The `--pdf` flag generates the report file. The `--json` flag returns structured data so you can write a short summary in chat.

### Step 4: Tell the user where the PDF is

Reply in this exact structure:

```
✅ PDF report generated

📊 Score: <X>/100 (Grade <Y> — <Label>)
🟢 <N> passed   🔴 <N> critical   🟡 <N> warnings   🔵 <N> info

📄 PDF saved to:
   <full path to PDF>

The report includes a cover with the score, an executive summary, all findings grouped by category with fix instructions, what's working, and recommended next steps.

Open it now? Run: open "<full path to PDF>"
```

Make sure the file path is on its own line so the user can copy/paste it.

### Step 5: Handle errors

- **PDF generation fails but audit succeeded** → Print the JSON summary in chat and tell the user PDF export failed (likely missing `pdfkit` — run `npm install` inside `${CLAUDE_PLUGIN_ROOT}`).
- **Audit fails entirely** → Report the error, suggest checking the URL.
- **`node_modules` missing** → Run `npm install` inside `${CLAUDE_PLUGIN_ROOT}` first, then retry.

## Variant: PowerPoint instead of PDF

If the user explicitly asks for a slide deck instead of a PDF, swap `--pdf` for `--pptx` and use a `.pptx` extension on the output path.
