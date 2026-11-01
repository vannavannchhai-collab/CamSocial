"use client";

import React from "react";
import type { Employee, PayrollRun, PayrollSettings, Payslip } from "@/lib/types";
import {
  PdfPage, NationalHeader, CompanyBlock, FormReference, DocTitle,
  SectionTitle, Signatures, DocFooter,
} from "./DocFrame";
import { KHR, USD, monthYearKh, monthYearEn, formatDate, toKhmerDigits } from "@/lib/format";
import { aggregate, sumCategory } from "@/lib/payroll/calc";
import { calculateNssf, dependentCount, TAX_BRACKETS } from "@/lib/payroll/cambodia";
import { chunk } from "./PayrollRegisterDocument";

export interface DocRow {
  slip: Payslip;
  employee: Employee;
}

export type ReportRow = DocRow;

// ============================================================================
// ១. ទម្រង់បណ្តាយការបង់ភាគទាន ប.ស.ស · NSSF MONTHLY CONTRIBUTION DECLARATION
// ============================================================================

export function NssfDeclarationDocument({
  rows, run, settings, pageCount,
}: {
  rows: DocRow[]; run: PayrollRun; settings: PayrollSettings; pageCount?: number;
}) {
  const perPage = 18;
  const pages = chunk(rows, perPage);
  const totals = aggregate(rows.map((r) => r.slip));

  const cols = [
    { w: "3.5%", label: "ល.រ" },
    { w: "10%", label: "លេខ ប.ស.ស" },
    { w: "16%", label: "គោត្តនាម-នាម" },
    { w: "5%", label: "ភេទ" },
    { w: "8%", label: "ថ្ងៃខែកើត" },
    { w: "10%", label: "មូលដ្ឋានគិត (៛)" },
    { w: "10%", label: "សុខាភិបាល\nបុគ្គលិក" },
    { w: "10%", label: "សុខាភិបាល\nនិយោជក" },
    { w: "10%", label: "ប៉ង់ស្យ៊ុង\nបុគ្គលិក" },
    { w: "10%", label: "ប៉ង់ស្យ៊ុង\nនិយោជក" },
    { w: "8.5%", label: "ហានិភ័យ\nការងារ" },
    { w: "9%", label: "សរុប" },
  ];

  return (
    <>
      {pages.map((pageRows, pageIdx) => {
        const isLast = pageIdx === pages.length - 1;
        return (
          <PdfPage key={pageIdx} label={`ទម្រង់ ប.ស.ស ទំព័រ ${pageIdx + 1}`}>
            <NationalHeader compact />
            <div className="flex items-start justify-between gap-4">
              <CompanyBlock />
              <div className="text-right doc-small">
                <p className="font-bold">លេខ ប.ស.ស និយោជក</p>
                <p className="font-semibold">{settings.company.nssfEmployerNumber}</p>
                <p className="text-ink-500 mt-1">លេខ: NSSF/{run.periodYear}/{String(run.periodMonth).padStart(2, "0")}</p>
              </div>
            </div>

            <DocTitle
              titleKh="ទម្រង់បណ្តាយការបង់ភាគទានបេឡាជាតិសន្តិសុខសង្គម"
              titleEn="National Social Security Fund — Monthly Contribution Declaration"
              subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
              subtitleEn={`${monthYearEn(run.periodMonth, run.periodYear)} · Contribution to be paid by the 15th of the following month`}
            />

            <div className="doc-grid mb-1.5" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
              {[
                ["ឈ្មោះសហគ្រាស", settings.company.nameKh],
                ["អត្តសញ្ញាណសារពើពន្ធ", settings.company.taxId],
                ["ចំនួនកម្មករ-និយោជិត", `${rows.length} នាក់`],
                ["ស្ថានភាព", "គណនាតាមមូលដ្ឋានកម្រៃ"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: "1.5mm" }}>
                  <span className="doc-label shrink-0">{k}:</span>
                  <span className="doc-value truncate">{v}</span>
                </div>
              ))}
            </div>

            <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed" }}>
              <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
              <thead>
                <tr>
                  {cols.map((c, i) => (
                    <th key={i} style={{ padding: "0.8mm 0.4mm", fontSize: "5.8pt", whiteSpace: "pre-line" }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ slip, employee }, i) => {
                  const nssf = calculateNssf(slip.nssfBase, settings, { isMember: employee.isNssfMember });
                  return (
                    <tr key={slip.id}>
                      <td className="center">{toKhmerDigits(pageIdx * perPage + i + 1)}</td>
                      <td className="center" style={{ fontSize: "5.6pt" }}>{employee.nssfNumber}</td>
                      <td style={{ fontSize: "6pt" }}>{employee.lastNameKh} {employee.firstNameKh}</td>
                      <td className="center">{employee.gender === "female" ? "ស" : "ប"}</td>
                      <td className="center" style={{ fontSize: "5.6pt" }}>{formatDate(employee.dob)}</td>
                      <td className="num">{KHR(nssf.contributableWage)}</td>
                      <td className="num">{KHR(nssf.employeeHealth)}</td>
                      <td className="num">{KHR(nssf.employerHealth)}</td>
                      <td className="num">{KHR(nssf.employeePension)}</td>
                      <td className="num">{KHR(nssf.employerPension)}</td>
                      <td className="num">{KHR(nssf.employerRisk)}</td>
                      <td className="num font-semibold">{KHR(nssf.total)}</td>
                    </tr>
                  );
                })}
                {Array.from({ length: Math.max(0, perPage - pageRows.length) }).map((_, i) => (
                  <tr key={`f${i}`} style={{ height: "5.6mm" }}>
                    {cols.map((_, j) => <td key={j} />)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="center font-bold">សរុប</td>
                  <td className="num">{KHR(pageRows.reduce((s, r) => s + r.slip.nssfBase, 0))}</td>
                  <td className="num" colSpan={5} style={{ textAlign: "center" }}>
                    {KHR(pageRows.reduce((s, r) => s + r.slip.nssfEmployee + r.slip.nssfEmployer, 0))}
                  </td>
                  <td className="num font-bold">
                    {KHR(pageRows.reduce((s, r) => s + r.slip.nssfEmployee + r.slip.nssfEmployer, 0))}
                  </td>
                </tr>
                {isLast && (
                  <tr style={{ background: "#eef1f8" }}>
                    <td colSpan={5} className="center font-bold">សរុបរួម ({rows.length} នាក់)</td>
                    <td className="num font-bold">{KHR(rows.reduce((s, r) => s + r.slip.nssfBase, 0))}</td>
                    <td colSpan={6} className="center font-bold">
                      បុគ្គលិក ៛{KHR(totals.nssfEmployee)} · និយោជក ៛{KHR(totals.nssfEmployer)}
                    </td>
                    <td className="num font-bold">{KHR(totals.nssfTotal)}</td>
                  </tr>
                )}
              </tfoot>
            </table>

            {isLast && (
              <>
                <div className="mt-1.5 grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "2mm" }}>
                  <table className="doc-table doc-table--dense">
                    <tbody>
                      <tr><td>អត្រាភាគទានបុគ្គលិក</td><td className="num">{(settings.nssfEmployeeHealthRate + settings.nssfEmployeePensionRate).toFixed(1)}%</td></tr>
                      <tr><td>អត្រាភាគទាននិយោជក (សុខាភិបាល+ប៉ង់ស្យ៊ុង)</td><td className="num">{(settings.nssfEmployerHealthRate + settings.nssfEmployerPensionRate).toFixed(1)}%</td></tr>
                      <tr><td>អត្រាហានិភ័យការងារ (និយោជក)</td><td className="num">{settings.nssfEmployerRiskRate.toFixed(1)}%</td></tr>
                      <tr><td>មូលដ្ឋានគិតអប្បបរមា / អតិបរមា</td><td className="num">៛{KHR(settings.nssfFloor)} / ៛{KHR(settings.nssfCeiling)}</td></tr>
                    </tbody>
                  </table>
                  <table className="doc-table doc-table--dense">
                    <tbody>
                      <tr><td>ភាគទានសុខាភិបាល បុគ្គលិក</td><td className="num">៛{KHR(rows.reduce((s, r) => s + calculateNssf(r.slip.nssfBase, settings).employeeHealth, 0))}</td></tr>
                      <tr><td>ភាគទានប៉ង់ស្យ៊ុង បុគ្គលិក</td><td className="num">៛{KHR(rows.reduce((s, r) => s + calculateNssf(r.slip.nssfBase, settings).employeePension, 0))}</td></tr>
                      <tr><td>ភាគទានសុខាភិបាល និយោជក</td><td className="num">៛{KHR(rows.reduce((s, r) => s + calculateNssf(r.slip.nssfBase, settings).employerHealth, 0))}</td></tr>
                      <tr><td>ភាគទានប៉ង់ស្យ៊ុង និយោជក</td><td className="num">៛{KHR(rows.reduce((s, r) => s + calculateNssf(r.slip.nssfBase, settings).employerPension, 0))}</td></tr>
                      <tr><td>ភាគទានហានិភ័យការងារ</td><td className="num">៛{KHR(rows.reduce((s, r) => s + calculateNssf(r.slip.nssfBase, settings).employerRisk, 0))}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="doc-note-box mt-1.5">
                  ខ្ញុំសូមបញ្ជាក់ថា ព័ត៌មានខាងលើនេះជាការពិត និងត្រឹមត្រូវគ្រប់ជ្រុងជ្រោយ។
                  ភាគទានសរុបត្រូវបង់ចំនួន <b>៛{KHR(totals.nssfTotal)}</b> (≈ {USD(totals.nssfTotal / (run.exchangeRate || 4100))})។
                </div>

                <Signatures
                  custom={[
                    { role: "អ្នករៀបចំបញ្ជី", roleEn: "Prepared by", name: settings.company.accountantNameKh },
                    { role: "នាយកប្រតិបត្តិ", roleEn: "Director", name: settings.company.signatoryNameKh },
                  ]}
                />
              </>
            )}

            <DocFooter
              docCode={`NSSF/${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`}
              page={pageIdx + 1}
              total={pageCount ?? pages.length}
            />
          </PdfPage>
        );
      })}
    </>
  );
}

// ============================================================================
// ២. បញ្ជីពន្ធលើបៀវត្សរ៍ · TAX ON SALARY (ToS) WITHHOLDING SCHEDULE
// ============================================================================

export function TosDeclarationDocument({
  rows, run, settings, pageCount,
}: {
  rows: DocRow[]; run: PayrollRun; settings: PayrollSettings; pageCount?: number;
}) {
  const perPage = 18;
  const pages = chunk(rows, perPage);
  const totals = aggregate(rows.map((r) => r.slip));

  const cols = [
    { w: "3.5%", label: "ល.រ" },
    { w: "9%", label: "លេខសារពើពន្ធ\n(TIN)" },
    { w: "15%", label: "គោត្តនាម-នាម" },
    { w: "8%", label: "អត្តសញ្ញាណ\nប័ណ្ណ" },
    { w: "8.5%", label: "ប្រាក់ខែជាប់ពន្ធ" },
    { w: "7%", label: "ក្នុងបន្ទុក\n(នាក់)" },
    { w: "9%", label: "កាត់បន្ថយ\nគ្រួសារ" },
    { w: "9%" , label: "ប.ស.ស\nបុគ្គលិក" },
    { w: "10%", label: "ប្រាក់ជាប់ពន្ធ\nសុទ្ធ" },
    { w: "7.5%", label: "អត្រា" },
    { w: "10%", label: "ពន្ធត្រូវបង់" },
    { w: "4%" , label: "ហត្ថលេខា" },
  ];

  return (
    <>
      {pages.map((pageRows, pageIdx) => {
        const isLast = pageIdx === pages.length - 1;
        return (
          <PdfPage key={pageIdx} label={`ពន្ធលើបៀវត្សរ៍ ទំព័រ ${pageIdx + 1}`}>
            <NationalHeader compact />
            <div className="flex items-start justify-between gap-4">
              <CompanyBlock />
              <div className="doc-small text-right">
                <p className="font-bold">អគ្គនាយកដ្ឋានពន្ធដារ</p>
                <p className="text-ink-500">General Department of Taxation</p>
                <p className="mt-1 text-ink-500">លេខ: TOS/{run.periodYear}/{String(run.periodMonth).padStart(2, "0")}</p>
              </div>
            </div>

            <DocTitle
              titleKh="បញ្ជីពន្ធលើបៀវត្សរ៍ ត្រូវបានកាត់ទុក"
              titleEn="Tax on Salary Withholding Schedule"
              subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
              subtitleEn={`${monthYearEn(run.periodMonth, run.periodYear)} · Declared & paid by the 20th of the following month`}
            />

            <div className="doc-grid mb-1.5" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
              {[
                ["ឈ្មោះក្រុមហ៊ុន", settings.company.nameKh],
                ["អត្តសញ្ញាណសារពើពន្ធ", settings.company.taxId],
                ["ចំនួននិយោជិត", `${rows.length} នាក់`],
                ["ការកាត់បន្ថយផ្ទាល់ខ្លួន", `៛${KHR(settings.taxPersonalDeduction)}`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: "1.5mm" }}>
                  <span className="doc-label shrink-0">{k}:</span>
                  <span className="doc-value truncate">{v}</span>
                </div>
              ))}
            </div>

            <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed" }}>
              <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
              <thead>
                <tr>
                  {cols.map((c, i) => (
                    <th key={i} style={{ padding: "0.8mm 0.4mm", fontSize: "5.8pt", whiteSpace: "pre-line" }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ slip, employee }, i) => {
                  const deps = dependentCount(employee.spouseDependents, employee.childDependents);
                  const depDed = deps * settings.taxDependentDeduction;
                  const netTaxable = Math.max(
                    0,
                    slip.taxableGross - slip.nssfEmployee - settings.taxPersonalDeduction - depDed
                  );
                  const rate = slip.taxableGross ? (slip.tax / slip.taxableGross) * 100 : 0;
                  return (
                    <tr key={slip.id}>
                      <td className="center">{toKhmerDigits(pageIdx * perPage + i + 1)}</td>
                      <td className="center" style={{ fontSize: "5.6pt" }}>{employee.taxNumber}</td>
                      <td style={{ fontSize: "6pt" }}>{employee.lastNameKh} {employee.firstNameKh}</td>
                      <td className="center" style={{ fontSize: "5.4pt" }}>{employee.nationalId}</td>
                      <td className="num">{KHR(slip.taxableGross)}</td>
                      <td className="center">{toKhmerDigits(deps)}</td>
                      <td className="num">{KHR(depDed)}</td>
                      <td className="num">{KHR(slip.nssfEmployee)}</td>
                      <td className="num">{KHR(netTaxable)}</td>
                      <td className="center" style={{ fontSize: "5.8pt" }}>{rate.toFixed(2)}%</td>
                      <td className="num font-semibold">{KHR(slip.tax)}</td>
                      <td />
                    </tr>
                  );
                })}
                {Array.from({ length: Math.max(0, perPage - pageRows.length) }).map((_, i) => (
                  <tr key={`f${i}`} style={{ height: "5.6mm" }}>
                    {cols.map((_, j) => <td key={j} />)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="center font-bold">សរុបទំព័រ</td>
                  <td className="num">{KHR(pageRows.reduce((s, r) => s + r.slip.taxableGross, 0))}</td>
                  <td className="center">{toKhmerDigits(pageRows.reduce((s, r) => s + dependentCount(r.employee.spouseDependents, r.employee.childDependents), 0))}</td>
                  <td className="num" colSpan={3} />
                  <td className="center">—</td>
                  <td className="num font-bold">{KHR(pageRows.reduce((s, r) => s + r.slip.tax, 0))}</td>
                  <td />
                </tr>
                {isLast && (
                  <tr style={{ background: "#eef1f8" }}>
                    <td colSpan={4} className="center font-bold">សរុបរួម</td>
                    <td className="num font-bold">{KHR(totals.taxableGross)}</td>
                    <td colSpan={5} className="center font-bold">
                      ពន្ធត្រូវបង់សរុប ≈ {((totals.tax / (totals.taxableGross || 1)) * 100).toFixed(2)}% នៃប្រាក់ជាប់ពន្ធ
                    </td>
                    <td className="num font-bold">{KHR(totals.tax)}</td>
                    <td />
                  </tr>
                )}
              </tfoot>
            </table>

            {isLast && (
              <>
                <SectionTitle en="TAX BRACKETS APPLIED (RESIDENT)">អត្រាពន្ធលើបៀវត្សរ៍ជាប់ជាន់ (អ្នកស្នាក់នៅ)</SectionTitle>
                <table className="doc-table doc-table--dense">
                  <thead>
                    <tr>
                      <th style={{ width: "8%" }}>ជាន់</th>
                      <th>ប្រាក់ចំណូលជាប់ពន្ធប្រចាំខែ (៛)</th>
                      <th style={{ width: "12%" }}>អត្រា</th>
                      <th style={{ width: "22%" }}>ពន្ធសន្មត (៛)</th>
                      <th style={{ width: "12%" }}>ចំនួននិយោជិត</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TAX_BRACKETS.map((b, i) => {
                      const inBracket = rows.filter((r) => {
                        const deps = dependentCount(r.employee.spouseDependents, r.employee.childDependents);
                        const nt = Math.max(0, r.slip.taxableGross - r.slip.nssfEmployee - settings.taxPersonalDeduction - deps * settings.taxDependentDeduction);
                        return nt > b.from && (b.to === null || nt <= b.to);
                      }).length;
                      return (
                        <tr key={i}>
                          <td className="center">{toKhmerDigits(i + 1)}</td>
                          <td>
                            {i === 0 && "០ – ១,៣០០,០០០"}
                            {i > 0 && `${KHR(b.from)} – ${b.to ? KHR(b.to) : "ឡើងទៅ"}`}
                          </td>
                          <td className="center">{toKhmerDigits(b.rate)}%</td>
                          <td className="num">{b.base ? KHR(b.base) : "—"}</td>
                          <td className="center">{toKhmerDigits(inBracket)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="doc-note-box mt-1.5">
                  <b>ចំណាំ:</b> ការគណនាពន្ធលើបៀវត្សរ៍ = ប្រាក់ខែជាប់ពន្ធ − ភាគទាន ប.ស.ស បុគ្គលិក − ការកាត់បន្ថយផ្ទាល់ខ្លួន ៛{KHR(settings.taxPersonalDeduction)}
                  {" "}− ការកាត់បន្ថយក្នុងបន្ទុក ៛{KHR(settings.taxDependentDeduction)}/នាក់។
                  និយោជិតដែលជាអ្នកមិនស្នាក់នៅ (Non-resident) ជាប់ពន្ធអត្រាថេរ ២០% ដោយគ្មានការកាត់បន្ថយ។
                </div>
                <Signatures
                  custom={[
                    { role: "អ្នករៀបចំបញ្ជី", roleEn: "Prepared by", name: settings.company.accountantNameKh },
                    { role: "នាយកប្រតិបត្តិ", roleEn: "Director", name: settings.company.signatoryNameKh },
                  ]}
                />
              </>
            )}

            <DocFooter docCode={`TOS/${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`} page={pageIdx + 1} total={pageCount ?? pages.length} />
          </PdfPage>
        );
      })}
    </>
  );
}

// ============================================================================
// ៣. បញ្ជីផ្ទេរប្រាក់តាមធនាគារ · BANK TRANSFER / PAYMENT SCHEDULE
// ============================================================================

export function BankTransferDocument({
  rows, run, settings, pageCount,
}: {
  rows: DocRow[]; run: PayrollRun; settings: PayrollSettings; pageCount?: number;
}) {
  const perPage = 22;
  const pages = chunk(rows, perPage);
  const totalNet = rows.reduce((s, r) => s + r.slip.netPay, 0);

  return (
    <>
      {pages.map((pageRows, pageIdx) => {
        const isLast = pageIdx === pages.length - 1;
        return (
          <PdfPage key={pageIdx} label={`បញ្ជីផ្ទេរប្រាក់ ទំព័រ ${pageIdx + 1}`}>
            <NationalHeader compact />
            <div className="flex items-start justify-between gap-4">
              <CompanyBlock />
              <div className="doc-small text-right">
                <p className="font-bold">ធនាគារ៖ {settings.company.bankName}</p>
                <p className="text-ink-500">គណនី៖ {settings.company.bankAccount}</p>
                <p className="mt-1 text-ink-500">លេខ: BTF/{run.periodYear}/{String(run.periodMonth).padStart(2, "0")}</p>
              </div>
            </div>

            <DocTitle
              titleKh="បញ្ជីផ្ទេរប្រាក់បៀវត្សរ៍តាមធនាគារ"
              titleEn="Salary Bank Transfer Instruction / Payment Schedule"
              subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
              subtitleEn={`Pay date: ${formatDate(run.payDate)} · Currency: KHR (៛)`}
            />

            <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ fontSize: "5.8pt" }}>ល.រ</th>
                  <th style={{ fontSize: "5.8pt" }}>កូដបុគ្គលិក</th>
                  <th style={{ fontSize: "5.8pt" }}>ឈ្មោះអ្នកទទួល (គណនីធនាគារ)</th>
                  <th style={{ fontSize: "5.8pt" }}>ភេទ</th>
                  <th style={{ fontSize: "5.8pt" }}>លេខគណនី</th>
                  <th style={{ fontSize: "5.8pt" }}>ធនាគារ / សាខា</th>
                  <th style={{ fontSize: "5.8pt" }}>ចំនួនទឹកប្រាក់ (៛)</th>
                  <th style={{ fontSize: "5.8pt" }}>ចំនួន (USD)</th>
                  <th style={{ fontSize: "5.8pt" }}>ហត្ថលេខា</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ slip, employee }, i) => (
                  <tr key={slip.id}>
                    <td className="center">{toKhmerDigits(pageIdx * perPage + i + 1)}</td>
                    <td className="center" style={{ fontSize: "5.6pt" }}>{employee.code}</td>
                    <td style={{ fontSize: "6pt" }}>
                      <div className="font-semibold">{employee.lastNameEn} {employee.firstNameEn}</div>
                      <div style={{ fontSize: "5.2pt", color: "#6d7cb5" }}>{employee.lastNameKh} {employee.firstNameKh}</div>
                    </td>
                    <td className="center">{employee.gender === "female" ? "ស" : "ប"}</td>
                    <td className="center" style={{ fontSize: "6pt" }}>{employee.bankAccount}</td>
                    <td style={{ fontSize: "5.4pt" }}>{employee.bankName}</td>
                    <td className="num font-semibold">{KHR(slip.netPay)}</td>
                    <td className="num">{USD(slip.netPayUsd)}</td>
                    <td />
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, perPage - pageRows.length) }).map((_, i) => (
                  <tr key={`f${i}`} style={{ height: "5.4mm" }}>
                    {Array.from({ length: 9 }).map((_, j) => <td key={j} />)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="center font-bold">សរុបទំព័រ</td>
                  <td className="num font-bold">{KHR(pageRows.reduce((s, r) => s + r.slip.netPay, 0))}</td>
                  <td className="num font-bold">{USD(pageRows.reduce((s, r) => s + r.slip.netPayUsd, 0))}</td>
                  <td />
                </tr>
                {isLast && pages.length > 1 && (
                  <tr style={{ background: "#eef1f8" }}>
                    <td colSpan={6} className="center font-bold">សរុបរួម ({rows.length} នាក់)</td>
                    <td className="num font-bold">{KHR(totalNet)}</td>
                    <td className="num font-bold">{USD(totalNet / (run.exchangeRate || 4100))}</td>
                    <td />
                  </tr>
                )}
              </tfoot>
            </table>

            {isLast && (
              <>
                <div className="mt-1.5 flex items-center justify-between gap-3" style={{ border: "0.4mm solid #1b2038", padding: "2mm 3mm", background: "#eef1f8" }}>
                  <div>
                    <p className="doc-small font-bold">ចំនួនទឹកប្រាក់ត្រូវផ្ទេរសរុប</p>
                    <p className="doc-tiny text-ink-500">
                      Total amount to be transferred · {rows.length} beneficiaries · {pages.length} page(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tnum" style={{ fontSize: "14pt", fontWeight: 700 }}>
                      ៛ {KHR(totalNet)}
                    </p>
                    <p className="doc-small text-ink-600 tnum">
                      ≈ {USD(totalNet / (run.exchangeRate || 4100))} @ ៛{KHR(run.exchangeRate)}/USD
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 doc-note-box">
                  សូមធនាគារផ្ទេរប្រាក់ខាងលើចូលគណនីរបស់និយោជិតម្នាក់ៗតាមព័ត៌មានខាងលើ។
                  រាល់ការផ្ទេរត្រូវធ្វើឡើងក្នុងថ្ងៃបើកប្រាក់ដែលបានកំណត់ ហើយសំណុំឯកសារនេះជាឯកសារយោងផ្លូវការ។
                  {" "}ប្រាក់ខែទទួលបានសុទ្ធត្រូវបានកាត់ពន្ធលើបៀវត្សរ៍ និងភាគទាន ប.ស.ស រួចរាល់។
                </div>

                <Signatures
                  custom={[
                    { role: "អ្នករៀបចំបញ្ជី", roleEn: "Prepared by", name: settings.company.accountantNameKh },
                    { role: "ប្រធានហិរញ្ញវត្ថុ", roleEn: "Chief Financial Officer", name: "" },
                    { role: "នាយកប្រតិបត្តិ", roleEn: "Director", name: settings.company.signatoryNameKh },
                  ]}
                />
              </>
            )}

            <DocFooter docCode={`BTF/${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`} page={pageIdx + 1} total={pageCount ?? pages.length} />
          </PdfPage>
        );
      })}
    </>
  );
}

// ============================================================================
// ៤. របាយការណ៍សង្ខេបបៀវត្សរ៍ · PAYROLL SUMMARY REPORT
// ============================================================================

export function PayrollSummaryDocument({
  rows, run, settings, pageCount, deptTotals,
}: {
  rows: DocRow[]; run: PayrollRun; settings: PayrollSettings; pageCount?: number;
  deptTotals: { name: string; code: string; headcount: number; gross: number; nssf: number; tax: number; net: number }[];
}) {
  const totals = aggregate(rows.map((r) => r.slip));
  const base = sumCategory(rows.map((r) => r.slip), "base", "earning");
  const allow = sumCategory(rows.map((r) => r.slip), "allowance", "earning");
  const ot = sumCategory(rows.map((r) => r.slip), "overtime", "earning");
  const bonus = sumCategory(rows.map((r) => r.slip), "bonus", "earning");
  const unpaid = sumCategory(rows.map((r) => r.slip), "unpaid_leave", "deduction");
  const union = sumCategory(rows.map((r) => r.slip), "union", "deduction");
  const advance = sumCategory(rows.map((r) => r.slip), "advance", "deduction");

  return (
    <PdfPage label="របាយការណ៍សង្ខេបបៀវត្សរ៍">
      <NationalHeader compact />
      <div className="flex items-start justify-between gap-4">
        <CompanyBlock />
        <FormReference number={`${run.code}/SUM-01`} date={`ថ្ងៃទី ${formatDate(run.payDate)}`} />
      </div>

      <DocTitle
        titleKh="របាយការណ៍សង្ខេបបៀវត្សរ៍ប្រចាំខែ"
        titleEn="Monthly Payroll Summary Report"
        subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
        subtitleEn={monthYearEn(run.periodMonth, run.periodYear)}
      />

      <SectionTitle letter="១" en="HEADLINE FIGURES">សូចនាករសំខាន់</SectionTitle>
      <table className="doc-table">
        <tbody>
          <tr><td style={{ width: "55%" }}>ចំនួនបុគ្គលិកទទួលប្រាក់ខែ</td><td className="num font-bold">{toKhmerDigits(rows.length)} នាក់</td></tr>
          <tr><td>ប្រាក់ខែគោលសរុប (Basic salaries)</td><td className="num">{KHR(base)}</td></tr>
          <tr><td>ប្រាក់ឧបត្ថម្ភសរុប (Allowances)</td><td className="num">{KHR(allow)}</td></tr>
          <tr><td>ប្រាក់ធ្វើការបន្ថែមម៉ោង (Overtime)</td><td className="num">{KHR(ot)}</td></tr>
          <tr><td>ប្រាក់រង្វាន់ និងចំណូលផ្សេងៗ</td><td className="num">{KHR(bonus)}</td></tr>
          <tr style={{ background: "#eef1f8" }}><td className="font-bold">ប្រាក់ចំណូលសរុប (GROSS PAY)</td><td className="num font-bold">{KHR(totals.gross)}</td></tr>
          <tr><td>ភាគទាន ប.ស.ស បុគ្គលិក (Employee NSSF)</td><td className="num">{KHR(totals.nssfEmployee)}</td></tr>
          <tr><td>ពន្ធលើបៀវត្សរ៍ (Tax on Salary)</td><td className="num">{KHR(totals.tax)}</td></tr>
          <tr><td>ការកាត់ថ្ងៃអវត្តមាន / គ្មានប្រាក់</td><td className="num">{KHR(unpaid)}</td></tr>
          <tr><td>ភាគទានសហជីព</td><td className="num">{KHR(union)}</td></tr>
          <tr><td>សងប្រាក់បុរេប្រទាន</td><td className="num">{KHR(advance)}</td></tr>
          <tr style={{ background: "#eef1f8" }}><td className="font-bold">ការកាត់ប្រាក់សរុប (TOTAL DEDUCTIONS)</td><td className="num font-bold">{KHR(totals.totalDeductions)}</td></tr>
          <tr style={{ background: "#dff2ee" }}><td className="font-bold">ប្រាក់ខែទទួលបានសុទ្ធ (NET PAY)</td><td className="num font-bold">៛{KHR(totals.netPay)}</td></tr>
        </tbody>
      </table>

      <SectionTitle letter="២" en="EMPLOYER STATUTORY COST">ចំណាយផ្នែកច្បាប់របស់និយោជក</SectionTitle>
      <table className="doc-table">
        <tbody>
          <tr><td style={{ width: "55%" }}>ភាគទាន ប.ស.ស និយោជក (៤.១%)</td><td className="num">{KHR(totals.nssfEmployer)}</td></tr>
          <tr><td>ចំណាយប្រាក់ខែសរុប (Gross)</td><td className="num">{KHR(totals.gross)}</td></tr>
          <tr style={{ background: "#eef1f8" }}><td className="font-bold">ចំណាយសរុបរបស់ក្រុមហ៊ុន (TOTAL EMPLOYER COST)</td><td className="num font-bold">{KHR(totals.employerCost)}</td></tr>
          <tr><td>សមាមាត្រចំណាយបន្ថែមលើប្រាក់ខែ</td><td className="num">
            {((totals.nssfEmployer / (totals.gross || 1)) * 100).toFixed(2)}%
          </td></tr>
        </tbody>
      </table>

      <SectionTitle letter="៣" en="BREAKDOWN BY DEPARTMENT">ការបែងចែកតាមដេប៉ាតឺមង់</SectionTitle>
      <table className="doc-table doc-table--dense">
        <thead>
          <tr>
            <th style={{ width: "6%" }}>ល.រ</th>
            <th style={{ width: "10%" }}>កូដ</th>
            <th>ដេប៉ាតឺម៉ង់</th>
            <th style={{ width: "10%" }}>ចំនួន</th>
            <th style={{ width: "18%" }}>ចំណូលសរុប (៛)</th>
            <th style={{ width: "14%" }}>ប.ស.ស (៛)</th>
            <th style={{ width: "14%" }}>ពន្ធ (៛)</th>
            <th style={{ width: "17%" }}>ទទួលបាន (៛)</th>
          </tr>
        </thead>
        <tbody>
          {deptTotals.map((d, i) => (
            <tr key={d.code}>
              <td className="center">{toKhmerDigits(i + 1)}</td>
              <td className="center">{d.code}</td>
              <td>{d.name}</td>
              <td className="center">{toKhmerDigits(d.headcount)}</td>
              <td className="num">{KHR(d.gross)}</td>
              <td className="num">{KHR(d.nssf)}</td>
              <td className="num">{KHR(d.tax)}</td>
              <td className="num font-semibold">{KHR(d.net)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="center font-bold">សរុប</td>
            <td className="center font-bold">{toKhmerDigits(rows.length)}</td>
            <td className="num font-bold">{KHR(deptTotals.reduce((s, d) => s + d.gross, 0))}</td>
            <td className="num font-bold">{KHR(deptTotals.reduce((s, d) => s + d.nssf, 0))}</td>
            <td className="num font-bold">{KHR(deptTotals.reduce((s, d) => s + d.tax, 0))}</td>
            <td className="num font-bold">{KHR(deptTotals.reduce((s, d) => s + d.net, 0))}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-1.5 doc-note-box">
        របាយការណ៍នេះរៀបចំឡើងដើម្បីផ្ទៀងផ្ទាត់ជាមួយបញ្ជីបៀវត្សរ៍ប្រចាំខែ បញ្ជីពន្ធលើបៀវត្សរ៍ និងទម្រង់បណ្តាយការបង់ភាគទាន ប.ស.ស។
        ទិន្នន័យគណនាតាមប្រព័ន្ធ KhmerPayroll ហើយត្រូវបានផ្ទៀងផ្ទាត់ដោយផ្នែកគណនេយ្យ។
      </div>

      <Signatures blocks={3} />
      <DocFooter docCode={`${run.code}/SUM`} page={1} total={pageCount ?? 1} />
    </PdfPage>
  );
}
