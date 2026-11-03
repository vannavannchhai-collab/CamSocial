"use client";

import React from "react";
import type { Department, Employee, Position } from "@/lib/types";
import {
  PdfPage, NationalHeader, CompanyBlock, FormReference, DocTitle,
  SectionTitle, Signatures, DocFooter, amt,
} from "./DocFrame";
import { KHR, monthYearKh, formatDateKh } from "@/lib/format";

// ============================================================================
// បញ្ជីរចនាសម្ព័ន្ធអង្គភាព និងមុខតំណែង / ORG STRUCTURE & POSITION LIST
// ----------------------------------------------------------------------------
// Standard A4 portrait official listing:
//   1. National header + company block + form reference
//   2. Department table with headcount and payroll mass
//   3. Position table with level, salary band and current holders
//   4. Signature row + document-control footer with page numbers
//   One .pdf-page = exactly one exported PDF page.
// ============================================================================

const ROWS_PER_PAGE = 16;

export function OrgStructureDocument({
  departments,
  positions,
  employees,
}: {
  departments: Department[];
  positions: Position[];
  employees: Employee[];
}) {
  const active = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");

  const deptRows = departments.map((d) => {
    const members = active.filter((e) => e.departmentId === d.id);
    const total = members.reduce((s, e) => s + e.baseSalary + e.allowances.reduce((a, x) => a + x.amount, 0), 0);
    return { d, count: members.length, total };
  });
  const totalPayroll = deptRows.reduce((s, x) => s + x.total, 0);

  const posSorted = [...positions].sort((a, b) => b.level - a.level || a.code.localeCompare(b.code));
  const posPages: Position[][] = [];
  for (let i = 0; i < posSorted.length; i += ROWS_PER_PAGE) {
    posPages.push(posSorted.slice(i, i + ROWS_PER_PAGE));
  }
  if (posPages.length === 0) posPages.push([]);

  const pageCount = 1 + posPages.length; // page 1 = departments, rest = positions
  const today = formatDateKh(new Date().toISOString().slice(0, 10));

  const deptPage = (
    <PdfPage key="dept" label="ដេប៉ាតឺមង់" className="!py-[14mm]">
      <NationalHeader />
      <div className="flex items-start justify-between gap-4">
        <CompanyBlock />
        <FormReference number="ORG-01" date={today} />
      </div>
      <DocTitle
        titleKh="បញ្ជីរចនាសម្ព័ន្ធអង្គភាព និងដេប៉ាតឺមង់"
        titleEn="Organizational Structure & Department Listing"
        subtitleKh={`ចំនួនសរុប ${active.length} នាក់ · ប្រាក់ខែសរុបប្រចាំខែ ៛${amt(totalPayroll)}`}
      />
      <SectionTitle letter="ក">ដេប៉ាតឺមង់ទាំងអស់ ({departments.length})</SectionTitle>
      <table className="doc-table doc-table--zebra mt-1.5" style={{ fontSize: "8pt" }}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>ល.រ</th>
            <th>កូដ</th>
            <th>ឈ្មោះខ្មែរ</th>
            <th>ឈ្មោះឡាតាំង</th>
            <th className="center">បុគ្គលិក</th>
            <th className="center">ប្រាក់ខែសរុប (៛)</th>
          </tr>
        </thead>
        <tbody>
          {deptRows.map(({ d, count, total }, i) => (
            <tr key={d.id}>
              <td className="center">{i + 1}</td>
              <td className="center font-semibold">{d.code}</td>
              <td>{d.nameKh}</td>
              <td className="text-ink-500">{d.nameEn}</td>
              <td className="center num">{count}</td>
              <td className="num">{amt(total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="font-bold">សរុប</td>
            <td className="center num font-bold">{deptRows.reduce((s, x) => s + x.count, 0)}</td>
            <td className="num font-bold">{amt(totalPayroll)}</td>
          </tr>
        </tfoot>
      </table>

      <SectionTitle letter="ខ">រចនាសម្ព័ន្ធតាមកម្រិត</SectionTitle>
      <p className="doc-small mt-1.5 text-ink-600">
        កម្រិត 6 — នיהולកំពូល · កម្រិត 5 — ប្រធានដេប៉ាតឺម៉ង់ · កម្រិត 4 — អ្នកគ្រប់គ្រងផ្នែក ·
        កម្រិត 3 — បុគ្គលិកជំនាញ · កម្រិត 2 — បុគ្គលិកទូទៅ · កម្រិត 1 — កម្មករ
      </p>

      <Signatures blocks={3} />
      <DocFooter
        docCode="ORG-01"
        page={1}
        total={pageCount}
        note="ឯកសារនេះបង្កើតដោយប្រព័ន្ធគ្រប់គ្រងបៀវត្សរ៍ — សូមរក្សាទុកជាឯកសារគណនេយ្យ។"
      />
    </PdfPage>
  );

  const posPageEls = posPages.map((pagePositions, pageIdx) => (
    <PdfPage key={`pos-${pageIdx}`} label={"positions-" + (pageIdx + 1)} className="!py-[14mm]">
      <NationalHeader compact />
      <div className="flex items-start justify-between gap-4">
        <CompanyBlock />
        <FormReference number={`ORG-02.${pageIdx + 1}`} date={today} />
      </div>
      <DocTitle
        titleKh="បញ្ជីមុខតំណែង និងជួроб្រាក់ខែ"
        titleEn="Position List & Salary Bands"
        subtitleKh={`ប្រចាំខែ ${monthYearKh(new Date().getMonth() + 1, new Date().getFullYear())} · សរុប ${positions.length} មុខតំណែង`}
      />
      <table className="doc-table doc-table--zebra mt-1.5" style={{ fontSize: "7.6pt" }}>
        <colgroup>
          <col style={{ width: "7%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>ល.រ</th>
            <th>កូដ</th>
            <th>ឈ្មោះខ្មែរ</th>
            <th>ឈ្មោះឡាតាំង</th>
            <th className="center">កម្រិត</th>
            <th>ជួроб្រាក់ខែ (៛)</th>
            <th className="center">អ្នកកាន់</th>
            <th className="center">ប្រាក់ខែសរុប</th>
          </tr>
        </thead>
        <tbody>
          {pagePositions.map((p, i) => {
            const holders = active.filter((e) => e.positionId === p.id);
            const sum = holders.reduce((s, e) => s + e.baseSalary, 0);
            return (
              <tr key={p.id}>
                <td className="center">{pageIdx * ROWS_PER_PAGE + i + 1}</td>
                <td className="center font-semibold">{p.code}</td>
                <td>{p.nameKh}</td>
                <td className="text-ink-500">{p.nameEn}</td>
                <td className="center">L{p.level}</td>
                <td className="num">{KHR(p.minSalary)} – {KHR(p.maxSalary)}</td>
                <td className="center num">{holders.length}</td>
                <td className="num">{holders.length ? amt(sum) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Signatures blocks={3} />
      <DocFooter
        docCode="ORG-02"
        page={pageIdx + 2}
        total={pageCount}
        note="ឯកសារនេះបង្កើតដោយប្រព័ន្ធគ្រប់គ្រងបៀវត្សរ៍ — សូមរក្សាទុកជាឯកសារគណនេយ្យ។"
      />
    </PdfPage>
  ));

  return (
    <>
      {deptPage}
      {posPageEls}
    </>
  );
}
