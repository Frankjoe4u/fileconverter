"use client";

import { useCallback, useRef, useState } from "react";
import { ConversionOption } from "@/lib/types";

interface DropZoneProps {
  option: ConversionOption;
  files: File[];
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ option, files, onFiles, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptString = Object.keys(option.accept).join(",");
  const acceptLabel = Object.values(option.accept).flat().join(", ");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const dropped = Array.from(e.dataTransfer.files);
      onFiles(dropped);
    },
    [disabled, onFiles],
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onFiles(Array.from(e.target.files));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-sky-300"}
        ${dragging ? "scale-[1.01]" : ""}
        ${files.length > 0 ? "py-5 px-6" : "py-10 px-6"}
      `}
      style={{
        borderColor: dragging ? option.color : "#bae6fd",
        backgroundColor: dragging ? `${option.color}12` : "#f0f9ff",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={option.multiple}
        accept={acceptString}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">{option.icon}</span>
          <div>
            <p className="text-sky-800 font-semibold text-[15px]">
              Drop {option.multiple ? "files" : "a file"} here
            </p>
            <p className="text-sky-400 text-xs mt-1">
              or click to browse · {acceptLabel}
            </p>
          </div>
          {option.multiple && (
            <span className="text-[11px] text-sky-400 bg-sky-100 px-3 py-1 rounded-full">
              Multiple files supported
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2"
            >
              <span className="text-lg">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sky-900 text-sm font-medium truncate">
                  {f.name}
                </p>
                <p className="text-sky-400 text-xs">{formatSize(f.size)}</p>
              </div>
            </div>
          ))}
          <p className="text-sky-300 text-xs text-center mt-1">
            Click to change {option.multiple ? "files" : "file"}
          </p>
        </div>
      )}
    </div>
  );
}
