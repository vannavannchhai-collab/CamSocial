"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { AttendanceSheetDocument } from "@/components/documents/MasterDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { exportCsv } from "@/lib/pdf/export";
import { monthYearKh } from "@/lib/format";
import { monthCalendar, holidaysInMonth } from "@/lib/payroll/holidays";

export default function AttendanceSheetPage() {
  const { employees, departments, activeRun, settings } = useStore();

  const list = useMemo(
    () => employees.filter((e) => e.status !== "resigned" && e.status !== "terminated"),
    [employees]
  );

  const pageCount = Math.max(1, Math.ceil(list.length / 12));
  const holidays = activeRun ? holidaysInMonth(activeRun.periodYear, activeRun.periodMonth) : [];
  const cal = activeRun ? monthCalendar(activeRun.periodYear, activeRun.periodMonth, false) : [];

  const onCsv = () => {
    if (!activeRun) return;
    const head = ["កូដ", "ឈ្មោះ", ...cal.map((c) => String(c.day)), "មក", "ច្បាប់", "OT"];
    const body = list.map((e) => [
      e.code, `${e.lastNameKh} ${e.firstNameKh}`,
      ...cal.map((c) => (c.isHoliday ? "ប" : c.isWeekend ? "" : "")),
      "", "", "",
    ]);
    exportCsv(`attendance-${activeRun.code}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="តារាងវត្តមានប្រចាំខែ"
        subtitle={activeRun ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${list.length} នាក់ · ${cal.length} ថ្ងៃ` : ""}
        filename={`attendance-${activeRun?.code ?? ""}.pdf`}
        docCode={`ATM/${activeRun?.periodYear ?? ""}/${String(activeRun?.periodMonth ?? "").padStart(2, "0")}`}
        backHref="/forms"
        orientation="landscape"
        pageCount={pageCount}
        onCsv={onCsv}
        note={`ថ្ងៃបុណ្យក្នុងខែនេះ ${holidays.length} ថ្ងៃ · ប្រអប់ពណ៌លឿង = ថ្ងៃបុណ្យជាតិ · ប្រអប់ស្រាល = ថ្ងៃសម្រាក`}
      />
      <PaperStage orientation="landscape">
        {!activeRun || list.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <AttendanceSheetDocument
            employees={list} run={activeRun} settings={settings}
            departments={departments} pageCount={pageCount}
          />
        )}
      </PaperStage>
    </div>
  );
}
