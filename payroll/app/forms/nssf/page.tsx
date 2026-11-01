"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { NssfDeclarationDocument } from "@/components/documents/StatutoryDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { buildRows } from "@/lib/payroll/reporting";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh } from "@/lib/format";
import { calculateNssf } from "@/lib/payroll/cambodia";

export default function NssfFormPage() {
  const { payslips, activeRun, employees, departments, positions, settings } = useStore();

  const rows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(
      payslips.filter((s) => s.runId === activeRun.id),
      employees, departments, positions
    );
  }, [payslips, activeRun, employees, departments, positions]);

  const pageCount = Math.max(1, Math.ceil(rows.length / 18));

  const onCsv = () => {
    const head = [
      "ល.រ", "លេខ ប.ស.ស", "គោត្តនាម-នាម", "ភេទ", "ថ្ងៃកើត",
      "មូលដ្ឋានគិត", "សុខាភិបាល បុគ្គលិក", "សុខាភិបាល និយោជក",
      "ប៉ង់ស្យ៊ុង បុគ្គលិក", "ប៉ង់ស្យ៊ុង និយោជក",
      "ហានិភ័យការងារ", "សរុប",
    ];
    const body = rows.map((r, i) => {
      const n = calculateNssf(r.slip.nssfBase, settings, { isMember: r.employee.isNssfMember });
      return [
        i + 1, r.employee.nssfNumber,
        `${r.employee.lastNameKh} ${r.employee.firstNameKh}`,
        r.employee.gender === "female" ? "ស" : "ប",
        r.employee.dob,
        n.contributableWage, n.employeeHealth, n.employerHealth,
        n.employeePension, n.employerPension, n.employerRisk, n.total,
      ];
    });
    exportCsv(`nssf-declaration-${activeRun?.code ?? ""}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="ទម្រង់បណ្តាយការបង់ភាគទាន ប.ស.ស"
        subtitle={activeRun ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${rows.length} នាក់` : ""}
        filename={`nssf-declaration-${activeRun?.code ?? ""}.pdf`}
        docCode={`NSSF/${activeRun?.periodYear ?? ""}/${String(activeRun?.periodMonth ?? "").padStart(2, "0")}`}
        backHref="/forms"
        pageCount={pageCount}
        onCsv={onCsv}
        note="មូលដ្ឋានគិត = ប្រាក់ខែជាប់កម្រៃ ៛២០០,០០០ – ៛១,២០០,០០០ · បុគ្គលិក ៣.៣% · និយោជក ៤.១%"
      />
      <PaperStage>
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <NssfDeclarationDocument rows={rows} run={activeRun!} settings={settings} pageCount={pageCount} />
        )}
      </PaperStage>
    </div>
  );
}
