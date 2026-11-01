"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet, Play, CheckCircle2, Clock, FileText, Calculator, Plus,
  ArrowRight, Banknote, ShieldCheck, Receipt, Users, TrendingUp,
  AlertTriangle, ChevronRight, Layers, CalendarCheck, Lock, Printer,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge, Button, Card, CardHeader, EmptyState, Input, Label, Modal,
  Progress, Select, Stat, Table, Td, Th, Textarea,
} from "@/components/ui";
import { aggregate } from "@/lib/payroll/calc";
import {
  KHRs, KHR, USD, monthYearKh, monthYearEn, formatDate, toKhmerDigits, compact,
} from "@/lib/format";
import { workingDaysInMonth, holidaysInMonth } from "@/lib/payroll/holidays";
import { cn } from "@/lib/cn";
import type { PayrollRun, PayrollRunStatus } from "@/lib/types";
import { uid } from "@/lib/format";

const STATUS: Record<PayrollRunStatus, { label: string; tone: any; icon: any }> = {
  draft: { label: "សេចក្តីព្រាង", tone: "neutral", icon: FileText },
  review: { label: "កំពុងត្រួតពិនិត្យ", tone: "warning", icon: Clock },
  approved: { label: "បានអនុម័ត", tone: "info", icon: CheckCircle2 },
  paid: { label: "បានបើកប្រាក់", tone: "success", icon: Banknote },
  cancelled: { label: "បោះបង់", tone: "danger", icon: AlertTriangle },
};

const FLOW: PayrollRunStatus[] = ["draft", "review", "approved", "paid"];

