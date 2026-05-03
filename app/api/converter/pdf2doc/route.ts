import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (err: any) => reject(err));
    parser.on("pdfParser_dataReady", (data: any) => {
      const text = data.Pages.map((page: any) =>
        page.Texts.map((t: any) =>
          decodeURIComponent(t.R.map((r: any) => r.T).join("")),
        ).join(" "),
      ).join("\n");
      resolve(text);
    });
    parser.parseBuffer(buffer);
  });
}

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
    const fullText = await extractText(buffer);

    if (!fullText.trim()) {
      return NextResponse.json(
        {
          error:
            "This PDF appears to be scanned or image-based. Only text-based PDFs are supported. Try copy-pasting text from your PDF to confirm it has selectable text.",
        },
        { status: 422 },
      );
    }

    const title = file.name.replace(/\.[^.]+$/, "");
    const docParagraphs: Paragraph[] = [];

    docParagraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 },
      }),
    );

    const lines = fullText.split("\n");
    let buf: string[] = [];

    const flushBuffer = () => {
      if (buf.length === 0) return;
      const text = buf.join(" ").trim();
      if (!text) {
        buf = [];
        return;
      }
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          spacing: { after: 120, line: 276 },
        }),
      );
      buf = [];
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        flushBuffer();
        continue;
      }
      if (detectHeading(line) && buf.length === 0) {
        docParagraphs.push(
          new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );
      } else {
        buf.push(line);
      }
    }
    flushBuffer();

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 22 } },
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
    console.error(
      "[pdf2doc] Full error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err)),
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Conversion failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
