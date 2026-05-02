---
name: seolens
description: Run a Seolens SEO audit on a URL. Returns the score, grade, and a prioritized issue list directly in chat — no files generated. Use /seolens-pdf if you need a PDF deliverable.
argument-hint: <url>
---

You are running the Seolens SEO auditor on the URL the user provided.

**Argument:** $ARGUMENTS

## Workflow

### Step 1: Parse the URL

Extract the URL from `$ARGUMENTS`. If no URL is given, ask the user for one.

### Step 2: Run the audit

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/seolens.js" <url> --json
```

This returns structured JSON. No files are created.

### Step 3: Present results in chat

Format your reply like this:

```
✅ SEO audit complete — <hostname>

📊 Score: <X>/100 (Grade <Y> — <Label>)
🟢 <N> passed   🔴 <N> critical   🟡 <N> warnings   🔵 <N> info

**Top issues to fix first:**
1. **<Critical issue label>** — <fix instruction>
2. **<Critical or warning label>** — <fix instruction>
3. **<Warning or info label>** — <fix instruction>

**What's working:** <comma-separated list of 5-7 passing checks>

💡 Want a PDF you can share? Run: /seolens-pdf <url>
```

Be concise. Lead with the score, prioritize critical > warning > info, always include the `fix` field as the actionable next step.

### Step 4: Handle errors

- **URL unreachable / timeout** → Report clearly, suggest checking the URL.
- **`node_modules` missing** → Run `npm install` inside `${CLAUDE_PLUGIN_ROOT}`, then retry.
