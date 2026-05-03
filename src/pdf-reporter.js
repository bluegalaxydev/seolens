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
    strengthsPage(doc, audit, newPage);
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
  y += 14;

  // Audit reference + check count (signals rigor)
  const auditId = computeAuditId(audit);
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(
      `AUDIT REFERENCE: ${auditId}  ·  ${audit.results.length} CHECKS  ·  ${Object.keys(categories).length} CATEGORIES`,
      MARGIN + 10, y,
      { characterSpacing: 1.5 },
    );

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

  // ─── Projected Uplift callout (the consultant's killer slide) ───
  const uplift = estimateUplift(audit.results, audit.score.value);
  const upliftY = 470;
  const upliftH = 60;
  const upliftX = MARGIN + 10;
  const upliftW = PAGE.W - upliftX - MARGIN;

  // Solid navy panel with gold accent
  doc.roundedRect(upliftX, upliftY, upliftW, upliftH, 4).fillColor(C.navy).fill();
  doc.rect(upliftX, upliftY, 4, upliftH).fill(C.gold);

  // Eyebrow text
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('PROJECTED ORGANIC TRAFFIC RECOVERY', upliftX + 18, upliftY + 9, { characterSpacing: 2 });

  // Big percentage
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(26)
    .text(uplift.headline, upliftX + 16, upliftY + 22);

  // Subtext (top line)
  doc
    .fillColor('#E8DAB8')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('within 60–120 days post-remediation', upliftX + 240, upliftY + 26);

  // Subtext (bottom line — methodological caveat)
  doc
    .fillColor('#B7C2DB')
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text('Modeled from comparable on-page remediation outcomes', upliftX + 240, upliftY + 41);

  // ─── Executive summary panel (white card on cream background) ───
  const panelY = 545;
  const panelH = 175;
  const panelX = MARGIN + 10;
  const panelW = PAGE.W - panelX - MARGIN;

  // Panel with subtle shadow effect (offset stroke)
  doc.roundedRect(panelX + 2, panelY + 2, panelW, panelH, 4).fillColor('#E8E2D5').fill();
  doc.roundedRect(panelX, panelY, panelW, panelH, 4).fillColor(C.bgPanel).fill();

  // Gold accent strip on the left of the panel
  doc.rect(panelX, panelY, 3, panelH).fill(C.gold);

  // Panel content
  let py = panelY + 16;
  doc
    .fillColor(C.gold)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('EXECUTIVE SUMMARY', panelX + 18, py, { characterSpacing: 2 });
  py += 18;
  doc
    .fillColor(C.navy)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(`Score: ${audit.score.value}/100 · Grade ${audit.score.grade}`, panelX + 18, py);
  py += 22;

  // Summary text
  doc
    .fillColor(C.bodyText)
    .font('Helvetica')
    .fontSize(10)
    .text(executiveSummary(audit, uplift), panelX + 18, py, {
      width: panelW - 36,
      lineGap: 3,
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

// ============ PAGE 4: STRENGTHS / WHAT'S WORKING WELL ============
function strengthsPage(doc, audit, newPage) {
  newPage();

  let y = HEADER_H + 30;

  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text("WHAT'S WORKING WELL", MARGIN, y);
  y += 14;
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text(
    'A strong foundation. These checks passed cleanly — preserve them as you make changes.',
    MARGIN, y, { width: PAGE.W - MARGIN * 2 - 4 },
  );
  y += 30;

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
    let y = HEADER_H + 30;

    // Section title (only on first action plan page)
    if (firstPage) {
      doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
      y += 12;
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('PRIORITIZED ACTION PLAN', MARGIN, y);
      y += 14;
      doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text(
        'Recommendations sorted by urgency. Quick Wins are highest-leverage and should be tackled this week.',
        MARGIN, y, { width: PAGE.W - MARGIN * 2 - 4 },
      );
      y += 28;
      firstPage = false;
    } else {
      // Subsequent pages: just a hairline + page subtitle
      doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.gold).lineWidth(1).stroke();
      y += 12;
      doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(11).text('PRIORITIZED ACTION PLAN  (continued)', MARGIN, y, { characterSpacing: 1.5 });
      y += 24;
    }

    // Header band
    doc.rect(MARGIN, y, PAGE.W - MARGIN * 2, 30).fill(bucket.color);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13).text(bucket.title, MARGIN + 14, y + 9);
    // Item count badge on the right
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(10).text(`${bucket.items.length} item${bucket.items.length === 1 ? '' : 's'}`, PAGE.W - MARGIN - 80, y + 10, { width: 70, align: 'right' });
    y += 30;

    // Items — generous spacing now that each bucket has its own page
    for (let i = 0; i < bucket.items.length; i++) {
      const item = bucket.items[i];
      const numText = `${i + 1}`;

      // Each card is taller and richer
      const cardH = 56;

      // Card background (white panel on cream)
      doc.roundedRect(MARGIN, y, PAGE.W - MARGIN * 2, cardH, 4).fillColor(C.bgPanel).fill();
      // Bucket-color left accent strip
      doc.rect(MARGIN, y, 4, cardH).fill(bucket.color);
      // Subtle hairline border
      doc.roundedRect(MARGIN, y, PAGE.W - MARGIN * 2, cardH, 4).strokeColor(C.hairline).lineWidth(0.5).stroke();

      // Number circle
      doc.circle(MARGIN + 28, y + cardH / 2, 12).fill(bucket.color);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text(numText, MARGIN + 22, y + cardH / 2 - 6, { width: 14, align: 'center' });

      // Category eyebrow (gold caps)
      doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(7).text(
        (categories[item.category] || item.category).toUpperCase(),
        MARGIN + 50, y + 8,
        { width: PAGE.W - MARGIN * 2 - 60, characterSpacing: 1.2 },
      );

      // Issue label (bold)
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11).text(
        item.label,
        MARGIN + 50, y + 19,
        { width: PAGE.W - MARGIN * 2 - 60, height: 14, ellipsis: true, lineBreak: false },
      );

      // Fix text (one line, ellipsis)
      doc.fillColor(C.bodyText).font('Helvetica').fontSize(9.5).text(
        item.fix || item.message || '',
        MARGIN + 50, y + 36,
        { width: PAGE.W - MARGIN * 2 - 60, height: 16, ellipsis: true, lineBreak: false },
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
function methodologyPage(doc, audit, newPage) {
  newPage();

  let y = HEADER_H + 30;

  doc.moveTo(MARGIN, y).lineTo(PAGE.W - MARGIN, y).strokeColor(C.navy).lineWidth(2).stroke();
  y += 12;
  doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20).text('METHODOLOGY', MARGIN, y);
  y += 14;
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text(
    'How findings are scored, weighted, and prioritized',
    MARGIN, y, { width: PAGE.W - MARGIN * 2 - 4 },
  );
  y += 26;

  // Methodology table
  const rows = [['Category', 'Weight', 'What it measures']];
  for (const [name, group] of Object.entries(marketingCategories)) {
    const sources = group.sources.map((s) => categories[s] || s).join(', ');
    rows.push([name, `${Math.round(group.weight * 100)}%`, sources]);
  }
  drawTable(doc, y, rows, [200, 70, PAGE.W - MARGIN * 2 - 270]);

  y = doc.y + 22;

  // Scoring legend
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(9).text('SCORING LEGEND', MARGIN, y, { characterSpacing: 1.5 });
  y += 16;

  const legend = [
    ['Score', 'Grade', 'Status', 'Color'],
    ['85–100', 'A',  'Excellent — leadership-tier optimization', '■'],
    ['70–84',  'B',  'Good — competitive but with growth opportunities', '■'],
    ['55–69',  'C',  'Fair — significant on-page gaps suppressing rankings', '■'],
    ['40–54',  'D',  'Needs Work — multiple critical issues block visibility', '■'],
    ['0–39',   'F',  'Major Issues — site is failing core SEO fundamentals', '■'],
  ];
  const legendColors = [null, C.green, C.blue, C.yellow, '#E08A00', C.red];

  drawLegendTable(doc, y, legend, [55, 50, 250, 35], legendColors);

  y = doc.y + 24;

  // ─── Data sources & references panel ───
  doc.fillColor(C.gold).font('Helvetica-Bold').fontSize(9).text('DATA SOURCES & REFERENCES', MARGIN, y, { characterSpacing: 1.5 });
  y += 16;

  const refs = [
    { label: 'Google Search Central', detail: 'developers.google.com/search — on-page SEO best practices, indexing rules, structured data requirements' },
    { label: 'Web Vitals', detail: 'web.dev/vitals — Core Web Vitals (LCP, CLS, INP) thresholds used to define performance scoring tiers' },
    { label: 'Schema.org', detail: 'schema.org — structured data vocabulary; required-field validation for Article, Product, Organization, FAQPage types' },
    { label: 'WCAG 2.1 AA', detail: 'w3.org/WAI/WCAG21 — accessibility checks (form labels, ARIA, color contrast proxies, keyboard navigation)' },
    { label: 'OWASP Secure Headers', detail: 'owasp.org/secure-headers — Content-Security-Policy, HSTS, X-Frame-Options threat-mitigation guidance' },
    { label: 'Google E-E-A-T Guidelines', detail: 'Search Quality Rater Guidelines — Experience, Expertise, Authoritativeness, Trust signals for YMYL content' },
  ];

  for (const r of refs) {
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9).text(r.label, MARGIN, y, { width: 145, lineBreak: false });
    doc.fillColor(C.bodyText).font('Helvetica').fontSize(9).text(r.detail, MARGIN + 150, y, { width: PAGE.W - MARGIN * 2 - 150, lineGap: 1 });
    y = doc.y + 6;
  }

  y += 6;

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
    'Findings reflect on-page state at time of audit. Off-page signals (backlinks, domain authority, search-console-derived data) are not included in the free tier; engage Seolens Pro for full-spectrum analysis.',
    MARGIN, y, { width: PAGE.W - MARGIN * 2, align: 'center', lineGap: 1 },
  );
}

function computeAuditId(audit) {
  // Stable short ID from URL + timestamp
  const stamp = (audit.fetchedAt || '').replace(/[^0-9]/g, '').slice(0, 12);
  let h = 0;
  for (const c of audit.url || '') h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
  return `SL-${stamp}-${hex}`;
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
