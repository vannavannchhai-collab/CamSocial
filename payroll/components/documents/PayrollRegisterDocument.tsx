"use client";

import React from "react";
import type { Department, Employee, PayrollRun, PayrollSettings, Payslip, Position } from "@/lib/types";
import {
  PdfPage, NationalHeader, CompanyBlock, FormReference, DocTitle,
  SectionTitle, Signatures, DocFooter,
} from "./DocFrame";
import { KHR, USD, monthYearKh, monthYearEn, formatDate, toKhmerDigits } from "@/lib/format";
import { aggregate, sumCategory } from "@/lib/payroll/calc";

// ============================================================================
// បញ្ជីបៀវត្សរ៍ប្រចាំខែ · MONTHLY PAYROLL REGISTER
// Landscape A4. Multi-page with running totals and carried-forward balance.
// ============================================================================

export interface RegisterRow {
  slip: Payslip;
  employee: Employee;
  department?: Department;
  position?: Position;
}

const ROWS_PER_PAGE = 16;

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function PayrollRegisterDocument({
  rows,
  run,
  settings,
  pageCount,
}: {
  rows: RegisterRow[];
  run: PayrollRun;
  settings: PayrollSettings;
  /** total documents in the export, for the "ទំព័រ x/y" footer */
  pageCount?: number;
}) {
  const pages = chunk(rows, ROWS_PER_PAGE);
  const totals = aggregate(rows.map((r) => r.slip));

  // column widths for landscape A4 (usable ≈ 273mm)
  const cols = [
    { w: "3.2%", label: "ល.រ", en: "No." },
    { w: "6.5%", label: "កូដ", en: "Code" },
    { w: "13%", label: "ឈ្មោះបុគ្គលិក", en: "Employee name" },
    { w: "9.5%", label: "មុខតំណែង", en: "Position" },
    { w: "8.5%", label: "ប្រាក់ខែគោល", en: "Base salary" },
    { w: "8%", label: "ប្រាក់ឧបត្ថម្ភ", en: "Allowances" },
    { w: "7%", label: "OT", en: "Overtime" },
    { w: "8.8%", label: "ចំណូលសរុប", en: "Gross pay" },
    { w: "8%", label: "ប.ស.ស ៣.៣%", en: "NSSF employee" },
    { w: "8%", label: "ពន្ធ ToS", en: "Tax on salary" },
    { w: "7%", label: "កាត់ផ្សេងៗ", en: "Other deductions" },
    { w: "8.5%", label: "កាត់សរុប", en: "Total deductions" },
    { w: "9.5%", label: "ទទួលបានសុទ្ធ", en: "Net pay" },
    { w: "5.5%", label: "ហត្ថលេខា", en: "Sign" },
  ];

  return (
    <>
      {pages.map((pageRows, pageIdx) => {
        const isLast = pageIdx === pages.length - 1;
        const pageTotals = aggregate(pageRows.map((r) => r.slip));
        return (
          <PdfPage key={pageIdx} label={`បញ្ជីបៀវត្សរ៍ ទំព័រ ${pageIdx + 1}`} orientation="landscape">
            <NationalHeader compact />

            <div className="flex items-start justify-between gap-4">
              <CompanyBlock />
              <FormReference
                number={`${run.code}/REG-${String(pageIdx + 1).padStart(2, "0")}`}
                date={`ថ្ងៃទី ${formatDate(run.payDate)}`}
              />
            </div>

            <DocTitle
              titleKh="បញ្ជីបៀវត្សរ៍ប្រចាំខែ"
              titleEn="Monthly Payroll Register"
              subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
              subtitleEn={`Pay period: ${monthYearEn(run.periodMonth, run.periodYear)} · Pay date: ${formatDate(run.payDate)}`}
            />

            <div
              className="doc-grid mb-1.5"
              style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}
            >
              {[
                ["ចំនួនបុគ្គលិក", `${pageRows.length} នាក់`],
                ["ថ្ងៃធ្វើការ", `${run.workingDays} ថ្ងៃ`],
                ["អត្រាប្តូរប្រាក់", `៛${KHR(run.exchangeRate)}/USD`],
                ["ថ្ងៃបើកប្រាក់", formatDate(run.payDate)],
                ["ស្ថានភាព", run.status === "paid" ? "បានបើកប្រាក់" : run.status === "approved" ? "បានអនុម័ត" : "សេចក្តីព្រាង"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: "1.5mm", borderBottom: "none" }}>
                  <span className="doc-label shrink-0">{k}:</span>
                  <span className="doc-value truncate">{v}</span>
                </div>
              ))}
            </div>

            <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed" }}>
              <colgroup>
                {cols.map((c, i) => (
                  <col key={i} style={{ width: c.w }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {cols.map((c, i) => (
                    <th key={i} style={{ padding: "0.8mm 0.6mm" }}>
                      <div style={{ fontSize: "6.2pt", lineHeight: 1.5 }}>{c.label}</div>
                      <div style={{ fontSize: "5.2pt", fontWeight: 400, lineHeight: 1.4, color: "#4e5d9c" }}>
                        {c.en}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ slip, employee, position, department }, i) => {
                  const serial = pageIdx * ROWS_PER_PAGE + i + 1;
                  const base = slip.earnings.find((e) => e.category === "base")?.amount ?? 0;
                  const allowances = slip.earnings
                    .filter((e) => e.category === "allowance")
                    .reduce((a, e) => a + e.amount, 0);
                  const ot = slip.earnings
                    .filter((e) => e.category === "overtime")
                    .reduce((a, e) => a + e.amount, 0);
                  const otherDed = slip.deductions
                    .filter((d) => !["nssf", "tax"].includes(d.category))
                    .reduce((a, d) => a + d.amount, 0);
                  return (
                    <tr key={slip.id}>
                      <td className="center">{toKhmerDigits(serial)}</td>
                      <td className="center" style={{ fontSize: "5.8pt" }}>{employee.code}</td>
                      <td style={{ fontSize: "6.2pt", lineHeight: 1.4 }}>
                        <div className="font-semibold">{employee.lastNameKh} {employee.firstNameKh}</div>
                        <div style={{ fontSize: "5pt", color: "#6d7cb5" }}>
                          {employee.lastNameEn} {employee.firstNameEn}
                        </div>
                      </td>
                      <td style={{ fontSize: "5.6pt", lineHeight: 1.35 }}>
                        <div>{position?.nameKh ?? "—"}</div>
                        <div style={{ fontSize: "4.8pt", color: "#6d7cb5" }}>{department?.code}</div>
                      </td>
                      <td className="num">{KHR(base)}</td>
                      <td className="num">{KHR(allowances)}</td>
                      <td className="num">{KHR(ot)}</td>
                      <td className="num font-semibold">{KHR(slip.gross)}</td>
                      <td className="num">{KHR(slip.nssfEmployee)}</td>
                      <td className="num">{KHR(slip.tax)}</td>
                      <td className="num">{KHR(otherDed)}</td>
                      <td className="num">{KHR(slip.totalDeductions)}</td>
                      <td className="num font-bold">{KHR(slip.netPay)}</td>
                      <td />
                    </tr>
                  );
                })}
                {/* filler rows keep the grid rectangular on the last page */}
                {Array.from({ length: Math.max(0, ROWS_PER_PAGE - pageRows.length) }).map((_, i) => (
                  <tr key={`f${i}`} style={{ height: "6.4mm" }}>
                    {cols.map((_, j) => (
                      <td key={j} />
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="font-bold center">
                    សរុបទំព័រនេះ ({pageRows.length} នាក់)
                  </td>
                  <td className="num">{KHR(pageTotals.gross - pageTotals.tax - pageTotals.nssfEmployee - pageTotals.otherDeductions)}</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num font-bold">{KHR(pageTotals.gross)}</td>
                  <td className="num">{KHR(pageTotals.nssfEmployee)}</td>
                  <td className="num">{KHR(pageTotals.tax)}</td>
                  <td className="num">{KHR(pageTotals.otherDeductions)}</td>
                  <td className="num">{KHR(pageTotals.totalDeductions)}</td>
                  <td className="num font-bold">{KHR(pageTotals.netPay)}</td>
                  <td />
                </tr>
                {isLast && pages.length > 1 && (
                  <tr style={{ background: "#eef1f8" }}>
                    <td colSpan={7} className="font-bold center">
                      សរុបរួមទាំងអស់ ({rows.length} នាក់)
                    </td>
                    <td className="num font-bold">{KHR(totals.gross)}</td>
                    <td className="num font-bold">{KHR(totals.nssfEmployee)}</td>
                    <td className="num font-bold">{KHR(totals.tax)}</td>
                    <td className="num font-bold">{KHR(totals.otherDeductions)}</td>
                    <td className="num font-bold">{KHR(totals.totalDeductions)}</td>
                    <td className="num font-bold">{KHR(totals.netPay)}</td>
                    <td />
                  </tr>
                )}
              </tfoot>
            </table>

            {isLast && (
              <>
                <SectionTitle en="PAYROLL SUMMARY BY STATUTORY ITEM">សេចក្តីសង្ខេបសម្រាប់ការបង់ពន្ធ និង ប.ស.ស</SectionTitle>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "2mm" }}>
                  <table className="doc-table doc-table--dense">
                    <tbody>
                      {[
                        ["ប្រាក់ខែគោលសរុប", sumCategory(rows.map((r) => r.slip), "base", "earning")],
                        ["ប្រាក់ឧបត្ថម្ភសរុប", sumCategory(rows.map((r) => r.slip), "allowance", "earning")],
                        ["ប្រាក់ថែមម៉ោងសរុប", sumCategory(rows.map((r) => r.slip), "overtime", "earning")],
                        ["ប្រាក់រង្វាន់ / ផ្សេងៗ", sumCategory(rows.map((r) => r.slip), "bonus", "earning")],
                      ].map(([k, v]) => (
                        <tr key={k as string}>
                          <td>{k as string}</td>
                          <td className="num">{KHR(v as number)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#eef1f8" }}>
                        <td className="font-bold">ប្រាក់ចំណូលសរុប (GROSS)</td>
                        <td className="num font-bold">{KHR(totals.gross)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="doc-table doc-table--dense">
                    <tbody>
                      {[
                        ["ប.ស.ស បុគ្គលិក (ភាគបុគ្គលិក)", totals.nssfEmployee],
                        ["ប.ស.ស និយោជក (ភាគក្រុមហ៊ុន)", totals.nssfEmployer],
                        ["ពន្ធលើបៀវត្សរ៍ (ToS)", totals.tax],
                        ["ការកាត់ផ្សេងៗ (សហជីព/បុរេប្រទាន)", totals.otherDeductions],
                      ].map(([k, v]) => (
                        <tr key={k as string}>
                          <td>{k as string}</td>
                          <td className="num">{KHR(v as number)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#eef1f8" }}>
                        <td className="font-bold">ប្រាក់ខែទទួលបានសរុប (NET)</td>
                        <td className="num font-bold">{KHR(totals.netPay)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-1 doc-note-box">
                  <b>ចំណាំ:</b> បញ្ជីនេះរៀបចំឡើងស្របតាមច្បាប់ស្តីពីការងារ និងប្រកាសស្តីពីពន្ធលើបៀវត្សរ៍របស់អគ្គនាយកដ្ឋានពន្ធដារ។
                  ភាគទាន ប.ស.ស គណនាលើមូលដ្ឋានអប្បបរមា ៛{KHR(settings.nssfFloor)} និងអតិបរមា ៛{KHR(settings.nssfCeiling)}
                  ក្នុងអត្រា បុគ្គលិក {(settings.nssfEmployeeHealthRate + settings.nssfEmployeePensionRate).toFixed(1)}%
                  និងនិយោជក {(settings.nssfEmployerRiskRate + settings.nssfEmployerHealthRate + settings.nssfEmployerPensionRate).toFixed(1)}%។
                  {" "}ប្រាក់ខែទទួលបានសរុប ≈ {USD(totals.netPayUsd)} តាមអត្រា ៛{KHR(run.exchangeRate)}/USD។
                </div>

                <Signatures blocks={3} />
              </>
            )}

            <DocFooter
              docCode={`${run.code}/REG`}
              page={pageIdx + 1}
              total={pageCount ?? pages.length}
              note={
                pageIdx === 0
                  ? "បញ្ជីនេះជាឯកសារគណនេយ្យផ្លូវការ — ត្រូវចុះហត្ថលេខា និងបោះត្រាដោយអ្នកមានសិទ្ធិ។"
                  : undefined
              }
            />
          </PdfPage>
        );
      })}
    </>
  );
}
