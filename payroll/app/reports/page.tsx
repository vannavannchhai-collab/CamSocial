"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, BarChart3, PieChart, Building2, Users, Wallet, Receipt,
  ShieldCheck, Download, Calendar, ArrowUpRight, ArrowDownRight, Printer,
  FileSpreadsheet, Layers,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, CardHeader, Select, Stat, Table, Td, Th } from "@/components/ui";
import { BarChart, Donut, AreaChart, StackedBar } from "@/components/charts";
import { aggregate, sumCategory } from "@/lib/payroll/calc";
import { departmentTotals, buildRows } from "@/lib/payroll/reporting";
import {
  KHR, KHRs, USD, MONTHS_KH, MONTHS_EN, compact, toKhmerDigits, formatDate,
} from "@/lib/format";
import { exportCsv } from "@/lib/pdf/export";
import { cn } from "@/lib/cn";

export default function ReportsPage() {
  const { runs, payslips, employees, departments, positions, settings } = useStore();
  const [range, setRange] = useState("all");

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => a.periodYear - b.periodYear || a.periodMonth - b.periodMonth),
    [runs]
  );

  const series = useMemo(
    () =>
      sortedRuns.map((r) => {
        const slips = payslips.filter((s) => s.runId === r.id);
        const t = aggregate(slips);
        return { run: r, slips, t };
      }),
    [sortedRuns, payslips]
  );

  const activeRun = series[series.length - 1];
  const current = activeRun?.t;
  const prev = series.length > 1 ? series[series.length - 2].t : null;

  const rows = useMemo(() => {
    if (!activeRun) return [];
    return buildRows(activeRun.slips, employees, departments, positions);
  }, [activeRun, employees, departments, positions]);

  const depts = useMemo(() => departmentTotals(rows, departments), [rows, departments]);

  const delta = (a?: number, b?: number) =>
    a && b ? ((b - a) / a) * 100 : 0;

  const base = activeRun ? sumCategory(activeRun.slips, "base", "earning") : 0;
  const allow = activeRun ? sumCategory(activeRun.slips, "allowance", "earning") : 0;
  const ot = activeRun ? sumCategory(activeRun.slips, "overtime", "earning") : 0;

  const allBase = series.reduce((s, x) => s + sumCategory(x.slips, "base", "earning"), 0);
  const allNet = series.reduce((s, x) => s + x.t.netPay, 0);
  const allTax = series.reduce((s, x) => s + x.t.tax, 0);
  const allNssf = series.reduce((s, x) => s + x.t.nssfTotal, 0);

  const onExportTrend = () => {
    const head = ["វដ្ត", "ខែ", "ឆ្នាំ", "បុគ្គលិក", "ចំណូលសរុប", "ប.ស.ស", "ពន្ធ", "ទទួលបាន", "ចំណាយក្រុមហ៊ុន"];
    const body = series.map((x) => [
      x.run.code, x.run.periodMonth, x.run.periodYear, x.t.headcount,
      x.t.gross, x.t.nssfTotal, x.t.tax, x.t.netPay, x.t.employerCost,
    ]);
    exportCsv("payroll-trend.csv", [head, ...body]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">របាយការណ៍វិភាគ</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            និន្នាការបៀវត្សរ៍ · ការបែងចែកថ្លៃដើម · ការអនុលោមភាព
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportTrend}>
            <Download size={14} /> នាំចេញនិន្នាការ
          </Button>
          <Link href="/forms/payroll-summary">
            <Button size="sm">
              <Printer size={14} /> របាយការណ៍ផ្លូវការ
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="ចំណូលសរុប (ខែបច្ចុប្បន្ន)"
          value={KHRs(current?.gross ?? 0)}
          sub={
            <span className={cn("inline-flex items-center gap-0.5", delta(prev?.gross, current?.gross) >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {delta(prev?.gross, current?.gross) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(delta(prev?.gross, current?.gross)).toFixed(1)}%
            </span>
          }
          icon={<Wallet size={16} />} tone="info"
        />
        <Stat label="ពន្ធសរុប" value={KHRs(current?.tax ?? 0)} sub={`អត្រាប្រសិទ្ធភាព ${(((current?.tax ?? 0) / (current?.taxableGross || 1)) * 100).toFixed(2)}%`} icon={<Receipt size={16} />} tone="gold" />
        <Stat label="ប.ស.ស សរុប" value={KHRs(current?.nssfTotal ?? 0)} sub={`បុគ្គលិក ${KHRs(current?.nssfEmployee ?? 0)}`} icon={<ShieldCheck size={16} />} tone="success" />
        <Stat label="ចំណាយក្រុមហ៊ុន" value={KHRs(current?.employerCost ?? 0)} sub={`≈ ${USD((current?.employerCost ?? 0) / settings.exchangeRate)}`} icon={<TrendingUp size={16} />} tone="violet" />
      </div>

      {/* trend */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="និន្នាការចំណាយបៀវត្សរ៍"
            subtitle={`${series.length} ខែ · ចំណូលសរុប ${KHRs(series.reduce((s, x) => s + x.t.gross, 0))}`}
            icon={<TrendingUp size={15} />}
          />
          <div className="p-4">
            <BarChart
              data={series.map((x) => ({
                label: MONTHS_KH[x.run.periodMonth - 1].slice(0, 3),
                value: x.t.gross,
              }))}
              valueFormat={(n) => KHRs(n)}
              height={190}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="រចនាសម្ព័ន្ធចំណាយ" subtitle="ខែបច្ចុប្បន្ន" icon={<PieChart size={15} />} />
          <div className="p-4">
            <Donut
              data={[
                { label: "ប្រាក់ទទួលបាន", value: current?.netPay ?? 0, color: "#0f9b8e" },
                { label: "ពន្ធលើបៀវត្សរ៍", value: current?.tax ?? 0, color: "#eaa92e" },
                { label: "ប.ស.ស (បុគ្គលិក)", value: current?.nssfEmployee ?? 0, color: "#3d4a80" },
                { label: "ប.ស.ស (និយោជក)", value: current?.nssfEmployer ?? 0, color: "#6d7cb5" },
                { label: "កាត់ផ្សេងៗ", value: current?.otherDeductions ?? 0, color: "#d9576b" },
              ]}
              size={150}
              centerValue={compact(current?.employerCost ?? 0)}
              centerLabel="ចំណាយសរុប"
            />
          </div>
        </Card>
      </div>

      {/* composition + dept */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="សមាសភាពប្រាក់ចំណូល" subtitle="បំណែកនៃ Gross" icon={<BarChart3 size={15} />} />
          <div className="space-y-3 p-4">
            {[
              { k: "ប្រាក់ខែគោល", v: base, c: "#3d4a80" },
              { k: "ប្រាក់ឧបត្ថម្ភ", v: allow, c: "#0f9b8e" },
              { k: "ប្រាក់ថែមម៉ោង", v: ot, c: "#eaa92e" },
            ].map((x) => (
              <div key={x.k}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[11px] text-ink-600">{x.k}</span>
                  <span className="text-[11px] font-bold text-ink-900 tnum">
                    {KHRs(x.v)} <span className="text-[9px] font-normal text-ink-400">({((x.v / (current?.gross || 1)) * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full" style={{ width: `${(x.v / (current?.gross || 1)) * 100}%`, background: x.c }} />
                </div>
              </div>
            ))}
            <div className="mt-3 rounded-lg bg-ink-50 p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["បុគ្គលិក", String(current?.headcount ?? 0)],
                  ["មធ្យម/នាក់", KHR((current?.gross ?? 0) / (current?.headcount || 1))],
                  ["បន្ថែមលើខែ", `${(((current?.nssfEmployer ?? 0) / (current?.gross || 1)) * 100).toFixed(2)}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[9px] text-ink-400">{k}</p>
                    <p className="text-[12px] font-bold text-ink-900 tnum">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="ចំណាយតាមដេប៉ាតឺមង់" subtitle="ខែបច្ចុប្បន្ន" icon={<Building2 size={15} />} />
          <div className="p-4">
            <Table>
              <thead>
                <tr>
                  <Th>ដេប៉ាតឺមង់</Th>
                  <Th align="center">នាក់</Th>
                  <Th align="right">ចំណូលសរុប</Th>
                  <Th align="right">ទទួលបាន</Th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.code}>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
                        <span className="text-[11px] font-medium text-ink-800">{d.code}</span>
                      </div>
                    </Td>
                    <Td align="center"><span className="text-[11px] tnum">{d.headcount}</span></Td>
                    <Td align="right"><span className="text-[11px] font-semibold">{KHR(d.gross)}</span></Td>
                    <Td align="right"><span className="text-[11px] font-bold text-emerald-700">{KHR(d.net)}</span></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>

      {/* cumulative table */}
      <Card>
        <CardHeader
          title="តារាងសរុបប្រវត្តិបៀវត្សរ៍"
          subtitle={`${series.length} ខែ · ប្រាក់ទទួលបានសរុប ${KHRs(allNet)}`}
          icon={<Layers size={15} />}
          action={
            <Badge tone="info">
              <FileSpreadsheet size={10} /> CSV អាចនាំចេញ
            </Badge>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>វដ្ត</Th>
              <Th>ខែ</Th>
              <Th align="center">បុគ្គលិក</Th>
              <Th align="right">ចំណូលសរុប</Th>
              <Th align="right">ប.ស.ស</Th>
              <Th align="right">ពន្ធ</Th>
              <Th align="right">ទទួលបាន</Th>
              <Th align="right">ចំណាយក្រុមហ៊ុន</Th>
              <Th align="center">ស្ថានភាព</Th>
            </tr>
          </thead>
          <tbody>
            {series.map((x) => (
              <tr key={x.run.id} className="hover:bg-ink-50/60">
                <Td><span className="text-[11px] font-semibold text-ink-900">{x.run.code}</span></Td>
                <Td><span className="text-[11px] text-ink-600">{MONTHS_KH[x.run.periodMonth - 1]} {x.run.periodYear}</span></Td>
                <Td align="center"><span className="text-[11px] tnum">{x.t.headcount}</span></Td>
                <Td align="right"><span className="text-[11px] font-semibold">{KHR(x.t.gross)}</span></Td>
                <Td align="right"><span className="text-[11px]">{KHR(x.t.nssfTotal)}</span></Td>
                <Td align="right"><span className="text-[11px]">{KHR(x.t.tax)}</span></Td>
                <Td align="right"><span className="text-[11px] font-bold text-emerald-700">{KHR(x.t.netPay)}</span></Td>
                <Td align="right"><span className="text-[11px] text-ink-600">{KHR(x.t.employerCost)}</span></Td>
                <Td align="center">
                  <Badge tone={x.run.status === "paid" ? "success" : x.run.status === "approved" ? "info" : "neutral"}>
                    {x.run.status === "paid" ? "បានបើក" : x.run.status === "approved" ? "អនុម័ត" : "ព្រាង"}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ink-50 font-bold">
              <Td colSpan={3}>សរុប {series.length} ខែ</Td>
              <Td align="right">{KHR(series.reduce((s, x) => s + x.t.gross, 0))}</Td>
              <Td align="right">{KHR(allNssf)}</Td>
              <Td align="right">{KHR(allTax)}</Td>
              <Td align="right" className="text-emerald-700">{KHR(allNet)}</Td>
              <Td colSpan={2} />
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
