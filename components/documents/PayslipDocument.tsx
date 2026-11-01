"use client";

import React from "react";
import type { Employee, PayrollSettings, PayrollRun, Payslip } from "@/lib/types";
import { PdfPage } from "./DocFrame";
import { KHR, USD, monthYearKh, formatDate, fullNameKh, serviceLabel } from "@/lib/format";
import { dependentCount } from "@/lib/payroll/cambodia";

// ============================================================================
// ប័ណ្ណបៀវត្សរ៍ / PAY SLIP
// ----------------------------------------------------------------------------
// Two layouts, both A4 and both keeping the official-form conventions:
//   • "full"    — one slip per page, generous spacing (default export)
//   • "compact" — two slips per page (employee + office copy) with a cut guide,
//                sized to fit a 134 mm box so it can never overflow.
// ============================================================================

export interface PayslipProps {
  slip: Payslip;
  employee: Employee;
  run: PayrollRun;
  settings: PayrollSettings;
  departmentName: string;
  positionName: string;
  serial: number;
  copy?: "employee" | "file";
}

type Density = "full" | "compact";

const S = (d: Density) => ({
  base: d === "full" ? "7.6pt" : "6.3pt",
  tableFont: d === "full" ? "7.6pt" : "6.3pt",
  tablePad: d === "full" ? "1.15mm 1.8mm" : "0.62mm 1.3mm",
  rowLH: d === "full" ? 1.55 : 1.4,
  titleSize: d === "full" ? "15pt" : "12pt",
  factsFont: d === "full" ? "7.6pt" : "6.2pt",
  factsPad: d === "full" ? "1.15mm 2mm" : "0.7mm 1.5mm",
  netSize: d === "full" ? "17pt" : "13.5pt",
  noteFont: d === "full" ? "6.9pt" : "5.9pt",
  sigHeight: d === "full" ? "14mm" : "7mm",
  sigFont: d === "full" ? "7.4pt" : "6.2pt",
  minRows: d === "full" ? 6 : 3,
  showFooterNote: d === "full",
  factsCols: d === "full" ? 2 : 3,
});

