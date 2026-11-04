"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileDown, Users, Search, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { PayslipSheet } from "@/components/documents/PayslipDocument";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { Badge, Button, Input, Select } from "@/components/ui";
import { exportPagesToPdf } from "@/lib/pdf/export";
import { buildRows } from "@/lib/payroll/reporting";
import { monthYearKh, fullNameKh } from "@/lib/format";

export default function BatchPayslipsPage() {
  const { employees, payslips, activeRun, settings, departments, positions, departmentById, positionById, runs } = useStore();
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [posFilter, setPosFilter] = useState<string>("all");
  const [layout, setLayout] = useState<"two" | "one">("two");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    if (!activeRun) return [];
    const slips = payslips.filter((s) => s.runId === activeRun.id);
    let r = buildRows(slips, employees, departments, positions);
    if (deptFilter !== "all") r = r.filter((x) => x.employee.departmentId === deptFilter);
    if (posFilter !== "all") r = r.filter((x) => x.employee.positionId === posFilter);
    if (q.trim()) {
      const t = q.toLowerCase();
      r = r.filter(
        (x) =>
          `${x.employee.lastNameKh} ${x.employee.firstNameKh} ${x.employee.lastNameEn} ${x.employee.firstNameEn} ${x.employee.code}`
            .toLowerCase()
            .includes(t)
      );
    }
    return r;
  }, [payslips, activeRun, employees, departments, positions, deptFilter, posFilter, q]);

  const handleExportAll = async () => {
    setBusy(true);
    try {
      await exportPagesToPdf({
        filename: `payslips-${activeRun?.code ?? "all"}.pdf`,
        scale: 2.6,
        title: `ប័ណ្ណបៀវត្សរ៍ ${activeRun?.code ?? ""}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DocumentToolbar
        title={`ប័ណ្ណបៀវត្សរ៍ទាំងអស់ · ${rows.length} នាក់`}
        subtitle={
          activeRun
            ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${layout === "two" ? "២ ច្បាប់/ទំព័រ (បុគ្គលិក + ការិយាល័យ)" : "១ ច្បាប់/ទំព័រ"}`
            : ""
        }
        filename={`payslips-${activeRun?.code ?? "all"}.pdf`}
        docCode={activeRun?.code}
        backHref="/payslips"
        pageCount={rows.length}
        scale={2.6}
        note="រាល់ទំព័រ A4 មួយមានប័ណ្ណបៀវត្សរ៍ពីរច្បាប់ (បុគ្គលិក + ការិយាល័យ) ដោយមានបន្ទាត់កាត់។ បោះពុម្ពទ្វេភាគី ឬកាត់ជាករណី។"
      />

      {/* filter bar */}
      <div className="no-print sticky top-[57px] z-20 border-b border-ink-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ស្វែងរកបុគ្គលិក / កូដ…"
              className="h-8 w-52 pl-8 text-xs"
            />
          </div>
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-8 w-44 text-xs"
          >
            <option value="all">គ្រប់ដេប៉ាតឺម៉ង់</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameKh}
              </option>
            ))}
          </Select>
          <Select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="h-8 w-52 text-xs"
          >
            <option value="all">គ្រប់មុខតំណែង ({positions.length})</option>
            {[...positions]
              .sort((a, b) => b.level - a.level || a.code.localeCompare(b.code))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  L{p.level} · {p.nameKh}
                </option>
              ))}
          </Select>
          <div className="flex items-center gap-0.5 rounded-lg bg-ink-50 p-0.5 ring-1 ring-ink-200">
            <button
              onClick={() => setLayout("two")}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${layout === "two" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"}`}
            >
              ២ ច្បាប់
            </button>
            <button
              onClick={() => setLayout("one")}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${layout === "one" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"}`}
            >
              ១ ច្បាប់ (A5)
            </button>
          </div>
          <Badge tone="info" className="ml-auto">
            <Layers size={10} /> {rows.length} ទំព័រ
          </Badge>
          <Button size="sm" variant="outline" onClick={handleExportAll} loading={busy}>
            <FileDown size={13} /> នាំចេញទាំងអស់
          </Button>
        </div>
      </div>

      <PaperStage>
        {!activeRun || rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <Users size={28} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm font-semibold text-ink-700">គ្មានប័ណ្ណបៀវត្សរ៍</p>
            <p className="mt-1 text-xs text-ink-400">
              សូមគណនាវដ្តបៀវត្សរ៍ជាមុនសិន ឬជ្រើសរើសវដ្តផ្សេង។
            </p>
            <Link href="/payroll" className="mt-4 inline-block">
              <Button size="sm">ទៅកាន់វដ្តបៀវត្សរ៍</Button>
            </Link>
          </div>
        ) : (
          rows.map((r, i) => (
            <PayslipSheet
              key={r.slip.id}
              slip={r.slip}
              employee={r.employee}
              run={activeRun}
              settings={settings}
              departmentName={r.department?.nameKh ?? "—"}
              positionName={r.position?.nameKh ?? "—"}
              serial={i + 1}
            />
          ))
        )}
      </PaperStage>
    </div>
  );
}
