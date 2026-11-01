"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { BankTransferDocument } from "@/components/documents/StatutoryDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { buildRows } from "@/lib/payroll/reporting";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh } from "@/lib/format";

export default function BankTransferFormPage() {
  const { payslips, activeRun, employees, departments, positions, settings } = useStore();

  const rows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(payslips.filter((s) => s.runId === activeRun.id), employees, departments, positions);
  }, [payslips, activeRun, employees, departments, positions]);

  const pageCount = Math.max(1, Math.ceil(rows.length / 22));

  const onCsv = () => {
    const head = ["ល.រ", "កូដ", "ឈ្មោះអ្នកទទួល", "គណនីធនាគារ", "ធនាគារ", "ចំនួន (៛)", "ចំនួន (USD)"];
    const body = rows.map((r, i) => [
      i + 1, r.employee.code,
      `${r.employee.lastNameEn} ${r.employee.firstNameEn}`,
      r.employee.bankAccount, r.employee.bankName, r.slip.netPay, r.slip.netPayUsd,
    ]);
    exportCsv(`bank-transfer-${activeRun?.code ?? ""}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="បញ្ជីផ្ទេរប្រាក់បៀវត្សរ៍តាមធនាគារ"
        subtitle={activeRun ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${rows.length} នាក់` : ""}
        filename={`bank-transfer-${activeRun?.code ?? ""}.pdf`}
        docCode={`BTF/${activeRun?.periodYear ?? ""}/${String(activeRun?.periodMonth ?? "").padStart(2, "0")}`}
        backHref="/forms"
        pageCount={pageCount}
        onCsv={onCsv}
        note="បញ្ជីនេះប្រើសម្រាប់បញ្ជូនទៅធនាគារដើម្បីផ្ទេរប្រាក់ខែចូលគណនីនិយោជិត"
      />
      <PaperStage>
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <BankTransferDocument rows={rows} run={activeRun!} settings={settings} pageCount={pageCount} />
        )}
      </PaperStage>
    </div>
  );
}
