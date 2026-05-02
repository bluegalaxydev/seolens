/**
 * Main audit orchestration. Fetches a URL, runs all checks, returns structured results.
 */
import * as cheerio from 'cheerio';
import { fetchPage } from './fetcher.js';
import { allChecks } from './checks/index.js';
import { computeScore } from './scorer.js';

/**
 * @param {string} url - The URL to audit.
 * @param {object} [options]
 * @param {number} [options.timeout=15000]
 * @param {function} [options.onProgress] - called with (current, total, checkId)
 * @returns {Promise<AuditResult>}
 */
export async function audit(url, options = {}) {
  const { timeout = 15000, onProgress } = options;

  // Normalize URL
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const page = await fetchPage(url, { timeout });
  const $ = cheerio.load(page.html);
  const ctx = {
    url: page.finalUrl,
    requestedUrl: page.requestedUrl,
    status: page.status,
    headers: page.headers,
    html: page.html,
    bytes: page.bytes,
    elapsedMs: page.elapsedMs,
    $,
  };

  const results = [];
  let i = 0;
  let lastCategory = null;
  for (const check of allChecks) {
    i++;
    // Stage announcement when category changes — gives users a sense of progress
    if (check.category !== lastCategory) {
      if (onProgress) onProgress(i, allChecks.length, `Stage: ${check.category}`, true);
      lastCategory = check.category;
    }
    if (onProgress) onProgress(i, allChecks.length, check.id);
    try {
      const out = await check.run(ctx);
      results.push({
        id: check.id,
        category: check.category,
        label: check.label,
        weight: check.weight,
        ...out,
      });
    } catch (err) {
      results.push({
        id: check.id,
        category: check.category,
        label: check.label,
        weight: check.weight,
        passed: false,
        severity: 'error',
        message: `Check threw: ${err.message}`,
      });
    }
  }

  const score = computeScore(results);

  return {
    url: ctx.url,
    requestedUrl: ctx.requestedUrl,
    fetchedAt: new Date().toISOString(),
    status: ctx.status,
    bytes: ctx.bytes,
    elapsedMs: ctx.elapsedMs,
    score,
    results,
    summary: summarize(results),
  };
}

function summarize(results) {
  const counts = { passed: 0, critical: 0, warning: 0, info: 0, skipped: 0 };
  for (const r of results) {
    if (r.passed) counts.passed++;
    else if (r.severity === 'critical') counts.critical++;
    else if (r.severity === 'warning') counts.warning++;
    else if (r.severity === 'info') counts.info++;
    else if (r.severity === 'skip') counts.skipped++;
  }
  return counts;
}
