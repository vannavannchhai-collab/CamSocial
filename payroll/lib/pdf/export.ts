"use client";

// ============================================================================
// PDF export engine
// ----------------------------------------------------------------------------
// Khmer script requires complex text shaping (coeng reordering, ligatures,
// stacked vowels). Client-side PDF writer libraries (jsPDF/pdf-lib) do not
// shape Khmer, so embedded-font PDFs render as broken glyph clusters.
//
// To guarantee the *standard printed form* looks exactly like the on-screen
// official document — and identical in Microsoft Word / Acrobat — every page
// is laid out in real HTML with the Kantumruy Pro + Noto Sans Khmer stacks,
// rasterised at high DPI by html2canvas and placed 1:1 onto an A4 page.
//
// Each `.pdf-page` element becomes exactly one PDF page, so table rows can
// never be split across a page break by accident.
// ============================================================================

export interface PdfExportOptions {
  /** CSS selector scope that contains .pdf-page elements (default: body) */
  root?: HTMLElement | null;
  filename: string;
  /** 2–4 is a good range; 3 ≈ 288 DPI and stays readable when zoomed. */
  scale?: number;
  orientation?: "portrait" | "landscape";
  title?: string;
  subject?: string;
  onProgress?: (done: number, total: number, label?: string) => void;
}

export const PAGE_MM = {
  portrait: { w: 210, h: 297 },
  landscape: { w: 297, h: 210 },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureFonts() {
  try {
    // Block until every Khmer face used by the document is ready, otherwise
    // html2canvas snapshots fallback glyphs (missing subscripts/ligatures).
    const faces = [
      "400 16px 'Kantumruy Pro'",
      "500 16px 'Kantumruy Pro'",
      "600 16px 'Kantumruy Pro'",
      "700 16px 'Kantumruy Pro'",
      "400 16px 'Noto Sans Khmer'",
      "700 16px 'Noto Sans Khmer'",
    ];
    await Promise.all(faces.map((f) => (document as any).fonts?.load(f).catch(() => null)));
    await (document as any).fonts?.ready;
  } catch {
    /* older browsers */
  }
}

/**
 * Render every `.pdf-page` inside `root` into a multi-page A4 PDF.
 * Returns the number of pages produced.
 */
export async function exportPagesToPdf(opts: PdfExportOptions): Promise<number> {
  const {
    root = document.body,
    filename,
    scale = 3,
    orientation = "portrait",
    title,
    subject,
    onProgress,
  } = opts;

  const pages = Array.from(
    (root ?? document.body).querySelectorAll<HTMLElement>(".pdf-page")
  ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

  if (!pages.length) {
    throw new Error("មិនមានទំព័រសម្រាប់នាំចេញទេ (no .pdf-page found)");
  }

  await ensureFonts();
  // Reset any on-screen zoom so the capture is pixel-exact 1:1 A4.
  const stage = document.getElementById("paper-stage") as HTMLElement | null;
  const prevZoom = stage?.style.getPropertyValue("--stage-zoom") ?? "";
  if (stage) stage.style.setProperty("--stage-zoom", "1");
  await wait(160);

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const size = PAGE_MM[orientation];
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pdf.setProperties({
    title: title ?? filename.replace(/\.pdf$/i, ""),
    subject: subject ?? "KhmerPayroll — Standard Payroll Form",
    creator: "KhmerPayroll",
    author: "KhmerPayroll",
  });

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    onProgress?.(i, pages.length, el.dataset.label);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(el, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: el.offsetWidth,
        height: el.offsetHeight,
        windowWidth: Math.max(document.documentElement.clientWidth, el.offsetWidth),
        scrollX: 0,
        scrollY: 0,
      });
    } catch (e) {
      throw new Error(
        `បរាជ័យក្នុងការរៀបចំទំព័រទី ${i + 1}: ${(e as Error).message}`
      );
    }

    if (i > 0) pdf.addPage("a4", orientation);
    const img = canvas.toDataURL("image/jpeg", 0.94);

    // Fit to the printable A4 area preserving the 210×297 ratio.
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const elW = pxToMm(el.offsetWidth);
    const elH = pxToMm(el.offsetHeight);

    let drawW = size.w;
    let drawH = (elH / elW) * size.w;
    if (drawH > size.h) {
      drawH = size.h;
      drawW = (elW / elH) * size.h;
    }
    const offsetX = (size.w - drawW) / 2;
    const offsetY = (size.h - drawH) / 2;

    pdf.addImage(img, "JPEG", offsetX, offsetY, drawW, drawH, undefined, "FAST");

    // yield to the UI so the progress bar paints
    await wait(0);
  }

  if (stage) {
    if (prevZoom) stage.style.setProperty("--stage-zoom", prevZoom);
    else stage.style.removeProperty("--stage-zoom");
  }

  onProgress?.(pages.length, pages.length);
  pdf.save(filename);
  return pages.length;
}

/** Trigger the browser print dialog (vector "Save as PDF", perfect Khmer). */
export function printDocument(title?: string) {
  const prev = document.title;
  if (title) document.title = title;
  window.print();
  setTimeout(() => {
    document.title = prev;
  }, 1500);
}

/** CSV export helper (Excel-compatible with BOM for Khmer text). */
export function exportCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function exportJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
