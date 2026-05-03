#!/usr/bin/env node
/**
 * Seolens CLI entry point.
 *
 * Usage:
 *   seolens <url>                 — audit URL, print report to terminal
 *   seolens <url> --json          — output JSON
 *   seolens <url> --markdown      — output Markdown
 *   seolens <url> --out report.md — save Markdown to file
 */
import { audit, LAST_AUDIT_PATH } from '../src/audit.js';
import { renderTerminal, renderMarkdown } from '../src/reporter.js';
import { renderPptx } from '../src/pptx-reporter.js';
import { renderPdf } from '../src/pdf-reporter.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('seolens 0.1.0');
  process.exit(0);
}

const url = args.find((a) => !a.startsWith('--'));
if (!url) {
  console.error('Error: missing URL.');
  printHelp();
  process.exit(1);
}

const wantJson = args.includes('--json');
const wantMarkdown = args.includes('--markdown') || args.includes('--md');
const outIndex = args.findIndex((a) => a === '--out' || a === '-o');
const outPath = outIndex >= 0 ? args[outIndex + 1] : null;
const pptxIndex = args.indexOf('--pptx');
const pptxPath = pptxIndex >= 0 ? args[pptxIndex + 1] : null;
const pdfIndex = args.indexOf('--pdf');
const pdfPath = pdfIndex >= 0 ? args[pdfIndex + 1] : null;
const preparedForIdx = args.indexOf('--prepared-for');
const preparedFor = preparedForIdx >= 0 ? args[preparedForIdx + 1] : null;
const preparedByIdx = args.indexOf('--prepared-by');
const preparedBy = preparedByIdx >= 0 ? args[preparedByIdx + 1] : null;

const fromCache = args.includes('--from-cache');

(async () => {
  try {
    let result;
    if (fromCache) {
      // /seolens-pdf workflow: read the last audit from cache rather than re-running.
      // This enforces the "/seolens first, /seolens-pdf second" pattern.
      if (!existsSync(LAST_AUDIT_PATH)) {
        process.stderr.write(`No cached audit found at ${LAST_AUDIT_PATH}.\nPlease run /seolens <url> first to generate one.\n`);
        process.exit(4);
      }
      result = JSON.parse(readFileSync(LAST_AUDIT_PATH, 'utf8'));
      // Verify the cached URL matches what was requested
      if (url && !result.url.includes(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))) {
        process.stderr.write(`Cached audit is for ${result.url}, not ${url}.\nRun /seolens ${url} first, then /seolens-pdf.\n`);
        process.exit(4);
      }
      // Check freshness — cache older than 1 hour is suspicious
      const ageMs = Date.now() - new Date(result.fetchedAt).getTime();
      if (ageMs > 3600_000) {
        process.stderr.write(`Cached audit is ${Math.round(ageMs / 60000)} minutes old.\nFor fresh data, run /seolens <url> first.\n`);
        process.exit(4);
      }
      process.stderr.write(`Using cached audit from ${new Date(result.fetchedAt).toLocaleTimeString()}\n`);
    } else {
      if (!wantJson) {
        process.stderr.write(`Auditing ${url}…\n`);
      }
      result = await audit(url, {
        onProgress: (i, total, id) => {
          if (!wantJson) process.stderr.write(`  [${i}/${total}] ${id}\r`);
        },
      });
    }

    if (!wantJson) process.stderr.write(' '.repeat(60) + '\r');

    if (pptxPath) {
      const abs = resolve(process.cwd(), pptxPath);
      await renderPptx(result, abs);
      process.stderr.write(`PowerPoint report saved to ${abs}\n`);
    }

    if (pdfPath) {
      const abs = resolve(process.cwd(), pdfPath);
      await renderPdf(result, abs, { preparedFor, preparedBy });
      process.stderr.write(`PDF report saved to ${abs}\n`);
    }

    if (wantJson) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    } else if (wantMarkdown || outPath) {
      const md = renderMarkdown(result);
      if (outPath) {
        const abs = resolve(process.cwd(), outPath);
        writeFileSync(abs, md, 'utf8');
        process.stderr.write(`Markdown report saved to ${abs}\n`);
      } else {
        process.stdout.write(md);
      }
    } else if (!pptxPath && !pdfPath) {
      process.stdout.write(renderTerminal(result));
    }

    // Exit non-zero if score is below 70 (useful in CI)
    process.exit(result.score.value >= 70 ? 0 : 1);
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(2);
  }
})();

function printHelp() {
  console.log(`
  Seolens — fast SEO auditor

  Usage:
    seolens <url>                  Run audit, print to terminal
    seolens <url> --markdown       Print Markdown report to stdout
    seolens <url> --json           Print full JSON results
    seolens <url> --out FILE       Save Markdown report to FILE
    seolens <url> --pptx FILE      Save PowerPoint (.pptx) report to FILE
    seolens <url> --pdf FILE       Save PDF report (3-4 pages) to FILE

  Examples:
    seolens https://example.com
    seolens example.com --pdf report.pdf
    seolens example.com --pptx report.pptx
    seolens example.com --out report.md
    seolens example.com --json | jq '.score'
`);
}
