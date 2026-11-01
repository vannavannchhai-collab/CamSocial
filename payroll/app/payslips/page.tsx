"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText, Search, Download, Printer, Eye, Layers, Users, Wallet,
  TrendingUp, Receipt, ChevronDown, FileDown, CheckSquare, Square,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Avatar, Badge, Button, Card, EmptyState, Input, Modal, Select,
  Stat, Table, Td, Th,
} from "@/components/ui";
import { PayslipDocument } from "@/components/documents/PayslipDocument";
import { exportPagesToPdf, exportCsv } from "@/lib/pdf/export";
import { aggregate } from "@/lib/payroll/calc";
import { buildRows } from "@/lib/payroll/reporting";
import {
  KHR, KHRs, USD, monthYearKh, fullNameKh, fullNameEn, formatDate, toKhmerDigits,
} from "@/lib/format";
import { cn } from "@/lib/cn";

export default function PayslipsPage() {
  const {
    payslips, activeRun, employees, departments, positions, settings,
    departmentById, positionById, runs,
  } = useStore();

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const allRows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(
      payslips.filter((s) => s.runId === activeRun.id),
      employees, departments, positions
    );
  }, [payslips, activeRun, employees, departments, positions]);

  const rows = useMemo(() => {
    let r = allRows;
    if (q.trim()) {
      const t = q.toLowerCase();
      r = r.filter((x) =>
        `${x.employee.code} ${x.employee.lastNameKh} ${x.employee.firstNameKh} ${x.employee.lastNameEn} ${x.employee.firstNameEn}`
          .toLowerCase()
          .includes(t)
      );
    }
    if (dept !== "all") r = r.filter((x) => x.employee.departmentId === dept);
    return r;
  }, [allRows, q, dept]);

  const totals = useMemo(() => aggregate(rows.map((r) => r.slip)), [rows]);
  const previewRow = preview ? allRows.find((r) => r.slip.id === preview) : null;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () =>
    setSelected((s) => (s.length === rows.length ? [] : rows.map((r) => r.slip.id)));

  const downloadOne = async (slipId: string) => {
    setBusyId(slipId);
    const row = allRows.find((r) => r.slip.id === slipId);
    setPreview(slipId);
    await new Promise((r) => setTimeout(r, 380));
    try {
      await exportPagesToPdf({
        root: document.getElementById("single-preview"),
        filename: `payslip-${row?.employee.code ?? "employee"}-${activeRun?.code ?? ""}.pdf`,
        scale: 3,
        title: `ប័ណ្ណបៀវត្សរ៍ ${row?.employee.code}`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const onExportCsv = () => {
    const head = [
      "កូដ", "ឈ្មោះ", "ដេប៉ាតឺមង់", "មុខតំណែង",
      "ប្រាក់ខែគោល", "ប្រាក់ឧបត្ថម្ភ", "OT", "ចំណូលសរុប",
      "ប.ស.ស", "ពន្ធ", "កាត់សរុប", "ទទួលបាន", "USD",
    ];
    const body = rows.map((r) => {
      const base = r.slip.earnings.find((e) => e.category === "base")?.amount ?? 0;
      const allow = r.slip.earnings.filter((e) => e.category === "allowance").reduce((a, e) => a + e.amount, 0);
      const ot = r.slip.earnings.filter((e) => e.category === "overtime").reduce((a, e) => a + e.amount, 0);
      return [
        r.employee.code, `${r.employee.lastNameKh} ${r.employee.firstNameKh}`,
        r.department?.nameKh ?? "", r.position?.nameKh ?? "",
        base, allow, ot, r.slip.gross,
        r.slip.nssfEmployee, r.slip.tax, r.slip.totalDeductions, r.slip.netPay, r.slip.netPayUsd,
      ];
    });
    exportCsv(`payslips-${activeRun?.code ?? "all"}.csv`, [head, ...body]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">ប័ណ្ណបៀវត្សរ៍</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {activeRun ? `${activeRun.code} · ${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · ${allRows.length} ប័ណ្ណ` : "គ្មានវដ្តសកម្ម"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.length > 0 && (
            <Badge tone="info">{selected.length} បានជ្រើស</Badge>
          )}
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            <Download size={14} /> CSV
          </Button>
          <Link href="/payslips/batch">
            <Button size="sm">
              <Printer size={14} /> បោះពុម្ពទាំងអស់
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="ចំណូលសរុប" value={KHRs(totals.gross)} sub={`${rows.length} ប័ណ្ណ`} icon={<Wallet size={16} />} tone="info" />
        <Stat label="ប្រាក់ទទួលបាន" value={KHRs(totals.netPay)} sub={`≈ ${USD(totals.netPayUsd)}`} icon={<TrendingUp size={16} />} tone="success" />
        <Stat label="ពន្ធលើបៀវត្សរ៍" value={KHRs(totals.tax)} sub={`${((totals.tax / (totals.taxableGross || 1)) * 100).toFixed(2)}%`} icon={<Receipt size={16} />} tone="gold" />
        <Stat label="ប.ស.ស (ពីរភាគី)" value={KHRs(totals.nssfTotal)} sub={`បុគ្គលិក ${KHRs(totals.nssfEmployee)}`} icon={<Users size={16} />} tone="violet" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកបុគ្គលិក…" className="h-9 pl-9 text-xs" />
          </div>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 w-44 text-xs">
            <option value="all">គ្រប់ដេប៉ាតឺម៉ង់</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.nameKh}</option>
            ))}
          </Select>
          <Select
            value={activeRun?.id ?? ""}
            onChange={() => {}}
            className="h-9 w-40 text-xs"
            disabled
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>{r.code}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="គ្មានប័ណ្ណបៀវត្សរ៍" description="គណនាវដ្តបៀវត្សរ៍ជាមុនសិន" action={<Link href="/payroll"><Button size="sm">ទៅកាន់វដ្ត</Button></Link>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-8">
                  <button onClick={toggleAll} className="text-ink-500 hover:text-ink-900">
                    {selected.length === rows.length && rows.length > 0 ? (
                      <CheckSquare size={14} />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </Th>
                <Th>បុគ្គលិក</Th>
                <Th>ដេប៉ាតឺមង់</Th>
                <Th align="right">ចំណូលសរុប</Th>
                <Th align="right">ប.ស.ស</Th>
                <Th align="right">ពន្ធ</Th>
                <Th align="right">កាត់សរុប</Th>
                <Th align="right">ទទួលបាន</Th>
                <Th align="center" className="w-24">សកម្មភាព</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSel = selected.includes(r.slip.id);
                return (
                  <tr key={r.slip.id} className={cn("group transition-colors", isSel ? "bg-sky-50/60" : "hover:bg-ink-50/60")}>
                    <Td>
                      <button onClick={() => toggle(r.slip.id)} className="text-ink-400 hover:text-ink-900">
                        {isSel ? <CheckSquare size={14} className="text-sky-600" /> : <Square size={14} />}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullNameKh(r.employee)} size={30} />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-ink-900">{fullNameKh(r.employee)}</p>
                          <p className="truncate text-[10px] text-ink-400">{r.employee.code} · {r.position?.nameKh}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[10px] font-medium text-ink-600">{r.department?.code}</span>
                    </Td>
                    <Td align="right"><span className="text-[11px] font-semibold text-ink-900">{KHR(r.slip.gross)}</span></Td>
                    <Td align="right"><span className="text-[11px] text-ink-600">{KHR(r.slip.nssfEmployee)}</span></Td>
                    <Td align="right"><span className="text-[11px] text-ink-600">{KHR(r.slip.tax)}</span></Td>
                    <Td align="right"><span className="text-[11px] text-rose-600">{KHR(r.slip.totalDeductions)}</span></Td>
                    <Td align="right"><span className="text-[12px] font-bold text-emerald-700">{KHR(r.slip.netPay)}</span></Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => setPreview(r.slip.id)}
                          className="grid h-7 w-7 place-items-center rounded text-ink-500 hover:bg-ink-100"
                          title="មើល"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => downloadOne(r.slip.id)}
                          disabled={busyId === r.slip.id}
                          className="grid h-7 w-7 place-items-center rounded text-ink-500 hover:bg-ink-100 disabled:opacity-40"
                          title="ទាញយក PDF"
                        >
                          <FileDown size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50 font-bold">
                <Td colSpan={3}>
                  សរុប ({rows.length} នាក់)
                </Td>
                <Td align="right">{KHR(totals.gross)}</Td>
                <Td align="right">{KHR(totals.nssfEmployee)}</Td>
                <Td align="right">{KHR(totals.tax)}</Td>
                <Td align="right">{KHR(totals.totalDeductions)}</Td>
                <Td align="right" className="text-emerald-700">{KHR(totals.netPay)}</Td>
                <Td />
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>

      {/* ---------- preview modal ---------- */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="ប័ណ្ណបៀវត្សរ៍"
        subtitle={previewRow ? `${previewRow.employee.code} · ${fullNameEn(previewRow.employee)}` : ""}
        size="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>បិទ</Button>
            <Button size="sm" onClick={() => preview && downloadOne(preview)} loading={!!busyId}>
              <FileDown size={13} /> ទាញយក PDF
            </Button>
          </>
        }
      >
        {previewRow && activeRun && (
          <div className="overflow-x-auto bg-ink-100 p-3">
            <div
              id="single-preview"
              style={{ transform: "scale(0.74)", transformOrigin: "top center", height: "fit-content" }}
            >
              <PayslipDocument
                slip={previewRow.slip}
                employee={previewRow.employee}
                run={activeRun}
                settings={settings}
                departmentName={previewRow.department?.nameKh ?? "—"}
                positionName={previewRow.position?.nameKh ?? "—"}
                serial={allRows.findIndex((x) => x.slip.id === previewRow.slip.id) + 1}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
