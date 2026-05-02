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
import { audit } from '../src/audit.js';
import { renderTerminal, renderMarkdown } from '../src/reporter.js';
import { renderPptx } from '../src/pptx-reporter.js';
import { writeFileSync } from 'node:fs';
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

(async () => {
  try {
    if (!wantJson) {
      process.stderr.write(`Auditing ${url}…\n`);
    }
    const result = await audit(url, {
      onProgress: (i, total, id) => {
        if (!wantJson) process.stderr.write(`  [${i}/${total}] ${id}\r`);
      },
    });

    if (!wantJson) process.stderr.write(' '.repeat(60) + '\r');

    if (pptxPath) {
      const abs = resolve(process.cwd(), pptxPath);
      await renderPptx(result, abs);
      process.stderr.write(`PowerPoint report saved to ${abs}\n`);
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
    } else if (!pptxPath) {
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

  Examples:
    seolens https://example.com
    seolens example.com --markdown > report.md
    seolens example.com --out report.md
    seolens example.com --pptx report.pptx
    seolens example.com --json | jq '.score'
`);
}
