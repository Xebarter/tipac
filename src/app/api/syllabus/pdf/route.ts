import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

// ─── Types ────────────────────────────────────────────────────────────────────

type PdfBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] }
  | {
    type: "table";
    title?: string;
    headers: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };

// ─── Colours (exact Tailwind values from the View modal) ─────────────────────
const P7 = "#6D28D9";   // purple-700
const P5 = "#8B5CF6";   // purple-500
const P2 = "#DDD6FE";   // purple-200  (used for divider)
const R6 = "#DC2626";   // red-600
const G900 = "#111827";
const G800 = "#1F2937";
const G700 = "#374151";
const G600 = "#4B5563";
const G500 = "#6B7280";
const G200 = "#E5E7EB";
const G100 = "#F3F4F6";   // gray-50 ≈ thead bg
const G50 = "#F9FAFB";
const WHT = "#FFFFFF";

// A4 dimensions in points
const PW = 595.28;
const PH = 841.89;

// Margins
const ML = 48;
const MR = 48;
const MB = 48;
const BW = PW - ML - MR;  // 499.28 pt

// ─── Parser ───────────────────────────────────────────────────────────────────

function isCaps(line: string) {
  const t = line.trim();
  if (!t) return false;
  const letters = t.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

function parseCompTable(lines: string[], si: number) {
  const rows: Array<[string, string, string, string]> = [];
  let i = si;
  while (i < lines.length) {
    const l = (lines[i] ?? "").trim();
    if (!l) { i++; continue; }
    if (isCaps(l) || /^Please take note/i.test(l) || /^GUIDELINES/i.test(l)) break;
    if (/^(\d+\.|\d+)$/.test(l)) {
      const sn = l.replace(/\.$/, "");
      const item = (lines[i + 1] ?? "").trim();
      const thm = (lines[i + 2] ?? "").trim();
      const tm = (lines[i + 3] ?? "").trim();
      if (item && thm && tm) { rows.push([sn, item, thm, tm]); i += 4; continue; }
      break;
    }
    break;
  }
  return { rows, nextIndex: i };
}

function parseSyllabus(text: string): PdfBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: PdfBlock[] = [];
  let i = 0;
  let pendingOl: string[] = [];
  let pendingUl: string[] = [];
  let lastHeading: string | undefined;

  const flush = () => {
    if (pendingOl.length) { blocks.push({ type: "ol", items: pendingOl }); pendingOl = []; }
    if (pendingUl.length) { blocks.push({ type: "ul", items: pendingUl }); pendingUl = []; }
  };

  while (i < lines.length) {
    const trimmed = (lines[i] ?? "").trim();
    if (!trimmed) { flush(); i++; continue; }

    const isTableStart =
      trimmed === "S/N" &&
      (lines[i + 1] ?? "").trim() === "ITEM" &&
      (lines[i + 2] ?? "").trim() === "THEME" &&
      (lines[i + 3] ?? "").trim() === "STAGE TIME";

    if (isTableStart) {
      flush();
      const { rows, nextIndex } = parseCompTable(lines, i + 4);
      if (rows.length) {
        blocks.push({
          type: "table",
          title: lastHeading,
          headers: ["S/N", "Item", "Theme", "Stage Time"],
          rows,
        });
      }
      i = nextIndex;
      continue;
    }

    const olM = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (olM) { pendingOl.push(olM[2]); i++; continue; }

    const ulM = trimmed.match(/^(?:·|-|\*)\s*(.+)$/);
    if (ulM) { pendingUl.push(ulM[1]); i++; continue; }

    flush();

    if (isCaps(trimmed)) {
      lastHeading = trimmed;
      if (blocks.length === 0) {
        blocks.push({ type: "h1", text: trimmed });
      } else if (/CATEGORY|OBJECTIVES|ORGANISATION|GUIDELINES|THEME/i.test(trimmed)) {
        blocks.push({ type: "h2", text: trimmed });
      } else {
        blocks.push({ type: "h3", text: trimmed });
      }
      i++;
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
    i++;
  }

  flush();
  return blocks;
}

function stripDupe(blocks: PdfBlock[]) {
  const idx = blocks.findIndex((b) => {
    if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") {
      return /^main theme\s*:/i.test(b.text.trim());
    }
    return false;
  });
  return idx === -1 ? blocks : blocks.slice(idx);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

/** Purple→purple→red horizontal gradient spanning x1..x2 at a given y. */
function makeGrad(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number) {
  const g = doc.linearGradient(x1, y, x2, y);
  g.stop(0, P7).stop(0.5, P5).stop(1, R6);
  return g;
}

/** Full-width top accent bar (mirrors h-1.5 gradient) */
function drawTopBar(doc: PDFKit.PDFDocument) {
  const h = 5;
  doc.rect(0, 0, PW, h).fill(makeGrad(doc, 0, PW, 0));
}

/** Full-width bottom accent bar */
function drawBottomBar(doc: PDFKit.PDFDocument) {
  const h = 5;
  const y = PH - h;
  doc.rect(0, y, PW, h).fill(makeGrad(doc, 0, PW, y));
}

/** Page footer */
function drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const fy = PH - MB + 6;

  doc
    .moveTo(ML, fy)
    .lineTo(ML + BW, fy)
    .lineWidth(0.4)
    .strokeColor(G200)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(G500)
    .text(
      "www.tipac.co.ug  ·  info@tipac.org  ·  +256 772 470 972",
      ML,
      fy + 7,
      { width: BW * 0.7 },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(G600)
    .text(`Page ${pageNum}`, ML, fy + 7, { width: BW, align: "right" });
}

// ─── Letterhead (mirrors the View modal header exactly) ───────────────────────
//
//  [purple→red bar 5pt]
//  [Logo 48pt  |  org label   title   subtitle]   [Main Theme badge]
//  [Festival dates card]  [Venue card]  [Document card]
//  [1pt thin gradient divider via purple-200]
//

function drawLetterhead(doc: PDFKit.PDFDocument, logoBuffer: Buffer | null): number {
  // 1. Top bar
  drawTopBar(doc);
  let y = 5;

  const PAD = 28;   // vertical padding inside header card (≈ py-8)
  const LOGO = 48;   // logo box size (≈ h-14 w-14 = 56px)

  y += PAD;  // start of content inside header

  // 2. Logo
  const logoX = ML;
  const logoY = y;

  if (logoBuffer) {
    // border box
    doc
      .roundedRect(logoX, logoY, LOGO, LOGO, 8)
      .lineWidth(1)
      .strokeColor(G200)
      .stroke();
    // white fill
    doc.roundedRect(logoX, logoY, LOGO, LOGO, 8).fill(WHT);
    // image with 3pt inner padding
    doc.image(logoBuffer, logoX + 3, logoY + 3, { fit: [LOGO - 6, LOGO - 6] });
  }

  // 3. Text next to logo (gap-4 = 12pt)
  const tx = logoX + LOGO + 12;
  const tw = PW - tx - MR - 148;  // leave room for badge on right

  // org label — text-xs font-bold uppercase tracking-wide text-gray-500
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(G500)
    .text("THEATRE INITIATIVE FOR THE PEARL OF AFRICA CHILDREN", tx, y + 1, {
      width: tw,
      characterSpacing: 0.4,
    });

  // title — text-xl font-black text-gray-900
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(G900)
    .text("TIPAC Festival 2026", tx, y + 12, { width: tw });

  // subtitle — text-sm text-gray-600
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(G600)
    .text("Syllabus for Pre-Primary, Primary & Secondary Schools", tx, y + 31, {
      width: tw,
    });

  // 4. Main Theme badge — rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
  const BW2 = 140;
  const BH = 46;
  const badX = PW - MR - BW2;
  const badY = y;

  doc.roundedRect(badX, badY, BW2, BH, 8).fill(G50);
  doc
    .roundedRect(badX, badY, BW2, BH, 8)
    .lineWidth(1)
    .strokeColor(G200)
    .stroke();

  // "MAIN THEME" label — text-xs font-bold uppercase tracking-wide text-gray-500
  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(G500)
    .text("MAIN THEME", badX + 10, badY + 9, { characterSpacing: 0.4 });

  // Value — text-sm font-extrabold purple (gradient not supported, use purple-700)
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(P7)
    .text("Environmental Sustainability", badX + 10, badY + 20, { width: BW2 - 20 });

  // 5. Three info cards (mt-6, grid cols-3 gap-3)
  const infoY = y + LOGO + 10;
  const col = (BW - 2 * 8) / 3;   // gap-3 ≈ 8pt

  const infos = [
    { label: "FESTIVAL DATES", value: "24th–26th April 2026" },
    { label: "VENUE", value: "Uganda National Cultural Centre, Kampala" },
    { label: "DOCUMENT", value: "Official Syllabus" },
  ];

  for (let ci = 0; ci < infos.length; ci++) {
    const cx = ML + ci * (col + 8);
    const info = infos[ci];
    const IH = 40;

    // card — rounded-xl border border-gray-200 bg-white p-4
    doc.roundedRect(cx, infoY, col, IH, 8).fill(WHT);
    doc
      .roundedRect(cx, infoY, col, IH, 8)
      .lineWidth(1)
      .strokeColor(G200)
      .stroke();

    // label — text-xs font-bold uppercase tracking-wide text-gray-500
    doc
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .fillColor(G500)
      .text(info.label, cx + 10, infoY + 8, { width: col - 20, characterSpacing: 0.3 });

    // value — text-sm font-bold text-gray-900
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(G900)
      .text(info.value, cx + 10, infoY + 18, { width: col - 20 });
  }

  y = infoY + 40 + PAD;

  // 6. Thin gradient divider (transparent → purple-200 → transparent)
  // PDFKit gradient stop(pos, color, opacity) — use opacity for transparency
  const divG = doc.linearGradient(ML, y, ML + BW, y);
  divG.stop(0, P2, 0).stop(0.5, P2, 1).stop(1, P2, 0);
  doc.rect(ML, y, BW, 1).fill(divG);
  y += 1;

  // Return Y where body content begins (py-8 gap after divider)
  return y + PAD;
}

// ─── Continuation page header ─────────────────────────────────────────────────

function drawContinuationHeader(doc: PDFKit.PDFDocument): number {
  drawTopBar(doc);

  const lineY = 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(G900)
    .text("TIPAC Festival 2026 — Official Syllabus", ML, lineY);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(G500)
    .text("(continued)", ML, lineY, { width: BW, align: "right" });

  const divY = lineY + 15;
  doc
    .moveTo(ML, divY)
    .lineTo(ML + BW, divY)
    .lineWidth(0.5)
    .strokeColor(G200)
    .stroke();

  return divY + 12;
}

// ─── Space guard ─────────────────────────────────────────────────────────────

function hasRoom(doc: PDFKit.PDFDocument, needed: number) {
  return doc.y + needed < PH - MB - 44;
}

// ─── Block renderer (mirrors renderSyllabusBlocks in page.tsx) ────────────────

function renderBlocks(
  doc: PDFKit.PDFDocument,
  blocks: PdfBlock[],
  newPage: () => void,
) {
  for (const block of blocks) {

    // ── h1 — text-2xl sm:text-3xl font-black text-gray-900 ──────────────────
    if (block.type === "h1") {
      if (!hasRoom(doc, 36)) newPage();
      doc.moveDown(0.5);
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(G900)
        .text(block.text, ML, doc.y, { width: BW });
      doc.moveDown(0.4);
      continue;
    }

    // ── h2 — pt-4 text-xl font-extrabold text-gray-900 ──────────────────────
    if (block.type === "h2") {
      if (!hasRoom(doc, 28)) newPage();
      doc.moveDown(0.8);
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(G900)
        .text(block.text, ML, doc.y, { width: BW });
      doc.moveDown(0.35);
      continue;
    }

    // ── h3 — pt-3 text-lg font-extrabold text-gray-900 ──────────────────────
    if (block.type === "h3") {
      if (!hasRoom(doc, 22)) newPage();
      doc.moveDown(0.6);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(G900)
        .text(block.text, ML, doc.y, { width: BW });
      doc.moveDown(0.3);
      continue;
    }

    // ── p — text-sm text-gray-700 leading-relaxed ────────────────────────────
    if (block.type === "p") {
      if (!hasRoom(doc, 16)) newPage();
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(G700)
        .text(block.text, ML, doc.y, { width: BW, lineGap: 2.5 });
      doc.moveDown(0.4);
      continue;
    }

    // ── ol — list-decimal pl-6 space-y-2 text-sm text-gray-700 ─────────────
    if (block.type === "ol") {
      for (let idx = 0; idx < block.items.length; idx++) {
        if (!hasRoom(doc, 18)) newPage();

        const by = doc.y;
        const num = `${idx + 1}.`;

        // number aligns right in a ~22pt column
        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(G700)
          .text(num, ML, by, { width: 22, align: "right" });

        // item text
        const itemText = block.items[idx] ?? "";
        const itemH = doc
          .font("Helvetica")
          .fontSize(9.5)
          .heightOfString(itemText, { width: BW - 28, lineGap: 2 });

        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(G700)
          .text(itemText, ML + 26, by, { width: BW - 26, lineGap: 2 });

        doc.y = by + Math.max(itemH, 13) + 4;
      }
      doc.moveDown(0.3);
      continue;
    }

    // ── ul — list-disc pl-6 space-y-2 text-sm text-gray-700 ─────────────────
    if (block.type === "ul") {
      for (const item of block.items) {
        if (!hasRoom(doc, 18)) newPage();

        const by = doc.y;

        // disc bullet (filled circle)
        doc
          .circle(ML + 8, by + 5.5, 2.8)
          .fill(G800);

        const itemH = doc
          .font("Helvetica")
          .fontSize(9.5)
          .heightOfString(item, { width: BW - 22, lineGap: 2 });

        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(G700)
          .text(item, ML + 18, by, { width: BW - 18, lineGap: 2 });

        doc.y = by + Math.max(itemH, 13) + 4;
      }
      doc.moveDown(0.3);
      continue;
    }

    // ── table — mirrors web table (thead bg-gray-50, alternating rows) ───────
    if (block.type === "table") {
      if (!hasRoom(doc, 70)) newPage();
      doc.moveDown(0.35);

      // Optional category label (text-xs font-bold uppercase text-gray-600)
      if (block.title) {
        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor(G600)
          .text("ITEMS FOR COMPETITION", ML, doc.y, {
            width: BW,
            characterSpacing: 0.5,
          });
        doc.moveDown(0.4);
      }

      // Column widths — web: w-20 | min-w-52 | auto | w-32
      const TW = BW;
      const cols = [
        Math.floor(TW * 0.08),   // S/N
        Math.floor(TW * 0.27),   // Item
        Math.floor(TW * 0.44),   // Theme
        TW - Math.floor(TW * 0.08) - Math.floor(TW * 0.27) - Math.floor(TW * 0.44), // Stage Time
      ];

      const PX = 10;   // cell horizontal pad
      const PY = 7;    // cell vertical pad
      const FS = 9;    // cell font size

      // Measure a row's height
      const rowH = (cells: string[], bold: boolean): number => {
        let max = 0;
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(FS);
        for (let c = 0; c < 4; c++) {
          const h = doc.heightOfString(cells[c] ?? "", {
            width: cols[c] - PX * 2,
            lineGap: 1.5,
          });
          if (h > max) max = h;
        }
        return Math.max(PY * 2 + 11, max + PY * 2);
      };

      // Draw a row
      const drawRow = (
        cells: string[],
        ry: number,
        rh: number,
        isHeader: boolean,
        altRow: boolean,
      ) => {
        // background — thead bg-gray-100, even rows white, odd rows gray-50
        const bg = isHeader ? G100 : altRow ? G50 : WHT;
        doc.rect(ML, ry, TW, rh).fill(bg);

        // bottom border — border-b border-gray-200 (header) / border-gray-100 (body)
        doc
          .moveTo(ML, ry + rh)
          .lineTo(ML + TW, ry + rh)
          .lineWidth(isHeader ? 0.75 : 0.4)
          .strokeColor(isHeader ? G200 : G100)
          .stroke();

        // outer vertical edges
        doc.moveTo(ML, ry).lineTo(ML, ry + rh).lineWidth(0.5).strokeColor(G200).stroke();
        doc.moveTo(ML + TW, ry).lineTo(ML + TW, ry + rh).lineWidth(0.5).strokeColor(G200).stroke();

        // cell content
        let cx = ML;
        for (let c = 0; c < 4; c++) {
          // vertical divider
          if (c > 0) {
            doc
              .moveTo(cx, ry)
              .lineTo(cx, ry + rh)
              .lineWidth(0.4)
              .strokeColor(G200)
              .stroke();
          }

          // font + colour matching web:
          //   header th: text-xs font-extrabold uppercase text-gray-700
          //   S/N   td:  text-sm font-bold text-gray-800
          //   Item  td:  text-sm text-gray-800
          //   Theme td:  text-sm text-gray-700
          //   Time  td:  text-sm font-semibold text-gray-800
          let font = "Helvetica";
          let color = G700;
          let size = FS;
          let track = 0;
          let upcase = false;

          if (isHeader) {
            font = "Helvetica-Bold";
            color = G700;
            size = 7.5;
            track = 0.4;
            upcase = true;
          } else if (c === 0 || c === 1 || c === 3) {
            font = c === 2 ? "Helvetica" : "Helvetica-Bold";
            color = G800;
          } else {
            color = G700;
          }

          const cellText = upcase
            ? (cells[c] ?? "").toUpperCase()
            : (cells[c] ?? "");

          doc
            .font(font)
            .fontSize(size)
            .fillColor(color)
            .text(cellText, cx + PX, ry + PY, {
              width: cols[c] - PX * 2,
              lineGap: 1.5,
              characterSpacing: track,
            });

          cx += cols[c];
        }
      };

      // Draw header
      const tableTopY = doc.y;

      // top border line
      doc
        .moveTo(ML, tableTopY)
        .lineTo(ML + TW, tableTopY)
        .lineWidth(0.5)
        .strokeColor(G200)
        .stroke();

      const hh = rowH(block.headers, true);
      drawRow(block.headers, tableTopY, hh, true, false);
      doc.y = tableTopY + hh;

      // Draw data rows
      for (let r = 0; r < block.rows.length; r++) {
        const rh2 = rowH(block.rows[r], false);
        if (!hasRoom(doc, rh2 + 10)) newPage();
        const ry = doc.y;
        drawRow(block.rows[r], ry, rh2, false, r % 2 === 1);
        doc.y = ry + rh2;
      }

      doc.moveDown(0.8);
      continue;
    }
  }
}

// ─── PDF buffer ───────────────────────────────────────────────────────────────

async function generatePdf(text: string, logoBuffer: Buffer | null): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: "TIPAC Festival 2026 — Official Syllabus",
      Author: "Theatre Initiative for the Pearl of Africa Children (TIPAC)",
      Subject: "Festival Syllabus 2026",
      Creator: "TIPAC · tipac.co.ug",
      Keywords: "TIPAC, 2026, festival, syllabus, performing arts, Uganda",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) =>
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
  );

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let pageNum = 1;

  const addNewPage = () => {
    pageNum++;
    doc.addPage({ size: "A4", margin: 0 });
    drawBottomBar(doc);
    drawFooter(doc, pageNum);
    doc.y = drawContinuationHeader(doc);
  };

  // First page
  drawBottomBar(doc);
  drawFooter(doc, pageNum);
  doc.y = drawLetterhead(doc, logoBuffer);

  // Render content
  const blocks = stripDupe(parseSyllabus(text));
  renderBlocks(doc, blocks, addNewPage);

  doc.end();
  return done;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const text = await readFile(
      path.join(process.cwd(), "syllabus.txt"),
      "utf8",
    );

    let logoBuffer: Buffer | null = null;
    try {
      logoBuffer = await readFile(
        path.join(process.cwd(), "public", "logo.jpg"),
      );
    } catch {
      // Logo is optional — continue without it
    }

    const pdf = await generatePdf(text, logoBuffer);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="TIPAC-Festival-2026-Official-Syllabus.pdf"',
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[PDF generation error]", err);
    return NextResponse.json(
      { error: "Failed to generate syllabus PDF" },
      { status: 500 },
    );
  }
}
