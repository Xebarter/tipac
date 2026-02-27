import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

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

function isAllCapsHeading(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) {
    return false;
  }

  return letters === letters.toUpperCase();
}

function parseCompetitionTable(lines: string[], startIndex: number) {
  const rows: Array<[string, string, string, string]> = [];
  let i = startIndex;

  while (i < lines.length) {
    const l1 = (lines[i] ?? "").trim();
    if (!l1) {
      i += 1;
      continue;
    }

    if (isAllCapsHeading(l1) || /^Please take note/i.test(l1) || /^GUIDELINES/i.test(l1)) {
      break;
    }

    if (/^(\d+\.|\d+)$/.test(l1)) {
      const sn = l1.replace(/\.$/, "");
      const item = (lines[i + 1] ?? "").trim();
      const theme = (lines[i + 2] ?? "").trim();
      const stageTime = (lines[i + 3] ?? "").trim();

      if (item && theme && stageTime) {
        rows.push([sn, item, theme, stageTime]);
        i += 4;
        continue;
      }

      break;
    }

    break;
  }

  return { rows, nextIndex: i };
}

function parseSyllabus(text: string): PdfBlock[] {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: PdfBlock[] = [];

  let i = 0;
  let pendingOl: string[] = [];
  let pendingUl: string[] = [];
  let lastHeading: string | undefined;

  const flushLists = () => {
    if (pendingOl.length) {
      blocks.push({ type: "ol", items: pendingOl });
      pendingOl = [];
    }
    if (pendingUl.length) {
      blocks.push({ type: "ul", items: pendingUl });
      pendingUl = [];
    }
  };

  while (i < rawLines.length) {
    const line = (rawLines[i] ?? "").trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushLists();
      i += 1;
      continue;
    }

    const isTableHeader =
      trimmed === "S/N" &&
      (rawLines[i + 1] ?? "").trim() === "ITEM" &&
      (rawLines[i + 2] ?? "").trim() === "THEME" &&
      (rawLines[i + 3] ?? "").trim() === "STAGE TIME";

    if (isTableHeader) {
      flushLists();
      const { rows, nextIndex } = parseCompetitionTable(rawLines, i + 4);
      if (rows.length) {
        blocks.push({
          type: "table",
          title: lastHeading,
          headers: ["S/N", "Item", "Theme", "Stage time"],
          rows,
        });
      }
      i = nextIndex;
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (olMatch) {
      pendingOl.push(olMatch[2]);
      i += 1;
      continue;
    }

    const ulMatch = trimmed.match(/^(?:·|\-|\*)\s*(.+)$/);
    if (ulMatch) {
      pendingUl.push(ulMatch[1]);
      i += 1;
      continue;
    }

    flushLists();

    if (isAllCapsHeading(trimmed)) {
      lastHeading = trimmed;
      if (blocks.length === 0) {
        blocks.push({ type: "h1", text: trimmed });
      } else if (/CATEGORY|OBJECTIVES|ORGANISATION|GUIDELINES|THEME/i.test(trimmed)) {
        blocks.push({ type: "h2", text: trimmed });
      } else {
        blocks.push({ type: "h3", text: trimmed });
      }
      i += 1;
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
    i += 1;
  }

  flushLists();
  return blocks;
}

function stripDuplicatedHeaderBlocks(blocks: PdfBlock[]) {
  const startIndex = blocks.findIndex((b) => {
    if (b.type === "p" || b.type === "h1" || b.type === "h2" || b.type === "h3") {
      return /^main theme\s*:/i.test(b.text.trim());
    }
    return false;
  });

  if (startIndex === -1) {
    return blocks;
  }

  return blocks.slice(startIndex);
}

function drawBrandBars(doc: PDFKit.PDFDocument, pageWidth: number, pageHeight: number) {
  doc.save();
  
  // Create gradient effect with multiple bars at the top
  const barHeight = 8;
  const gradientSteps = 5;
  
  for (let i = 0; i < gradientSteps; i++) {
    const alpha = 1 - (i * 0.15);
    doc.fillOpacity(alpha);
    
    // Purple to red gradient across top
    const gradient = doc.linearGradient(0, i * 2, pageWidth, i * 2);
    gradient.stop(0, "#7C3AED").stop(0.5, "#C026D3").stop(1, "#DC2626");
    
    doc.rect(0, i * 2, pageWidth, 2).fill(gradient);
  }
  
  // Solid accent bar at top
  doc.fillOpacity(1);
  const topGradient = doc.linearGradient(0, 0, pageWidth, 0);
  topGradient.stop(0, "#6D28D9").stop(0.5, "#A855F7").stop(1, "#DC2626");
  doc.rect(0, 0, pageWidth, 4).fill(topGradient);
  
  // Bottom brand bar with gradient
  const bottomGradient = doc.linearGradient(0, pageHeight - barHeight, pageWidth, pageHeight - barHeight);
  bottomGradient.stop(0, "#6D28D9").stop(0.5, "#A855F7").stop(1, "#DC2626");
  doc.rect(0, pageHeight - barHeight, pageWidth, barHeight).fill(bottomGradient);
  
  doc.restore();
}

function drawWatermark(doc: PDFKit.PDFDocument) {
  const cx = doc.page.width / 2;
  const cy = doc.page.height / 2;

  doc.save();
  doc.translate(cx, cy);
  doc.rotate(-25);
  doc.fillOpacity(0.03);
  
  // Main watermark
  doc
    .font("Helvetica-Bold")
    .fontSize(72)
    .fillColor("#7C3AED")
    .text("TIPAC", -doc.page.width / 2, -50, {
      width: doc.page.width,
      align: "center",
    });
  
  // Subtitle watermark
  doc
    .font("Helvetica")
    .fontSize(18)
    .fillColor("#DC2626")
    .text("Festival 2026", -doc.page.width / 2, 10, {
      width: doc.page.width,
      align: "center",
    });
  
  doc.fillOpacity(1);
  doc.restore();
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const y = doc.page.height - doc.page.margins.bottom + 20;

  doc.save();
  
  // Gradient line separator
  const gradient = doc.linearGradient(left, y - 12, right, y - 12);
  gradient.stop(0, "#7C3AED").stop(0.5, "#A855F7").stop(1, "#DC2626");
  
  doc
    .lineWidth(1.5)
    .moveTo(left, y - 12)
    .lineTo(right, y - 12)
    .stroke(gradient);

  // Footer text with modern styling
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#374151")
    .text("TIPAC Festival 2026", left, y, { continued: false });
  
  // Page number in a rounded pill
  const pageText = `Page ${pageNumber}`;
  const pageWidth = doc.widthOfString(pageText) + 16;
  const pillX = right - pageWidth;
  const pillY = y - 4;
  
  doc.roundedRect(pillX, pillY, pageWidth, 18, 9).fill("#F3F4F6");
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#6D28D9")
    .text(pageText, pillX + 8, y);
  
  doc.restore();
}

function drawHeader(doc: PDFKit.PDFDocument, logoBuffer: Buffer | null) {
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const usableWidth = doc.page.width - marginLeft - marginRight;
  const headerTopY = doc.page.margins.top + 6;

  // Background card with subtle shadow effect
  doc.save();
  doc.roundedRect(marginLeft, headerTopY - 4, usableWidth, 106, 16).fill("#FFFFFF");
  
  // Subtle border
  doc.roundedRect(marginLeft, headerTopY - 4, usableWidth, 106, 16)
     .lineWidth(1)
     .strokeColor("#E5E7EB")
     .stroke();
  doc.restore();

  const logoBox = 64;
  if (logoBuffer) {
    doc.save();
    
    // Logo container with gradient border
    const logoGradient = doc.linearGradient(marginLeft + 10, headerTopY, marginLeft + 10 + logoBox, headerTopY);
    logoGradient.stop(0, "#7C3AED").stop(1, "#DC2626");
    
    doc.roundedRect(marginLeft + 10, headerTopY, logoBox, logoBox, 14)
       .lineWidth(2.5)
       .stroke(logoGradient);
    
    // White background for logo
    doc.roundedRect(marginLeft + 10, headerTopY, logoBox, logoBox, 14).fill("#FFFFFF");
    
    doc.image(logoBuffer, marginLeft + 16, headerTopY + 6, { fit: [logoBox - 12, logoBox - 12] });
    doc.restore();
  }

  const headerTextX = marginLeft + (logoBuffer ? logoBox + 24 : 14);
  const headerTextWidth = usableWidth - (logoBuffer ? logoBox + 34 : 24);

  // Organization name with smaller, uppercase styling
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#9333EA")
    .text("THEATRE INITIATIVE FOR THE PEARL OF AFRICA CHILDREN", headerTextX, headerTopY + 4, {
      width: headerTextWidth,
      characterSpacing: 0.5,
    });

  // Main title with gradient effect simulation (using purple)
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#111827")
    .text("TIPAC FESTIVAL 2026", headerTextX, headerTopY + 18, {
      width: headerTextWidth,
      characterSpacing: 0.3,
    });

  // Subtitle with refined typography
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#6B7280")
    .text("Syllabus for Pre-Primary, Primary and Secondary Schools", headerTextX, headerTopY + 44, {
      width: headerTextWidth,
    });

  // Info boxes with modern design
  const boxY = headerTopY + 62;
  const boxHeight = 26;
  const boxSpacing = 6;
  const totalBoxWidth = headerTextWidth;
  const singleBoxWidth = (totalBoxWidth - boxSpacing) / 2;

  // Dates box
  doc.save();
  doc.roundedRect(headerTextX, boxY, singleBoxWidth, boxHeight, 10).fill("#F9FAFB");
  doc.roundedRect(headerTextX, boxY, singleBoxWidth, boxHeight, 10)
     .lineWidth(1)
     .strokeColor("#E5E7EB")
     .stroke();
  
  doc.fillColor("#9333EA").font("Helvetica-Bold").fontSize(7).text("📅  FESTIVAL DATES", headerTextX + 10, boxY + 6, {
    width: singleBoxWidth - 20,
  });
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text("24th–26th April 2026", headerTextX + 10, boxY + 15, {
    width: singleBoxWidth - 20,
  });
  doc.restore();

  // Venue box
  const venueX = headerTextX + singleBoxWidth + boxSpacing;
  doc.save();
  doc.roundedRect(venueX, boxY, singleBoxWidth, boxHeight, 10).fill("#F9FAFB");
  doc.roundedRect(venueX, boxY, singleBoxWidth, boxHeight, 10)
     .lineWidth(1)
     .strokeColor("#E5E7EB")
     .stroke();
  
  doc.fillColor("#DC2626").font("Helvetica-Bold").fontSize(7).text("📍  VENUE", venueX + 10, boxY + 6, {
    width: singleBoxWidth - 20,
  });
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9).text("UNCC, Kampala", venueX + 10, boxY + 15, {
    width: singleBoxWidth - 20,
  });
  doc.restore();

  // Theme badge - centered below info boxes
  const themeY = boxY + boxHeight + 8;
  const themeBadgeWidth = totalBoxWidth;
  const themeBadgeHeight = 28;
  
  doc.save();
  // Gradient background for theme
  const themeGradient = doc.linearGradient(headerTextX, themeY, headerTextX + themeBadgeWidth, themeY);
  themeGradient.stop(0, "#7C3AED").stop(0.5, "#A855F7").stop(1, "#DC2626");
  
  doc.roundedRect(headerTextX, themeY, themeBadgeWidth, themeBadgeHeight, 12).fill(themeGradient);
  
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("🌍  MAIN THEME", headerTextX + 14, themeY + 6, {
    width: themeBadgeWidth - 28,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12).text("Environmental Sustainability", headerTextX + 14, themeY + 16, {
    width: themeBadgeWidth - 28,
  });
  doc.restore();
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number, startNewPage: () => void) {
  const bottom = doc.page.height - doc.page.margins.bottom - 20;
  const currentY = doc.y;
  
  // Only create new page if we're not at the very top and content won't fit
  if (currentY > doc.page.margins.top + 130 && currentY + neededHeight > bottom) {
    startNewPage();
  }
}

function renderBlocks(doc: PDFKit.PDFDocument, blocks: PdfBlock[], startNewPage: () => void) {
  for (const block of blocks) {
    if (block.type === "h1") {
      ensureSpace(doc, 32, startNewPage);
      doc.moveDown(0.3);
      
      // Add a subtle accent line before h1
      const left = doc.page.margins.left;
      const y = doc.y;
      doc.save();
      doc.rect(left, y, 4, 20).fill("#7C3AED");
      doc.restore();
      
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000").text(block.text, {
        indent: 12,
        align: 'left',
      });
      doc.moveDown(0.7);
      doc.font("Helvetica").fontSize(11).fillColor("#000000");
      continue;
    }

    if (block.type === "h2") {
      ensureSpace(doc, 28, startNewPage);
      doc.moveDown(0.6);
      
      // Background highlight for h2
      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const y = doc.y;
      
      doc.save();
      doc.roundedRect(left, y - 2, right - left, 26, 8).fill("#F9FAFB");
      doc.restore();
      
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#000000").text(block.text, left + 10, y + 4);
      doc.y = y + 26;
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(11).fillColor("#000000");
      continue;
    }

    if (block.type === "h3") {
      ensureSpace(doc, 24, startNewPage);
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000").text(block.text);
      doc.moveDown(0.3);
      doc.font("Helvetica").fontSize(11).fillColor("#000000");
      continue;
    }

    if (block.type === "p") {
      ensureSpace(doc, 18, startNewPage);
      doc.font("Helvetica").fontSize(10.5).fillColor("#000000").text(block.text, {
        lineGap: 3,
        align: 'left',
      });
      doc.moveDown(0.4);
      continue;
    }

    if (block.type === "ol") {
      for (let i = 0; i < block.items.length; i += 1) {
        ensureSpace(doc, 18, startNewPage);
        
        const left = doc.page.margins.left;
        const y = doc.y;
        
        // Number in a colored circle
        doc.save();
        doc.circle(left + 8, y + 6, 8).fill("#E0E7FF");
        doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9).text(`${i + 1}`, left + 4, y + 2, {
          width: 8,
          align: 'center',
        });
        doc.restore();
        
        doc.font("Helvetica").fontSize(10.5).fillColor("#000000").text(block.items[i], left + 22, y, {
          lineGap: 3,
          align: 'left',
        });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.4);
      continue;
    }

    if (block.type === "ul") {
      for (const item of block.items) {
        ensureSpace(doc, 18, startNewPage);
        
        const left = doc.page.margins.left;
        const y = doc.y;
        
        // Custom bullet point
        doc.save();
        doc.circle(left + 8, y + 6, 3).fill("#DC2626");
        doc.restore();
        
        doc.font("Helvetica").fontSize(10.5).fillColor("#000000").text(item, left + 22, y, {
          lineGap: 3,
          align: 'left',
        });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.4);
      continue;
    }

    if (block.type === "table") {
      ensureSpace(doc, 80, startNewPage);
      doc.moveDown(0.3);

      if (block.title) {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#6D28D9").text(block.title.toUpperCase(), {
          characterSpacing: 0.8,
        });
        doc.moveDown(0.4);
      }

      const startX = doc.page.margins.left;
      const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidths = [tableWidth * 0.1, tableWidth * 0.28, tableWidth * 0.46, tableWidth * 0.16];
      const padX = 8;
      const padY = 6;

      const getRowHeight = (cells: string[], isHeader: boolean) => {
        let max = 0;
        const fontSize = isHeader ? 9.5 : 9.5;
        doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);
        for (let i = 0; i < 4; i += 1) {
          const h = doc.heightOfString(cells[i] ?? "", {
            width: colWidths[i] - padX * 2,
          });
          max = Math.max(max, h);
        }

        return Math.max(20, max + padY * 2);
      };

      const drawRow = (cells: string[], y: number, height: number, isHeader: boolean, shaded: boolean) => {
        // Background fill
        if (isHeader) {
          doc.save();
          const gradient = doc.linearGradient(startX, y, startX + tableWidth, y);
          gradient.stop(0, "#7C3AED").stop(1, "#DC2626");
          doc.rect(startX, y, tableWidth, height).fill(gradient);
          doc.restore();
        } else if (shaded) {
          doc.save();
          doc.rect(startX, y, tableWidth, height).fill("#F9FAFB");
          doc.restore();
        }

        // Outer border
        doc.save();
        doc.lineWidth(isHeader ? 0 : 0.5).strokeColor("#E5E7EB");
        doc.rect(startX, y, tableWidth, height).stroke();
        doc.restore();

        let x = startX;
        for (let i = 0; i < 4; i += 1) {
          // Cell borders
          doc.save();
          doc.lineWidth(0.5).strokeColor(isHeader ? "#FFFFFF" : "#E5E7EB");
          if (i > 0) {
            doc.moveTo(x, y).lineTo(x, y + height).stroke();
          }
          doc.restore();

          doc
            .font(isHeader ? "Helvetica-Bold" : i === 0 || i === 3 ? "Helvetica-Bold" : "Helvetica")
            .fontSize(isHeader ? 9.5 : 9.5)
            .fillColor(isHeader ? "#FFFFFF" : "#000000")
            .text(cells[i] ?? "", x + padX, y + padY, {
              width: colWidths[i] - padX * 2,
              lineGap: 2,
              align: 'left',
            });
          x += colWidths[i];
        }
      };

      // Add rounded container background
      const tableY = doc.y;
      const estimatedHeight = getRowHeight(block.headers, true) + 
        block.rows.reduce((sum, row) => sum + getRowHeight(row, false), 0);
      
      doc.save();
      doc.roundedRect(startX - 4, tableY - 4, tableWidth + 8, estimatedHeight + 8, 12)
         .lineWidth(1.5)
         .strokeColor("#E5E7EB")
         .stroke();
      doc.restore();

      const headerY = doc.y;
      const headerHeight = getRowHeight(block.headers, true);
      drawRow(block.headers, headerY, headerHeight, true, false);
      doc.y = headerY + headerHeight;

      for (let r = 0; r < block.rows.length; r += 1) {
        const row = block.rows[r];
        const rowHeight = getRowHeight(row, false);
        ensureSpace(doc, rowHeight + 14, startNewPage);
        const y = doc.y;
        drawRow(row, y, rowHeight, false, r % 2 === 1);
        doc.y = y + rowHeight;
      }

      doc.moveDown(0.8);
      doc.font("Helvetica").fontSize(10.5).fillColor("#000000");
    }
  }
}

async function generatePdfBuffer(text: string, logoBuffer: Buffer | null) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: "TIPAC Festival 2026 Syllabus",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let pageNumber = 1;

  const applyTemplate = () => {
    drawBrandBars(doc, doc.page.width, doc.page.height);
    drawHeader(doc, logoBuffer);
    drawFooter(doc, pageNumber);
    doc.y = doc.page.margins.top + 120;
  };

  const startNewPage = () => {
    pageNumber += 1;
    doc.addPage();
    applyTemplate();
  };

  applyTemplate();

  const blocks = stripDuplicatedHeaderBlocks(parseSyllabus(text));
  renderBlocks(doc, blocks, startNewPage);

  doc.end();
  return endPromise;
}

export async function GET() {
  try {
    const syllabusPath = path.join(process.cwd(), "syllabus.txt");
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    const text = await readFile(syllabusPath, "utf8");

    let logoBuffer: Buffer | null = null;
    try {
      logoBuffer = await readFile(logoPath);
    } catch {
      logoBuffer = null;
    }

    const pdfBuffer = await generatePdfBuffer(text, logoBuffer);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="TIPAC-Festival-2026-Syllabus.pdf"',
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate syllabus PDF" }, { status: 500 });
  }
}
