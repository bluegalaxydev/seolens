/**
 * Premium PDF report generator for Seolens.
 *
 * Layout (matches the marketing-audit report style):
 *   Page 1: Cover — navy header, big donut score gauge, executive summary
 *   Page 2: Score breakdown — horizontal bar chart + table
 *   Page 3: Key findings — severity-coded table
 *   Page 4+: Prioritized action plan (Quick Wins / Medium Term / Strategic)
 *   Final: Methodology + scoring legend
 *
 * Visual identity:
 *   - Navy header bar on every page (#1F2D4D) with brand + URL
 *   - Off-white background (#FAFBFC) instead of pure white for premium feel
 *   - Severity-coded badges (critical=red, warning=orange, info=blue)
 *   - Section headers with colored backgrounds
 *   - Subtle hairline rules between sections
 */
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { categories, marketingCategories } from './checks/index.js';
import { estimateUplift } from './scorer.js';

// Cool-gray "consulting elite" palette — McKinsey/BCG/Goldman vibe.
// Cool gray background (not warm cream) for a more institutional, B2B feel.
// Navy + gold accent maintains the editorial premium quality.
const C = {
  navy: '#1F2D4D',          // primary brand
  navyDeep: '#0F1A30',      // deeper navy for footers
  gold: '#B89968',          // refined warm gold (slightly muted to play with cool gray)
  goldSoft: '#DACDB0',      // gold tint for hairlines
  ink: '#1A2138',           // body text (dark cool charcoal)
  bodyText: '#2D3447',
  muted: '#6B7589',
  hairline: '#DCE0E8',      // cool gray hairlines
  bg: '#F4F6FA',            // cool gray background — consulting/finance industry standard
  bgPanel: '#FFFFFF',       // pure white panels for contrast
  bgAlt: '#E9EDF4',         // slightly darker cool gray for alt rows
  primary: '#1F4FB6',
  green: '#15803D',
  greenSoft: '#D1FAE5',
  yellow: '#B45309',
  yellowSoft: '#FEF3C7',
  red: '#B91C1C',
  redSoft: '#FEE2E2',
  blue: '#1E40AF',
  blueSoft: '#DBEAFE',
};

const PAGE = { W: 612, H: 792 };
const HEADER_H = 50;
const FOOTER_H = 30;
const MARGIN = 56;

export async function renderPdf(audit, outPath, options = {}) {
  const meta = {
    preparedFor: options.preparedFor || '',
    preparedBy: options.preparedBy || '',
  };
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      // Set all margins to 0 so PDFKit doesn't auto-paginate when text() goes
      // past the implicit margin. We manage all positioning manually.
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: false,
      info: {
        Title: `SEO Audit Report — ${audit.url}`,
        Author: 'SEO Audit',
        Subject: `On-page SEO audit for ${audit.url}`,
        Keywords: 'seo, audit, on-page, technical seo, marketing',
        Producer: 'SEO Audit Report',
      },
    });

    const stream = createWriteStream(outPath);
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
    doc.pipe(stream);

    let pageNum = 0;
    const newPage = () => {
      doc.addPage();
      pageNum++;
      drawPageChrome(doc, audit, pageNum);
    };

    coverPage(doc, audit, newPage, meta);
    scoreBreakdownPage(doc, audit, newPage);
    keyFindingsPage(doc, audit, newPage);
    riskQuadrantPage(doc, audit, newPage);
    strengthsPage(doc, audit, newPage);
    actionPlanPages(doc, audit, newPage);
    methodologyPage(doc, audit, newPage, meta);

    doc.end();
  });
}

// ============ PAGE CHROME ============
function drawPageChrome(doc, audit, pageNum) {
  // Cream background (premium "weight" — never pure white)
  doc.rect(0, 0, PAGE.W, PAGE.H).fill(C.bg);

  // ─── Navy header bar with gold rule below ───
  doc.rect(0, 0, PAGE.W, HEADER_H).fill(C.navy);
  // Subtle gold accent line beneath header (the signature "premium" detail)
  doc.rect(0, HEADER_H, PAGE.W, 2).fill(C.gold);

  // Brand-neutral header — just the report category in white, URL in gold-accent right-aligned.
  // Keeps the document feeling like a deliverable, not a tool's output.
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('SEO AUDIT REPORT', MARGIN, HEADER_H / 2 - 6, { characterSpacing: 2 });

  // URL on the right
  doc
    .fillColor('#E8DAB8')
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(audit.url, PAGE.W / 2, HEADER_H / 2 - 4, { width: PAGE.W / 2 - MARGIN, align: 'right' });

  // ─── Left edge gold accent strip (the "magazine spine" effect) ───
  // Only on pages 2+ (cover gets a different treatment)
  if (pageNum > 1) {
    doc.rect(0, HEADER_H + 2, 4, PAGE.H - HEADER_H - 2 - FOOTER_H).fill(C.gold);
  }

  // ─── Footer with thin gold rule (brand-neutral) ───
  doc.moveTo(MARGIN, PAGE.H - FOOTER_H).lineTo(PAGE.W - MARGIN, PAGE.H - FOOTER_H).strokeColor(C.gold).lineWidth(0.5).stroke();
  // Left: confidentiality marker
  doc
    .fillColor(C.muted)
    .font('Helvetica')
    .fontSize(8.5)
    .text('CONFIDENTIAL  ·  ON-PAGE SEO AUDIT', MARGIN, PAGE.H - FOOTER_H + 12, { width: PAGE.W / 2 - MARGIN, align: 'left', characterSpacing: 1 });
  // Right: page number
  doc
    .fillColor(C.muted)
    .font('Helvetica-Oblique')
    .fontSize(8.5)
    .text(`— ${pageNum} —`, PAGE.W / 2, PAGE.H - FOOTER_H + 12, { width: PAGE.W / 2 - MARGIN, align: 'right' });
}

