"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, Palmtree, Users,
  ChevronLeft, ChevronRight, Timer, HeartPulse, Baby, Sparkles, Ban,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, Select, Stat,
  Table, Td, Th,
} from "@/components/ui";
import { monthCalendar, holidaysInMonth, workingDaysInMonth } from "@/lib/payroll/holidays";
import {
  KHR, monthYearKh, fullNameKh, formatDate, toKhmerDigits, daysBetween,
} from "@/lib/format";
import { uid, isoToday } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { LeaveType } from "@/lib/types";

const LEAVE_META: Record<LeaveType, { kh: string; icon: any; paid: boolean; max: string; tone: any }> = {
  annual: { kh: "ច្បាប់ប្រចាំឆ្នាំ", icon: Palmtree, paid: true, max: "១៨ ថ្ងៃ", tone: "info" },
  sick: { kh: "ច្បាប់ឈឺ", icon: HeartPulse, paid: true, max: "៦ ខែ", tone: "warning" },
  maternity: { kh: "ច្បាប់សម្រាលកូន", icon: Baby, paid: true, max: "៩០ ថ្ងៃ", tone: "violet" },
  paternity: { kh: "ច្បាប់ប្រពន្ធសម្រាល", icon: Baby, paid: true, max: "១០ ថ្ងៃ", tone: "info" },
  special: { kh: "ច្បាប់ពិសេស", icon: Sparkles, paid: true, max: "៧ ថ្ងៃ", tone: "gold" },
  unpaid: { kh: "គ្មានប្រាក់", icon: Ban, paid: false, max: "តាមកិច្ចព្រមព្រៀង", tone: "neutral" },
};

