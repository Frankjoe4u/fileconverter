"use client";

import { ConversionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ConversionStatus;
  message: string;
}

const STATUS_STYLES = {
  idle: {
    bg: "bg-sky-50",
    border: "border-sky-100",
    text: "text-sky-400",
    dot: "bg-sky-300",
  },
  uploading: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    dot: "bg-blue-400 animate-pulse",
  },
  processing: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-600",
    dot: "bg-indigo-400 animate-pulse",
  },
  done: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-500",
    dot: "bg-red-400",
  },
};

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${styles.bg} ${styles.border} ${styles.text}`}
      style={{ boxShadow: "0 2px 8px rgba(14,165,233,0.08)" }}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
      <span>{message}</span>
    </div>
  );
}