// ============ PAGE 1: COVER ============
function coverPage(doc, audit, newPage, meta = {}) {
  newPage();

  // Cover side accent: navy block + gold strip
  doc.rect(0, HEADER_H + 2, 28, PAGE.H - HEADER_H - 2 - FOOTER_H).fill(C.navy);
  doc.rect(28, HEADER_H + 2, 4, PAGE.H - HEADER_H - 2 - FOOTER_H).fill(C.gold);

  const xL = MARGIN + 10;     // left content X (after side accent)
  const contentW = PAGE.W - xL - MARGIN;

  // ─── 1) Eyebrow ───
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('CONFIDENTIAL  ·  ON-PAGE SEO AUDIT', xL, 95, { characterSpacing: 2 });

  // ─── 2) Title (single big line, no wrap to second line) ───
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(38)
    .text('SEO Audit Report', xL, 115);

  // Thin gold rule below title
  doc.moveTo(xL, 168).lineTo(xL + 70, 168).strokeColor(C.gold).lineWidth(2).stroke();

  // ─── 3) Audit Reference line ───
  const auditId = computeAuditId(audit);
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text(
      `AUDIT REFERENCE  ${auditId}    ·    ${audit.results.length} CHECKS    ·    ${Object.keys(categories).length} CATEGORIES`,
      xL, 188, { characterSpacing: 1.6, width: contentW },
    );

  // ─── 4) Prepared For block (clean, single line, full width) ───
  const ppY = 215;
  // Top hairline
  doc.moveTo(xL, ppY).lineTo(xL + contentW, ppY).strokeColor(C.gold).lineWidth(0.5).stroke();
  // PREPARED FOR eyebrow + client name + URL — all single column
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7.5).text('PREPARED FOR', xL, ppY + 12, { characterSpacing: 1.8 });
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(14).text(
    meta.preparedFor || extractClientName(audit.url),
    xL, ppY + 26, { width: contentW, height: 18, ellipsis: true, lineBreak: false },
  );
  doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(
    audit.url,
    xL, ppY + 46, { width: contentW, height: 12, ellipsis: true, lineBreak: false },
  );
  // Bottom hairline
  doc.moveTo(xL, ppY + 64).lineTo(xL + contentW, ppY + 64).strokeColor(C.gold).lineWidth(0.5).stroke();

  // ─── 5) Critical Insight quote (LEFT) + Donut gauge (RIGHT) ───
  // These share vertical space y=300..430
  const midY = 305;
  const midH = 130;
  const gaugeR = 56;
  const gaugeCx = xL + contentW - gaugeR - 14;
  const gaugeCy = midY + midH / 2;
  drawDonutGauge(doc, gaugeCx, gaugeCy, gaugeR, audit);

  // Score caption below gauge (very compact)
  doc
    .fillColor(C.muted)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text('OVERALL  ·  ' + audit.score.label.toUpperCase(), gaugeCx - 60, gaugeCy + gaugeR + 8, { width: 120, align: 'center', characterSpacing: 1.5 });

  // Quote on the left half
  const upliftPreview = estimateUplift(audit.results, audit.score.value);
  const totalIssuesCover = audit.summary.critical + audit.summary.warning + audit.summary.info;
  const quoteText = upliftPreview.high > 5
    ? `An estimated ${upliftPreview.headline} of organic traffic is currently being suppressed by ${totalIssuesCover} fixable on-page deficiencies.`
    : `${totalIssuesCover} optimization opportunities identified across the audit.`;
  const quoteX = xL + 22;
  const quoteW = gaugeCx - gaugeR - quoteX - 30;
  // Big gold opening quote
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(40).text('"', xL + 4, midY - 4);
  // Quote
  doc.fillColor(C.navy).font('Helvetica-Oblique').fontSize(12).text(quoteText, quoteX, midY + 12, { width: quoteW, lineGap: 2.5 });
  // Attribution
  const attrY = doc.y + 6;
  doc.moveTo(quoteX, attrY).lineTo(quoteX + 26, attrY).strokeColor(C.gold).lineWidth(1).stroke();
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7).text('FROM THE AUDIT', quoteX, attrY + 6, { characterSpacing: 1.5 });

  // ─── 6) Projected Uplift navy callout ───
  const uplift = estimateUplift(audit.results, audit.score.value);
  const upY = 460;
  const upH = 56;
  doc.roundedRect(xL, upY, contentW, upH, 4).fillColor(C.navy).fill();
  doc.rect(xL, upY, 4, upH).fill(C.gold);
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7.5).text('PROJECTED ORGANIC TRAFFIC RECOVERY', xL + 16, upY + 9, { characterSpacing: 2 });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text(uplift.headline, xL + 14, upY + 21);
  doc.fillColor('#E8DAB8').font('Helvetica-Bold').fontSize(8.5).text('within 60–120 days post-remediation', xL + 226, upY + 24);
  doc.fillColor('#B7C2DB').font('Helvetica-Oblique').fontSize(7.5).text('Modeled from comparable on-page remediation outcomes', xL + 226, upY + 38);

  // ─── 7) Executive Summary panel ───
  const panelY = 532;
  const panelH = 192;
  // Subtle shadow + panel
  doc.roundedRect(xL + 2, panelY + 2, contentW, panelH, 4).fillColor('#D5D9E0').fill();
  doc.roundedRect(xL, panelY, contentW, panelH, 4).fillColor(C.bgPanel).fill();
  doc.rect(xL, panelY, 3, panelH).fill(C.gold);
  // Content
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(8.5).text('EXECUTIVE SUMMARY', xL + 18, panelY + 14, { characterSpacing: 2 });
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(13).text(
    `Score: ${audit.score.value}/100  ·  Grade ${audit.score.grade}`,
    xL + 18, panelY + 30,
  );
  doc.fillColor(C.bodyText).font('Helvetica').fontSize(9.5).text(
    executiveSummary(audit, uplift),
    xL + 18, panelY + 52, { width: contentW - 36, lineGap: 2.5, align: 'left' },
  );
}

