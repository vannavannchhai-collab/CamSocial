"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { monthYearKh, toKhmerDigits, formatDateKh } from "@/lib/format";
import { cn } from "@/lib/cn";

// ============================================================================
// Official Cambodian document chrome
// ----------------------------------------------------------------------------
// Every exported form follows the same print convention used by Cambodian
// ministries and the GDT:
//   1. National header (ព្រះរាជាណាចក្រកម្ពុជា / ជាតិ សាសនា ព្រះមហាក្សត្រ)
//   2. Company block on the left, form reference on the right
//   3. Centred bilingual title
//   4. Bordered body table(s)
//   5. Signature row (prepared / checked / approved)
//   6. Footer with document control line
// ============================================================================

export function NationalHeader({ compact }: { compact?: boolean }) {
  const { settings } = useStore();
  return (
    <div className="mb-2">
      <div className="text-center doc-tiny" style={{ letterSpacing: "0.03em" }}>
        ព្រះរាជាណាចក្រកម្ពុជា
      </div>
      <div
        className="text-center font-bold"
        style={{ fontSize: compact ? "7.4pt" : "8pt", letterSpacing: "0.16em", lineHeight: 1.9 }}
      >
        ជាតិ សាសនា ព្រះមហាក្សត្រ
      </div>
      <div className="mx-auto mt-1" style={{ width: compact ? "26mm" : "34mm" }}>
        <div style={{ borderTop: "0.35mm solid #1b2038" }} />
        <div style={{ borderTop: "0.15mm solid #1b2038", marginTop: "0.7mm" }} />
      </div>
    </div>
  );
}

export function CompanyBlock({ align = "left" }: { align?: "left" | "right" }) {
  const { settings } = useStore();
  const c = settings.company;
  return (
    <div className={cn("doc-small", align === "right" && "text-right")}>
      <p className="font-bold" style={{ fontSize: "8.4pt" }}>
        {c.nameKh}
      </p>
      <p className="text-ink-500">{c.nameEn}</p>
      <p className="text-ink-500">អត្តសញ្ញាណសារពើពន្ធ (VAT TIN): {c.taxId}</p>
      <p className="text-ink-500">លេខ ប.ស.ស និយោជក: {c.nssfEmployerNumber}</p>
    </div>
  );
}

export function FormReference({
  number,
  date,
  label = "លេខ",
}: {
  number: string;
  date?: string;
  label?: string;
}) {
  return (
    <div className="doc-small text-right">
      <p>
        {label}: <span className="font-semibold">{number}</span>
      </p>
      {date && <p className="text-ink-500">{date}</p>}
    </div>
  );
}

