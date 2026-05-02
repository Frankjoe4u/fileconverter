export type ConversionMode = "img2pdf" | "doc2pdf" | "pdf2doc";

export type ConversionStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface ConversionOption {
  id: ConversionMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  accept: Record<string, string[]>;
  multiple: boolean;
}

export const CONVERSION_OPTIONS: ConversionOption[] = [
  {
    id: "img2pdf",
    label: "Images to PDF",
    shortLabel: "IMG → PDF",
    description: "Combine one or more images into a single PDF file",
    icon: "🖼️",
    color: "#6366f1",
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"] },
    multiple: true,
  },
  {
    id: "doc2pdf",
    label: "Word to PDF",
    shortLabel: "DOC → PDF",
    description: "Convert a Word document (.docx) to PDF",
    icon: "📄",
    color: "#0ea5e9",
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
  },
  {
    id: "pdf2doc",
    label: "PDF to Word",
    shortLabel: "PDF → DOC",
    description: "Extract text from a PDF and build a Word document",
    icon: "📑",
    color: "#f43f5e",
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  },
];