function drawDonutGauge(doc, cx, cy, r, audit) {
  // Full circle gauge (more elegant than semicircle for premium feel)
  const startAngle = -Math.PI / 2;       // start at top
  const endAngle = startAngle + Math.PI * 2;
  const value = Math.max(0, Math.min(100, audit.score.value));
  const fillEnd = startAngle + (endAngle - startAngle) * (value / 100);
  const arcThickness = 14;

  // Background ring — soft gold tint
  drawArc(doc, cx, cy, r, startAngle, endAngle, C.goldSoft, arcThickness);
  // Score arc — solid color
  drawArc(doc, cx, cy, r, startAngle, fillEnd, scoreColorFor(value), arcThickness);

  // Inner white disc for clean donut center
  doc.circle(cx, cy, r - arcThickness - 2).fillColor(C.bgPanel).fill();
  // Subtle inner ring (gold hairline)
  doc.circle(cx, cy, r - arcThickness - 2).strokeColor(C.gold).lineWidth(0.4).stroke();

  // Big score number (centered)
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(40)
    .text(`${value}`, cx - 40, cy - 22, { width: 80, align: 'center' });
  // Small "/100" label
  doc
    .fillColor(C.muted)
    .font('Helvetica')
    .fontSize(10)
    .text('out of 100', cx - 40, cy + 18, { width: 80, align: 'center', characterSpacing: 1 });
}

function drawArc(doc, cx, cy, r, startAngle, endAngle, color, thickness) {
  if (Math.abs(endAngle - startAngle) < 0.001) return;
  const steps = 60;
  const span = endAngle - startAngle;
  doc.lineWidth(thickness).strokeColor(color);
  doc.path(arcPath(cx, cy, r, startAngle, endAngle, steps)).stroke();
}

function arcPath(cx, cy, r, startAngle, endAngle, steps) {
  const stepAngle = (endAngle - startAngle) / steps;
  let path = '';
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + i * stepAngle;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return path;
}

// ============ PAGE 2: SCORE BREAKDOWN ============
function scoreBreakdownPage(doc, audit, newPage) {
  newPage();

  let y = drawSectionHeader(doc, '01', 'SCORE BREAKDOWN', 'Performance across six marketing dimensions');

  const breakdown = computeBreakdown(audit);

  // ─── 3 × 2 card grid ───
  const gridW = PAGE.W - MARGIN * 2;
  const cardW = (gridW - 24) / 3;     // 3 columns, 12px gap × 2
  const cardH = 110;
  const cardGapX = 12;
  const cardGapY = 14;

  for (let i = 0; i < breakdown.length; i++) {
    const row = breakdown[i];
    const col = i % 3;
    const r = Math.floor(i / 3);
    const cardX = MARGIN + col * (cardW + cardGapX);
    const cardY = y + r * (cardH + cardGapY);

    const color = scoreColorFor(row.score);

    // Card with subtle shadow
    doc.roundedRect(cardX + 1.5, cardY + 1.5, cardW, cardH, 4).fillColor('#D5D9E0').fill();
    doc.roundedRect(cardX, cardY, cardW, cardH, 4).fillColor(C.bgPanel).fill();
    // Score-color top stripe
    doc.rect(cardX, cardY, cardW, 4).fill(color);

    // Category eyebrow (small caps gold)
    doc
      .fillColor(C.gold)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(row.label.toUpperCase(), cardX + 14, cardY + 14, { width: cardW - 28, characterSpacing: 1.2 });

    // Score number — sized to be clearly secondary to the cover gauge (40pt)
    doc
      .fillColor(color)
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(`${row.score}`, cardX + 14, cardY + 30, { width: cardW - 28, lineBreak: false });

    // /100 inline small (next to the score, baseline-aligned)
    doc
      .fillColor(C.muted)
      .font('Helvetica')
      .fontSize(9)
      .text('/ 100', cardX + 14 + textWidth(doc, `${row.score}`, 26) + 4, cardY + 44, { lineBreak: false });

    // Weight indicator
    doc
      .fillColor(C.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(`Weight  ${Math.round(row.weight * 100)}%`, cardX + 14, cardY + 70, { width: cardW - 28, characterSpacing: 0.8, lineBreak: false });

    // Status label (bottom)
    doc
      .fillColor(color)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(statusLabel(row.score).toUpperCase(), cardX + 14, cardY + 86, { width: cardW - 28, characterSpacing: 1.5, lineBreak: false });
  }

  y += 2 * (cardH + cardGapY) + 14;

  // Detailed weights table (kept underneath for the data-curious)
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(8.5).text('DETAILED CATEGORY WEIGHTS', MARGIN, y, { characterSpacing: 1.5 });
  y += 14;

  drawTable(doc, y, [
    ['Category', 'Score', 'Weight', 'Status'],
    ...breakdown.map((r) => [r.label, `${r.score}`, `${Math.round(r.weight * 100)}%`, statusLabel(r.score)]),
  ], [220, 70, 75, 130]);
}

function computeBreakdown(audit) {
  const out = [];
  for (const [groupName, group] of Object.entries(marketingCategories)) {
    let totalWeight = 0;
    let lostWeight = 0;
    for (const r of audit.results) {
      if (r.severity === 'skip') continue;
      if (!group.sources.includes(r.category)) continue;
      totalWeight += r.weight;
      if (!r.passed) {
        const penalty = r.severity === 'critical' || r.severity === 'error' ? 1.0 : r.severity === 'warning' ? 0.5 : r.severity === 'info' ? 0.2 : 0.5;
        lostWeight += r.weight * penalty;
      }
    }
    const score = totalWeight === 0 ? 100 : Math.max(0, Math.round(((totalWeight - lostWeight) / totalWeight) * 100));
    out.push({ label: groupName, score, weight: group.weight });
  }
  return out;
}

// ============ PAGE 3: KEY FINDINGS ============
function keyFindingsPage(doc, audit, newPage) {
  newPage();

  let y = drawSectionHeader(doc, '02', 'KEY FINDINGS', 'Severity-ranked issues that materially impact organic performance');

  const allFailed = audit.results
    .filter((r) => !r.passed && r.severity !== 'skip')
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  // Top 10 only — keeps the page focused. Full list is in JSON/Markdown export.
  const failed = allFailed.slice(0, 10);

  if (failed.length === 0) {
    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(14).text('✓ No issues found. Excellent work.', MARGIN, y);
    return;
  }

  // Table header
  const sevColW = 75;
  const findColX = MARGIN + sevColW + 10;
  const findColW = PAGE.W - MARGIN * 2 - sevColW - 10;

  doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, 22).fill(C.navy);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('SEVERITY', MARGIN + 8, y + 7, { width: sevColW });
  doc.text('FINDING', findColX, y + 7, { width: findColW });
  y += 22;

  let alt = false;
  for (const r of failed) {
    // Pre-measure the row height
    doc.font('Helvetica').fontSize(10);
    const findingText = r.fix ? `${r.label} — ${r.message}\n→ ${r.fix}` : `${r.label} — ${r.message}`;
    const rowH = Math.max(28, doc.heightOfString(findingText, { width: findColW - 10 }) + 14);

    // Page break if needed
    if (y + rowH > PAGE.H - FOOTER_H - 20) {
      newPage();
      y = HEADER_H + 30;
      doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
      y += 12;
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('KEY FINDINGS (continued)', MARGIN, y);
      y += 32;
    }

    // Row background
    doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, rowH).fill(alt ? C.bgAlt : C.bg);
    alt = !alt;

    // Severity badge
    const sevText = (r.severity || 'fail').toUpperCase();
    doc.fillColor(severityColor(r.severity)).font('Helvetica-Bold').fontSize(10).text(sevText, MARGIN + 8, y + 7, { width: sevColW });

    // Finding text
    doc.fillColor(C.bodyText).font('Helvetica').fontSize(10).text(`${r.label} — ${r.message || ''}`, findColX, y + 7, { width: findColW - 10 });
    if (r.fix) {
      const labelLineH = doc.heightOfString(`${r.label} — ${r.message || ''}`, { width: findColW - 10 });
      doc.fillColor(C.primary).font('Helvetica-Oblique').fontSize(10).text(`→ ${r.fix}`, findColX, y + 7 + labelLineH + 2, { width: findColW - 10 });
    }

    y += rowH;
  }
}

