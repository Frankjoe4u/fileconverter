import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

// Force CJS build — the ESM entry has no call signatures
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buf: Buffer,
) => Promise<{ text: string }>;

export const runtime = "nodejs";
export const maxDuration = 60;

function detectHeading(line: string): boolean {
  return (
    line.length > 0 &&
    line.length < 80 &&
    !line.endsWith(".") &&
    !line.endsWith(",") &&
    line === line.trim()
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdfParse(buffer);
    const fullText = data.text;

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 422 },
      );
    }

    const title = file.name.replace(/\.[^.]+$/, "");

    // Build DOCX paragraphs
    const docParagraphs: Paragraph[] = [];

    // Title
    docParagraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 },
      }),
    );

    // Parse content
    const lines = fullText.split("\n");
    let buffer2: string[] = [];

    const flushBuffer = () => {
      if (buffer2.length === 0) return;
      const text = buffer2.join(" ").trim();
      if (!text) {
        buffer2 = [];
        return;
      }
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          spacing: { after: 120, line: 276 },
        }),
      );
      buffer2 = [];
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        flushBuffer();
        continue;
      }
      if (detectHeading(line) && buffer2.length === 0) {
        docParagraphs.push(
          new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );
      } else {
        buffer2.push(line);
      }
    }
    flushBuffer();

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22 },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
            },
          },
          children: docParagraphs,
        },
      ],
    });

    const docBuffer = new Uint8Array(await Packer.toBuffer(doc));

    return new NextResponse(docBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title}.docx"`,
      },
    });
  } catch (err) {
    console.error("[pdf2doc]", err);
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 },
    );
  }
}