export default function AttendancePage() {
  const {
    employees, departments, activeRun, attendanceSummary, leaves, reviewLeave,
    addLeave, departmentById,
  } = useStore();

  const [monthOffset, setMonthOffset] = useState(0);
  const [dept, setDept] = useState("all");
  const [tab, setTab] = useState<"attendance" | "leave">("attendance");

  const base = activeRun
    ? new Date(activeRun.periodYear, activeRun.periodMonth - 1 + monthOffset, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth() + 1;

  const cal = useMemo(() => monthCalendar(year, month, false), [year, month]);
  const holidays = useMemo(() => holidaysInMonth(year, month), [year, month]);
  const workdays = useMemo(() => workingDaysInMonth(year, month), [year, month]);

  const active = useMemo(
    () => employees.filter((e) => e.status !== "resigned" && e.status !== "terminated"),
    [employees]
  );

  const list = dept === "all" ? active : active.filter((e) => e.departmentId === dept);

  const summaries = useMemo(
    () => list.map((e) => ({ e, s: attendanceSummary(e.id) })),
    [list, attendanceSummary]
  );

  const totals = useMemo(() => {
    const s = summaries.reduce(
      (acc, x) => ({
        worked: acc.worked + x.s.daysWorked,
        paidLeave: acc.paidLeave + x.s.paidLeaveDays,
        unpaid: acc.unpaid + x.s.unpaidLeaveDays,
        absent: acc.absent + x.s.absentDays,
        late: acc.late + x.s.lateCount,
        ot: acc.ot + x.s.totalOvertimeHours,
      }),
      { worked: 0, paidLeave: 0, unpaid: 0, absent: 0, late: 0, ot: 0 }
    );
    return s;
  }, [summaries]);

  const pending = leaves.filter((l) => l.status === "pending");
  const approved = leaves.filter((l) => l.status === "approved");

  const dowKh = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">វត្តមាន & ច្បាប់</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {monthYearKh(month, year)} · {workdays} ថ្ងៃធ្វើការ · {holidays.length} ថ្ងៃបុណ្យ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-ink-200">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-50">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-[11px] font-semibold text-ink-700">{monthYearKh(month, year)}</span>
            <button onClick={() => setMonthOffset((o) => o + 1)} className="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="ថ្ងៃធ្វើការសរុប" value={totals.worked} sub={`${list.length} នាក់`} icon={<CheckCircle2 size={16} />} tone="success" />
        <Stat label="ច្បាប់មានប្រាក់" value={`${totals.paidLeave} ថ្ងៃ`} sub={`ប្រហែល ${KHR(totals.paidLeave * 30000)}`} icon={<Palmtree size={16} />} tone="info" />
        <Stat label="អវត្តមាន / គ្មានប្រាក់" value={`${totals.unpaid + totals.absent} ថ្ងៃ`} sub={`កាត់ប្រាក់ស្វ័យប្រវត្តិ`} icon={<XCircle size={16} />} tone="danger" />
        <Stat label="ម៉ោងថែម" value={`${totals.ot} ម៉ោង`} sub={`មកយឺត ${totals.late} ដង`} icon={<Timer size={16} />} tone="gold" />
      </div>

      {/* tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
        {[
          { id: "attendance", label: "វត្តមានបុគ្គលិក", icon: CalendarDays, count: list.length },
          { id: "leave", label: "ពាក្យសុំច្បាប់", icon: Palmtree, count: pending.length },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors",
                tab === t.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
              )}
            >
              <Icon size={14} />
              {t.label}
              {t.count > 0 && (
                <span className={cn("rounded-full px-1.5 text-[9px]", tab === t.id ? "bg-ink-900 text-white" : "bg-ink-200 text-ink-600")}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "attendance" && (
        <>
          {/* calendar strip */}
          <Card>
            <CardHeader
              title="ប្រតិទិនខែ"
              subtitle={`${cal.length} ថ្ងៃ · ថ្ងៃលឿង = បុណ្យជាតិ`}
              icon={<CalendarDays size={15} />}
              action={
                <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-8 w-40 text-xs">
                  <option value="all">គ្រប់ដេប៉ាតឺមង់</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.nameKh}</option>
                  ))}
                </Select>
              }
            />
            <div className="flex flex-wrap gap-1 p-3">
              {cal.map((c) => (
                <div
                  key={c.date}
                  title={c.holiday?.nameKh ?? dowKh[c.dow]}
                  className={cn(
                    "flex h-11 w-9 flex-col items-center justify-center rounded-lg text-[10px] ring-1",
                    c.isHoliday
                      ? "bg-gold-100 text-gold-800 ring-gold-300"
                      : c.isWeekend
                      ? "bg-ink-50 text-ink-300 ring-ink-100"
                      : "bg-white text-ink-700 ring-ink-200"
                  )}
                >
                  <span className="text-[8px] opacity-60">{dowKh[c.dow].slice(0, 3)}</span>
                  <span className="text-[12px] font-bold tnum">{c.day}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* attendance table */}
          <Card>
            <CardHeader
              title="សេចក្តីសង្ខេបវត្តមាន"
              subtitle={`${list.length} នាក់ · គិតតាមវដ្តបៀវត្សរ៍បច្ចុប្បន្ន`}
              icon={<Users size={15} />}
            />
            {list.length === 0 ? (
              <EmptyState icon={<Users size={22} />} title="គ្មានបុគ្គលិក" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>បុគ្គលិក</Th>
                    <Th>ដេប៉ាតឺមង់</Th>
                    <Th align="center">មកធ្វើការ</Th>
                    <Th align="center">ច្បាប់មានប្រាក់</Th>
                    <Th align="center">អវត្តមាន</Th>
                    <Th align="center">មកយឺត</Th>
                    <Th align="center">ម៉ោង OT</Th>
                    <Th align="center">អត្រាវត្តមាន</Th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(({ e, s }) => {
                    const rate = workdays ? Math.min(100, (s.daysWorked / workdays) * 100) : 0;
                    return (
                      <tr key={e.id} className="hover:bg-ink-50/60">
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={fullNameKh(e)} size={28} />
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-semibold text-ink-900">{fullNameKh(e)}</p>
                              <p className="text-[9px] text-ink-400">{e.code}</p>
                            </div>
                          </div>
                        </Td>
                        <Td><span className="text-[10px] text-ink-600">{departmentById(e.departmentId)?.code}</span></Td>
                        <Td align="center"><b className="text-[11px] text-emerald-700 tnum">{s.daysWorked}</b></Td>
                        <Td align="center"><span className="text-[11px] text-sky-700 tnum">{s.paidLeaveDays}</span></Td>
                        <Td align="center">
                          <span className={cn("text-[11px] tnum", s.unpaidLeaveDays + s.absentDays > 0 ? "font-bold text-rose-600" : "text-ink-400")}>
                            {s.unpaidLeaveDays + s.absentDays}
                          </span>
                        </Td>
                        <Td align="center"><span className="text-[11px] text-ink-600 tnum">{s.lateCount}</span></Td>
                        <Td align="center"><span className="text-[11px] font-semibold text-gold-700 tnum">{s.totalOvertimeHours}</span></Td>
                        <Td align="center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="h-1 w-12 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={cn("h-full rounded-full", rate >= 95 ? "bg-emerald-500" : rate >= 80 ? "bg-amber-500" : "bg-rose-500")}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="w-8 text-[9px] text-ink-500 tnum">{rate.toFixed(0)}%</span>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {tab === "leave" && (
        <LeavePanel
          leaves={leaves}
          employees={employees}
          onReview={reviewLeave}
          onAdd={(l) => addLeave(l)}
        />
      )}
    </div>
  );
}

function LeavePanel({
  leaves, employees, onReview, onAdd,
}: {
  leaves: ReturnType<typeof useStore>["leaves"];
  employees: ReturnType<typeof useStore>["employees"];
  onReview: (id: string, s: "approved" | "rejected") => void;
  onAdd: (l: any) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [empId, setEmpId] = useState(employees[0]?.id ?? "");
  const [type, setType] = useState<LeaveType>("annual");
  const [from, setFrom] = useState(isoToday());
  const [to, setTo] = useState(isoToday());
  const [reason, setReason] = useState("");

  const days = daysBetween(from, to);
  const sorted = [...leaves].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Card>
        <CardHeader
          title="ពាក្យសុំច្បាប់"
          subtitle={`${leaves.filter((l) => l.status === "pending").length} រង់ចាំ · ${leaves.filter((l) => l.status === "approved").length} អនុម័ត`}
          icon={<Palmtree size={15} />}
          action={
            <Button size="sm" onClick={() => setShowNew((v) => !v)}>
              {showNew ? "បិទ" : "+ ដាក់ពាក្យថ្មី"}
            </Button>
          }
        />

        {showNew && (
          <div className="border-b border-ink-100 bg-ink-50/50 p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-600">បុគ្គលិក</label>
                <Select value={empId} onChange={(e) => setEmpId(e.target.value)} className="h-9 text-xs">
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.code} — {fullNameKh(e)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-600">ប្រភេទច្បាប់</label>
                <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className="h-9 text-xs">
                  {Object.entries(LEAVE_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.kh}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-600">ពីថ្ងៃ</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-full rounded-lg border border-ink-200 px-2 text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-600">ដល់ថ្ងៃ</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-full rounded-lg border border-ink-200 px-2 text-xs" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="មូលហេតុ…"
                className="h-9 flex-1 rounded-lg border border-ink-200 px-2 text-xs"
              />
              <Badge tone="info">{days} ថ្ងៃ</Badge>
              <Button
                size="sm"
                onClick={() => {
                  onAdd({
                    id: uid("lv"),
                    employeeId: empId,
                    type,
                    from,
                    to,
                    days,
                    paid: LEAVE_META[type].paid,
                    reason: reason || "—",
                    status: "pending",
                    createdAt: isoToday(),
                  });
                  setShowNew(false);
                  setReason("");
                }}
              >
                ដាក់ពាក្យ
              </Button>
            </div>
          </div>
        )}

        <Table>
          <thead>
            <tr>
              <Th>បុគ្គលិក</Th>
              <Th>ប្រភេទ</Th>
              <Th align="center">កាលបរិច្ឆេទ</Th>
              <Th align="center">ថ្ងៃ</Th>
              <Th align="center">មានប្រាក់</Th>
              <Th>មូលហេតុ</Th>
              <Th align="center">ស្ថានភាព</Th>
              <Th align="center" className="w-28">សកម្មភាព</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => {
              const e = employees.find((x) => x.id === l.employeeId);
              const meta = LEAVE_META[l.type];
              const Icon = meta.icon;
              return (
                <tr key={l.id} className="hover:bg-ink-50/60">
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={e ? fullNameKh(e) : "?"} size={26} />
                      <span className="truncate text-[11px] font-medium text-ink-800">{e ? fullNameKh(e) : "—"}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-700">
                      <Icon size={10} />
                      {meta.kh}
                    </span>
                  </Td>
                  <Td align="center">
                    <span className="text-[10px] text-ink-600">{formatDate(l.from)}</span>
                    {l.from !== l.to && <span className="text-[10px] text-ink-400"> → {formatDate(l.to)}</span>}
                  </Td>
                  <Td align="center"><b className="text-[11px] tnum">{l.days}</b></Td>
                  <Td align="center">
                    {l.paid ? (
                      <CheckCircle2 size={13} className="mx-auto text-emerald-500" />
                    ) : (
                      <XCircle size={13} className="mx-auto text-rose-400" />
                    )}
                  </Td>
                  <Td><span className="truncate text-[10px] text-ink-500">{l.reason}</span></Td>
                  <Td align="center">
                    <Badge tone={l.status === "approved" ? "success" : l.status === "rejected" ? "danger" : "warning"} dot>
                      {l.status === "approved" ? "អនុម័ត" : l.status === "rejected" ? "បដិសេធ" : "រង់ចាំ"}
                    </Badge>
                  </Td>
                  <Td align="center">
                    {l.status === "pending" ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onReview(l.id, "approved")}
                          className="grid h-6 w-6 place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          title="អនុម័ត"
                        >
                          <CheckCircle2 size={12} />
                        </button>
                        <button
                          onClick={() => onReview(l.id, "rejected")}
                          className="grid h-6 w-6 place-items-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="បដិសេធ"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-ink-300">—</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* leave policy cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(LEAVE_META).map(([k, v]) => {
          const Icon = v.icon;
          return (
            <Card key={k} className="p-3">
              <div className="flex items-start gap-2.5">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  v.tone === "info" ? "bg-sky-50 text-sky-600" :
                  v.tone === "warning" ? "bg-amber-50 text-amber-600" :
                  v.tone === "violet" ? "bg-violet-50 text-violet-600" :
                  v.tone === "gold" ? "bg-gold-50 text-gold-600" : "bg-ink-50 text-ink-500")}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink-800">{v.kh}</p>
                  <p className="text-[10px] text-ink-400">
                    អតិបរមា {v.max} · {v.paid ? "មានប្រាក់ឈ្នួល" : "គ្មានប្រាក់ឈ្នួល"}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