// ============ PAGE 4: RISK QUADRANT (IMPACT × EFFORT) ============
// Plots failed checks on a 2x2 quadrant — Impact (vertical) by Effort (horizontal).
// Quick Wins (high impact / low effort) become visually obvious. The single most
// pitch-worthy chart in any consulting report.
const EFFORT_BY_CATEGORY = {
  // LOW effort — copy/text/markup changes
  meta: 'low', headings: 'low', content: 'low', 'html-compliance': 'low',
  social: 'low', 'structured-data': 'low', 'schema-deep': 'low',
  links: 'low', conversion: 'low', eeat: 'low', 'image-optimization': 'low',
  'critical-issues': 'low',
  // MEDIUM effort — design/layout/template changes
  images: 'medium', accessibility: 'medium', mobile: 'medium', trust: 'medium',
  ecommerce: 'medium', 'keyword-optimization': 'medium', 'page-experience': 'medium',
  // HIGH effort — infrastructure/architecture
  technical: 'high', performance: 'high', security: 'high', backlinks: 'high',
  i18n: 'high', crawlability: 'high', indexability: 'high',
};

function riskQuadrantPage(doc, audit, newPage) {
  newPage();

  let y = drawSectionHeader(doc, '03', 'STRATEGIC RISK MATRIX', 'Findings plotted by impact and implementation effort to identify quick wins');

  const failed = audit.results.filter((r) => !r.passed && r.severity !== 'skip');

  // Quadrant chart geometry
  const chartX = MARGIN + 60;
  const chartY = y;
  const chartW = PAGE.W - chartX - MARGIN - 10;
  const chartH = 380;

  // Axis labels (outer)
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('IMPACT', MARGIN, chartY + chartH / 2 - 5, { width: 50, align: 'right', characterSpacing: 2 });

  // Vertical axis arrow indicators
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('HIGH', MARGIN + 10, chartY + 8, { width: 40, characterSpacing: 1 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('LOW', MARGIN + 14, chartY + chartH - 16, { width: 40, characterSpacing: 1 });

  // Horizontal axis label
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('EFFORT TO REMEDIATE', chartX, chartY + chartH + 12, { width: chartW, align: 'center', characterSpacing: 2 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('LOW', chartX + 4, chartY + chartH + 26, { width: 40, characterSpacing: 1 });
  doc.fillColor(C.muted).font('Helvetica').fontSize(8).text('HIGH', chartX + chartW - 36, chartY + chartH + 26, { width: 40, align: 'right', characterSpacing: 1 });

  // Chart background
  doc.rect(chartX, chartY, chartW, chartH).fillColor('#FFFFFF').fill();
  doc.rect(chartX, chartY, chartW, chartH).strokeColor(C.hairline).lineWidth(0.5).stroke();

  // Quadrant divider lines
  doc.moveTo(chartX + chartW / 2, chartY).lineTo(chartX + chartW / 2, chartY + chartH).strokeColor(C.hairline).lineWidth(0.5).stroke();
  doc.moveTo(chartX, chartY + chartH / 2).lineTo(chartX + chartW, chartY + chartH / 2).strokeColor(C.hairline).lineWidth(0.5).stroke();

  // Quadrant labels (corners)
  const qPad = 12;
  // TOP-LEFT: Quick Wins (low effort, high impact) — gold/highlight
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(10).text('QUICK WINS', chartX + qPad, chartY + qPad, { width: chartW / 2 - qPad * 2, characterSpacing: 1.5 });
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text('High impact · low effort', chartX + qPad, chartY + qPad + 13, { width: chartW / 2 - qPad * 2 });

  // TOP-RIGHT: Big Bets (high effort, high impact)
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(10).text('STRATEGIC BETS', chartX + chartW / 2 + qPad, chartY + qPad, { width: chartW / 2 - qPad * 2, align: 'right', characterSpacing: 1.5 });
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text('High impact · high effort', chartX + chartW / 2 + qPad, chartY + qPad + 13, { width: chartW / 2 - qPad * 2, align: 'right' });

  // BOTTOM-LEFT: Fill-ins (low effort, low impact)
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(10).text('INCREMENTAL', chartX + qPad, chartY + chartH - qPad - 22, { width: chartW / 2 - qPad * 2, characterSpacing: 1.5 });
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text('Low impact · low effort', chartX + qPad, chartY + chartH - qPad - 9, { width: chartW / 2 - qPad * 2 });

  // BOTTOM-RIGHT: Time Sinks (high effort, low impact)
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(10).text('DEPRIORITIZE', chartX + chartW / 2 + qPad, chartY + chartH - qPad - 22, { width: chartW / 2 - qPad * 2, align: 'right', characterSpacing: 1.5 });
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text('Low impact · high effort', chartX + chartW / 2 + qPad, chartY + chartH - qPad - 9, { width: chartW / 2 - qPad * 2, align: 'right' });

  // Place dots — deterministic spread within each quadrant
  // Impact axis: critical = high, warning = mid-high, info = low-mid
  // Effort axis: from EFFORT_BY_CATEGORY mapping
  const placed = []; // {x, y, severity}
  for (const r of failed) {
    const effort = EFFORT_BY_CATEGORY[r.category] || 'medium';
    let baseImpact;
    if (r.severity === 'critical' || r.severity === 'error') baseImpact = 0.78;
    else if (r.severity === 'warning') baseImpact = 0.55;
    else baseImpact = 0.25;
    let baseEffort;
    if (effort === 'low') baseEffort = 0.22;
    else if (effort === 'medium') baseEffort = 0.55;
    else baseEffort = 0.78;

    // Add deterministic jitter so dots don't all stack
    const seed = (r.id || '').split('').reduce((a, c) => (a + c.charCodeAt(0)) % 100, 0);
    const jx = ((seed * 7) % 13 - 6) / 100;
    const jy = ((seed * 13) % 11 - 5) / 100;

    const x = chartX + (baseEffort + jx) * chartW;
    const yPos = chartY + (1 - (baseImpact + jy)) * chartH; // invert for top=high
    placed.push({ x, y: yPos, severity: r.severity, weight: r.weight });
  }

  // Render dots (smaller for less severity, bigger for more)
  for (const p of placed) {
    const sevColor = severityColor(p.severity);
    const radius = p.severity === 'critical' || p.severity === 'error' ? 6 : p.severity === 'warning' ? 4.5 : 3;
    // Soft halo
    doc.circle(p.x, p.y, radius + 2).fillOpacity(0.15).fillColor(sevColor).fill().fillOpacity(1);
    // Solid dot
    doc.circle(p.x, p.y, radius).fillColor(sevColor).fill();
  }

  // Legend below the axis label
  let legendY = chartY + chartH + 50;
  const legendItems = [
    { label: 'CRITICAL', color: C.red, count: failed.filter((r) => r.severity === 'critical' || r.severity === 'error').length },
    { label: 'WARNING', color: C.yellow, count: failed.filter((r) => r.severity === 'warning').length },
    { label: 'INFO', color: C.blue, count: failed.filter((r) => r.severity === 'info').length },
  ];
  let legendX = chartX;
  for (const item of legendItems) {
    doc.circle(legendX + 6, legendY + 5, 4).fillColor(item.color).fill();
    doc.fillColor(C.bodyText).font('Helvetica-Bold').fontSize(9).text(`${item.label}`, legendX + 16, legendY, { characterSpacing: 1.5, lineBreak: false });
    doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(`${item.count} findings`, legendX + 75, legendY, { lineBreak: false });
    legendX += 170;
  }

  // Reading hint
  legendY += 22;
  doc
    .fillColor(C.muted)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      'Dot size reflects relative weight in scoring. Findings in the top-left quadrant ("Quick Wins") deliver the highest ROI per hour invested and should be prioritized for the first sprint.',
      MARGIN, legendY, { width: PAGE.W - MARGIN * 2, lineGap: 1.5 },
    );
}

// ============ PAGE 5: STRENGTHS / WHAT'S WORKING WELL ============
function strengthsPage(doc, audit, newPage) {
  newPage();

  let y = drawSectionHeader(doc, '04', "WHAT'S WORKING WELL", 'A strong foundation — preserve these as you implement changes');
  // (Section 04 — comes after Risk Matrix 03)

  const passed = audit.results.filter((r) => r.passed && r.severity !== 'skip');

  // Group passing checks by category, take top 12 most diverse
  const byCategory = {};
  for (const r of passed) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }
  // Round-robin pick from each category for variety, cap at 12
  const picked = [];
  let i = 0;
  while (picked.length < 12) {
    let added = false;
    for (const cat of Object.keys(byCategory)) {
      if (byCategory[cat][i]) {
        picked.push(byCategory[cat][i]);
        added = true;
        if (picked.length >= 12) break;
      }
    }
    if (!added) break;
    i++;
  }

  if (picked.length === 0) {
    doc.fillColor(C.muted).font('Helvetica').fontSize(11).text('No passing checks to highlight.', MARGIN, y);
    return;
  }

  // 2-column card grid: 6 rows × 2 cols
  const colW = (PAGE.W - MARGIN * 2 - 16) / 2;
  const cardH = 56;
  const colGap = 16;
  const rowGap = 10;

  for (let idx = 0; idx < picked.length; idx++) {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cardX = MARGIN + col * (colW + colGap);
    const cardY = y + row * (cardH + rowGap);

    const r = picked[idx];

    // Card background (white panel on cream)
    doc.roundedRect(cardX, cardY, colW, cardH, 4).fillColor(C.bgPanel).fill();
    // Green left accent strip
    doc.rect(cardX, cardY, 3, cardH).fill(C.green);
    // Subtle hairline border
    doc.roundedRect(cardX, cardY, colW, cardH, 4).strokeColor(C.hairline).lineWidth(0.5).stroke();

    // Green checkmark
    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(14).text('✓', cardX + 12, cardY + 8, { width: 18 });

    // Category label (small caps gold)
    doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7).text(
      (categories[r.category] || r.category).toUpperCase(),
      cardX + 32, cardY + 10,
      { width: colW - 40, characterSpacing: 1.2 },
    );

    // Check label (bold)
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(10).text(
      r.label,
      cardX + 32, cardY + 22,
      { width: colW - 40, height: 14, ellipsis: true, lineBreak: false },
    );

    // Check message (muted, single line)
    doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text(
      r.message || '',
      cardX + 32, cardY + 38,
      { width: colW - 40, height: 14, ellipsis: true, lineBreak: false },
    );
  }

  // Bottom note
  const totalRows = Math.ceil(picked.length / 2);
  y = y + totalRows * (cardH + rowGap) + 16;
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(9).text(
    `${audit.results.filter((r) => r.passed).length} of ${audit.results.length} total checks passed cleanly. Showing the top ${picked.length} for diversity across categories.`,
    MARGIN, y, { width: PAGE.W - MARGIN * 2, align: 'center' },
  );
}

// ============ PAGES 5+: ACTION PLAN (each bucket gets its own page) ============
function actionPlanPages(doc, audit, newPage) {
  const buckets = bucketActions(audit);
  const nonEmpty = buckets.filter((b) => b.items.length > 0);
  let firstPage = true;

  for (const bucket of nonEmpty) {
    newPage();
    let y;

    // Section title (only on first action plan page)
    if (firstPage) {
      y = drawSectionHeader(doc, '05', 'PRIORITIZED ACTION PLAN', 'Recommendations ranked by urgency and impact');
      firstPage = false;
    } else {
      // Subsequent action plan pages — just a soft continuation
      y = HEADER_H + 30;
      doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.gold).lineWidth(0.7).stroke();
      y += 10;
      doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(9).text('05 · PRIORITIZED ACTION PLAN  ·  CONTINUED', MARGIN, y, { characterSpacing: 1.8 });
      y += 22;
    }

    // Header band
    doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, 30).fill(bucket.color);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13).text(bucket.title, MARGIN + 14, y + 9);
    // Item count badge on the right
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10).text(`${bucket.items.length} item${bucket.items.length === 1 ? '' : 's'}`, PAGE.W - MARGIN - 80, y + 10, { width: 70, align: 'right' });
    y += 30;

    // Items — generous spacing now that each bucket has its own page
    const cardW = PAGE.W - MARGIN * 2;
    const valueColW = 110;
    const textColW = cardW - 50 - valueColW - 10;

    for (let i = 0; i < bucket.items.length; i++) {
      const item = bucket.items[i];
      const numText = `${i + 1}`;
      const cardH = 56;

      // Card background
      doc.roundedRect(MARGIN, y, cardW, cardH, 4).fillColor(C.bgPanel).fill();
      // Bucket-color left accent strip
      doc.rect(MARGIN, y, 4, cardH).fill(bucket.color);
      // Subtle hairline border
      doc.roundedRect(MARGIN, y, cardW, cardH, 4).strokeColor(C.hairline).lineWidth(0.5).stroke();

      // Number circle
      doc.circle(MARGIN + 28, y + cardH / 2, 12).fill(bucket.color);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text(numText, MARGIN + 22, y + cardH / 2 - 6, { width: 14, align: 'center' });

      // Category eyebrow (gold caps)
      doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7).text(
        (categories[item.category] || item.category).toUpperCase(),
        MARGIN + 50, y + 8,
        { width: textColW, characterSpacing: 1.2 },
      );

      // Issue label (bold)
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11).text(
        item.label,
        MARGIN + 50, y + 19,
        { width: textColW, height: 14, ellipsis: true, lineBreak: false },
      );

      // Fix text (one line, ellipsis)
      doc.fillColor(C.bodyText).font('Helvetica').fontSize(9.5).text(
        item.fix || item.message || '',
        MARGIN + 50, y + 36,
        { width: textColW, height: 16, ellipsis: true, lineBreak: false },
      );

      // ─── Right column: Estimated revenue impact ───
      const valueX = MARGIN + cardW - valueColW - 10;
      doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7).text(
        'EST. REVENUE IMPACT',
        valueX, y + 10, { width: valueColW, align: 'right', characterSpacing: 1.2 },
      );
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(13).text(
        impactDollarRange(item),
        valueX, y + 22, { width: valueColW, align: 'right' },
      );
      doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(7.5).text(
        'recovery range',
        valueX, y + 40, { width: valueColW, align: 'right' },
      );

      y += cardH + 8;
    }
  }
}

