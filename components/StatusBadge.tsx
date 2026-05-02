"use client";

import { ConversionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ConversionStatus;
  message: string;
}

const STATUS_STYLES: Record<
  ConversionStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  idle: {
    bg: "bg-white/5",
    border: "border-white/10",
    text: "text-white/50",
    dot: "bg-white/30",
  },
  uploading: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-300",
    dot: "bg-blue-400 animate-pulse",
  },
  processing: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-300",
    dot: "bg-indigo-400 animate-pulse",
  },
  done: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-300",
    dot: "bg-red-400",
  },
};

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={`
        flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm
        ${styles.bg} ${styles.border} ${styles.text}
      `}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
      <span>{message}</span>
    </div>
  );
}
