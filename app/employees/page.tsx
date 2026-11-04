"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, UserPlus, Search, Filter, Download, MoreHorizontal, Mail,
  Phone, Building2, Wallet, ShieldCheck, ArrowUpDown, Eye, Pencil, Trash2,
  BadgeCheck, ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, Modal,
  Select, Stat, Table, Td, Textarea, Th, Label,
} from "@/components/ui";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import {
  KHR, KHRs, formatDate, fullNameKh, fullNameEn, serviceLabel, toKhmerDigits,
} from "@/lib/format";
import { exportCsv } from "@/lib/pdf/export";
import { cn } from "@/lib/cn";
import type { Employee } from "@/lib/types";
import { dependentCount } from "@/lib/payroll/cambodia";

type SortKey = "code" | "name" | "salary" | "hire";

export default function EmployeesPage() {
  const {
    employees, departments, positions, departmentById, positionById,
    removeEmployee, settings, activeRun, payslips,
  } = useStore();

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [pos, setPos] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("code");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [detail, setDetail] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    let list = [...employees];
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((e) =>
        `${e.code} ${e.lastNameKh} ${e.firstNameKh} ${e.lastNameEn} ${e.firstNameEn} ${e.phone} ${e.email} ${e.nssfNumber} ${e.taxNumber}`
          .toLowerCase()
          .includes(t)
      );
    }
    if (dept !== "all") list = list.filter((e) => e.departmentId === dept);
    if (pos !== "all") list = list.filter((e) => e.positionId === pos);
    if (status !== "all") list = list.filter((e) => e.status === status);

    list.sort((a, b) => {
      let r = 0;
      if (sort === "code") r = a.code.localeCompare(b.code);
      else if (sort === "name") r = a.lastNameKh.localeCompare(b.lastNameKh, "km");
      else if (sort === "salary") r = a.baseSalary - b.baseSalary;
      else r = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
      return dir === "asc" ? r : -r;
    });
    return list;
  }, [employees, q, dept, pos, status, sort, dir]);

  const active = employees.filter((e) => e.status === "active" || e.status === "probation");
  const totalSalary = active.reduce((s, e) => s + e.baseSalary + e.allowances.reduce((a, x) => a + x.amount, 0), 0);
  const avgSalary = active.length ? totalSalary / active.length : 0;
  const female = active.filter((e) => e.gender === "female").length;
  const noNssf = active.filter((e) => !e.nssfNumber).length;

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir("asc"); }
  };

  const onExport = () => {
    const head = ["កូដ", "គោត្តនាម-នាម", "ឈ្មោះឡាតាំង", "ភេទ", "ដេប៉ាតឺមង់", "មុខតំណែង", "ប្រាក់ខែគោល", "ប្រាក់ឧបត្ថម្ភ", "ថ្ងៃចូល", "ស្ថានភាព", "ប.ស.ស", "TIN"];
    const body = filtered.map((e) => [
      e.code, `${e.lastNameKh} ${e.firstNameKh}`, `${e.lastNameEn} ${e.firstNameEn}`,
      e.gender, departmentById(e.departmentId)?.nameKh ?? "", positionById(e.positionId)?.nameKh ?? "",
      e.baseSalary, e.allowances.reduce((a, x) => a + x.amount, 0), e.hireDate, e.status,
      e.nssfNumber, e.taxNumber,
    ]);
    exportCsv("employees.csv", [head, ...body]);
  };

  const statusTone = (s: Employee["status"]) =>
    s === "active" ? "success" : s === "probation" ? "warning" : s === "suspended" ? "danger" : "neutral";
  const statusLabel = (s: Employee["status"]) =>
    s === "active" ? "សកម្ម" : s === "probation" ? "សាកល្បង" : s === "suspended" ? "ផ្អាក" : s === "resigned" ? "លាឈប់" : "បញ្ឈប់";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">បុគ្គលិក</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {employees.length} នាក់សរុប · {active.length} នាក់សកម្ម · {departments.length} ដេប៉ាតឺម៉ង់
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={14} /> នាំចេញ
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <UserPlus size={14} /> បន្ថែមបុគ្គលិក
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="បុគ្គលិកសកម្ម" value={active.length} sub={`${female} នាក់ជាស្ត្រី`} icon={<Users size={16} />} tone="info" />
        <Stat label="ប្រាក់ខែសរុប/ខែ" value={KHRs(totalSalary)} sub="រួមប្រាក់ឧបត្ថម្ភ" icon={<Wallet size={16} />} tone="success" />
        <Stat label="ប្រាក់ខែមធ្យម" value={KHRs(avgSalary)} sub={`≈ $${(avgSalary / settings.exchangeRate).toFixed(0)}`} icon={<ArrowUpDown size={16} />} tone="gold" />
        <Stat
          label="ស្ថានភាព ប.ស.ស"
          value={noNssf === 0 ? "ពេញលេញ" : `${noNssf} ខ្វះ`}
          sub={noNssf === 0 ? "បុគ្គលិកទាំងអស់មានលេខ ប.ស.ស" : "ត្រូវចុះឈ្មោះបន្ថែម"}
          icon={<ShieldCheck size={16} />}
          tone={noNssf === 0 ? "success" : "danger"}
        />
      </div>

      <Card>
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ កូដ ទូរស័ព្ទ ឬលេខ ប.ស.ស…"
              className="h-9 pl-9 text-xs"
            />
          </div>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 w-44 text-xs">
            <option value="all">គ្រប់ដេប៉ាតឺម៉ង់</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.nameKh}</option>
            ))}
          </Select>
          <Select value={pos} onChange={(e) => setPos(e.target.value)} className="h-9 w-48 text-xs">
            <option value="all">គ្រប់មុខតំណែង ({positions.length})</option>
            {[...positions]
              .sort((a, b) => b.level - a.level || a.code.localeCompare(b.code))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  L{p.level} · {p.nameKh}
                </option>
              ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-36 text-xs">
            <option value="all">គ្រប់ស្ថានភាព</option>
            <option value="active">សកម្ម</option>
            <option value="probation">សាកល្បង</option>
            <option value="suspended">ផ្អាក</option>
            <option value="resigned">លាឈប់</option>
          </Select>
          <Badge tone="neutral">{filtered.length} លទ្ធផល</Badge>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="រកមិនឃើញបុគ្គលិក"
            description="សូមកែលម្អការស្វែងរក ឬបន្ថែមបុគ្គលិកថ្មី"
            action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}><UserPlus size={14} /> បន្ថែមបុគ្គលិក</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-10">
                  <input type="checkbox" className="rounded border-ink-300" />
                </Th>
                <Th>
                  <button onClick={() => toggleSort("code")} className="inline-flex items-center gap-1 hover:text-ink-800">
                    បុគ្គលិក <ArrowUpDown size={10} />
                  </button>
                </Th>
                <Th>ដេប៉ាតឺមង់ / មុខតំណែង</Th>
                <Th align="right">
                  <button onClick={() => toggleSort("salary")} className="inline-flex items-center gap-1 hover:text-ink-800">
                    ប្រាក់ខែគោល <ArrowUpDown size={10} />
                  </button>
                </Th>
                <Th align="center">ក្នុងបន្ទុក</Th>
                <Th align="center">ស្ថានភាព</Th>
                <Th align="center">ទំនាក់ទំនង</Th>
                <Th align="center" className="w-24">សកម្មភាព</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const p = positionById(e.positionId);
                const d = departmentById(e.departmentId);
                const deps = dependentCount(e.spouseDependents, e.childDependents);
                return (
                  <tr key={e.id} className="group transition-colors hover:bg-ink-50/60">
                    <Td>
                      <input type="checkbox" className="rounded border-ink-300" />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullNameKh(e)} size={34} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink-900">
                            {fullNameKh(e)}
                          </p>
                          <p className="truncate text-[10px] text-ink-400">
                            {e.code} · {fullNameEn(e)}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-[11px] font-medium text-ink-700">{d?.nameKh}</p>
                      <p className="flex items-center gap-1 text-[10px] text-ink-400">
                        {p && (
                          <Badge
                            tone={p.level >= 5 ? "violet" : p.level >= 3 ? "info" : "neutral"}
                            className="!px-1 !py-0 !text-[9px]"
                          >
                            L{p.level}
                          </Badge>
                        )}
                        {p?.nameKh}
                      </p>
                    </Td>
                    <Td align="right">
                      <p className="text-[12px] font-bold text-ink-900">{KHR(e.baseSalary)}</p>
                      <p className="text-[10px] text-ink-400">
                        +{KHR(e.allowances.reduce((s, a) => s + a.amount, 0))}
                      </p>
                    </Td>
                    <Td align="center">
                      <span className="text-[11px] font-semibold text-ink-700 tnum">{deps}</span>
                    </Td>
                    <Td align="center">
                      <Badge tone={statusTone(e.status) as any} dot>
                        {statusLabel(e.status)}
                      </Badge>
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-1">
                        <a href={`tel:${e.phone}`} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700" title={e.phone}>
                          <Phone size={12} />
                        </a>
                        <a href={`mailto:${e.email}`} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700" title={e.email}>
                          <Mail size={12} />
                        </a>
                      </div>
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setDetail(e)}
                          className="grid h-7 w-7 place-items-center rounded text-ink-500 hover:bg-ink-100"
                          title="មើល"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => { setEditing(e); setShowForm(true); }}
                          className="grid h-7 w-7 place-items-center rounded text-ink-500 hover:bg-ink-100"
                          title="កែ"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(e)}
                          className="grid h-7 w-7 place-items-center rounded text-rose-500 hover:bg-rose-50"
                          title="លុប"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ---------- add / edit ---------- */}
      <EmployeeForm
        open={showForm}
        onClose={() => setShowForm(false)}
        employee={editing}
      />

      {/* ---------- detail ---------- */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="ព័ត៌មានបុគ្គលិក"
        subtitle={detail ? `${detail.code} · ${fullNameEn(detail)}` : ""}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDetail(null)}>បិទ</Button>
            <Button size="sm" onClick={() => { setEditing(detail); setDetail(null); setShowForm(true); }}>
              <Pencil size={13} /> កែប្រែ
            </Button>
          </>
        }
      >
        {detail && <EmployeeDetailPanel employee={detail} />}
      </Modal>

      {/* ---------- delete ---------- */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="លុបបុគ្គលិក?"
        subtitle="សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>បោះបង់</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => { if (confirmDelete) removeEmployee(confirmDelete.id); setConfirmDelete(null); }}
            >
              <Trash2 size={13} /> លុប
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          តើអ្នកពិតជាចង់លុប <b>{confirmDelete ? fullNameKh(confirmDelete) : ""}</b> ({confirmDelete?.code}) ចេញពីប្រព័ន្ធ?
          ប័ណ្ណបៀវត្សរ៍ដែលពាក់ព័ន្ធនឹងត្រូវលុបផងដែរ។
        </p>
      </Modal>
    </div>
  );
}