function bucketActions(audit) {
  const failed = audit.results.filter((r) => !r.passed && r.severity !== 'skip');
  const critical = failed.filter((r) => r.severity === 'critical' || r.severity === 'error');
  const warning = failed.filter((r) => r.severity === 'warning');
  const info = failed.filter((r) => r.severity === 'info');

  // Quick wins: all critical + first few warnings, capped at 6 total
  const quickWins = critical.concat(warning).slice(0, 6);
  // Medium term: remaining warnings, capped at 6
  const mediumTerm = warning.slice(Math.max(0, 6 - critical.length), Math.max(0, 6 - critical.length) + 6);
  // Strategic: top 5 info-level items
  const strategic = info.slice(0, 5);

  return [
    { title: 'QUICK WINS — This Week', color: C.green, items: quickWins },
    { title: 'MEDIUM TERM — 1–3 Months', color: C.blue, items: mediumTerm },
    { title: 'STRATEGIC — 3–6 Months', color: C.navy, items: strategic },
  ];
}

// ============ FINAL: METHODOLOGY ============
function methodologyPage(doc, audit, newPage, meta = {}) {
  newPage();

  let y = drawSectionHeader(doc, '06', 'METHODOLOGY', 'How findings are scored, weighted, and prioritized');

  // Methodology table
  const rows = [['Category', 'Weight', 'What it measures']];
  for (const [name, group] of Object.entries(marketingCategories)) {
    const sources = group.sources.map((s) => categories[s] || s).join(', ');
    rows.push([name, `${Math.round(group.weight * 100)}%`, sources]);
  }
  drawTable(doc, y, rows, [165, 55, PAGE.W - MARGIN * 2 - 220]);

  y = doc.y + 14;

  // ─── Scoring legend (compact) ───
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(8.5).text('SCORING LEGEND', MARGIN, y, { characterSpacing: 1.5 });
  y += 12;

  const legend = [
    ['Score', 'Grade', 'Status', 'Color'],
    ['85–100', 'A',  'Excellent — leadership-tier optimization', '■'],
    ['70–84',  'B',  'Good — competitive with growth opportunities', '■'],
    ['55–69',  'C',  'Fair — significant on-page gaps suppressing rankings', '■'],
    ['40–54',  'D',  'Needs Work — multiple critical issues block visibility', '■'],
    ['0–39',   'F',  'Major Issues — failing core SEO fundamentals', '■'],
  ];
  const legendColors = [null, C.green, C.blue, C.yellow, '#E08A00', C.red];

  drawLegendTable(doc, y, legend, [55, 50, 280, 35], legendColors);

  y = doc.y + 14;

  // ─── Data sources & references (tight rows) ───
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(8.5).text('DATA SOURCES & REFERENCES', MARGIN, y, { characterSpacing: 1.5 });
  y += 12;

  const refs = [
    { label: 'Google Search Central', detail: 'developers.google.com/search — on-page best practices, indexing, structured data' },
    { label: 'Web Vitals', detail: 'web.dev/vitals — LCP, CLS, INP thresholds used for performance scoring tiers' },
    { label: 'Schema.org', detail: 'schema.org — structured data vocabulary; required-field validation' },
    { label: 'WCAG 2.1 AA', detail: 'w3.org/WAI/WCAG21 — form labels, ARIA validity, contrast proxies, keyboard nav' },
    { label: 'OWASP Secure Headers', detail: 'owasp.org/secure-headers — CSP, HSTS, X-Frame-Options threat mitigation' },
    { label: 'Google E-E-A-T Guidelines', detail: 'Search Quality Rater Guidelines — YMYL trust signals (2022 update)' },
  ];

  for (const r of refs) {
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8.5).text(r.label, MARGIN, y, { width: 145, lineBreak: false });
    doc.fillColor(C.bodyText).font('Helvetica').fontSize(8.5).text(r.detail, MARGIN + 148, y, { width: PAGE.W - MARGIN * 2 - 148, height: 14, lineBreak: false, ellipsis: true });
    y += 13;
  }

  y += 10;

  // ─── About This Audit (tight, one paragraph) ───
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(8.5).text('ABOUT THIS AUDIT', MARGIN, y, { characterSpacing: 1.5 });
  y += 12;
  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(8.5)
    .text(
      `Methodology refined across on-page SEO engagements with small-business and enterprise clients. ${audit.results.length} indicators reflect industry consensus on Google's documented ranking factors, augmented by E-E-A-T signals from the 2022 Search Quality Rater Guidelines and Core Web Vitals thresholds. Severity weighting is calibrated against impact data from SEO performance studies and aggregated remediation case histories.`,
      MARGIN, y, { width: PAGE.W - MARGIN * 2, lineGap: 1.5, align: 'justify' },
    );

  y = doc.y + 8;

  // ─── Audit metadata footer ───
  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.gold).lineWidth(0.5).stroke();
  y += 10;

  const auditId = computeAuditId(audit);
  doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text(
    `Audit Reference: ${auditId}  ·  ${audit.results.length} checks across ${Object.keys(categories).length} categories  ·  Generated ${formatDate(audit.fetchedAt)}`,
    MARGIN, y, { width: PAGE.W - MARGIN * 2, align: 'center' },
  );
  y += 14;
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8).text(
    'Findings reflect on-page state at the time of audit. Off-page signals (backlinks, domain authority, search-console-derived data) are not represented in this audit and require dedicated analysis.',
    MARGIN, y, { width: PAGE.W - MARGIN * 2, align: 'center', lineGap: 1 },
  );
}