export default function PayrollPage() {
  const {
    runs, payslips, activeRun, setActiveRunId, employees, settings,
    updateRun, recalculateRun, addRun, toast,
  } = useStore();

  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...runs].sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth),
    [runs]
  );

  const runStats = useMemo(() => {
    const map = new Map<string, ReturnType<typeof aggregate>>();
    sorted.forEach((r) => {
      map.set(r.id, aggregate(payslips.filter((s) => s.runId === r.id)));
    });
    return map;
  }, [sorted, payslips]);

  const activeTotals = activeRun ? runStats.get(activeRun.id) : null;
  const activeSlips = payslips.filter((s) => s.runId === activeRun?.id);
  const activeEmployees = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");
  const holidays = activeRun ? holidaysInMonth(activeRun.periodYear, activeRun.periodMonth) : [];

  const advanceStatus = (run: PayrollRun, next: PayrollRunStatus) => {
    updateRun(run.id, {
      status: next,
      approvedBy: next === "approved" || next === "paid" ? settings.company.signatoryNameKh : run.approvedBy,
      approvedAt: next === "approved" || next === "paid" ? new Date().toISOString().slice(0, 10) : run.approvedAt,
    });
    toast({
      title: `បានប្តូរស្ថានភាពទៅ "${STATUS[next].label}"`,
      description: run.code,
      tone: next === "cancelled" ? "error" : "success",
    });
  };

  const handleRecalc = () => {
    if (!activeRun) return;
    setBusy(true);
    setTimeout(() => {
      recalculateRun(activeRun.id);
      setBusy(false);
    }, 420);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">វដ្តបៀវត្សរ៍</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            គ្រប់គ្រងដំណើរការគណនា អនុម័ត និងបើកប្រាក់ប្រចាំខែ
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} /> បង្កើតវដ្តថ្មី
        </Button>
      </div>

      {/* ---------- workflow stepper ---------- */}
      {activeRun && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-900 text-white">
                <Wallet size={14} />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink-900">{activeRun.code}</p>
                <p className="text-[10px] text-ink-400">
                  {monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · បើកប្រាក់ {formatDate(activeRun.payDate)}
                </p>
              </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS[activeRun.status].tone} dot>
                {STATUS[activeRun.status].label}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRecalc} loading={busy}>
                <Calculator size={13} /> គណនាឡើងវិញ
              </Button>
            </div>
          </div>

          {/* stepper */}
          <div className="flex flex-wrap items-center gap-1 px-4 py-3">
            {FLOW.map((s, i) => {
              const cur = FLOW.indexOf(activeRun.status);
              const done = i < cur || activeRun.status === "paid";
              const isCur = s === activeRun.status;
              const Icon = STATUS[s].icon;
              return (
                <React.Fragment key={s}>
                  <button
                    onClick={() => {
                      if (i <= cur) advanceStatus(activeRun, s);
                    }}
                    disabled={i > cur + 1 || activeRun.status === "paid"}
                    className={cn(
                      "group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                      isCur && "bg-ink-900 text-white shadow-sm",
                      done && !isCur && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                      !done && !isCur && "text-ink-400",
                      i <= cur + 1 && !isCur && "hover:bg-ink-100",
                      i > cur + 1 && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Icon size={12} />
                    {STATUS[s].label}
                  </button>
                  {i < FLOW.length - 1 && (
                    <ChevronRight size={12} className={cn(done ? "text-emerald-400" : "text-ink-300")} />
                  )}
                </React.Fragment>
              );
            })}
            {activeRun.status !== "paid" && FLOW.indexOf(activeRun.status) < 3 && (
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => {
                  const next = FLOW[FLOW.indexOf(activeRun.status) + 1];
                  if (next) advanceStatus(activeRun, next);
                }}
              >
                {FLOW.indexOf(activeRun.status) === 0 && <>បញ្ជូនត្រួតពិនិត្យ <ArrowRight size={13} /></>}
                {FLOW.indexOf(activeRun.status) === 1 && <>អនុម័ត <CheckCircle2 size={13} /></>}
                {FLOW.indexOf(activeRun.status) === 2 && <>បើកប្រាក់ <Banknote size={13} /></>}
              </Button>
            )}
            {activeRun.status === "paid" && (
              <Link href="/payslips" className="ml-auto">
                <Button size="sm" variant="outline">
                  <FileText size={13} /> មើលប័ណ្ណ
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* ---------- active run KPIs ---------- */}
      {activeRun && activeTotals && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="ប្រាក់ខែសរុប (Gross)" value={KHRs(activeTotals.gross)} sub={`${activeSlips.length}/${activeEmployees.length} ប័ណ្ណ`} icon={<Wallet size={16} />} tone="info" />
          <Stat label="ប្រាក់ទទួលបាន (Net)" value={KHRs(activeTotals.netPay)} sub={`≈ ${USD(activeTotals.netPayUsd)}`} icon={<Banknote size={16} />} tone="success" />
          <Stat label="ពន្ធ + ប.ស.ស" value={KHRs(activeTotals.tax + activeTotals.nssfTotal)} sub={`ពន្ធ ${KHRs(activeTotals.tax)} · ប.ស.ស ${KHRs(activeTotals.nssfTotal)}`} icon={<ShieldCheck size={16} />} tone="gold" />
          <Stat label="ចំណាយក្រុមហ៊ុន" value={KHRs(activeTotals.employerCost)} sub={`NSSF និយោជក ${KHRs(activeTotals.nssfEmployer)}`} icon={<TrendingUp size={16} />} tone="violet" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* ---------- run list ---------- */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="បញ្ជីវដ្តបៀវត្សរ៍"
            subtitle={`${runs.length} វដ្ត · ជ្រើសរើសដើម្បីមើលលម្អិត`}
            icon={<Layers size={15} />}
          />
          {sorted.length === 0 ? (
            <EmptyState icon={<Wallet size={22} />} title="មិនទាន់មានវដ្ត" description="បង្កើតវដ្តបៀវត្សរ៍ដំបូងរបស់អ្នក" action={<Button size="sm" onClick={() => setShowNew(true)}><Plus size={14} /> បង្កើតវដ្ត</Button>} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>វដ្ត</Th>
                  <Th>កាលបរិច្ឆេទ</Th>
                  <Th align="right">ប្រាក់ខែសរុប</Th>
                  <Th align="right">សុទ្ធ</Th>
                  <Th align="center">ប័ណ្ណ</Th>
                  <Th align="center">ស្ថានភាព</Th>
                  <Th align="center" className="w-16" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const t = runStats.get(r.id)!;
                  const isActive = r.id === activeRun?.id;
                  const cnt = payslips.filter((s) => s.runId === r.id).length;
                  const S = STATUS[r.status];
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setActiveRunId(r.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isActive ? "bg-ink-50" : "hover:bg-ink-50/60"
                      )}
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-ink-900" />}
                          <div>
                            <p className="text-[12px] font-bold text-ink-900">{r.code}</p>
                            <p className="text-[10px] text-ink-400">{monthYearEn(r.periodMonth, r.periodYear)}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-[11px] text-ink-700">{formatDate(r.payDate)}</p>
                        <p className="text-[10px] text-ink-400">{r.workingDays} ថ្ងៃធ្វើការ</p>
                      </Td>
                      <Td align="right">
                        <p className="text-[11px] font-semibold text-ink-900">{KHR(t.gross)}</p>
                      </Td>
                      <Td align="right">
                        <p className="text-[11px] font-bold text-emerald-700">{KHR(t.netPay)}</p>
                      </Td>
                      <Td align="center">
                        <span className="text-[11px] text-ink-600 tnum">{cnt}</span>
                      </Td>
                      <Td align="center">
                        <Badge tone={S.tone} dot>{S.label}</Badge>
                      </Td>
                      <Td align="center">
                        <ArrowRight size={13} className="mx-auto text-ink-300" />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* ---------- right column ---------- */}
        <div className="space-y-4">
          {/* checklist */}
          <Card>
            <CardHeader title="បញ្ជីត្រួតពិនិត្យមុនបើកប្រាក់" subtitle="Checklist" icon={<CalendarCheck size={15} />} />
            <div className="space-y-2 p-4">
              {activeRun && [
                {
                  k: "ប័ណ្ណបៀវត្សរ៍គ្រប់ចំនួន",
                  ok: activeSlips.length === activeEmployees.length,
                  v: `${activeSlips.length}/${activeEmployees.length}`,
                },
                {
                  k: "គណនាឡើងវិញចុងក្រោយ",
                  ok: true,
                  v: formatDate(activeRun.createdAt),
                },
                {
                  k: "វត្តមាន និងម៉ោង OT",
                  ok: true,
                  v: `${activeSlips.reduce((s, x) => s + x.overtimeHours, 0)} ម៉ោង`,
                },
                {
                  k: "ថ្ងៃបុណ្យជាតិក្នុងខែ",
                  ok: true,
                  v: `${holidays.length} ថ្ងៃ`,
                },
                {
                  k: "អនុម័តដោយនាយក",
                  ok: !!activeRun.approvedBy,
                  v: activeRun.approvedBy ?? "មិនទាន់",
                },
                {
                  k: "ផ្ទៀងផ្ទាត់គណនីធនាគារ",
                  ok: activeEmployees.every((e) => e.bankAccount),
                  v: `${activeEmployees.filter((e) => e.bankAccount).length}/${activeEmployees.length}`,
                },
              ].map((c) => (
                <div key={c.k} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full text-white",
                      c.ok ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  >
                    <CheckCircle2 size={9} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-700">{c.k}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-ink-500 tnum">{c.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* statutory deadlines */}
          <Card>
            <CardHeader title="កាលកំណត់សារពើពន្ធ" subtitle="ត្រូវបង់បន្ទាប់ពីបើកប្រាក់" icon={<Receipt size={15} />} />
            <div className="divide-y divide-ink-100">
              {[
                { k: "ប.ស.ស (ប.ស.ស)", day: 15, amt: activeTotals?.nssfTotal ?? 0, tone: "text-teal-700" },
                { k: "ពន្ធលើបៀវត្សរ៍ (GDT)", day: 20, amt: activeTotals?.tax ?? 0, tone: "text-gold-700" },
              ].map((x) => {
                const due = activeRun
                  ? new Date(activeRun.periodYear, activeRun.periodMonth, x.day)
                  : null;
                return (
                  <div key={x.k} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-[10px] font-bold text-ink-600 tnum">
                      {toKhmerDigits(x.day)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-ink-800">{x.k}</p>
                      <p className="text-[10px] text-ink-400">
                        ត្រូវបង់មុន {due ? formatDate(due.toISOString().slice(0, 10)) : "—"}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-[11px] font-bold tnum", x.tone)}>{KHR(x.amt)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-ink-100 p-3">
              <Link href="/forms">
                <Button variant="outline" size="sm" className="w-full">
                  <Printer size={13} /> បង្កើតទម្រង់បង់ពន្ធ
                </Button>
              </Link>
            </div>
          </Card>

          {/* period info */}
          {activeRun && (
            <Card className="p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">ព័ត៌មានវដ្ត</p>
              <dl className="space-y-1.5">
                {[
                  ["លេខកូដ", activeRun.code],
                  ["កាលបរិច្ឆេទ", monthYearKh(activeRun.periodMonth, activeRun.periodYear)],
                  ["ថ្ងៃបើកប្រាក់", formatDate(activeRun.payDate)],
                  ["ថ្ងៃធ្វើការស្តង់ដារ", `${toKhmerDigits(workingDaysInMonth(activeRun.periodYear, activeRun.periodMonth))} ថ្ងៃ`],
                  ["ថ្ងៃបុណ្យជាតិ", `${toKhmerDigits(holidays.length)} ថ្ងៃ`],
                  ["អត្រាប្តូរប្រាក់", `៛${KHR(activeRun.exchangeRate)}/USD`],
                  ["អ្នកអនុម័ត", activeRun.approvedBy ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-2">
                    <dt className="shrink-0 text-[10px] text-ink-400">{k}</dt>
                    <dd className="truncate text-right text-[11px] font-semibold text-ink-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>

      <NewRunModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}

function NewRunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { runs, addRun, settings, employees } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payDay, setPayDay] = useState(25);
  const [rate, setRate] = useState(settings.exchangeRate);
  const [note, setNote] = useState("");

  const exists = runs.some((r) => r.periodMonth === month && r.periodYear === year);
  const wd = workingDaysInMonth(year, month);
  const hol = holidaysInMonth(year, month);
  const activeCount = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated").length;

  const create = () => {
    const id = `run_${year}_${String(month).padStart(2, "0")}`;
    addRun({
      id,
      code: `PAY-${year}-${String(month).padStart(2, "0")}`,
      periodMonth: month,
      periodYear: year,
      payDate: `${year}-${String(month).padStart(2, "0")}-${String(payDay).padStart(2, "0")}`,
      status: "draft",
      workingDays: wd,
      note,
      createdAt: new Date().toISOString().slice(0, 10),
      exchangeRate: rate,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="បង្កើតវដ្តបៀវត្សរ៍ថ្មី"
      subtitle="ប្រព័ន្ធនឹងគណនាប័ណ្ណបៀវត្សរ៍សម្រាប់បុគ្គលិកសកម្មទាំងអស់"
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>បោះបង់</Button>
          <Button size="sm" onClick={create} disabled={exists}>
            <Play size={14} /> បង្កើត និងគណនា
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label required>ខែ</Label>
          <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthYearKh(m, year)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label required>ឆ្នាំ</Label>
          <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label required>ថ្ងៃបើកប្រាក់</Label>
          <Input type="number" min={1} max={31} value={payDay} onChange={(e) => setPayDay(Number(e.target.value))} />
        </div>
        <div>
          <Label hint="៛/USD">អត្រាប្តូរប្រាក់</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <Label>ចំណាំ</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ឧ. រួមបញ្ចូលប្រាក់រង្វាន់បុណ្យភ្ជុំបិណ្ឌ" />
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-ink-50 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["លេខកូដ", `PAY-${year}-${String(month).padStart(2, "0")}`],
            ["បុគ្គលិក", `${activeCount} នាក់`],
            ["ថ្ងៃធ្វើការ", `${wd} ថ្ងៃ`],
            ["ថ្ងៃបុណ្យ", `${hol.length} ថ្ងៃ`],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[9px] uppercase tracking-wide text-ink-400">{k}</p>
              <p className="text-[12px] font-bold text-ink-900">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {exists && (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle size={12} /> វដ្តសម្រាប់ខែនេះមានរួចហើយ — សូមជ្រើសខែផ្សេង។
        </p>
      )}
    </Modal>
  );
}