function EmployeeDetailPanel({ employee: e }: { employee: Employee }) {
  const { departmentById, positionById, employees, payslips, settings } = useStore();
  const d = departmentById(e.departmentId);
  const p = positionById(e.positionId);
  const manager = employees.find((x) => x.id === e.managerId);
  const mySlips = payslips
    .filter((s) => s.employeeId === e.id)
    .sort((a, b) => b.runId.localeCompare(a.runId))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
        <Avatar name={fullNameKh(e)} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-ink-900">{fullNameKh(e)}</p>
          <p className="text-[11px] text-ink-500">{fullNameEn(e)}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="info">{e.code}</Badge>
            <Badge tone="gold">{p?.nameKh}</Badge>
            <Badge tone="neutral">{d?.nameKh}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { t: "ព័ត៌មានផ្ទាល់ខ្លួន", rows: [
            ["ថ្ងៃកើត", formatDate(e.dob)],
            ["ភេទ", e.gender === "female" ? "ស្រី" : e.gender === "male" ? "ប្រុស" : "ផ្សេង"],
            ["អត្តសញ្ញាណប័ណ្ណ", e.nationalId],
            ["ទូរស័ព្ទ", e.phone],
            ["អ៊ីមែល", e.email],
            ["អាសយដ្ឋាន", e.address],
          ]},
          { t: "ការងារ", rows: [
            ["ប្រភេទការងារ", e.employmentType === "permanent" ? "អចិន្ត្រៃយ៍" : e.employmentType === "fixed_term" ? "កំណត់រយៈពេល" : e.employmentType === "probation" ? "សាកល្បង" : "ក្រៅម៉ោង"],
            ["ថ្ងៃចូលធ្វើការ", formatDate(e.hireDate)],
            ["អាណត្តិការងារ", serviceLabel(e.hireDate)],
            ["អ្នកគ្រប់គ្រង", manager ? fullNameKh(manager) : "—"],
            ["ច្បាប់ប្រចាំឆ្នាំ", `${e.annualLeaveEntitlement - e.annualLeaveUsed}/${e.annualLeaveEntitlement} ថ្ងៃ`],
            ["សមាជិកសហជីព", e.isUnionMember ? `បាទ/ចាស (${e.unionFeeRate}%)` : "ទេ"],
          ]},
          { t: "ប្រាក់ខែ", rows: [
            ["ប្រាក់ខែគោល", KHRs(e.baseSalary)],
            ["ប្រាក់ឧបត្ថម្ភ", KHRs(e.allowances.reduce((s, a) => s + a.amount, 0))],
            ["សរុប", KHRs(e.baseSalary + e.allowances.reduce((s, a) => s + a.amount, 0))],
            ["≈ ដុល្លារ", `$${((e.baseSalary + e.allowances.reduce((s, a) => s + a.amount, 0)) / settings.exchangeRate).toFixed(2)}`],
            ["វិធីបង់", e.paymentMethod === "bank_transfer" ? "ផ្ទេរធនាគារ" : e.paymentMethod === "cash" ? "សាច់ប្រាក់" : "ផ្សេងៗ"],
            ["គណនី", `${e.bankAccount}`],
          ]},
          { t: "សារពើពន្ធ & ប.ស.ស", rows: [
            ["លេខ ប.ស.ស", e.nssfNumber || "— មិនទាន់មាន"],
            ["លេខសារពើពន្ធ", e.taxNumber],
            ["ស្ថានភាពពន្ធ", e.taxResidency === "resident" ? "អ្នកស្នាក់នៅ" : "មិនស្នាក់នៅ (២០%)"],
            ["គូស្វាមី/ភរិយា", String(e.spouseDependents)],
            ["កូនក្នុងបន្ទុក", String(e.childDependents)],
            ["កាត់បន្ថយពន្ធ", KHRs(dependentCount(e.spouseDependents, e.childDependents) * settings.taxDependentDeduction)],
          ]},
        ].map((g) => (
          <div key={g.t} className="rounded-xl border border-ink-200 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">{g.t}</p>
            <dl className="space-y-1.5">
              {g.rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-[11px] text-ink-400">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-[11px] font-semibold text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {e.allowances.length > 0 && (
        <div className="rounded-xl border border-ink-200 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">ប្រាក់ឧបត្ថម្ភ</p>
          <div className="flex flex-wrap gap-2">
            {e.allowances.map((a) => (
              <span key={a.id} className="rounded-lg bg-ink-50 px-2.5 py-1.5 text-[11px] ring-1 ring-ink-200">
                <b className="text-ink-800">{a.labelKh}</b>
                <span className="ml-1.5 text-ink-600 tnum">{KHRs(a.amount)}</span>
                {!a.taxable && <span className="ml-1.5 text-[9px] text-emerald-600">មិនជាប់ពន្ធ</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {mySlips.length > 0 && (
        <div className="rounded-xl border border-ink-200 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">ប័ណ្ណបៀវត្សរ៍ចុងក្រោយ</p>
          <ul className="space-y-1.5">
            {mySlips.map((s) => {
              const run = useStoreRun(s.runId);
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-ink-600">{run}</span>
                  <span className="font-bold text-ink-900 tnum">{KHR(s.netPay)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function useStoreRun(runId: string) {
  const { runs } = useStore();
  const r = runs.find((x) => x.id === runId);
  return r ? r.code : runId;
}
