"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PayrollSummaryDocument } from "@/components/documents/StatutoryDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { buildRows, departmentTotals } from "@/lib/payroll/reporting";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh } from "@/lib/format";

export default function PayrollSummaryFormPage() {
  const { payslips, activeRun, employees, departments, positions, settings } = useStore();

  const rows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(payslips.filter((s) => s.runId === activeRun.id), employees, departments, positions);
  }, [payslips, activeRun, employees, departments, positions]);

  const deptTotals = useMemo(() => departmentTotals(rows, departments), [rows, departments]);

  const onCsv = () => {
    const head = ["កូដ", "ដេប៉ាតឺមង់", "ចំនួនបុគ្គលិក", "ចំណូលសរុប", "ប.ស.ស", "ពន្ធ", "ទទួលបាន"];
    const body = deptTotals.map((d) => [d.code, d.name, d.headcount, d.gross, d.nssf, d.tax, d.net]);
    exportCsv(`payroll-summary-${activeRun?.code ?? ""}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="របាយការណ៍សង្ខេបបៀវត្សរ៍"
        subtitle={activeRun ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${rows.length} នាក់` : ""}
        filename={`payroll-summary-${activeRun?.code ?? ""}.pdf`}
        docCode={`${activeRun?.code ?? ""}/SUM-01`}
        backHref="/forms"
        pageCount={1}
        onCsv={onCsv}
        note="សង្ខេបសម្រាប់ថ្នាក់គ្រប់គ្រង · មានការបែងចែកតាមដេប៉ាតឺម៉ង់"
      />
      <PaperStage>
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <PayrollSummaryDocument
            rows={rows} run={activeRun!} settings={settings}
            pageCount={1} deptTotals={deptTotals}
          />
        )}
      </PaperStage>
    </div>
  );
}
