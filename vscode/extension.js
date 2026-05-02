/**
 * Seolens — VS Code extension entry point.
 *
 * Wraps the Seolens npm library and renders results in a VS Code webview.
 */
const vscode = require('vscode');
const path = require('node:path');
const fs = require('node:fs');

let seolensLib;

/**
 * Lazy-load the Seolens library. Tries (in order):
 *   1. The published npm package `seolens` (production case)
 *   2. The sibling source at `../src/index.js` (development case — F5 from inside the seolens repo)
 */
async function loadSeolens() {
  if (seolensLib) return seolensLib;
  const tried = [];
  try {
    seolensLib = await import('seolens');
    return seolensLib;
  } catch (err) {
    tried.push(`npm 'seolens': ${err.message}`);
  }
  try {
    const url = require('node:url').pathToFileURL(
      path.join(__dirname, '..', 'src', 'index.js'),
    ).href;
    seolensLib = await import(url);
    return seolensLib;
  } catch (err) {
    tried.push(`local ../src/index.js: ${err.message}`);
  }
  throw new Error(
    `Could not load Seolens. Run \`npm install -g seolens\` then reload VS Code.\n\nTried:\n - ${tried.join('\n - ')}`,
  );
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('seolens.auditUrl', async () => {
      const url = await vscode.window.showInputBox({
        title: 'Seolens — Audit URL',
        prompt: 'Enter the URL to audit',
        placeHolder: 'https://example.com',
        validateInput: (v) => {
          if (!v) return 'URL is required';
          if (!/^https?:\/\//i.test(v) && !v.includes('.')) return 'Enter a valid URL';
          return null;
        },
      });
      if (!url) return;
      await runAudit(context, url);
    }),

    vscode.commands.registerCommand('seolens.auditCurrentFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Open an HTML file first.');
        return;
      }
      const filePath = editor.document.uri.fsPath;
      const fileUrl = `file://${filePath}`;
      await runAudit(context, fileUrl);
    }),
  );
}

