"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { TosDeclarationDocument } from "@/components/documents/StatutoryDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { buildRows } from "@/lib/payroll/reporting";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh } from "@/lib/format";
import { dependentCount } from "@/lib/payroll/cambodia";

export default function TosFormPage() {
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
      "ល.រ", "TIN", "គោត្តនាម-នាម", "អត្តសញ្ញាណប័ណ្ណ", "ប្រាក់ជាប់ពន្ធ",
      "ក្នុងបន្ទុក", "កាត់បន្ថយគ្រួសារ", "ប.ស.ស បុគ្គលិក",
      "ប្រាក់ជាប់ពន្ធសុទ្ធ", "អត្រា %", "ពន្ធត្រូវបង់",
    ];
    const body = rows.map((r, i) => {
      const deps = dependentCount(r.employee.spouseDependents, r.employee.childDependents);
      const depDed = deps * settings.taxDependentDeduction;
      const net = Math.max(0, r.slip.taxableGross - r.slip.nssfEmployee - settings.taxPersonalDeduction - depDed);
      const rate = r.slip.taxableGross ? (r.slip.tax / r.slip.taxableGross) * 100 : 0;
      return [
        i + 1, r.employee.taxNumber,
        `${r.employee.lastNameKh} ${r.employee.firstNameKh}`,
        r.employee.nationalId,
        r.slip.taxableGross, deps, depDed, r.slip.nssfEmployee, net,
        rate.toFixed(2), r.slip.tax,
      ];
    });
    exportCsv(`tax-on-salary-${activeRun?.code ?? ""}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="បញ្ជីពន្ធលើបៀវត្សរ៍"
        subtitle={activeRun ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${rows.length} នាក់` : ""}
        filename={`tax-on-salary-${activeRun?.code ?? ""}.pdf`}
        docCode={`TOS/${activeRun?.periodYear ?? ""}/${String(activeRun?.periodMonth ?? "").padStart(2, "0")}`}
        backHref="/forms"
        pageCount={pageCount}
        onCsv={onCsv}
        note="ពន្ធលើបៀវត្សរ៍ = (ប្រាក់ជាប់ពន្ធ − ប.ស.ស − កាត់បន្ថយផ្ទាល់ខ្លួន − ក្នុងបន្ទុក) × អត្រាជាន់ · ត្រូវបង់មុនថ្ងៃទី២០"
      />
      <PaperStage>
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <TosDeclarationDocument rows={rows} run={activeRun!} settings={settings} pageCount={pageCount} />
        )}
      </PaperStage>
    </div>
  );
}