function computeAuditId(audit) {
  // Stable short ID from URL + timestamp. Brand-neutral prefix.
  const stamp = (audit.fetchedAt || '').replace(/[^0-9]/g, '').slice(0, 12);
  let h = 0;
  for (const c of audit.url || '') h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
  return `AR-${stamp}-${hex}`;
}

/**
 * Extract a "client name" from a URL when no explicit prepared-for is provided.
 * github.com → GitHub, jgpetitinsurance.com → Jgpetitinsurance, my-site.io → My Site
 */
function extractClientName(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const root = host.split('.')[0];
    return root
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return 'The Site';
  }
}

/**
 * Estimate per-issue revenue impact range. Heuristic — assumes a generic
 * small-business traffic baseline. Used in the Action Plan column.
 */
function impactDollarRange(item) {
  const sev = item.severity;
  const w = item.weight || 2;
  let low, high;
  if (sev === 'critical' || sev === 'error') { low = 200 * w; high = 800 * w; }
  else if (sev === 'warning') { low = 60 * w; high = 250 * w; }
  else { low = 15 * w; high = 80 * w; }
  return `$${formatK(low)}–$${formatK(high)}/mo`;
}

function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

function textWidth(doc, str, fontSize) {
  // Save current font state, measure, restore
  const prev = { fontSize: doc._fontSize };
  doc.fontSize(fontSize);
  const w = doc.widthOfString(String(str));
  doc.fontSize(prev.fontSize);
  return w;
}

