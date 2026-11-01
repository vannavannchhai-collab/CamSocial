"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PayrollRegisterDocument } from "@/components/documents/PayrollRegisterDocument";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { buildRows } from "@/lib/payroll/reporting";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh, KHR } from "@/lib/format";

export default function PayrollRegisterPage() {
  const { payslips, activeRun, employees, departments, positions, settings } = useStore();

  const rows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(
      payslips.filter((s) => s.runId === activeRun.id),
      employees,
      departments,
      positions
    );
  }, [payslips, activeRun, employees, departments, positions]);

  const pageCount = Math.max(1, Math.ceil(rows.length / 16));

  const onCsv = () => {
    const head = [
      "ល.រ", "កូដ", "ឈ្មោះខ្មែរ", "ឈ្មោះឡាតាំង", "មុខតំណែង", "ដេប៉ាតឺមង់",
      "ប្រាក់ខែគោល", "ប្រាក់ឧបត្ថម្ភ", "OT", "ចំណូលសរុប",
      "ប.ស.ស បុគ្គលិក", "ពន្ធ ToS", "កាត់ផ្សេង", "កាត់សរុប", "ទទួលបានសុទ្ធ",
      "NSSF និយោជក", "ចំណាយក្រុមហ៊ុន", "TIN", "លេខ ប.ស.ស",
    ];
    const body = rows.map((r, i) => {
      const base = r.slip.earnings.find((e) => e.category === "base")?.amount ?? 0;
      const allow = r.slip.earnings.filter((e) => e.category === "allowance").reduce((a, e) => a + e.amount, 0);
      const ot = r.slip.earnings.filter((e) => e.category === "overtime").reduce((a, e) => a + e.amount, 0);
      const otherDed = r.slip.deductions.filter((d) => !["nssf", "tax"].includes(d.category)).reduce((a, d) => a + d.amount, 0);
      return [
        i + 1,
        r.employee.code,
        `${r.employee.lastNameKh} ${r.employee.firstNameKh}`,
        `${r.employee.lastNameEn} ${r.employee.firstNameEn}`,
        r.position?.nameKh ?? "",
        r.department?.nameKh ?? "",
        base, allow, ot, r.slip.gross,
        r.slip.nssfEmployee, r.slip.tax, otherDed, r.slip.totalDeductions, r.slip.netPay,
        r.slip.nssfEmployer, r.slip.employerCost,
        r.employee.taxNumber, r.employee.nssfNumber,
      ];
    });
    exportCsv(`payroll-register-${activeRun?.code ?? "all"}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="បញ្ជីបៀវត្សរ៍ប្រចាំខែ"
        subtitle={
          activeRun
            ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${rows.length} នាក់ · ${pageCount} ទំព័រ`
            : ""
        }
        filename={`payroll-register-${activeRun?.code ?? "all"}.pdf`}
        docCode={`${activeRun?.code ?? ""}/REG`}
        orientation="landscape"
        backHref="/forms"
        pageCount={pageCount}
        onCsv={onCsv}
        note="ទម្រង់ A4 ផ្ដេក · ១៦ នាក់/ទំព័រ · មានសរុបទំព័រ និងសរុបរួម · បន្ថែមសេចក្តីសង្ខេបបង់ពន្ធនៅទំព័រចុងក្រោយ"
      />

      <PaperStage orientation="landscape">
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យបៀវត្សរ៍</p>
          </div>
        ) : (
          <PayrollRegisterDocument
            rows={rows}
            run={activeRun!}
            settings={settings}
            pageCount={pageCount}
          />
        )}
      </PaperStage>
    </div>
  );
}
