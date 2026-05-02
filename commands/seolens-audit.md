---
name: seolens-audit
description: (Deprecated alias) Run a Seolens SEO audit. Prefer /seolens for chat-only output, or /seolens-pdf for a PDF deliverable.
argument-hint: <url>
---

This is a deprecated alias for the modern Seolens commands.

Tell the user about the two preferred commands:

- **`/seolens <url>`** — quick audit, results shown in chat (no files created)
- **`/seolens-pdf <url>`** — full audit + PDF report saved to Desktop

Then proceed by running `/seolens` behavior on the URL the user provided in `$ARGUMENTS`.

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" "$ARGUMENTS" --json
```

Present results with score, grade, top 3 issues, and what's working. End with a one-line note:

> "Tip: next time use `/seolens` for chat output, or `/seolens-pdf` to save a PDF report."