export function DocTitle({
  titleKh,
  titleEn,
  subtitleKh,
  subtitleEn,
}: {
  titleKh: string;
  titleEn?: string;
  subtitleKh?: string;
  subtitleEn?: string;
}) {
  return (
    <div className="mt-2 mb-2.5">
      <h1 className="doc-title">{titleKh}</h1>
      {titleEn && (
        <p
          className="text-center font-semibold uppercase text-ink-500"
          style={{ fontSize: "7.4pt", letterSpacing: "0.08em", lineHeight: 1.7 }}
        >
          {titleEn}
        </p>
      )}
      {subtitleKh && <p className="doc-subtitle mt-1">{subtitleKh}</p>}
      {subtitleEn && (
        <p className="text-center text-ink-500" style={{ fontSize: "7.6pt", lineHeight: 1.7 }}>
          {subtitleEn}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({
  children,
  en,
  letter,
}: {
  children: React.ReactNode;
  en?: string;
  letter?: string;
}) {
  return (
    <div className="doc-section-title mt-2.5 flex items-center justify-between gap-2">
      <span>
        {letter && <span className="mr-1.5">{letter}.</span>}
        {children}
      </span>
      {en && <span className="text-ink-500 font-normal" style={{ fontSize: "7pt" }}>{en}</span>}
    </div>
  );
}

/** Label / value info grid used for employee and company facts. */
export function InfoGrid({
  rows,
  cols = 2,
}: {
  rows: { label: string; value: React.ReactNode; span?: number }[];
  cols?: number;
}) {
  return (
    <div
      className="doc-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            gridColumn: r.span ? `span ${r.span}` : undefined,
            display: "flex",
            gap: "2mm",
            alignItems: "baseline",
          }}
        >
          <span className="doc-label shrink-0" style={{ minWidth: "22mm" }}>
            {r.label}:
          </span>
          <span className="doc-value min-w-0 flex-1">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Signatures({
  blocks = 3,
  custom,
}: {
  blocks?: 2 | 3 | 4;
  custom?: { role: string; roleEn?: string; name: string; date?: string }[];
}) {
  const { settings } = useStore();
  const c = settings.company;
  const defaults = [
    { role: "អ្នករៀបចំបញ្ជី", roleEn: "Prepared by", name: c.accountantNameKh },
    { role: "អ្នកត្រួតពិនិត្យ", roleEn: "Checked by", name: "" },
    { role: c.signatoryPositionKh, roleEn: "Approved by", name: c.signatoryNameKh },
    { role: "គណនេយ្យករទូទៅ", roleEn: "Chief Accountant", name: "" },
  ];
  const list = custom ?? defaults.slice(0, blocks);

  return (
    <div
      className="mt-3.5 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}
    >
      {list.map((s, i) => (
        <div key={i} className="doc-sign">
          <p className="role">{s.role}</p>
          {s.roleEn && (
            <p className="text-ink-400" style={{ fontSize: "6.4pt" }}>
              {s.roleEn}
            </p>
          )}
          <p className="text-ink-500" style={{ fontSize: "7pt" }}>
            ថ្ងៃទី........ ខែ........ ឆ្នាំ........
          </p>
          <div className="who">{s.name || ""}</div>
          <div className="line doc-tiny text-ink-400">ហត្ថលេខា និងត្រា</div>
        </div>
      ))}
    </div>
  );
}

export function DocFooter({
  note,
  page,
  total,
  docCode,
}: {
  note?: string;
  page?: number;
  total?: number;
  docCode?: string;
}) {
  const { settings } = useStore();
  return (
    <div className="mt-3 border-t border-ink-300 pt-1.5">
      {note && <p className="doc-tiny text-ink-500 mb-1">{note}</p>}
      <div className="flex items-end justify-between gap-3 doc-tiny text-ink-400">
        <span className="max-w-[110mm] leading-snug">
          {settings.company.nameKh} · {settings.company.phone} · {settings.company.email}
        </span>
        <span className="shrink-0 text-right">
          {docCode && <span className="mr-2">{docCode}</span>}
          {page !== undefined && total !== undefined && (
            <span>
              ទំព័រ {toKhmerDigits(page)}/{toKhmerDigits(total)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/** A4 page wrapper. One `.pdf-page` = exactly one PDF page. */
export function PdfPage({
  children,
  label,
  watermark,
  plain,
  className,
  orientation = "portrait",
}: {
  children: React.ReactNode;
  label?: string;
  watermark?: string;
  plain?: boolean;
  className?: string;
  /** Landscape pages are 297×210 mm and must match the PDF export matrix. */
  orientation?: "portrait" | "landscape";
}) {
  return (
    <div
      className={cn(
        "pdf-page paper-shadow relative mx-auto",
        orientation === "landscape" && "pdf-page--landscape",
        plain && "pdf-page--plain",
        className
      )}
      data-label={label}
    >
      {watermark && (
        <div className="doc-watermark">
          <span>{watermark}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/** Utility: format a KHR amount with thousands separators for forms. */
export const amt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

/** Blank line helper for handwritten fields. */
export const dots = (n = 12) => ".".repeat(n);

export function periodLabels(month: number, year: number) {
  return {
    kh: monthYearKh(month, year),
    en: `${year}-${String(month).padStart(2, "0")}`,
    dateKh: formatDateKh(`${year}-${String(month).padStart(2, "0")}-01`),
  };
}
