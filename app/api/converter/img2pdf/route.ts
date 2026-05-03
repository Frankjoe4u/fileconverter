import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getImageDimensions(
  buffer: Buffer,
  mimeType: string,
): Promise<{ width: number; height: number }> {
  // Parse dimensions from image headers without a heavy library
  if (mimeType === "image/png") {
    // PNG: width at bytes 16-19, height at 20-23
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    // JPEG: scan for SOF marker
    let i = 2;
    while (i < buffer.length) {
      if (buffer[i] !== 0xff) break;
      const marker = buffer[i + 1];
      const len = buffer.readUInt16BE(i + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
      i += 2 + len;
    }
  }
  if (mimeType === "image/webp") {
    // WebP: check RIFF header
    if (buffer.slice(8, 12).toString() === "WEBP") {
      const format = buffer.slice(12, 16).toString();
      if (format === "VP8 ") {
        const width = (buffer.readUInt16LE(26) & 0x3fff) + 1;
        const height = (buffer.readUInt16LE(28) & 0x3fff) + 1;
        return { width, height };
      }
      if (format === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        const width = (bits & 0x3fff) + 1;
        const height = ((bits >> 14) & 0x3fff) + 1;
        return { width, height };
      }
    }
  }
  // Fallback: assume A4-ish proportions
  return { width: 800, height: 1100 };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const A4_W = 595.28; // pts
    const A4_H = 841.89; // pts
    const PADDING = 20; // pts padding on each side

    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get dimensions
      const { width, height } = await getImageDimensions(buffer, file.type);

      // Scale to fit A4 with padding
      const maxW = A4_W - PADDING * 2;
      const maxH = A4_H - PADDING * 2;
      const ratio = Math.min(maxW / width, maxH / height);
      const w = width * ratio;
      const h = height * ratio;
      const x = (A4_W - w) / 2;
      const y = (A4_H - h) / 2;

      if (i > 0) pdf.addPage();

      // Convert to base64
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      // jsPDF format string
      const mimeToFormat: Record<string, string> = {
        "image/jpeg": "JPEG",
        "image/jpg": "JPEG",
        "image/png": "PNG",
        "image/webp": "WEBP",
        "image/gif": "GIF",
      };
      const format = mimeToFormat[file.type] ?? "JPEG";

      pdf.addImage(dataUrl, format, x, y, w, h);
    }

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
    const filename =
      files.length === 1
        ? files[0].name.replace(/\.[^.]+$/, "") + ".pdf"
        : "images.pdf";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[img2pdf]", err);
    return NextResponse.json(
      { error: "Image conversion failed. Please try again." },
      { status: 500 },
    );
  }
}