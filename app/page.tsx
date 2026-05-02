"use client";

import { useState, useCallback } from "react";
import {
  CONVERSION_OPTIONS,
  ConversionMode,
  ConversionOption,
  ConversionStatus,
} from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { StatusBadge } from "@/components/StatusBadge";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ConverterPage() {
  const [activeMode, setActiveMode] = useState<ConversionMode>("img2pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [message, setMessage] = useState("");

  const activeOption = CONVERSION_OPTIONS.find(
    (o: ConversionOption) => o.id === activeMode,
  )!;
  const isProcessing = status === "uploading" || status === "processing";

  const handleTabChange = (mode: ConversionMode) => {
    setActiveMode(mode);
    setFiles([]);
    setStatus("idle");
    setMessage("");
  };

  const handleFiles = useCallback((incoming: File[]) => {
    setFiles(incoming);
    setStatus("idle");
    setMessage("");
  }, []);

  const convert = async () => {
    if (!files.length || isProcessing) return;
    setStatus("uploading");
    setMessage("Preparing your file…");

    try {
      let blob: Blob;
      let outName: string;

      // ── Image → PDF (server) ────────────────────────────────────
      if (activeMode === "img2pdf") {
        setStatus("processing");
        setMessage("Building PDF from images…");
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        const res = await fetch("/api/converter/img2pdf", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Conversion failed");
        }
        blob = await res.blob();
        outName =
          files.length === 1
            ? files[0].name.replace(/\.[^.]+$/, "") + ".pdf"
            : "images.pdf";
      }

      // ── DOC → PDF (server) ──────────────────────────────────────
      else if (activeMode === "doc2pdf") {
        setStatus("processing");
        setMessage("Converting Word document to PDF…");
        const form = new FormData();
        form.append("file", files[0]);
        const res = await fetch("/api/converter/doc2pdf", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Conversion failed");
        }
        blob = await res.blob();
        outName = files[0].name.replace(/\.[^.]+$/, "") + ".pdf";
      }

      // ── PDF → DOC (server) ──────────────────────────────────────
      else {
        setStatus("processing");
        setMessage("Extracting text and building Word document…");
        const form = new FormData();
        form.append("file", files[0]);
        const res = await fetch("/api/converter/pdf2doc", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Conversion failed");
        }
        blob = await res.blob();
        outName = files[0].name.replace(/\.[^.]+$/, "") + ".docx";
      }

      downloadBlob(blob, outName);
      setStatus("done");
      setMessage(`✓ "${outName}" downloaded successfully!`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const reset = () => {
    setFiles([]);
    setStatus("idle");
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#07070f] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-150 h-150 rounded-full opacity-20 blur-[120px] transition-colors duration-700"
          style={{ background: activeOption.color }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-127 h-125 rounded-full opacity-10 blur-[100px] transition-colors duration-700"
          style={{ background: activeOption.color }}
        />
      </div>

      <div className="relative w-full max-w-125 animate-slide-up">
        {/* Card */}
        <div className="bg-white/4 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-2xl mb-4">
              ⚡
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              File Converter
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {activeOption.description}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5 bg-white/5 rounded-2xl p-1 mb-6">
            {CONVERSION_OPTIONS.map((opt: ConversionOption) => {
              const isActive = opt.id === activeMode;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleTabChange(opt.id)}
                  disabled={isProcessing}
                  className={`
                    flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold
                    transition-all duration-200 disabled:opacity-50
                    ${isActive ? "text-white shadow-lg" : "text-white/40 hover:text-white/70"}
                  `}
                  style={{
                    background: isActive ? opt.color : "transparent",
                    boxShadow: isActive ? `0 4px 20px ${opt.color}55` : "none",
                  }}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Drop zone */}
          <div className="mb-5">
            <DropZone
              option={activeOption}
              files={files}
              onFiles={handleFiles}
              disabled={isProcessing}
            />
          </div>

          {/* Status */}
          {message && (
            <div className="mb-5">
              <StatusBadge status={status} message={message} />
            </div>
          )}

          {/* Convert button */}
          <button
            onClick={convert}
            disabled={!files.length || isProcessing}
            className={`
              w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200
              ${
                files.length && !isProcessing
                  ? "text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  : "text-white/30 cursor-not-allowed bg-white/5"
              }
            `}
            style={
              files.length && !isProcessing
                ? {
                    background: `linear-gradient(135deg, ${activeOption.color}, ${activeOption.color}cc)`,
                    boxShadow: `0 8px 32px ${activeOption.color}50`,
                  }
                : {}
            }
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⟳</span>
                {message || "Converting…"}
              </span>
            ) : (
              `Convert ${activeOption.shortLabel}`
            )}
          </button>

          {/* Reset button */}
          {status === "done" && (
            <button
              onClick={reset}
              className="w-full mt-3 py-3 rounded-xl text-white/40 hover:text-white/70 text-sm transition-colors border border-white/10 hover:border-white/20"
            >
              Convert another file
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs mt-4">
          Images converted in-browser · Documents processed server-side
        </p>
      </div>
    </main>
  );
}