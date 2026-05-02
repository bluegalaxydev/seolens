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

// Premium "editorial" palette — navy core with warm gold accent.
// Inspired by financial/consulting reports (McKinsey, Goldman, etc.) — heavy,
// trustworthy, high-end. Background is a subtle warm off-white, NOT pure white,
// to give the page weight and eliminate the "form-y" feel.
const C = {
  navy: '#1F2D4D',          // primary brand
  navyDeep: '#0F1A30',      // deeper navy for footers
  gold: '#C9A86B',          // warm gold accent (refined, not gaudy)
  goldSoft: '#E8DAB8',      // gold tint for hairlines
  ink: '#1A1F2E',           // body text (dark charcoal-blue)
  bodyText: '#2D3142',
  muted: '#6E7689',
  hairline: '#E2E5EC',
  bg: '#FAF8F3',            // warm cream background — premium feel
  bgPanel: '#FFFFFF',        // pure white for content panels (contrast against cream)
  bgAlt: '#F1EEE6',         // slightly darker cream for alt rows
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

export async function renderPdf(audit, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      // Set all margins to 0 so PDFKit doesn't auto-paginate when text() goes
      // past the implicit margin. We manage all positioning manually.
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: false,
      info: {
        Title: `SEO Audit — ${audit.url}`,
        Author: 'Seolens',
        Subject: `SEO audit for ${audit.url}`,
        Keywords: 'seo, audit, on-page',
        Producer: 'Seolens',
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

    coverPage(doc, audit, newPage);
    scoreBreakdownPage(doc, audit, newPage);
    keyFindingsPage(doc, audit, newPage);
    actionPlanPages(doc, audit, newPage);
    methodologyPage(doc, audit, newPage);

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

  // SEOLENS monogram (left)
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('S', MARGIN - 30, HEADER_H / 2 - 4, { characterSpacing: 0 });
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('SEOLENS', MARGIN, HEADER_H / 2 - 6, { characterSpacing: 2 });
  // Subtitle next to brand name
  doc
    .fillColor('#B7C2DB')
    .font('Helvetica')
    .fontSize(9)
    .text('SEO AUDIT REPORT', MARGIN + 80, HEADER_H / 2 - 4, { characterSpacing: 1 });

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

  // ─── Footer with thin gold rule ───
  doc.moveTo(MARGIN, PAGE.H - FOOTER_H).lineTo(PAGE.W - MARGIN, PAGE.H - FOOTER_H).strokeColor(C.gold).lineWidth(0.5).stroke();
  doc
    .fillColor(C.muted)
    .font('Helvetica')
    .fontSize(8.5)
    .text('SEOLENS  ·  github.com/bluegalaxydev/seolens', MARGIN, PAGE.H - FOOTER_H + 12, { width: PAGE.W / 2 - MARGIN, align: 'left' });
  doc
    .fillColor(C.muted)
    .font('Helvetica-Oblique')
    .fontSize(8.5)
    .text(`— ${pageNum} —`, PAGE.W / 2, PAGE.H - FOOTER_H + 12, { width: PAGE.W / 2 - MARGIN, align: 'right' });
}

// ============ PAGE 1: COVER ============
function coverPage(doc, audit, newPage) {
  newPage();

  // Cover gets a unique left strip — a bold navy block extending the full height
  doc.rect(0, HEADER_H + 2, 28, PAGE.H - HEADER_H - 2 - FOOTER_H).fill(C.navy);
  doc.rect(28, HEADER_H + 2, 4, PAGE.H - HEADER_H - 2 - FOOTER_H).fill(C.gold);

  let y = 95;

  // Eyebrow text (smaller, all-caps, gold)
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('CONFIDENTIAL  ·  ON-PAGE SEO AUDIT', MARGIN + 10, y, { characterSpacing: 2 });
  y += 22;

  // Big editorial title
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(42)
    .text('SEO Audit', MARGIN + 10, y);
  y += 50;
  doc.fillColor(C.navy).font('Helvetica').fontSize(42).text('Report', MARGIN + 10, y);
  y += 60;

  // Thin gold rule
  doc.moveTo(MARGIN + 10, y).lineTo(MARGIN + 80, y).strokeColor(C.gold).lineWidth(2).stroke();
  y += 18;

  // URL in italic
  doc
    .fillColor(C.bodyText)
    .font('Helvetica-Oblique')
    .fontSize(13)
    .text(audit.url, MARGIN + 10, y, { width: PAGE.W - MARGIN * 2 - 10 });
  y += 20;

  // Date in muted
  doc
    .fillColor(C.muted)
    .font('Helvetica')
    .fontSize(10)
    .text(formatDate(audit.fetchedAt), MARGIN + 10, y, { characterSpacing: 1 });

  // Donut score gauge — positioned on the right side for editorial balance
  const gaugeCx = PAGE.W - MARGIN - 90;
  const gaugeCy = 380;
  const gaugeR = 75;
  drawDonutGauge(doc, gaugeCx, gaugeCy, gaugeR, audit);

  // Score caption below gauge
  doc
    .fillColor(C.muted)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('OVERALL SCORE', gaugeCx - 60, gaugeCy + gaugeR + 14, { width: 120, align: 'center', characterSpacing: 2 });
  doc
    .fillColor(scoreColorFor(audit.score.value))
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(audit.score.label.toUpperCase(), gaugeCx - 60, gaugeCy + gaugeR + 28, { width: 120, align: 'center', characterSpacing: 1 });

  // ─── Executive summary panel (white card on cream background) ───
  const panelY = 510;
  const panelH = 200;
  const panelX = MARGIN + 10;
  const panelW = PAGE.W - panelX - MARGIN;

  // Panel with subtle shadow effect (offset stroke)
  doc.roundedRect(panelX + 2, panelY + 2, panelW, panelH, 4).fillColor('#E8E2D5').fill();
  doc.roundedRect(panelX, panelY, panelW, panelH, 4).fillColor(C.bgPanel).fill();

  // Gold accent strip on the left of the panel
  doc.rect(panelX, panelY, 3, panelH).fill(C.gold);

  // Panel content
  let py = panelY + 18;
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('EXECUTIVE SUMMARY', panelX + 18, py, { characterSpacing: 2 });
  py += 18;
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(`Score: ${audit.score.value}/100 · Grade ${audit.score.grade}`, panelX + 18, py);
  py += 26;

  // Summary text
  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(10.5)
    .text(executiveSummary(audit), panelX + 18, py, {
      width: panelW - 36,
      lineGap: 3.5,
      align: 'left',
    });
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

  let y = HEADER_H + 30;

  // Section header
  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('SCORE BREAKDOWN', MARGIN, y);
  y += 36;

  // Compute per-category scores using marketingCategories aggregation
  const breakdown = computeBreakdown(audit);

  // Bar chart
  const labelW = 165;
  const barX = MARGIN + labelW;
  const barMaxW = PAGE.W - MARGIN - barX - 60;
  const barH = 22;
  const rowGap = 16;

  for (const row of breakdown) {
    const fillW = (row.score / 100) * barMaxW;
    const color = scoreColorFor(row.score);

    // Label (right-aligned to bar)
    doc.fillColor(C.bodyText).font('Helvetica').fontSize(11).text(row.label, MARGIN, y + 5, { width: labelW - 10, align: 'right' });

    // Bar background (gray track)
    doc.roundedRect(barX, y, barMaxW, barH, 3).fill(C.hairline);
    // Bar fill
    if (fillW > 0) doc.roundedRect(barX, y, fillW, barH, 3).fill(color);

    // Score value
    doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(`${row.score}`, barX + barMaxW + 8, y + 5, { width: 40 });

    y += barH + rowGap;
  }

  y += 24;

  // Score table
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(13).text('Detailed weights', MARGIN, y);
  y += 24;

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

  let y = HEADER_H + 30;

  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('KEY FINDINGS', MARGIN, y);
  y += 32;

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

// ============ PAGES 4+: ACTION PLAN ============
function actionPlanPages(doc, audit, newPage) {
  newPage();

  let y = HEADER_H + 30;

  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('PRIORITIZED ACTION PLAN', MARGIN, y);
  y += 32;

  const buckets = bucketActions(audit);

  for (const bucket of buckets) {
    if (bucket.items.length === 0) continue;

    // Header band
    if (y + 60 > PAGE.H - FOOTER_H) {
      newPage();
      y = HEADER_H + 30;
    }

    doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, 26).fill(bucket.color);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text(bucket.title, MARGIN + 12, y + 7);
    y += 26;

    // Items — single-line compact format
    for (let i = 0; i < bucket.items.length; i++) {
      const item = bucket.items[i];
      const numText = `${i + 1}.`;
      const text = item.fix ? `${item.label}. ${item.fix}` : `${item.label}. ${item.message || ''}`;

      doc.font('Helvetica').fontSize(10);
      const itemH = Math.max(24, doc.heightOfString(text, { width: PAGE.W - MARGIN * 2 - 60, height: 32, ellipsis: true }) + 10);

      if (y + itemH > PAGE.H - FOOTER_H - 20) {
        newPage();
        y = HEADER_H + 30;
        // Continued header band
        doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, 24).fill(bucket.color);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text(`${bucket.title} (continued)`, MARGIN + 12, y + 7);
        y += 24;
      }

      // Alternating row backgrounds
      doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, itemH).fillColor(i % 2 === 0 ? C.bgPanel : C.bgAlt).fill();

      // Gold accent bar on left of each item
      doc.rect(MARGIN, y, 2, itemH).fill(bucket.color);

      // Number
      doc.fillColor(bucket.color).font('Helvetica-Bold').fontSize(11).text(numText, MARGIN + 12, y + 6, { width: 30 });
      // Text (constrain height to 2 lines max with ellipsis)
      doc.fillColor(C.bodyText).font('Helvetica').fontSize(10).text(text, MARGIN + 50, y + 6, { width: PAGE.W - MARGIN * 2 - 60, height: 28, ellipsis: true, lineGap: 1 });

      y += itemH;
    }
    y += 16;
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
function methodologyPage(doc, audit, newPage) {
  newPage();

  let y = HEADER_H + 30;

  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('METHODOLOGY', MARGIN, y);
  y += 32;

  // Methodology table
  const rows = [['Category', 'Weight', 'What it measures']];
  for (const [name, group] of Object.entries(marketingCategories)) {
    const sources = group.sources.map((s) => categories[s] || s).join(', ');
    rows.push([name, `${Math.round(group.weight * 100)}%`, sources]);
  }
  drawTable(doc, y, rows, [200, 70, PAGE.W - MARGIN * 2 - 270]);

  y = doc.y + 30;

  // Scoring legend
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(13).text('Scoring Legend', MARGIN, y);
  y += 20;

  const legend = [
    ['Score', 'Grade', 'Status', 'Color'],
    ['80–100', 'A / A+', 'Strong', '■'],
    ['60–79', 'B / C+', 'Solid', '■'],
    ['40–59', 'D / C-', 'Needs Work', '■'],
    ['0–39', 'F', 'Critical', '■'],
  ];
  const legendColors = [null, C.green, C.blue, C.yellow, C.red];

  drawLegendTable(doc, y, legend, [80, 80, 130, 50], legendColors);

  y = doc.y + 28;

  // Footer note
  doc
    .fillColor(C.muted)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      `Audit performed ${formatDate(audit.fetchedAt)} on ${audit.url}. Run with Seolens — fast on-page SEO auditor.`,
      MARGIN,
      y,
      { width: PAGE.W - MARGIN * 2, align: 'center' },
    );
}

// ============ HELPERS ============
function drawTable(doc, y, rows, colWidths) {
  const x0 = MARGIN;
  const rowH = 22;

  // Header
  doc.rect(x0, y, PAGE.W - MARGIN * 2, rowH).fill(C.navy);
  let cx = x0;
  for (let c = 0; c < rows[0].length; c++) {
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text(rows[0][c], cx + 8, y + 7, { width: colWidths[c] - 16 });
    cx += colWidths[c];
  }
  y += rowH;

  // Body
  for (let i = 1; i < rows.length; i++) {
    const isStatus = rows[0].includes('Status');
    const fill = i % 2 === 0 ? C.bgAlt : C.bg;
    const dynRowH = Math.max(rowH, doc.heightOfString(rows[i][0], { width: colWidths[0] - 16 }) + 14);
    doc.rect(x0, y, PAGE.W - MARGIN * 2, dynRowH).fill(fill);
    cx = x0;
    for (let c = 0; c < rows[i].length; c++) {
      const text = rows[i][c];
      let color = C.bodyText;
      let font = 'Helvetica';
      if (rows[0][c] === 'Score') { color = scoreColorFor(parseInt(text, 10) || 0); font = 'Helvetica-Bold'; }
      if (rows[0][c] === 'Status') { color = statusColor(text); font = 'Helvetica-Bold'; }
      doc.fillColor(color).font(font).fontSize(10).text(text, cx + 8, y + 7, { width: colWidths[c] - 16 });
      cx += colWidths[c];
    }
    y += dynRowH;
  }
  doc.y = y + 4;
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

function executiveSummary(audit) {
  const value = audit.score.value;
  const summary = audit.summary;
  const top = audit.results
    .filter((r) => !r.passed && (r.severity === 'critical' || r.severity === 'warning'))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 3)
    .map((r) => r.label);

  let intro;
  if (value >= 90) intro = 'The site demonstrates excellent on-page SEO discipline across meta, structure, technical, and trust signals.';
  else if (value >= 75) intro = 'The site has a solid SEO foundation. A handful of warnings reduce the score from an A to a B.';
  else if (value >= 60) intro = 'The site is functional but missing several SEO best practices. Fixing the items in the action plan should produce measurable ranking gains within a few crawl cycles.';
  else intro = 'The site has significant on-page issues that are likely suppressing organic visibility. Prioritize the critical findings first — these typically deliver the highest ROI.';

  const issuesPart = top.length
    ? ` The biggest priorities are ${formatList(top)}.`
    : '';
  const passedPart = ` ${summary.passed} of ${summary.passed + summary.critical + summary.warning + summary.info} checks passed cleanly.`;
  const ctaPart = ' Review the prioritized action plan starting on page 4 for specific next steps.';

  return intro + issuesPart + passedPart + ctaPart;
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