async function runAudit(context, url) {
  let lib;
  try {
    lib = await loadSeolens();
  } catch (err) {
    vscode.window.showErrorMessage(err.message);
    return;
  }

  const config = vscode.workspace.getConfiguration('seolens');
  const timeout = config.get('timeout', 15000);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Seolens: auditing ${url}`,
      cancellable: false,
    },
    async (progress) => {
      try {
        const result = await lib.audit(url, {
          timeout,
          onProgress: (i, total, id) => {
            progress.report({ message: `${i}/${total}: ${id}`, increment: 100 / total });
          },
        });
        showResults(context, result);
      } catch (err) {
        vscode.window.showErrorMessage(`Seolens audit failed: ${err.message}`);
      }
    },
  );
}

function showResults(context, audit) {
  const panel = vscode.window.createWebviewPanel(
    'seolensReport',
    `SEO: ${shortUrl(audit.url)} — ${audit.score.value}/100`,
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true },
  );
  panel.webview.html = renderHtml(audit);

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.command === 'savePptx') {
      try {
        const lib = await loadSeolens();
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(`seolens-report-${Date.now()}.pptx`),
          filters: { PowerPoint: ['pptx'] },
        });
        if (!uri) return;
        await lib.renderPptx(audit, uri.fsPath);
        const open = await vscode.window.showInformationMessage('PowerPoint report saved.', 'Reveal in Finder');
        if (open) vscode.commands.executeCommand('revealFileInOS', uri);
      } catch (err) {
        vscode.window.showErrorMessage(`PPTX export failed: ${err.message}`);
      }
    }
    if (msg.command === 'saveMarkdown') {
      try {
        const lib = await loadSeolens();
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(`seolens-report-${Date.now()}.md`),
          filters: { Markdown: ['md'] },
        });
        if (!uri) return;
        const md = lib.renderMarkdown(audit);
        fs.writeFileSync(uri.fsPath, md, 'utf8');
        vscode.window.showInformationMessage('Markdown report saved.');
      } catch (err) {
        vscode.window.showErrorMessage(`Markdown export failed: ${err.message}`);
      }
    }
  });
}

function shortUrl(u) {
  try { return new URL(u).host; } catch { return u; }
}

function renderHtml(audit) {
  const score = audit.score;
  const scoreColor = score.value >= 80 ? '#16a34a' : score.value >= 60 ? '#ca8a04' : '#dc2626';
  const failed = audit.results.filter((r) => !r.passed && r.severity !== 'skip');
  const passed = audit.results.filter((r) => r.passed);
  const grouped = groupBy(failed, 'category');

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Seolens — ${esc(audit.url)}</title>
<style>
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --muted: var(--vscode-descriptionForeground);
    --primary: var(--vscode-button-background, #0066ff);
    --gray: var(--vscode-input-background);
    --border: var(--vscode-panel-border, #444);
    --red: #ef4444;
    --yellow: #f59e0b;
    --blue: #3b82f6;
    --green: #22c55e;
  }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: var(--fg); background: var(--bg); padding: 1.5em; max-width: 920px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { margin: 28px 0 8px; font-size: 18px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
  .url { color: var(--muted); margin-bottom: 20px; font-size: 13px; word-break: break-all; }
  .header-actions { float: right; }
  .header-actions button { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 6px; }
  .header-actions button:hover { opacity: 0.9; }
  .score-card { display: flex; gap: 24px; padding: 20px; background: var(--gray); border-radius: 8px; margin: 16px 0 24px; align-items: center; }
  .score-big { font-size: 56px; font-weight: 700; color: ${scoreColor}; line-height: 1; }
  .score-label { color: var(--muted); margin-top: 6px; }
  .stats { display: flex; gap: 16px; margin-left: auto; }
  .stat { text-align: center; min-width: 56px; }
  .stat-value { font-size: 20px; font-weight: 600; }
  .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .check { padding: 12px 14px; border-left: 3px solid var(--border); margin: 8px 0; background: var(--gray); border-radius: 0 6px 6px 0; }
  .check.critical { border-left-color: var(--red); }
  .check.warning { border-left-color: var(--yellow); }
  .check.info { border-left-color: var(--blue); }
  .check.passed { border-left-color: var(--green); }
  .check-label { font-weight: 600; }
  .check-msg { color: var(--muted); margin-top: 4px; font-size: 13px; }
  .check-fix { color: var(--primary); margin-top: 6px; font-size: 13px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-right: 6px; vertical-align: middle; }
  .badge.critical { background: rgba(239,68,68,0.2); color: var(--red); }
  .badge.warning { background: rgba(245,158,11,0.2); color: var(--yellow); }
  .badge.info { background: rgba(59,130,246,0.2); color: var(--blue); }
  .passed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; color: var(--green); font-size: 13px; margin-top: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; text-align: center; }
</style>
</head>
<body>

<div class="header-actions">
  <button onclick="exportPptx()">📊 Export PowerPoint</button>
  <button onclick="exportMarkdown()">📝 Export Markdown</button>
</div>

<h1>SEO Audit</h1>
<div class="url">${esc(audit.url)}</div>

<div class="score-card">
  <div>
    <div class="score-big">${score.value}<span style="font-size:24px;color:var(--muted)">/100</span></div>
    <div class="score-label">Grade ${score.grade} · ${score.label}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-value" style="color:var(--green)">${audit.summary.passed}</div><div class="stat-label">Passed</div></div>
    <div class="stat"><div class="stat-value" style="color:var(--red)">${audit.summary.critical}</div><div class="stat-label">Critical</div></div>
    <div class="stat"><div class="stat-value" style="color:var(--yellow)">${audit.summary.warning}</div><div class="stat-label">Warning</div></div>
    <div class="stat"><div class="stat-value" style="color:var(--blue)">${audit.summary.info}</div><div class="stat-label">Info</div></div>
  </div>
</div>

${failed.length === 0 ? '<h2>All checks passed ✓</h2>' : ''}

${Object.entries(grouped).map(([cat, items]) => `
<h2>${esc(catLabel(cat))}</h2>
${items.map((r) => `
  <div class="check ${r.severity || 'failed'}">
    <div class="check-label">
      <span class="badge ${r.severity || 'failed'}">${(r.severity || 'fail').toUpperCase()}</span>
      ${esc(r.label)}
    </div>
    <div class="check-msg">${esc(r.message || '')}</div>
    ${r.fix ? `<div class="check-fix">→ ${esc(r.fix)}</div>` : ''}
  </div>
`).join('')}
`).join('')}

${passed.length ? `
<h2>What's working (${passed.length})</h2>
<div class="passed-grid">
  ${passed.map((r) => `<div>✓ ${esc(r.label)}</div>`).join('')}
</div>
` : ''}

<div class="footer">
  Powered by <a href="https://github.com/bluegalaxydev/seolens">Seolens</a>.
  Want full-site crawl, Core Web Vitals, AI fix suggestions? <a href="https://github.com/bluegalaxydev/seolens-pro">Seolens Pro</a>
</div>

<script>
  const vscode = acquireVsCodeApi();
  function exportPptx() { vscode.postMessage({ command: 'savePptx' }); }
  function exportMarkdown() { vscode.postMessage({ command: 'saveMarkdown' }); }
</script>
</body>
</html>`;
}

function groupBy(arr, key) {
  const out = {};
  for (const x of arr) {
    if (!out[x[key]]) out[x[key]] = [];
    out[x[key]].push(x);
  }
  return out;
}

function catLabel(cat) {
  const map = {
    meta: 'Meta Tags',
    headings: 'Headings',
    images: 'Images',
    links: 'Links',
    technical: 'Technical',
    social: 'Social',
    'structured-data': 'Structured Data',
  };
  return map[cat] || cat;
}

function esc(s) {
  return String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

function deactivate() {}

module.exports = { activate, deactivate };