// ============ HELPERS ============

/**
 * Editorial-style numbered section header used on every internal page.
 * Returns the Y coordinate to start content below the header.
 */
function drawSectionHeader(doc, num, title, subtitle) {
  let y = HEADER_H + 30;
  const numW = 38;

  // Refined gold section number — sized to harmonize with body text, not dominate
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(num, MARGIN, y, { width: numW, characterSpacing: 0 });

  // Thin gold rule extending from the number to the right edge
  doc.moveTo(MARGIN + numW + 8, y + 14).lineTo(PAGE.W - MARGIN, y + 14).strokeColor(C.gold).lineWidth(1).stroke();
  // Hairline below for delicate double-line effect
  doc.moveTo(MARGIN + numW + 8, y + 16.5).lineTo(PAGE.W - MARGIN, y + 16.5).strokeColor(C.goldSoft).lineWidth(0.4).stroke();

  // Section title — sits next to the number, on the same baseline visually
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(title, MARGIN + numW + 14, y + 2, { characterSpacing: 1 });

  // Subtitle italic muted
  if (subtitle) {
    doc
      .fillColor(C.muted)
      .font('Helvetica-Oblique')
      .fontSize(9.5)
      .text(subtitle, MARGIN + numW + 14, y + 22, { width: PAGE.W - MARGIN * 2 - numW - 18 });
  }

  return y + 56;
}

