"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
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
  const [tabAnimating, setTabAnimating] = useState(false);

  const activeOption = CONVERSION_OPTIONS.find(
    (o: ConversionOption) => o.id === activeMode,
  )!;
  const isProcessing = status === "uploading" || status === "processing";

  const handleTabChange = (mode: ConversionMode) => {
    if (mode === activeMode) return;
    setTabAnimating(true);
    setTimeout(() => {
      setActiveMode(mode);
      setFiles([]);
      setStatus("idle");
      setMessage("");
      setTabAnimating(false);
    }, 200);
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
      } else if (activeMode === "doc2pdf") {
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
      } else {
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
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #cffafe 100%)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-slide { animation: fadeSlide 0.25s ease both; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .card-enter { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="relative w-full max-w-lg card-enter">
        {/* ── HERO HEADER ─────────────────────────────────────── */}
        <div
          className="rounded-3xl p-8 mb-4 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)",
            boxShadow: "0 20px 60px rgba(14,165,233,0.35)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute top-1/2 right-12 w-10 h-10 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4 animate-pop-in"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            >
              <Image
                src="/icons/icon-192x192.png"
                alt="Fancy-Doc Logo"
                width={64}
                height={64}
                className="object-contain rounded-xl"
                priority
              />
            </div>
            <h1 className="text-white text-3xl font-bold tracking-tight drop-shadow">
              Fancy-Doc
            </h1>
            <p
              key={activeMode}
              className="text-sky-100 text-sm mt-2 animate-fade-slide"
            >
              {activeOption.description}
            </p>
          </div>
        </div>

        {/* ── MAIN CARD ────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(186,230,253,0.8)",
            boxShadow: "0 8px 40px rgba(14,165,233,0.12)",
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex gap-1.5 rounded-2xl p-1 mb-5"
            style={{ background: "linear-gradient(135deg, #e0f2fe, #dbeafe)" }}
          >
            {CONVERSION_OPTIONS.map((opt: ConversionOption) => {
              const isActive = opt.id === activeMode;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleTabChange(opt.id)}
                  disabled={isProcessing}
                  className={`
                    flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold
                    transition-all duration-300 disabled:opacity-50
                    ${isActive ? "text-white scale-[1.03] shadow-md" : "text-sky-500 hover:text-sky-700 hover:scale-[1.01]"}
                  `}
                  style={{
                    background: isActive ? opt.color : "transparent",
                    boxShadow: isActive ? `0 4px 16px ${opt.color}60` : "none",
                  }}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Drop zone */}
          <div
            className={`mb-4 transition-opacity duration-200 ${tabAnimating ? "opacity-0" : "opacity-100"}`}
            key={activeMode}
          >
            <DropZone
              option={activeOption}
              files={files}
              onFiles={handleFiles}
              disabled={isProcessing}
            />
          </div>

          {/* Status badge */}
          {message && (
            <div className="mb-4 animate-fade-slide">
              <StatusBadge status={status} message={message} />
            </div>
          )}

          {/* Convert button */}
          <button
            onClick={convert}
            disabled={!files.length || isProcessing}
            className={`
              w-full py-4 rounded-2xl font-bold text-sm tracking-wide
              transition-all duration-200
              ${
                files.length && !isProcessing
                  ? "text-white cursor-pointer hover:scale-[1.02] active:scale-[0.97]"
                  : "cursor-not-allowed"
              }
            `}
            style={
              files.length && !isProcessing
                ? {
                    background: `linear-gradient(135deg, ${activeOption.color}, ${activeOption.color}bb)`,
                    boxShadow: `0 8px 24px ${activeOption.color}50`,
                  }
                : {
                    background: "linear-gradient(135deg, #bae6fd, #e0f2fe)",
                    color: "#7dd3fc",
                  }
            }
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  style={{ animation: "spin 0.7s linear infinite" }}
                />
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
              className="w-full mt-3 py-3 rounded-xl text-sky-500 hover:text-sky-700 text-sm font-medium transition-all duration-200 hover:scale-[1.01] animate-fade-slide"
              style={{
                background: "linear-gradient(135deg, #e0f2fe, #dbeafe)",
                border: "1px solid #bae6fd",
              }}
            >
              Convert another file
            </button>
          )}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <div
          className="mt-4 rounded-2xl px-5 py-3 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
            boxShadow: "0 4px 20px rgba(14,165,233,0.25)",
          }}
        >
          <span className="text-sky-200 text-xs">🔒</span>
          <p className="text-sky-100 text-xs font-medium">
            Files processed securely · Never stored · Your privacy matters
          </p>
        </div>
      </div>
    </main>
  );
}
