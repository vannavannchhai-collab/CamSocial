"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Users, Wallet, TrendingUp, Receipt, ShieldCheck, CalendarClock,
  ArrowUpRight, ArrowDownRight, FileText, Printer, AlertTriangle,
  BadgeCheck, Coins, Landmark, ChevronRight, Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { aggregate } from "@/lib/payroll/calc";
import { Badge, Button, Card, CardHeader, Stat, Avatar } from "@/components/ui";
import { Donut, BarChart, AreaChart, StackedBar } from "@/components/charts";
import { KHR, KHRs, USD, MONTHS_EN, MONTHS_KH, monthYearKh, fullNameKh, formatDate, compact } from "@/lib/format";
import { holidaysInMonth } from "@/lib/payroll/holidays";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const { employees, runs, payslips, activeRun, settings, departments, positionById, departmentById, attendanceSummary } = useStore();

  const activeSlips = useMemo(
    () => payslips.filter((s) => s.runId === activeRun?.id),
    [payslips, activeRun]
  );
  const totals = useMemo(() => aggregate(activeSlips), [activeSlips]);

  const activeEmployees = employees.filter(
    (e) => e.status !== "resigned" && e.status !== "terminated"
  );

  // ---- trend across runs ----
  const sortedRuns = useMemo(
    () =>
      [...runs].sort(
        (a, b) => a.periodYear - b.periodYear || a.periodMonth - b.periodMonth
      ),
    [runs]
  );

  const trend = useMemo(
    () =>
      sortedRuns.map((r) => {
        const t = aggregate(payslips.filter((s) => s.runId === r.id));
        return {
          run: r,
          label: MONTHS_KH[r.periodMonth - 1].slice(0, 3),
          gross: t.gross,
          net: t.netPay,
          cost: t.employerCost,
        };
      }),
    [sortedRuns, payslips]
  );

  const prev = trend.length > 1 ? trend[trend.length - 2] : null;
  const current = trend[trend.length - 1];
  const grossDelta = prev && prev.gross ? ((current.gross - prev.gross) / prev.gross) * 100 : 0;

  // ---- department breakdown ----
  const byDept = useMemo(() => {
    const colors = departments.map((d) => d.color);
    const map = new Map<string, { name: string; gross: number }>();
    activeSlips.forEach((s) => {
      const e = employees.find((x) => x.id === s.employeeId);
      if (!e) return;
      const d = departments.find((x) => x.id === e.departmentId);
      const key = d?.nameKh ?? "ផ្សេងៗ";
      const cur = map.get(key) ?? { name: key, gross: 0 };
      cur.gross += s.gross;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.gross - a.gross)
      .map((d, i) => ({ label: d.name, value: d.gross, color: colors[i % colors.length] }));
  }, [activeSlips, employees, departments]);

  const headByDept = useMemo(() => {
    return departments
      .map((d) => ({
        label: d.code,
        nameKh: d.nameKh,
        color: d.color,
        count: activeEmployees.filter((e) => e.departmentId === d.id).length,
      }))
      .filter((d) => d.count > 0);
  }, [departments, activeEmployees]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    activeEmployees.forEach((e) => (c[e.status] = (c[e.status] ?? 0) + 1));
    return c;
  }, [activeEmployees]);

  const otHours = activeSlips.reduce((s, p) => s + (p.overtimeHours ?? 0), 0);
  const avgNet = activeSlips.length ? totals.netPay / activeSlips.length : 0;
  const topEarners = [...activeSlips]
    .sort((a, b) => b.netPay - a.netPay)
    .slice(0, 5)
    .map((s) => ({ slip: s, emp: employees.find((e) => e.id === s.employeeId) }));

  const nextHolidays = activeRun ? holidaysInMonth(activeRun.periodYear, activeRun.periodMonth) : [];

  return (
    <div className="space-y-5">
      {/* ---------------- page head ---------------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink-900">
              ផ្ទាំងគ្រប់គ្រងបៀវត្សរ៍
            </h1>
            <Badge tone="success" dot>
              សកម្ម
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            {activeRun
              ? `${monthYearKh(activeRun.periodMonth, activeRun.periodYear)} · បើកប្រាក់ ${formatDate(activeRun.payDate)}`
              : "មិនទាន់មានវដ្តបៀវត្សរ៍"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/payslips/batch">
            <Button variant="outline" size="sm">
              <Printer size={14} /> បោះពុម្ពប័ណ្ណទាំងអស់
            </Button>
          </Link>
          <Link href="/payroll">
            <Button size="sm">
              <Wallet size={14} /> គ្រប់គ្រងវដ្តបៀវត្សរ៍
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------- KPI row ---------------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="ប្រាក់ខែសរុប (Gross)"
          value={KHRs(totals.gross)}
          sub={
            <span className={cn("inline-flex items-center gap-1", grossDelta >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {grossDelta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(grossDelta).toFixed(1)}% ធៀបខែមុន
            </span>
          }
          icon={<Wallet size={16} />}
          tone="info"
        />
        <Stat
          label="ប្រាក់ខែទទួលបាន (Net)"
          value={KHRs(totals.netPay)}
          sub={`≈ ${USD(totals.netPayUsd)} · មធ្យម ${KHRs(avgNet)}`}
          icon={<Coins size={16} />}
          tone="success"
        />
        <Stat
          label="ពន្ធលើបៀវត្សរ៍ (ToS)"
          value={KHRs(totals.tax)}
          sub={`${((totals.tax / (totals.taxableGross || 1)) * 100).toFixed(2)}% នៃប្រាក់ជាប់ពន្ធ`}
          icon={<Receipt size={16} />}
          tone="gold"
        />
        <Stat
          label="ចំណាយសរុបរបស់ក្រុមហ៊ុន"
          value={KHRs(totals.employerCost)}
          sub={`រួម ប.ស.ស និយោជក ${KHRs(totals.nssfEmployer)}`}
          icon={<Landmark size={16} />}
          tone="violet"
        />
      </div>

      {/* ---------------- secondary stats ---------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "បុគ្គលិកសកម្ម", value: String(activeEmployees.length), sub: `${headByDept.length} ដេប៉ាតឺម៉ង់`, icon: <Users size={15} /> },
          { label: "ប័ណ្ណបៀវត្សរ៍", value: String(activeSlips.length), sub: `${activeRun?.status === "draft" ? "សេចក្តីព្រាង" : "អនុម័តរួច"}`, icon: <FileText size={15} /> },
          { label: "ម៉ោងបន្ថែម (OT)", value: `${otHours} ម៉ោង`, sub: `× ${settings.otWeekdayRate} ថ្ងៃធម្មតា`, icon: <CalendarClock size={15} /> },
          { label: "ភាគទាន ប.ស.ស", value: KHRs(totals.nssfTotal), sub: `កម្រៃ ៛${compact(settings.nssfCeiling)}`, icon: <ShieldCheck size={15} /> },
        ].map((s, i) => (
          <Card key={i} className="flex items-center gap-3 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-500">
              {s.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-400">{s.label}</p>
              <p className="truncate text-sm font-bold text-ink-900 tnum">{s.value}</p>
              <p className="truncate text-[10px] text-ink-400">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ---------------- charts ---------------- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="និន្នាការប្រាក់ខែ"
            subtitle="ប្រាក់ខែសរុប និងចំណាយនិយោជក តាមខែ"
            icon={<TrendingUp size={15} />}
            action={
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-ink-700" /> Gross</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-ink-300" /> Employer cost</span>
              </div>
            }
          />
          <div className="p-4">
            <BarChart
              data={trend.map((t) => ({ label: t.label, value: t.gross, value2: t.cost }))}
              valueFormat={(n) => KHRs(n)}
              color="#3d4a80"
              height={172}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="ការបែងចែកតាមដេប៉ាតឺម៉ង់" subtitle="ភាគរយនៃប្រាក់ខែសរុប" icon={<Sparkles size={15} />} />
          <div className="p-4">
            <Donut
              data={byDept}
              centerValue={`${byDept.length}`}
              centerLabel="ដេប៉ាតឺម៉ង់"
              size={150}
            />
          </div>
        </Card>
      </div>

      {/* ---------------- middle grid ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* payroll composition */}
        <Card>
          <CardHeader title="រចនាសម្ព័ន្ធបៀវត្សរ៍" subtitle="បំណែកនៃប្រាក់ចំណូល និងការកាត់" icon={<Receipt size={15} />} />
          <div className="space-y-3.5 p-4">
            {[
              { label: "ប្រាក់ខែគោល", value: totals.gross - totals.nssfEmployee - totals.tax, color: "#3d4a80", pct: 100 },
              { label: "ភាគទាន ប.ស.ស (បុគ្គលិក)", value: totals.nssfEmployee, color: "#0f9b8e", pct: (totals.nssfEmployee / (totals.gross || 1)) * 100 },
              { label: "ពន្ធលើបៀវត្សរ៍", value: totals.tax, color: "#eaa92e", pct: (totals.tax / (totals.gross || 1)) * 100 },
              { label: "ការកាត់ផ្សេងៗ", value: totals.otherDeductions, color: "#d9576b", pct: (totals.otherDeductions / (totals.gross || 1)) * 100 },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-ink-600">{r.label}</span>
                  <span className="shrink-0 text-[11px] font-bold text-ink-900 tnum">{KHRs(r.value)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, r.pct))}%`, background: r.color }} />
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">ប្រាក់ខែទទួលបានសុទ្ធ</p>
              <p className="mt-0.5 text-base font-bold text-emerald-800 tnum">{KHRs(totals.netPay)}</p>
              <p className="text-[10px] text-emerald-600">≈ {USD(totals.netPayUsd)} USD</p>
            </div>
          </div>
        </Card>

        {/* headcount by dept */}
        <Card>
          <CardHeader title="ចំនួនបុគ្គលិកតាមដេប៉ាតឺម៉ង់" subtitle={`${activeEmployees.length} នាក់សរុប`} icon={<Users size={15} />} />
          <div className="space-y-2.5 p-4">
            {headByDept.map((d) => (
              <div key={d.label} className="flex items-center gap-2.5">
                <span className="grid h-6 w-9 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white" style={{ background: d.color }}>
                  {d.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink-700">{d.nameKh}</p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(d.count / activeEmployees.length) * 100}%`, background: d.color }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-ink-800 tnum">{d.count}</span>
              </div>
            ))}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-100 pt-3">
              {[
                { k: "សកម្ម", v: statusCounts.active ?? 0, tone: "text-emerald-600" },
                { k: "សាកល្បង", v: statusCounts.probation ?? 0, tone: "text-amber-600" },
                { k: "ផ្អាក", v: statusCounts.suspended ?? 0, tone: "text-rose-600" },
              ].map((s) => (
                <div key={s.k} className="text-center">
                  <p className={cn("text-base font-bold tnum", s.tone)}>{s.v}</p>
                  <p className="text-[9px] text-ink-400">{s.k}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* top earners */}
        <Card>
          <CardHeader
            title="ប្រាក់ខែទទួលបានខ្ពស់"
            subtitle="៥ នាក់កំពូល"
            icon={<BadgeCheck size={15} />}
            action={<Link href="/payslips" className="text-[11px] font-semibold text-ink-500 hover:text-ink-800">មើលទាំងអស់</Link>}
          />
          <ul className="divide-y divide-ink-100">
            {topEarners.map(({ slip, emp }, i) => (
              <li key={slip.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <span className="w-4 shrink-0 text-[10px] font-bold text-ink-300">{i + 1}</span>
                <Avatar name={emp ? fullNameKh(emp) : "?"} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-ink-800">
                    {emp ? fullNameKh(emp) : "—"}
                  </p>
                  <p className="truncate text-[9px] text-ink-400">
                    {emp ? departmentById(emp.departmentId)?.nameEn : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-ink-900 tnum">{KHR(slip.netPay)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---------------- bottom grid ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* upcoming holidays */}
        <Card>
          <CardHeader title="ថ្ងៃឈប់សម្រាកក្នុងខែនេះ" subtitle="ថ្ងៃបុណ្យជាតិ (គិតប្រាក់ឈ្នួល)" icon={<CalendarClock size={15} />} />
          <div className="p-4">
            {nextHolidays.length ? (
              <ul className="space-y-2">
                {nextHolidays.map((h) => {
                  const d = new Date(h.date);
                  return (
                    <li key={h.date} className="flex items-start gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                        <span className="text-[13px] font-bold leading-none">{d.getDate()}</span>
                        <span className="text-[8px] font-semibold uppercase">{MONTHS_EN[d.getMonth()].slice(0, 3)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-snug text-ink-800">{h.nameKh}</p>
                        <p className="text-[9px] text-ink-400">{h.nameEn}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-center text-[11px] text-ink-400">គ្មានថ្ងៃបុណ្យជាតិក្នុងខែនេះ</p>
            )}
          </div>
        </Card>

        {/* compliance */}
        <Card>
          <CardHeader title="ស្ថានភាពអនុលោមភាព" subtitle="ប.ស.ស និងសារពើពន្ធ" icon={<ShieldCheck size={15} />} />
          <div className="p-4">
            <StackedBar
              segments={[
                { label: "Net", value: totals.netPay, color: "#0f9b8e" },
                { label: "ToS", value: totals.tax, color: "#eaa92e" },
                { label: "NSSF", value: totals.nssfTotal, color: "#3d4a80" },
              ]}
              height={12}
            />
            <div className="mt-2 flex justify-between text-[9px] text-ink-400">
              <span>Net</span><span>ToS</span><span>NSSF</span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                { k: "ភាគទាន ប.ស.ស ត្រូវបង់", v: KHRs(totals.nssfTotal), ok: true, note: "ថ្ងៃទី ១៥ ខែបន្ទាប់" },
                { k: "ពន្ធលើបៀវត្សរ៍ត្រូវបង់", v: KHRs(totals.tax), ok: true, note: "ថ្ងៃទី ២០ ខែបន្ទាប់" },
                { k: "ប័ណ្ណបៀវត្សរ៍", v: `${activeSlips.length}/${activeEmployees.length}`, ok: activeSlips.length === activeEmployees.length, note: "បានបង្កើត" },
              ].map((r) => (
                <li key={r.k} className="flex items-center gap-2">
                  <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full text-white", r.ok ? "bg-emerald-500" : "bg-amber-500")}>
                    <BadgeCheck size={10} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-ink-700">{r.k}</p>
                    <p className="text-[9px] text-ink-400">{r.note}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-ink-900 tnum">{r.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* quick actions */}
        <Card>
          <CardHeader title="សកម្មភាពរហ័ស" subtitle="ទម្រង់ផ្លូវការ និងការនាំចេញ" icon={<Printer size={15} />} />
          <div className="grid grid-cols-2 gap-2 p-3">
            {[
              { href: "/forms/payroll-summary", label: "បញ្ជីបៀវត្សរ៍សង្ខេប", icon: FileText, tone: "bg-ink-50 text-ink-700" },
              { href: "/forms/nssf", label: "ទម្រង់ ប.ស.ស", icon: ShieldCheck, tone: "bg-teal-50 text-teal-700" },
              { href: "/forms/tos", label: "ទម្រង់ពន្ធ (ToS)", icon: Receipt, tone: "bg-gold-50 text-gold-700" },
              { href: "/forms/bank-transfer", label: "បញ្ជីផ្ទេរប្រាក់ធនាគារ", icon: Landmark, tone: "bg-violet-50 text-violet-700" },
              { href: "/payslips/batch", label: "ប័ណ្ណបៀវត្សរ៍ទាំងអស់", icon: Printer, tone: "bg-rose-50 text-rose-700" },
              { href: "/reports", label: "របាយការណ៍វិភាគ", icon: TrendingUp, tone: "bg-sky-50 text-sky-700" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex flex-col gap-1.5 rounded-xl border border-ink-100 p-2.5 transition-all hover:border-ink-300 hover:shadow-sm"
                >
                  <span className={cn("grid h-7 w-7 place-items-center rounded-lg", a.tone)}>
                    <Icon size={14} />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-ink-700 group-hover:text-ink-900">
                    {a.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---------------- warnings ---------------- */}
      {(() => {
        const noNssf = activeEmployees.filter((e) => !e.nssfNumber);
        const issues: { tone: "warning" | "danger" | "info"; text: string }[] = [];
        if (activeRun?.status === "draft")
          issues.push({ tone: "info", text: `វដ្ត ${activeRun.code} ជាសេចក្តីព្រាង — ត្រូវអនុម័តមុនបើកប្រាក់` });
        if (noNssf.length)
          issues.push({ tone: "warning", text: `${noNssf.length} នាក់មិនទាន់មានលេខ ប.ស.ស` });
        if (activeSlips.some((s) => s.netPay <= 0))
          issues.push({ tone: "danger", text: "មានប័ណ្ណបៀវត្សរ៍ដែលប្រាក់ទទួលបាន = 0 — ពិនិត្យការកាត់ប្រាក់" });
        if (!issues.length) return null;
        return (
          <Card className="border-amber-200 bg-amber-50/40">
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-amber-900">ត្រូវយកចិត្តទុកដាក់</p>
                <ul className="mt-1 space-y-1">
                  {issues.map((i, idx) => (
                    <li key={idx} className="text-[11px] text-amber-800">• {i.text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
