import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import jsPDF from "jspdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value;

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 422 },
      );
    }

    // Build PDF with jsPDF
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });
    const margin = 60;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxWidth = pageWidth - margin * 2;
    let y = margin + 10;

    // Title: use filename
    const title = file.name.replace(/\.[^.]+$/, "");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    const titleLines = pdf.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 24;
    });

    y += 12;

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 20;

    // Body text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(30, 30, 30);

    const paragraphs = fullText.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Detect potential heading (short line, ends without period)
      const isHeading =
        trimmed.length < 80 &&
        !trimmed.endsWith(".") &&
        !trimmed.includes("\n");

      if (isHeading) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(20, 20, 60);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
      }

      const lines = pdf.splitTextToSize(trimmed, maxWidth);
      const lineH = isHeading ? 18 : 15;

      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += lineH;
      });

      y += isHeading ? 6 : 10;
    }

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[doc2pdf]", err);
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 },
    );
  }
}