export function PayslipBody({
  slip, employee, run, settings, departmentName, positionName, serial, copy = "employee",
  density = "full",
}: PayslipProps & { density?: Density }) {
  const c = settings.company;
  const s = S(density);
  const netUsd = slip.netPay / (run.exchangeRate || 4100);
  const deps = dependentCount(employee.spouseDependents, employee.childDependents);

  const earnings = slip.earnings;
  const deductions = slip.deductions;
  const rows = Math.max(earnings.length, deductions.length, s.minRows);

  const facts: [string, string, string][] = [
    ["ឈ្មោះ", fullNameKh(employee), `${employee.firstNameEn} ${employee.lastNameEn}`],
    ["លេខកូដ", employee.code, `NSSF: ${employee.nssfNumber}`],
    ["មុខតំណែង", positionName, departmentName],
    ["ចូលធ្វើការ", formatDate(employee.hireDate), serviceLabel(employee.hireDate, new Date(run.payDate))],
    ["លេខសារពើពន្ធ", employee.taxNumber, employee.taxResidency === "resident" ? "អ្នកស្នាក់នៅ" : "មិនស្នាក់នៅ ២០%"],
    ["ធនាគារ", employee.bankName.replace(/\s*\(.*\)$/, ""), `${employee.bankAccount} · ក្នុងបន្ទុក ${deps}`],
  ];

  return (
    <div style={{ fontSize: s.base }}>
      {/* ============ header strip ============ */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div
            className="grid shrink-0 place-items-center rounded font-bold text-white"
            style={{
              width: density === "full" ? "11mm" : "8mm",
              height: density === "full" ? "11mm" : "8mm",
              background: "#1b2038",
              fontSize: density === "full" ? "9pt" : "7pt",
            }}
          >
            {c.logoText}
          </div>
          <div>
            <p className="font-bold" style={{ fontSize: density === "full" ? "9.4pt" : "8pt", lineHeight: 1.55 }}>
              {c.nameKh}
            </p>
            <p className="text-ink-500" style={{ fontSize: density === "full" ? "6.9pt" : "5.9pt", lineHeight: 1.5 }}>
              {c.nameEn} · VAT TIN: {c.taxId}
            </p>
            <p className="text-ink-500" style={{ fontSize: density === "full" ? "6.9pt" : "5.9pt", lineHeight: 1.5 }}>
              {c.addressKh}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right" style={{ fontSize: density === "full" ? "6.9pt" : "5.9pt", lineHeight: 1.6 }}>
          <p className="text-ink-500">
            លេខ:{" "}
            <span className="font-semibold text-ink-900">
              {run.code}-{String(serial).padStart(3, "0")}
            </span>
          </p>
          <p className="text-ink-500">បើកប្រាក់: {formatDate(run.payDate)}</p>
          <p className="text-ink-400">
            {copy === "employee" ? "ច្បាប់បុគ្គលិក · EMPLOYEE COPY" : "ច្បាប់ការិយាល័យ · OFFICE COPY"}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "0.45mm solid #1b2038", margin: "1.2mm 0 1mm" }} />

      {/* ============ title ============ */}
      <div className="text-center">
        <h1 style={{ fontSize: s.titleSize, fontWeight: 700, lineHeight: 1.7, letterSpacing: "0.01em" }}>
          ប័ណ្ណបៀវត្សរ៍
        </h1>
        <p
          className="uppercase text-ink-500"
          style={{ fontSize: density === "full" ? "6.9pt" : "5.7pt", letterSpacing: "0.12em", fontWeight: 600, lineHeight: 1.5 }}
        >
          Pay Statement / Salary Slip
        </p>
        <p style={{ fontSize: density === "full" ? "8.6pt" : "7.2pt", lineHeight: 1.7, fontWeight: 600 }}>
          ប្រចាំ{monthYearKh(run.periodMonth, run.periodYear)}
        </p>
      </div>

      {/* ============ employee facts ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${s.factsCols}, minmax(0, 1fr))`,
          border: "0.28mm solid #1b2038",
          fontSize: s.factsFont,
          lineHeight: 1.5,
          marginTop: "1.2mm",
        }}
      >
        {facts.map(([label, v1, v2], i) => (
          <div
            key={i}
            style={{
              padding: s.factsPad,
              borderRight: (i + 1) % s.factsCols === 0 ? undefined : "0.2mm solid #c8d1e6",
              borderBottom: i < facts.length - s.factsCols ? "0.2mm solid #c8d1e6" : undefined,
              display: "flex",
              gap: "1.2mm",
              alignItems: "baseline",
              minWidth: 0,
            }}
          >
            <span className="shrink-0 text-ink-500" style={{ minWidth: density === "full" ? "20mm" : "12mm" }}>
              {label}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{v1}</span>
              <span className="block truncate text-ink-400" style={{ fontSize: density === "full" ? "6.2pt" : "5.2pt" }}>
                {v2}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* ============ earnings / deductions ============ */}
      <table className="doc-table mt-1.5" style={{ fontSize: s.tableFont }}>
        <colgroup>
          <col style={{ width: "33%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "17%" }} />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={2} style={{ fontSize: density === "full" ? "7.4pt" : "6.2pt" }}>
              ប្រាក់ចំណូល · EARNINGS
            </th>
            <th colSpan={2} style={{ fontSize: density === "full" ? "7.4pt" : "6.2pt" }}>
              ការកាត់ប្រាក់ · DEDUCTIONS
            </th>
          </tr>
          <tr>
            <th style={{ background: "#f4f6fb", fontWeight: 600 }}>បរិយាយ</th>
            <th style={{ background: "#f4f6fb", fontWeight: 600 }}>ចំនួន (៛)</th>
            <th style={{ background: "#f4f6fb", fontWeight: 600 }}>បរិយាយ</th>
            <th style={{ background: "#f4f6fb", fontWeight: 600 }}>ចំនួន (៛)</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => {
            const e = earnings[i];
            const d = deductions[i];
            return (
              <tr key={i}>
                <td style={{ padding: s.tablePad, lineHeight: s.rowLH }}>{e?.labelKh ?? ""}</td>
                <td className="num" style={{ padding: s.tablePad }}>{e ? KHR(e.amount) : ""}</td>
                <td style={{ padding: s.tablePad, lineHeight: s.rowLH }}>{d?.labelKh ?? ""}</td>
                <td className="num" style={{ padding: s.tablePad }}>{d ? KHR(d.amount) : ""}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="font-bold" style={{ padding: s.tablePad }}>ប្រាក់ចំណូលសរុប (Gross)</td>
            <td className="num font-bold" style={{ padding: s.tablePad }}>{KHR(slip.gross)}</td>
            <td className="font-bold" style={{ padding: s.tablePad }}>ការកាត់សរុប (Deductions)</td>
            <td className="num font-bold" style={{ padding: s.tablePad }}>{KHR(slip.totalDeductions)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ============ net pay band ============ */}
      <div
        className="mt-1.5 flex items-center justify-between gap-3"
        style={{
          border: "0.45mm solid #1b2038",
          background: "#eef1f8",
          padding: density === "full" ? "2mm 3mm" : "1.2mm 2.2mm",
        }}
      >
        <div>
          <p style={{ fontSize: density === "full" ? "9pt" : "7.6pt", fontWeight: 700, lineHeight: 1.6 }}>
            ប្រាក់ខែទទួលបានសុទ្ធ · NET PAY
          </p>
          <p className="text-ink-500" style={{ fontSize: density === "full" ? "6.6pt" : "5.6pt", lineHeight: 1.45 }}>
            {slip.daysWorked} ថ្ងៃធ្វើការ · OT {slip.overtimeHours} ម៉ោង · អវត្តមាន {slip.unpaidLeaveDays} ថ្ងៃ
          </p>
        </div>
        <div className="text-right">
          <p className="tnum" style={{ fontSize: s.netSize, fontWeight: 700, lineHeight: 1.35 }}>
            ៛ {KHR(slip.netPay)}
          </p>
          <p className="text-ink-500 tnum" style={{ fontSize: density === "full" ? "7.2pt" : "6pt", lineHeight: 1.45 }}>
            ≈ {USD(netUsd)} · អត្រា ៛{KHR(run.exchangeRate)}/USD
          </p>
        </div>
      </div>

      {/* ============ statutory detail ============ */}
      <div className="mt-1.5 grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.5mm" }}>
        <div className="doc-note-box" style={{ fontSize: s.noteFont, lineHeight: 1.6, padding: density === "full" ? "2mm 2.5mm" : "1.2mm 1.8mm" }}>
          <p className="font-bold text-ink-900" style={{ fontSize: density === "full" ? "7.2pt" : "6.2pt" }}>
            ការគណនា ប.ស.ស · NSSF
          </p>
          <p>
            មូលដ្ឋាន ៛{KHR(slip.nssfBase)} (កម្រៃ {KHR(settings.nssfFloor)}–{KHR(settings.nssfCeiling)})
          </p>
          <p>
            បុគ្គលិក {settings.nssfEmployeeHealthRate}%+{settings.nssfEmployeePensionRate}% = <b>៛{KHR(slip.nssfEmployee)}</b>
          </p>
          <p>
            និយោជក {settings.nssfEmployerRiskRate}%+{settings.nssfEmployerHealthRate}%+{settings.nssfEmployerPensionRate}% ={" "}
            <b>៛{KHR(slip.nssfEmployer)}</b>
          </p>
        </div>
        <div className="doc-note-box" style={{ fontSize: s.noteFont, lineHeight: 1.6, padding: density === "full" ? "2mm 2.5mm" : "1.2mm 1.8mm" }}>
          <p className="font-bold text-ink-900" style={{ fontSize: density === "full" ? "7.2pt" : "6.2pt" }}>
            ការគណនាពន្ធ · TAX ON SALARY
          </p>
          <p>ប្រាក់ជាប់ពន្ធ ៛{KHR(slip.taxableGross)}</p>
          <p>
            កាត់បន្ថយ ៛{KHR(slip.nssfEmployee)} + ៛{KHR(settings.taxPersonalDeduction)} + ៛
            {KHR(deps * settings.taxDependentDeduction)}
          </p>
          <p>
            ពន្ធត្រូវបង់ <b>៛{KHR(slip.tax)}</b>
            {slip.taxableGross > 0 && ` (${((slip.tax / slip.taxableGross) * 100).toFixed(2)}%)`}
          </p>
        </div>
      </div>

      {/* ============ signatures ============ */}
      <div className="mt-2 grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "2mm" }}>
        {[
          { role: "ហត្ថលេខាបុគ្គលិក", en: "Employee's Signature", who: "" },
          { role: "អ្នករៀបចំបញ្ជី", en: "Prepared by", who: c.accountantNameKh },
          { role: c.signatoryPositionKh, en: "Approved by", who: c.signatoryNameKh },
        ].map((sg, i) => (
          <div key={i} className="doc-sign" style={{ fontSize: s.sigFont }}>
            <p className="font-bold">{sg.role}</p>
            <p className="text-ink-400" style={{ fontSize: density === "full" ? "6.2pt" : "5.2pt" }}>
              {sg.en}
            </p>
            <div style={{ height: s.sigHeight }} className="flex items-end justify-center">
              <span className="font-semibold" style={{ fontSize: density === "full" ? "7.2pt" : "6.2pt" }}>
                {sg.who}
              </span>
            </div>
            <div
              style={{ borderTop: "0.2mm dotted #6d7cb5", margin: "0 2mm", paddingTop: "0.5mm" }}
              className="text-ink-400"
            />
          </div>
        ))}
      </div>

      {s.showFooterNote && (
        <p className="mt-1 text-ink-400" style={{ fontSize: "6.2pt", lineHeight: 1.65 }}>
          ឯកសារបង្កើតដោយប្រព័ន្ធ KhmerPayroll · គណនាតាមច្បាប់ការងារ និងប្រកាសសារពើពន្ធកម្ពុជា ·
          ប.ស.ស ត្រូវបង់មុនថ្ងៃទី១៥ និងពន្ធលើបៀវត្សរ៍មុនថ្ងៃទី២០ ខែបន្ទាប់ · រក្សាទុក ១០ ឆ្នាំ។
        </p>
      )}
    </div>
  );
}

/** One payslip per A4 page — the default, generously spaced official slip. */
export function PayslipDocument(props: PayslipProps) {
  return (
    <PdfPage label={`ប័ណ្ណបៀវត្សរ៍ ${props.employee.code}`} className="!py-[14mm]">
      <PayslipBody {...props} density="full" />
    </PdfPage>
  );
}

/**
 * Two copies on one A4 sheet with a cut guide.
 * Each copy is capped at 134 mm so the sheet can never overflow the page.
 */
export function PayslipSheet(props: Omit<PayslipProps, "copy">) {
  return (
    <PdfPage label={`ប័ណ្ណបៀវត្សរ៍ ${props.employee.code}`} className="!py-[8mm]">
      <div style={{ height: "132mm", overflow: "hidden" }}>
        <PayslipBody {...props} copy="employee" density="compact" />
      </div>
      <div className="doc-cut" style={{ margin: "2.5mm 0" }} />
      <div style={{ height: "132mm", overflow: "hidden" }}>
        <PayslipBody {...props} copy="file" density="compact" />
      </div>
    </PdfPage>
  );
}
