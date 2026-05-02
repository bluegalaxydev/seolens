---
name: seolens-audit
description: Run a Seolens SEO audit on the URL the user provides. Returns a 0-100 score, grade, and prioritized list of fixes.
argument-hint: <url> [--pptx | --markdown]
---

You are running the Seolens SEO auditor on the URL the user just provided as an argument.

**Argument:** $ARGUMENTS

Steps:

1. Parse the URL from the argument. If no URL is given, ask the user for one.
2. Detect if the user passed `--pptx` or `--markdown` flags. Default is JSON.
3. Run one of the following bash commands:

**Default (JSON for parsing):**
```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --json
```

**PowerPoint report:**
```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --pptx /tmp/seolens-report.pptx
```

**Markdown report:**
```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --out /tmp/seolens-report.md
```

4. Parse the JSON output and present the results to the user with this structure:
   - **Lead with the score**: "Score: X/100 (Grade Y — Label)"
   - **Summary line**: e.g. "20 passed, 0 critical, 5 warnings, 2 info"
   - **Top 3 issues to fix first** (prioritize critical > warning > info), each with the `fix` field as the actionable next step
   - **What's passing** — list 5-10 things they got right (briefly)
   - **Optional next step**: if the user might want a shareable deliverable, offer to generate a PowerPoint with `/seolens-audit <url> --pptx`

5. If the audit fails (URL unreachable, timeout), report the error clearly and suggest the user check the URL.

Be concise but complete. The user wants actionable insights, not a wall of text.
