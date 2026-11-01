"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, FileDown, Printer, Loader2, Check, ZoomIn,
  ZoomOut, Maximize2, Sheet, Info, X, FileSpreadsheet,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { exportPagesToPdf, printDocument } from "@/lib/pdf/export";
import { cn } from "@/lib/cn";

export interface ToolbarAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

// Sticky dock shown above a document preview.
export function DocumentToolbar({
  title,
  subtitle,
  filename,
  docCode,
  orientation = "portrait",
  backHref = "/forms",
  extraActions = [],
  onCsv,
  scale = 2.2,
  pageCount,
  note,
  printMode,
}: {
  title: string;
  subtitle?: string;
  filename: string;
  docCode?: string;
  orientation?: "portrait" | "landscape";
  backHref?: string;
  extraActions?: ToolbarAction[];
  onCsv?: () => void;
  scale?: number;
  pageCount?: number;
  note?: string;
  /** Hide on-screen-only controls that must not appear in the browser print output. */
  printMode?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const handlePdf = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setDone(false);
    setProgress({ done: 0, total: pageCount ?? 1 });
    try {
      await exportPagesToPdf({
        filename,
        scale,
        orientation,
        title,
        subject: docCode,
        onProgress: (d, t) => setProgress({ done: d, total: t }),
      });
      setDone(true);
      setTimeout(() => setDone(false), 2600);
      // let the wrapper apply zoom reset for the capture
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [filename, scale, orientation, title, docCode, pageCount]);

  const setStageZoom = (z: number) => {
    setZoom(z);
    const stage = document.getElementById("paper-stage");
    if (stage) {
      stage.style.setProperty("--stage-zoom", String(z));
    }
  };

  return (
    <div className="no-print sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => router.push(backHref)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-500 ring-1 ring-ink-200 hover:bg-ink-50"
          title="ត្រឡប់ក្រោយ"
        >
          <ArrowLeft size={15} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[13px] font-bold text-ink-900">{title}</h2>
            {docCode && (
              <Badge tone="neutral" className="hidden shrink-0 sm:inline-flex">
                {docCode}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="truncate text-[10px] text-ink-400">{subtitle}</p>
          )}
        </div>

        {/* zoom */}
        <div className="hidden items-center gap-0.5 rounded-lg bg-ink-50 p-0.5 ring-1 ring-ink-200 md:flex">
          <button
            onClick={() => setStageZoom(Math.max(0.5, zoom - 0.1))}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-white"
            title="បង្រួម"
          >
            <ZoomOut size={13} />
          </button>
          <span className="w-9 text-center text-[10px] font-semibold text-ink-600 tnum">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setStageZoom(Math.min(1.6, zoom + 0.1))}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-white"
            title="ពង្រីក"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setStageZoom(1)}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-white"
            title="ទំហំដើម"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        <div className="no-print flex items-center gap-2">
          {extraActions.map((a, i) => (
            <Button key={i} size="sm" variant="outline" onClick={a.onClick}>
              {a.icon}
              <span className="hidden sm:inline">{a.label}</span>
            </Button>
          ))}
          {onCsv && (
            <Button size="sm" variant="outline" onClick={onCsv} title="នាំចេញ Excel/CSV">
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => printDocument(title)}>
            <Printer size={14} />
            <span className="hidden sm:inline">បោះពុម្ព</span>
          </Button>
          <Button size="sm" onClick={handlePdf} loading={busy} disabled={busy}>
            {done ? <Check size={14} /> : <FileDown size={14} />}
            <span>{busy ? "កំពុងបង្កើត…" : done ? "រួចរាល់" : "នាំចេញ PDF"}</span>
          </Button>
        </div>
      </div>

      {/* progress strip */}
      {progress && (
        <div className="border-t border-ink-100 bg-ink-50 px-4 py-1.5">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3">
            <Loader2 size={12} className="animate-spin text-ink-500" />
            <span className="text-[10px] font-medium text-ink-600">
              កំពុងបង្កើតទំព័រ {progress.done}/{progress.total} …
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-200">
              <div
                className="h-full rounded-full bg-ink-700 transition-all duration-300"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* hint / error strip */}
      {(note || err) && (
        <div
          className={cn(
            "border-t px-4 py-1.5 text-[10px]",
            err
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-ink-100 bg-white text-ink-500"
          )}
        >
          <div className="mx-auto flex max-w-[1400px] items-start gap-2">
            {err ? <X size={12} className="mt-0.5 shrink-0" /> : <Info size={12} className="mt-0.5 shrink-0" />}
            <span className="leading-relaxed">
              {err ?? note}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Screen wrapper that scales the A4 stack for smaller viewports. */
export function PaperStage({
  children,
  orientation = "portrait",
}: {
  children: React.ReactNode;
  orientation?: "portrait" | "landscape";
}) {
  return (
    <div className="paper-stage min-h-screen py-6">
      <div
        id="paper-stage"
        className="mx-auto flex flex-col items-center gap-5 px-3"
        style={{ ["--stage-zoom" as any]: 1 }}
      >
        <style jsx global>{`
          @media (max-width: 1100px) {
            #paper-stage > * {
              transform: scale(var(--stage-zoom, 1));
              transform-origin: top center;
            }
          }
          #paper-stage {
            --stage-zoom: 1;
          }
          #paper-stage > * {
            transform: scale(var(--stage-zoom, 1));
            transform-origin: top center;
          }
        `}</style>
        {children}
      </div>
    </div>
  );
}