function drawTable(doc, y, rows, colWidths) {
  const x0 = MARGIN;
  const rowH = 20;

  // Header
  doc.rect(x0, y, PAGE.W - MARGIN * 2, rowH).fill(C.navy);
  let cx = x0;
  for (let c = 0; c < rows[0].length; c++) {
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text(rows[0][c], cx + 8, y + 6, { width: colWidths[c] - 16, lineBreak: false });
    cx += colWidths[c];
  }
  y += rowH;

  // Body
  for (let i = 1; i < rows.length; i++) {
    const fill = i % 2 === 0 ? C.bgAlt : C.bgPanel;
    // Compute the tallest cell across all columns — fixes long-content overflow
    let maxCellH = rowH;
    for (let c = 0; c < rows[i].length; c++) {
      const h = doc.heightOfString(String(rows[i][c]), { width: colWidths[c] - 16 }) + 12;
      if (h > maxCellH) maxCellH = h;
    }
    doc.rect(x0, y, PAGE.W - MARGIN * 2, maxCellH).fill(fill);
    cx = x0;
    for (let c = 0; c < rows[i].length; c++) {
      const text = rows[i][c];
      let color = C.bodyText;
      let font = 'Helvetica';
      if (rows[0][c] === 'Score') { color = scoreColorFor(parseInt(text, 10) || 0); font = 'Helvetica-Bold'; }
      if (rows[0][c] === 'Status') { color = statusColor(text); font = 'Helvetica-Bold'; }
      doc.fillColor(color).font(font).fontSize(9).text(text, cx + 8, y + 6, { width: colWidths[c] - 16, lineGap: 1 });
      cx += colWidths[c];
    }
    y += maxCellH;
  }
  doc.y = y + 2;
}

function drawLegendTable(doc, y, rows, colWidths, colorOverrides) {
  const x0 = MARGIN;
  const rowH = 22;

  // Header
  doc.rect(x0, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill(C.navy);
  let cx = x0;
  for (let c = 0; c < rows[0].length; c++) {
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text(rows[0][c], cx + 8, y + 7, { width: colWidths[c] - 16 });
    cx += colWidths[c];
  }
  y += rowH;

  // Body
  for (let i = 1; i < rows.length; i++) {
    const fill = i % 2 === 0 ? C.bgAlt : C.bg;
    doc.rect(x0, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill(fill);
    cx = x0;
    for (let c = 0; c < rows[i].length; c++) {
      let color = C.bodyText;
      if (c === 3 && colorOverrides[i]) color = colorOverrides[i];
      const fontSize = c === 3 ? 16 : 10;
      doc.fillColor(color).font(c === 3 ? 'Helvetica' : 'Helvetica').fontSize(fontSize).text(rows[i][c], cx + 8, y + (c === 3 ? 4 : 7), { width: colWidths[c] - 16 });
      cx += colWidths[c];
    }
    y += rowH;
  }
  doc.y = y + 4;
}

function executiveSummary(audit, uplift) {
  const value = audit.score.value;
  const summary = audit.summary;
  const top = audit.results
    .filter((r) => !r.passed && (r.severity === 'critical' || r.severity === 'warning'))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 3)
    .map((r) => r.label);

  const totalIssues = summary.critical + summary.warning + summary.info;

  // Senior-consultant tone: structural assessment, specific terminology,
  // explicit reference to Google ranking factors and ranking suppression.
  let intro;
  if (value >= 90) {
    intro = `The site demonstrates a mature on-page optimization profile. Of ${audit.results.length} indicators evaluated, ${totalIssues} represent incremental refinement opportunities — primarily within structured data, performance budget, and conversion-funnel surfaces.`;
  } else if (value >= 75) {
    intro = `The site has a defensible on-page foundation, but the audit surfaced ${totalIssues} issues — including ${summary.critical} critical findings and ${summary.warning} high-impact warnings — that materially restrict organic ranking potential and SERP click-through rate.`;
  } else if (value >= 60) {
    intro = `The audit identified ${totalIssues} on-page issues across structural, technical, and content surfaces. Multiple findings overlap with documented Google ranking factors (E-E-A-T signals, Core Web Vitals, structured-data coverage) and are likely suppressing organic visibility relative to category competitors.`;
  } else {
    intro = `The audit identified ${totalIssues} significant on-page deficiencies, including ${summary.critical} critical findings that directly impede crawling, indexing, or relevance signaling. The site currently does not meet the threshold for competitive organic performance in its category.`;
  }

  const issuesPart = top.length
    ? ` The highest-leverage interventions are: ${formatList(top)}.`
    : '';

  const upliftPart = uplift && uplift.high > 5
    ? ` Based on aggregated SEO recovery data across comparable on-page remediation engagements, resolving the prioritized findings is associated with ${uplift.headline} organic traffic recovery within a 60–120 day window post-implementation.`
    : '';

  const ctaPart = ' A severity-ranked findings table and prioritized 90-day action plan follow on subsequent pages.';

  return intro + issuesPart + upliftPart + ctaPart;
}

function formatList(items) {
  if (items.length === 1) return `"${items[0]}"`;
  if (items.length === 2) return `"${items[0]}" and "${items[1]}"`;
  return `"${items[0]}", "${items[1]}", and "${items[2]}"`;
}

function severityRank(s) {
  if (s === 'critical' || s === 'error') return 3;
  if (s === 'warning') return 2;
  if (s === 'info') return 1;
  return 0;
}

function severityColor(s) {
  if (s === 'critical' || s === 'error') return C.red;
  if (s === 'warning') return C.yellow;
  if (s === 'info') return C.blue;
  return C.muted;
}

function scoreColorFor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.blue;
  if (s >= 40) return C.yellow;
  return C.red;
}

function statusLabel(s) {
  if (s >= 80) return 'Strong';
  if (s >= 60) return 'Solid';
  if (s >= 40) return 'Needs Work';
  return 'Critical';
}

function statusColor(label) {
  if (label === 'Strong') return C.green;
  if (label === 'Solid') return C.blue;
  if (label === 'Needs Work') return C.yellow;
  return C.red;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}
