"use client";

import React from "react";
import type { Department, Employee, PayrollRun, PayrollSettings, Position } from "@/lib/types";
import {
  PdfPage, NationalHeader, CompanyBlock, FormReference, DocTitle,
  SectionTitle, Signatures, DocFooter,
} from "./DocFrame";
import { KHR, monthYearKh, monthYearEn, formatDate, toKhmerDigits, fullNameKh, fullNameEn, serviceLabel } from "@/lib/format";
import { monthCalendar, holidaysInMonth } from "@/lib/payroll/holidays";
import { chunk } from "./PayrollRegisterDocument";
import { dependentCount } from "@/lib/payroll/cambodia";

// ============================================================================
// បញ្ជីព័ត៌មានបុគ្គលិក · EMPLOYEE MASTER LISTING
// ============================================================================

export function EmployeeMasterDocument({
  employees, departments, positions, settings, pageCount,
}: {
  employees: Employee[]; departments: Department[]; positions: Position[];
  settings: PayrollSettings; pageCount?: number;
}) {
  const perPage = 16;
  const pages = chunk(employees, perPage);
  const depMap = new Map(departments.map((d) => [d.id, d]));
  const posMap = new Map(positions.map((p) => [p.id, p]));
  const totalSalary = employees.reduce((s, e) => s + e.baseSalary, 0);

  const cols = [
    { w: "3.5%", l: "ល.រ" },
    { w: "8%", l: "កូដ" },
    { w: "15%", l: "គោត្តនាម-នាម" },
    { w: "10%", l: "មុខតំណែង" },
    { w: "9%", l: "ដេប៉ាតឺមង់" },
    { w: "8%", l: "ប្រភេទការងារ" },
    { w: "8%", l: "ថ្ងៃចូល" },
    { w: "8%", l: "ប្រាក់ខែគោល" },
    { w: "9%", l: "លេខ ប.ស.ស" },
    { w: "9%", l: "លេខសារពើពន្ធ" },
    { w: "7%", l: "ក្នុងបន្ទុក" },
    { w: "5%", l: "ស្ថានភាព" },
  ];

  const employmentLabel = (t: Employee["employmentType"]) =>
    t === "permanent" ? "អចិន្ត្រៃយ៍" : t === "fixed_term" ? "កំណត់រយៈពេល"
      : t === "probation" ? "សាកល្បង" : t === "part_time" ? "ក្រៅម៉ោង" : "កម្មសិក្សា";

  const statusLabel = (s: Employee["status"]) =>
    s === "active" ? "សកម្ម" : s === "probation" ? "សាកល្បង"
      : s === "suspended" ? "ផ្អាក" : s === "resigned" ? "លាឈប់" : "បញ្ឈប់";

  return (
    <>
      {pages.map((pageRows, pageIdx) => (
        <PdfPage key={pageIdx} label={`បញ្ជីបុគ្គលិក ទំព័រ ${pageIdx + 1}`}>
          <NationalHeader compact />
          <div className="flex items-start justify-between gap-4">
            <CompanyBlock />
            <FormReference
              number={`EMP/LIST-${String(pageIdx + 1).padStart(2, "0")}`}
              date={`ថ្ងៃទី ${formatDate(new Date().toISOString())}`}
            />
          </div>

          <DocTitle
            titleKh="បញ្ជីព័ត៌មានបុគ្គលិក"
            titleEn="Employee Master Listing"
            subtitleKh={`គិតត្រឹមថ្ងៃទី ${formatDate(new Date().toISOString())}`}
            subtitleEn={`Total ${employees.length} employees · ${pages.length} page(s)`}
          />

          <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed" }}>
            <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
            <thead>
              <tr>{cols.map((c, i) => <th key={i} style={{ fontSize: "5.8pt", padding: "0.8mm 0.4mm" }}>{c.l}</th>)}</tr>
            </thead>
            <tbody>
              {pageRows.map((e, i) => (
                <tr key={e.id}>
                  <td className="center">{toKhmerDigits(pageIdx * perPage + i + 1)}</td>
                  <td className="center" style={{ fontSize: "5.6pt" }}>{e.code}</td>
                  <td style={{ fontSize: "6pt", lineHeight: 1.35 }}>
                    <div className="font-semibold">{e.lastNameKh} {e.firstNameKh}</div>
                    <div style={{ fontSize: "4.8pt", color: "#6d7cb5" }}>{e.lastNameEn} {e.firstNameEn}</div>
                  </td>
                  <td style={{ fontSize: "5.4pt" }}>{posMap.get(e.positionId)?.nameKh ?? "—"}</td>
                  <td style={{ fontSize: "5.4pt" }}>{depMap.get(e.departmentId)?.code ?? "—"}</td>
                  <td className="center" style={{ fontSize: "5.2pt" }}>{employmentLabel(e.employmentType)}</td>
                  <td className="center" style={{ fontSize: "5.4pt" }}>{formatDate(e.hireDate)}</td>
                  <td className="num">{KHR(e.baseSalary)}</td>
                  <td className="center" style={{ fontSize: "5.2pt" }}>{e.nssfNumber}</td>
                  <td className="center" style={{ fontSize: "5.2pt" }}>{e.taxNumber}</td>
                  <td className="center">{toKhmerDigits(dependentCount(e.spouseDependents, e.childDependents))}</td>
                  <td className="center" style={{ fontSize: "5.2pt" }}>{statusLabel(e.status)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, perPage - pageRows.length) }).map((_, i) => (
                <tr key={`f${i}`} style={{ height: "6mm" }}>
                  {cols.map((_, j) => <td key={j} />)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="center font-bold">សរុប</td>
                <td colSpan={2} className="center font-bold">{toKhmerDigits(employees.length)} នាក់</td>
                <td className="num font-bold">{KHR(totalSalary)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>

          {pageIdx === pages.length - 1 && (
            <>
              <div className="doc-note-box mt-1.5">
                <b>ចំណាំ:</b> បញ្ជីនេះរួមមានបុគ្គលិកសកម្ម និងអ្នកក្រោមសម័យសាកល្បង។
                ប្រាក់ខែគោលសរុប ៛{KHR(totalSalary)} ក្នុងមួយខែ។
                បុគ្គលិកដែលគ្មានលេខ ប.ស.ស ត្រូវចុះឈ្មោះជាបន្ទាន់តាមច្បាប់។
              </div>
              <Signatures
                custom={[
                  { role: "អ្នករៀបចំបញ្ជី", roleEn: "Prepared by", name: settings.company.accountantNameKh },
                  { role: "ប្រធានធនធានមនុស្ស", roleEn: "HR Manager", name: "" },
                  { role: settings.company.signatoryPositionKh, roleEn: "Director", name: settings.company.signatoryNameKh },
                ]}
              />
            </>
          )}
          <DocFooter docCode="EMP/LIST" page={pageIdx + 1} total={pageCount ?? pages.length} />
        </PdfPage>
      ))}
    </>
  );
}

// ============================================================================
// តារាងវត្តមានប្រចាំខែ · MONTHLY ATTENDANCE SHEET
// ============================================================================

export function AttendanceSheetDocument({
  employees, run, settings, departments, pageCount,
}: {
  employees: Employee[]; run: PayrollRun; settings: PayrollSettings;
  departments: Department[]; pageCount?: number;
}) {
  const perPage = 12;
  const pages = chunk(employees, perPage);
  const cal = monthCalendar(run.periodYear, run.periodMonth, false);
  const depMap = new Map(departments.map((d) => [d.id, d]));
  const holidays = holidaysInMonth(run.periodYear, run.periodMonth);

  const dowKh = ["អា", "ច", "អ", "ព", "ព្រ", "សុ", "ស"];

  return (
    <>
      {pages.map((pageRows, pageIdx) => (
        <PdfPage key={pageIdx} label={`វត្តមាន ទំព័រ ${pageIdx + 1}`} orientation="landscape">
          <NationalHeader compact />
          <div className="flex items-start justify-between gap-4">
            <CompanyBlock />
            <FormReference
              number={`ATM/${run.periodYear}/${String(run.periodMonth).padStart(2, "0")}-${pageIdx + 1}`}
              date={monthYearKh(run.periodMonth, run.periodYear)}
            />
          </div>

          <DocTitle
            titleKh="តារាងវត្តមានបុគ្គលិកប្រចាំខែ"
            titleEn="Monthly Attendance Sheet"
            subtitleKh={`ប្រចាំ${monthYearKh(run.periodMonth, run.periodYear)}`}
            subtitleEn={`${monthYearEn(run.periodMonth, run.periodYear)} · ${cal.length} days`}
          />

          <table className="doc-table doc-table--dense" style={{ tableLayout: "fixed", fontSize: "5.2pt" }}>
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "9%" }} />
              {cal.map((c) => (
                <col key={c.date} style={{ width: `${60 / cal.length}%` }} />
              ))}
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: "0.5mm 0.2mm" }}>ល.រ</th>
                <th style={{ padding: "0.5mm 0.2mm" }}>គោត្តនាម-នាម</th>
                <th style={{ padding: "0.5mm 0.2mm" }}>ដេប៉.</th>
                {cal.map((c) => (
                  <th
                    key={c.date}
                    style={{
                      padding: "0.4mm 0",
                      fontSize: "4.4pt",
                      background: c.isHoliday ? "#faedc9" : c.isWeekend ? "#f4f6fb" : "#e6eaf4",
                      lineHeight: 1.3,
                    }}
                  >
                    <div>{dowKh[c.dow]}</div>
                    <div style={{ fontWeight: 700 }}>{c.day}</div>
                  </th>
                ))}
                <th style={{ padding: "0.4mm 0.2mm", fontSize: "4.4pt" }}>មក</th>
                <th style={{ padding: "0.4mm 0.2mm", fontSize: "4.4pt" }}>ច្បាប់</th>
                <th style={{ padding: "0.4mm 0.2mm", fontSize: "4.4pt" }}>OT</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e, i) => (
                <tr key={e.id} style={{ height: "6.6mm" }}>
                  <td className="center" style={{ padding: "0.4mm 0.2mm" }}>{toKhmerDigits(pageIdx * perPage + i + 1)}</td>
                  <td style={{ padding: "0.4mm 0.8mm", fontSize: "5.4pt" }}>{e.lastNameKh} {e.firstNameKh}</td>
                  <td className="center" style={{ padding: "0.4mm 0.2mm", fontSize: "4.6pt" }}>
                    {depMap.get(e.departmentId)?.code}
                  </td>
                  {cal.map((c) => (
                    <td
                      key={c.date}
                      className="center"
                      style={{
                        padding: 0,
                        background: c.isHoliday ? "#fdf8ec" : c.isWeekend ? "#fafbfe" : undefined,
                        fontSize: "5pt",
                      }}
                    >
                      {c.isHoliday ? "ប" : c.isWeekend ? "" : ""}
                    </td>
                  ))}
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <div className="doc-note-box flex-1" style={{ fontSize: "5.8pt" }}>
              <b>កូដសម្គាល់:</b> ✓ = មានវត្តមាន · ច = ច្បាប់មានប្រាក់ · គ = ច្បាប់គ្មានប្រាក់ ·
              អ = អវត្តមាន · ប = ថ្ងៃបុណ្យជាតិ · យ = មកយឺត
              {holidays.length > 0 && (
                <>
                  <br />
                  <b>ថ្ងៃបុណ្យក្នុងខែ:</b>{" "}
                  {holidays.map((h, i) => `${new Date(h.date).getDate()} ${h.nameEn}`).join(" · ")}
                </>
              )}
            </div>
            <div className="doc-small text-right shrink-0" style={{ fontSize: "6pt" }}>
              <p>ថ្ងៃធ្វើការ: <b>{run.workingDays}</b></p>
              <p>ថ្ងៃបុណ្យ: <b>{holidays.length}</b></p>
              <p>បុគ្គលិក: <b>{employees.length}</b></p>
            </div>
          </div>

          {pageIdx === pages.length - 1 && <Signatures blocks={3} />}
          <DocFooter docCode={`ATM/${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`} page={pageIdx + 1} total={pageCount ?? pages.length} />
        </PdfPage>
      ))}
    </>
  );
}

// ============================================================================
// កិច្ចសន្យាការងារ · EMPLOYMENT CONTRACT (UDC)
// ============================================================================

export function EmploymentContractDocument({
  employee, settings, positionName, departmentName,
}: {
  employee: Employee; settings: PayrollSettings; positionName: string; departmentName: string;
}) {
  const c = settings.company;
  const salaryUsd = employee.baseSalary / settings.exchangeRate;

  const Article = ({ n, kh, en, children }: { n: number; kh: string; en: string; children: React.ReactNode }) => (
    <div className="mt-2">
      <p className="doc-value" style={{ fontSize: "8.2pt" }}>
        មាត្រា {toKhmerDigits(n)}: {kh}
      </p>
      <p className="text-ink-400" style={{ fontSize: "6.2pt", marginBottom: "0.8mm" }}>{en}</p>
      <div className="doc-small" style={{ paddingLeft: "4mm", lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  return (
    <PdfPage label="កិច្ចសន្យាការងារ">
      <NationalHeader />
      <div className="flex items-start justify-between gap-4">
        <CompanyBlock />
        <FormReference number={`CTR/${new Date().getFullYear()}/${employee.code.slice(-4)}`} date={formatDate(new Date().toISOString())} />
      </div>

      <DocTitle
        titleKh="កិច្ចសន្យាការងារគ្មានកំណត់រយៈពេល"
        titleEn="Unlimited Duration Employment Contract (UDC)"
      />

      <div className="doc-small" style={{ lineHeight: 1.95 }}>
        <p>
          កិច្ចសន្យានេះធ្វើឡើងនៅ {c.province} នៅថ្ងៃទី {formatDate(new Date().toISOString())} រវាង៖
        </p>
        <div className="mt-1.5 doc-grid" style={{ gridTemplateColumns: "1fr", border: "0.28mm solid #1b2038" }}>
          <div>
            <p className="font-bold">ភាគីនិយោជក (Employer)</p>
            <p>ក្រុមហ៊ុន៖ <b>{c.nameKh}</b> ({c.nameEn})</p>
            <p>អាសយដ្ឋាន៖ {c.addressKh}</p>
            <p>អត្តសញ្ញាណសារពើពន្ធ៖ {c.taxId} · លេខ ប.ស.ស៖ {c.nssfEmployerNumber}</p>
            <p>តំណាងដោយ៖ <b>{c.signatoryNameKh}</b> — {c.signatoryPositionKh}</p>
          </div>
          <div style={{ borderTop: "0.2mm solid #c8d1e6" }}>
            <p className="font-bold">ភាគីនិយោជិត (Employee)</p>
            <p>
              ឈ្មោះ៖ <b>{fullNameKh(employee)}</b> ({fullNameEn(employee)}) · ភេទ៖{" "}
              {employee.gender === "female" ? "ស្រី" : "ប្រុស"}
            </p>
            <p>ថ្ងៃខែឆ្នាំកំណើត៖ {formatDate(employee.dob)} · អត្តសញ្ញាណប័ណ្ណលេខ៖ {employee.nationalId}</p>
            <p>អាសយដ្ឋាន៖ {employee.address} · ទូរស័ព្ទ៖ {employee.phone}</p>
            <p>លេខ ប.ស.ស៖ {employee.nssfNumber} · លេខសារពើពន្ធ៖ {employee.taxNumber}</p>
          </div>
        </div>
        <p className="mt-1.5">
          ភាគីទាំងពីរបានព្រមព្រៀងគ្នាចុះកិច្ចសន្យាការងារនេះ ស្របតាមច្បាប់ស្តីពីការងារ
          ដែលបានប្រកាសឱ្យប្រើដោយព្រះរាជក្រឹត្យលេខ ១៩២ កស/រកម ចុះថ្ងៃទី ១៣ ខែ មីនា ឆ្នាំ ១៩៩៧
          និងបទប្បញ្ញត្តិពាក់ព័ន្ធនានា។
        </p>

        <Article n={1} kh="មុខតំណែង និងការងារ" en="Position and Duties">
          និយោជិតត្រូវបានជួលឱ្យបំពេញការងារជា <b>{positionName}</b>
          នៅក្នុង <b>{departmentName}</b>។ និយោជិតត្រូវបំពេញភារកិច្ចដែលបានកំណត់ដោយប្រធានដេប៉ាតឺម៉ង់
          និងគោរពបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន។
        </Article>

        <Article n={2} kh="រយៈពេលកិច្ចសន្យា" en="Duration">
          កិច្ចសន្យានេះជាកិច្ចសន្យាគ្មានកំណត់រយៈពេល ចាប់ផ្តើមអនុវត្តពីថ្ងៃទី <b>{formatDate(employee.hireDate)}</b>។
          {employee.employmentType === "probation" && (
            <> និយោជិតស្ថិតក្នុងសម័យសាកល្បងរយៈពេល ៣ ខែ តាមមាត្រា ៦៨ នៃច្បាប់ស្តីពីការងារ។</>
          )}
        </Article>

        <Article n={3} kh="ប្រាក់ឈ្នួល និងអត្ថប្រយោជន៍" en="Wages and Benefits">
          <table className="doc-table doc-table--dense mt-1" style={{ fontSize: "6.4pt" }}>
            <tbody>
              <tr>
                <td style={{ width: "45%" }}>ប្រាក់ខែគោលប្រចាំខែ</td>
                <td className="num font-bold">៛{KHR(employee.baseSalary)}</td>
                <td className="num">≈ ${salaryUsd.toFixed(2)}</td>
              </tr>
              {employee.allowances.map((a) => (
                <tr key={a.id}>
                  <td>{a.labelKh}</td>
                  <td className="num">៛{KHR(a.amount)}</td>
                  <td className="num text-ink-400">{a.taxable ? "ជាប់ពន្ធ" : "មិនជាប់ពន្ធ"}</td>
                </tr>
              ))}
              <tr style={{ background: "#eef1f8" }}>
                <td className="font-bold">ប្រាក់ឈ្នួលសរុប</td>
                <td className="num font-bold">៛{KHR(employee.baseSalary + employee.allowances.reduce((s, a) => s + a.amount, 0))}</td>
                <td />
              </tr>
            </tbody>
          </table>
          ប្រាក់ឈ្នួលត្រូវបើកជារៀងរាល់ខែ មិនលើសពីថ្ងៃទី ២៥ នៃខែនោះ តាមរយៈការផ្ទេរប្រាក់ចូលគណនីធនាគារ{" "}
          <b>{employee.bankName}</b> លេខ <b>{employee.bankAccount}</b>។
        </Article>

        <Article n={4} kh="ម៉ោងធ្វើការ និងការឈប់សម្រាក" en="Working Hours and Leave">
          និយោជិតធ្វើការ ៤៨ ម៉ោង/សប្តាហ៍ តាមកាលវិភាគដែលក្រុមហ៊ុនកំណត់។
          និយោជិតមានសិទ្ធិឈប់សម្រាកប្រចាំឆ្នាំ {settings.annualLeaveDays} ថ្ងៃ មានប្រាក់ឈ្នួល
          ព្រមទាំងសិទ្ធិឈប់សម្រាកពេលឈឺ ពេលសម្រាលកូន និងថ្ងៃឈប់សម្រាកសាធារណៈតាមច្បាប់។
        </Article>

        <Article n={5} kh="បេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស)" en="National Social Security Fund">
          និយោជកត្រូវចុះឈ្មោះនិយោជិតជាសមាជិក ប.ស.ស និងបង់ភាគទានសុខាភិបាល {settings.nssfEmployeeHealthRate}%+{settings.nssfEmployerHealthRate}%,
          ប៉ង់ស្យ៊ុង {settings.nssfEmployeePensionRate}%+{settings.nssfEmployerPensionRate}%
          និងហានិភ័យការងារ {settings.nssfEmployerRiskRate}% (និយោជក) លើមូលដ្ឋានកម្រៃ ៛{KHR(settings.nssfFloor)}–៛{KHR(settings.nssfCeiling)}។
        </Article>

        <Article n={6} kh="ពន្ធលើបៀវត្សរ៍" en="Tax on Salary">
          និយោជកត្រូវកាត់ទុកពន្ធលើបៀវត្សរ៍តាមអត្រាជាប់ជាន់ ០% ដល់ ២០% ស្របតាមច្បាប់ស្តីពីសារពើពន្ធ
          និងបង់ទៅអគ្ននាយកដ្ឋានពន្ធដារមុនថ្ងៃទី ២០ នៃខែបន្ទាប់។
        </Article>

        <Article n={7} kh="អត្ថប្រយោជន៍អានុភាពការងារ" en="Seniority Indemnity">
          និយោជិតទទួលបានអត្ថប្រយោជន៍អានុភាពការងារ ១៥ ថ្ងៃ ក្នុងមួយឆ្នាំ បង់ពីរដងក្នុងមួយឆ្នាំ (ខែមិថុនា និងខែធ្នូ)
          ស្របតាមប្រកាសលេខ ៤៤៣ របស់ក្រសួងការងារ។
        </Article>

        <Article n={8} kh="រយៈពេលសាកល្បង និងការបញ្ចប់កិច្ចសន្យា" en="Probation and Termination">
          ក្នុងអំឡុងពេលសាកល្បង ភាគីទាំងពីរអាចបញ្ចប់កិច្ចសន្យាដោយជូនដំណឹងជាមុន ៧ ថ្ងៃ។
          ក្រោយសម័យសាកល្បង ការបញ្ចប់កិច្ចសន្យាត្រូវគោរពតាមមាត្រា ៧៣ ដល់ ៧៦ នៃច្បាប់ស្តីពីការងារ។
        </Article>

        <Article n={9} kh="ការដោះស្រាយវិវាទ" en="Dispute Resolution">
          រាល់វិវាទកើតឡើងពីកិច្ចសន្យានេះ ត្រូវដោះស្រាយដោយការចរចាផ្ទាល់។ ប្រសិនបើមិនអាចដោះស្រាយបាន
          ត្រូវយោងទៅអធិការការងារ ឬតុលាការការងារតាមច្បាប់ជាធរមាន។
        </Article>
      </div>

      <div className="mt-2 grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
        {[
          { role: "ភាគីនិយោជក", en: "For the Employer", name: settings.company.signatoryNameKh },
          { role: "ភាគីនិយោជិត", en: "The Employee", name: fullNameKh(employee) },
        ].map((s, i) => (
          <div key={i} className="doc-sign" style={{ fontSize: "7pt" }}>
            <p className="role">{s.role}</p>
            <p className="text-ink-400" style={{ fontSize: "6pt" }}>{s.en}</p>
            <p className="text-ink-500" style={{ fontSize: "6.4pt" }}>ថ្ងៃទី........ ខែ........ ឆ្នាំ........</p>
            <div style={{ height: "16mm" }} className="flex items-end justify-center">
              <span className="font-semibold">{s.name}</span>
            </div>
            <div style={{ borderTop: "0.25mm dotted #1b2038", margin: "0 3mm", paddingTop: "0.8mm" }} className="doc-tiny text-ink-400">
              ហត្ថលេខា និងត្រា
            </div>
          </div>
        ))}
      </div>

      <DocFooter docCode={`CTR/${employee.code}`} page={1} total={1} note="កិច្ចសន្យានេះធ្វើឡើងជាពីរច្បាប់ ដែលភាគីម្នាក់កាន់មួយច្បាប់។" />
    </PdfPage>
  );
}
