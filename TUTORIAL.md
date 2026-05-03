# Seolens Tutorial — First Audit in 5 Minutes

This walkthrough gets you from "never heard of Seolens" to "PDF report on my desktop" in about 5 minutes. It assumes you have Claude Code installed in VS Code, Cursor, or another supported IDE.

> **Don't have Claude Code yet?** Install it first: https://docs.claude.com/en/docs/agents-and-tools/claude-code/overview

---

## Step 1 — Open your terminal

On Mac: `Cmd + Space`, type **Terminal**, press Enter.
On Windows: press the Windows key, type **Terminal**, press Enter.

You'll see a command-line prompt like:
```
chunlinpeng@MacBook-Pro ~ %
```

That blinking cursor is where you'll type commands.

## Step 2 — Install the Seolens skill

Copy this entire block, paste it into your terminal, and press Enter:

```bash
mkdir -p ~/.claude/skills && cd ~/.claude/skills && \
  git clone https://github.com/bluegalaxydev/seolens.git && \
  cd seolens && npm install
```

You should see:
- A bunch of files being downloaded ("Cloning into 'seolens'...")
- npm installing dependencies (takes 10-30 seconds)
- Eventually `added 79 packages` and back to the prompt

If you see `added N packages` — you're good. Move on.

> **If `git` isn't found**, run `xcode-select --install` (Mac) and follow the prompt, then retry.
> **If `npm` isn't found**, install Node.js: https://nodejs.org (download the LTS version).

## Step 3 — Register the slash commands

Copy + paste this into your terminal:

```bash
mkdir -p ~/.claude/commands && \
  cp ~/.claude/skills/seolens/commands/*.md ~/.claude/commands/
```

This is what makes `/seolens-pdf` show up as a slash command in your IDE. (Without this step, only `/seolens` works — `/seolens-pdf` would say "command not found".)

## Step 4 — Restart your IDE

Close VS Code / Cursor / JetBrains **completely**:
- Mac: `Cmd + Q` (NOT just closing the window — actually quit the app)
- Windows: `Alt + F4` then make sure no window remains

Then reopen the app from your dock or Start menu.

## Step 5 — Open a fresh Claude Code chat

In your IDE, find the Claude Code panel (usually right side or activity bar).

Look for a **`+`** icon or **"New Chat"** button at the top of the panel and click it. Always start fresh — slash commands sometimes don't load in old chats.

## Step 6 — Run your first audit

In the Claude Code chat input, type:

```
/seolens https://your-favorite-site.com
```

Replace `https://your-favorite-site.com` with a real site you want to audit. Try your own site, your client's site, or a public site like `https://github.com`.

Press Enter. You should see:

1. Claude says it's running an audit
2. A bash command is executed: `cd /Users/.../seolens && node bin/seolens.js ...`
3. After 5-10 seconds, Claude responds with:
   - **Score** (e.g. "85/100, Grade B — Solid")
   - **Top issues** (Critical, Warnings, Info)
   - **What's working**

If you got that — congratulations, the skill works.

## Step 7 — Generate the PDF report

Right after the chat audit finishes, type:

```
/seolens-pdf https://your-favorite-site.com
```

(Use the **same URL** you just audited — the PDF command reads cached results to avoid re-running 106 checks.)

After 1-2 seconds, Claude will say:

```
✅ PDF report generated

📄 Saved to:
   /Users/<you>/Desktop/seolens-<host>-<timestamp>.pdf

Open it now? Run: open "..."
```

## Step 8 — Open the PDF

Either:
- Double-click the file on your Desktop
- Or copy the path Claude gave you and run `open "<path>"` in your terminal

You'll see an 8-page report with:
1. **Cover** — score gauge, executive summary
2. **Score Breakdown** — 6 category bars
3. **Key Findings** — top 10 issues
4. **What's Working Well** — strengths
5. **Quick Wins** — fix this week
6. **Medium Term** — fix in 1-3 months
7. **Strategic** — fix in 3-6 months
8. **Methodology** — how scoring works

That's your client deliverable. You can email it as-is.

---

## Common pitfalls

### "I typed `/seolens-pdf` but Claude doesn't recognize it"

You probably skipped step 3 (registering slash commands) or step 4 (full restart). Quick fix:

```bash
cp ~/.claude/skills/seolens/commands/*.md ~/.claude/commands/
```

Then `Cmd+Q` your IDE and reopen. **Reload Window is not enough — you need a full quit + relaunch**.

### "It says 'No cached audit found'"

You ran `/seolens-pdf` without first running `/seolens`. The PDF command needs an audit to build from. Run:

```
/seolens <url>          ← do this first
/seolens-pdf <url>      ← then this
```

### "It worked on URL A but now I want URL B and it complains"

The cache is for one URL at a time. Run `/seolens <new-url>` to refresh, then `/seolens-pdf <new-url>`.

### "I want to audit my localhost"

Currently Seolens only fetches HTTP/HTTPS URLs. Start a dev server first:

```bash
python3 -m http.server 8000
```

Then audit `http://localhost:8000`.

---

## Next steps

- ⭐ **Star the repo** at https://github.com/bluegalaxydev/seolens
- 🐛 **Report bugs** or **request checks** via GitHub Issues
- 🚀 **Try Seolens Pro** for full-site crawl + Core Web Vitals + real backlink data: https://github.com/bluegalaxydev/seolens-pro
- 💬 **Tell a friend** — Seolens is free, but stars and word-of-mouth help fund development

Have fun. The fastest way to improve a site's SEO is to know what's broken — Seolens just made that part free.
