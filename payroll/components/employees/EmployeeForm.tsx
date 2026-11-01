"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Wallet, ShieldCheck, User, Briefcase, Landmark, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Button, Input, Label, Modal, Select, Textarea, Toggle,
} from "@/components/ui";
import type { Allowance, Employee, EmployeeStatus, EmploymentType, Gender, TaxResidency } from "@/lib/types";
import { KHR, KHRs, uid, isoToday } from "@/lib/format";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "personal", label: "ផ្ទាល់ខ្លួន", icon: User },
  { id: "job", label: "ការងារ", icon: Briefcase },
  { id: "salary", label: "ប្រាក់ខែ", icon: Wallet },
  { id: "statutory", label: "ពន្ធ & ប.ស.ស", icon: ShieldCheck },
  { id: "bank", label: "ធនាគារ", icon: Landmark },
] as const;

type TabId = (typeof TABS)[number]["id"];

const emptyEmployee = (code: string): Omit<Employee, "id" | "createdAt"> => ({
  code,
  firstNameKh: "",
  lastNameKh: "",
  firstNameEn: "",
  lastNameEn: "",
  gender: "female",
  dob: "1995-01-01",
  nationalId: "",
  nssfNumber: "",
  taxNumber: "",
  phone: "",
  email: "",
  address: "ភ្នំពេញ",
  departmentId: "",
  positionId: "",
  employmentType: "permanent",
  status: "active",
  hireDate: isoToday(),
  baseSalary: 500_000,
  currency: "KHR",
  allowances: [],
  bankName: "ធនាគារ អេស៊ីលីដា (ACLEDA)",
  bankAccount: "",
  paymentMethod: "bank_transfer",
  taxResidency: "resident",
  spouseDependents: 0,
  childDependents: 0,
  isNssfMember: true,
  isUnionMember: false,
  unionFeeRate: 1,
  annualLeaveEntitlement: 18,
  annualLeaveUsed: 0,
  sickLeaveUsed: 0,
});

const ALLOWANCE_PRESETS: { kind: Allowance["kind"]; kh: string; en: string; taxable: boolean; nssfable: boolean }[] = [
  { kind: "transport", kh: "ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ", en: "Transport", taxable: true, nssfable: true },
  { kind: "meal", kh: "ប្រាក់ឧបត្ថម្ភអាហារ", en: "Meal", taxable: true, nssfable: false },
  { kind: "housing", kh: "ប្រាក់ឧបត្ថម្ភផ្ទះ", en: "Housing", taxable: true, nssfable: true },
  { kind: "phone", kh: "ប្រាក់ឧបត្ថម្ភទូរស័ព្ទ", en: "Phone", taxable: true, nssfable: false },
  { kind: "attendance", kh: "ប្រាក់ឧបត្ថម្ភវត្តមាន", en: "Attendance", taxable: true, nssfable: true },
  { kind: "skill", kh: "ប្រាក់ឧបត្ថម្ភជំនាញ", en: "Skill", taxable: true, nssfable: true },
  { kind: "responsibility", kh: "ប្រាក់ឧបត្ថម្ភទទួលខុសត្រូវ", en: "Responsibility", taxable: true, nssfable: true },
  { kind: "other", kh: "ផ្សេងៗ", en: "Other", taxable: true, nssfable: true },
];

export function EmployeeForm({
  open, onClose, employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  const { employees, departments, positions, addEmployee, updateEmployee, settings, toast } = useStore();
  const [tab, setTab] = useState<TabId>("personal");
  const [form, setForm] = useState<Omit<Employee, "id" | "createdAt">>(emptyEmployee(""));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextCode = useMemo(() => {
    const max = employees.reduce((m, e) => {
      const n = parseInt(e.code.replace(/\D/g, ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `KP-${String(max + 1).padStart(4, "0")}`;
  }, [employees]);

  useEffect(() => {
    if (!open) return;
    if (employee) {
      const { id, createdAt, ...rest } = employee;
      setForm(rest);
    } else {
      const fresh = emptyEmployee(nextCode);
      fresh.departmentId = departments[0]?.id ?? "";
      fresh.positionId = positions[0]?.id ?? "";
      setForm(fresh);
    }
    setTab("personal");
    setErrors({});
  }, [open, employee, nextCode, departments, positions]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstNameKh.trim()) e.firstNameKh = "ត្រូវបំពេញ";
    if (!form.lastNameKh.trim()) e.lastNameKh = "ត្រូវបំពេញ";
    if (!form.firstNameEn.trim()) e.firstNameEn = "Required";
    if (!form.lastNameEn.trim()) e.lastNameEn = "Required";
    if (!form.phone.trim()) e.phone = "ត្រូវបំពេញ";
    if (!form.departmentId) e.departmentId = "ជ្រើសរើសដេប៉ាតឺមង់";
    if (!form.positionId) e.positionId = "ជ្រើសរើសមុខតំណែង";
    if (!form.baseSalary || form.baseSalary <= 0) e.baseSalary = "ត្រូវធំជាង ០";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "អ៊ីមែលមិនត្រឹមត្រូវ";
    setErrors(e);
    if (Object.keys(e).length) {
      // jump to the tab holding the first error
      const first = Object.keys(e)[0];
      if (["firstNameKh", "lastNameKh", "firstNameEn", "lastNameEn", "phone", "email"].includes(first)) setTab("personal");
      else if (["departmentId", "positionId"].includes(first)) setTab("job");
      else if (first === "baseSalary") setTab("salary");
      return false;
    }
    return true;
  };

  const submit = () => {
    if (!validate()) return;
    if (employee) {
      updateEmployee(employee.id, form);
      toast({ title: "បានកែប្រែព័ត៌មានបុគ្គលិក", description: form.code, tone: "success" });
    } else {
      addEmployee({
        ...form,
        id: uid("emp"),
        createdAt: isoToday(),
      });
    }
    onClose();
  };

  const addAllowance = (preset: (typeof ALLOWANCE_PRESETS)[number]) => {
    setForm((f) => ({
      ...f,
      allowances: [
        ...f.allowances,
        {
          id: uid("alw"),
          kind: preset.kind,
          labelKh: preset.kh,
          labelEn: preset.en,
          amount: 100_000,
          taxable: preset.taxable,
          nssfable: preset.nssfable,
        },
      ],
    }));
  };

  const totalGross =
    form.baseSalary + form.allowances.reduce((s, a) => s + (a.amount || 0), 0);

  // live preview of the statutory position
  const preview = useMemo(() => {
    const capped = Math.min(Math.max(totalGross, settings.nssfFloor), settings.nssfCeiling);
    const empNssf = Math.round((capped * (settings.nssfEmployeeHealthRate + settings.nssfEmployeePensionRate)) / 100);
    const deps = Math.min(10, (form.spouseDependents > 0 ? 1 : 0) + Math.max(0, Math.min(8, form.childDependents)));
    const taxable = Math.max(
      0,
      totalGross - empNssf - settings.taxPersonalDeduction - deps * settings.taxDependentDeduction
    );
    // progressive
    const brackets = [
      { from: 0, to: 1_300_000, rate: 0 },
      { from: 1_300_000, to: 2_000_000, rate: 5 },
      { from: 2_000_000, to: 8_500_000, rate: 10 },
      { from: 8_500_000, to: 12_500_000, rate: 15 },
      { from: 12_500_000, to: Infinity, rate: 20 },
    ];
    let tax = 0;
    for (const b of brackets) {
      if (taxable > b.from) tax += ((Math.min(taxable, b.to) - b.from) * b.rate) / 100;
    }
    tax = Math.round(tax);
    return { empNssf, tax, net: totalGross - empNssf - tax, deps };
  }, [totalGross, form.spouseDependents, form.childDependents, settings]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "កែប្រែព័ត៌មានបុគ្គលិក" : "បន្ថែមបុគ្គលិកថ្មី"}
      subtitle={employee ? `${employee.code} · ${employee.lastNameKh} ${employee.firstNameKh}` : `លេខកូដថ្មី: ${nextCode}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>បោះបង់</Button>
          <Button size="sm" onClick={submit}>
            <Save size={14} /> {employee ? "រក្សាទុកការកែប្រែ" : "បន្ថែមបុគ្គលិក"}
          </Button>
        </>
      }
    >
      {/* tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-ink-50 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const hasErr = Object.keys(errors).some((k) =>
            (t.id === "personal" && ["firstNameKh", "lastNameKh", "firstNameEn", "lastNameEn", "phone", "email"].includes(k)) ||
            (t.id === "job" && ["departmentId", "positionId"].includes(k)) ||
            (t.id === "salary" && k === "baseSalary")
          );
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors",
                tab === t.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
              )}
            >
              <Icon size={12} />
              {t.label}
              {hasErr && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
            </button>
          );
        })}
      </div>

      {/* ---------- personal ---------- */}
      {tab === "personal" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label required>នាម (ខ្មែរ)</Label>
            <Input value={form.lastNameKh} onChange={(e) => set("lastNameKh", e.target.value)} error={!!errors.lastNameKh} placeholder="ឧ. សុខ" />
            {errors.lastNameKh && <p className="mt-0.5 text-[10px] text-rose-600">{errors.lastNameKh}</p>}
          </div>
          <div>
            <Label required>គោត្តនាម (ខ្មែរ)</Label>
            <Input value={form.firstNameKh} onChange={(e) => set("firstNameKh", e.target.value)} error={!!errors.firstNameKh} placeholder="ឧ. ច័ន្ទថា" />
            {errors.firstNameKh && <p className="mt-0.5 text-[10px] text-rose-600">{errors.firstNameKh}</p>}
          </div>
          <div>
            <Label required>Last name (Latin)</Label>
            <Input value={form.lastNameEn} onChange={(e) => set("lastNameEn", e.target.value)} error={!!errors.lastNameEn} placeholder="Sok" />
          </div>
          <div>
            <Label required>First name (Latin)</Label>
            <Input value={form.firstNameEn} onChange={(e) => set("firstNameEn", e.target.value)} error={!!errors.firstNameEn} placeholder="Chanthy" />
          </div>
          <div>
            <Label>ភេទ</Label>
            <Select value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
              <option value="female">ស្រី</option>
              <option value="male">ប្រុស</option>
              <option value="other">ផ្សេងៗ</option>
            </Select>
          </div>
          <div>
            <Label>ថ្ងៃខែឆ្នាំកំណើត</Label>
            <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          </div>
          <div>
            <Label>អត្តសញ្ញាណប័ណ្ណ</Label>
            <Input value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="010234567" />
          </div>
          <div>
            <Label required>ទូរស័ព្ទ</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} error={!!errors.phone} placeholder="012 345 678" />
            {errors.phone && <p className="mt-0.5 text-[10px] text-rose-600">{errors.phone}</p>}
          </div>
          <div>
            <Label>អ៊ីមែល</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={!!errors.email} placeholder="name@company.com.kh" />
            {errors.email && <p className="mt-0.5 text-[10px] text-rose-600">{errors.email}</p>}
          </div>
          <div>
            <Label>អាសយដ្ឋាន</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
      )}

      {/* ---------- job ---------- */}
      {tab === "job" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label required>ដេប៉ាតឺមង់</Label>
            <Select value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.nameKh}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>មុខតំណែង</Label>
            <Select value={form.positionId} onChange={(e) => set("positionId", e.target.value)}>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.nameKh}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>ប្រភេទកិច្ចសន្យា</Label>
            <Select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
              <option value="permanent">អចិន្ត្រៃយ៍ (UDC)</option>
              <option value="fixed_term">កំណត់រយៈពេល (FDC)</option>
              <option value="probation">សម័យសាកល្បង</option>
              <option value="part_time">ក្រៅម៉ោង</option>
              <option value="intern">កម្មសិក្សាការី</option>
            </Select>
          </div>
          <div>
            <Label>ស្ថានភាព</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as EmployeeStatus)}>
              <option value="active">សកម្ម</option>
              <option value="probation">សាកល្បង</option>
              <option value="suspended">ផ្អាក</option>
              <option value="resigned">លាឈប់</option>
              <option value="terminated">បញ្ឈប់</option>
            </Select>
          </div>
          <div>
            <Label required>ថ្ងៃចូលធ្វើការ</Label>
            <Input type="date" value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
          </div>
          <div>
            <Label>អ្នកគ្រប់គ្រងផ្ទាល់</Label>
            <Select value={form.managerId ?? ""} onChange={(e) => set("managerId", e.target.value || undefined)}>
              <option value="">— គ្មាន —</option>
              {employees.filter((x) => x.id !== employee?.id).map((x) => (
                <option key={x.id} value={x.id}>{x.lastNameKh} {x.firstNameKh} ({x.code})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>ច្បាប់ប្រចាំឆ្នាំ (ថ្ងៃ)</Label>
            <Input type="number" value={form.annualLeaveEntitlement} onChange={(e) => set("annualLeaveEntitlement", Number(e.target.value))} />
          </div>
          <div>
            <Label>ច្បាប់បានប្រើ (ថ្ងៃ)</Label>
            <Input type="number" value={form.annualLeaveUsed} onChange={(e) => set("annualLeaveUsed", Number(e.target.value))} />
          </div>
        </div>
      )}

      {/* ---------- salary ---------- */}
      {tab === "salary" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label required hint="គិតជារៀល">ប្រាក់ខែគោល</Label>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={(e) => set("baseSalary", Number(e.target.value))}
                error={!!errors.baseSalary}
              />
              {errors.baseSalary && <p className="mt-0.5 text-[10px] text-rose-600">{errors.baseSalary}</p>}
              <p className="mt-1 text-[10px] text-ink-400">
                ≈ ${(form.baseSalary / settings.exchangeRate).toFixed(2)} USD
                {form.baseSalary < 420_000 && " · ⚠ ទាបជាងប្រាក់ឈ្នួលអប្បបរមា ៛៤២០,០០០"}
              </p>
            </div>
            <div>
              <Label>លេខកូដបុគ្គលិក</Label>
              <Input value={form.code} onChange={(e) => set("code", e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">ប្រាក់ឧបត្ថម្ភ</p>
              <span className="text-[10px] text-ink-400">{form.allowances.length} ប្រការ</span>
            </div>

            {form.allowances.length === 0 && (
              <p className="py-3 text-center text-[11px] text-ink-400">មិនទាន់មានប្រាក់ឧបត្ថម្ភ</p>
            )}

            <div className="space-y-2">
              {form.allowances.map((a, i) => (
                <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 p-2">
                  <Input
                    value={a.labelKh}
                    onChange={(e) => {
                      const next = [...form.allowances];
                      next[i] = { ...a, labelKh: e.target.value };
                      set("allowances", next);
                    }}
                    className="h-8 min-w-[140px] flex-1 border-ink-200 bg-white text-xs"
                  />
                  <Input
                    type="number"
                    value={a.amount}
                    onChange={(e) => {
                      const next = [...form.allowances];
                      next[i] = { ...a, amount: Number(e.target.value) };
                      set("allowances", next);
                    }}
                    className="h-8 w-28 border-ink-200 bg-white text-xs tnum"
                  />
                  <Toggle
                    checked={a.taxable}
                    onChange={(v) => {
                      const next = [...form.allowances];
                      next[i] = { ...a, taxable: v };
                      set("allowances", next);
                    }}
                    label="ជាប់ពន្ធ"
                  />
                  <button
                    onClick={() => set("allowances", form.allowances.filter((x) => x.id !== a.id))}
                    className="grid h-7 w-7 place-items-center rounded text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-ink-600 hover:text-ink-900">
                + បន្ថែមប្រាក់ឧបត្ថម្ភ
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ALLOWANCE_PRESETS.map((p) => (
                  <button
                    key={p.kind}
                    onClick={() => addAllowance(p)}
                    className="rounded-lg border border-ink-200 px-2 py-1 text-[10px] font-medium text-ink-600 hover:border-ink-400 hover:bg-white"
                  >
                    {p.kh}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-900 p-3 text-white sm:grid-cols-4">
            {[
              ["ប្រាក់ខែគោល", KHR(form.baseSalary)],
              ["ប្រាក់ឧបត្ថម្ភ", KHR(form.allowances.reduce((s, a) => s + a.amount, 0))],
              ["Gross", KHR(totalGross)],
              ["≈ USD", `$${(totalGross / settings.exchangeRate).toFixed(0)}`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] uppercase tracking-wide text-ink-400">{k}</p>
                <p className="text-[13px] font-bold tnum">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- statutory ---------- */}
      {tab === "statutory" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>លេខ ប.ស.ស</Label>
              <Input value={form.nssfNumber} onChange={(e) => set("nssfNumber", e.target.value)} placeholder="NSSF-123456" />
            </div>
            <div>
              <Label>លេខអត្តសញ្ញាណសារពើពន្ធ (TIN)</Label>
              <Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} placeholder="TIN-1234567" />
            </div>
            <div>
              <Label>ស្ថានភាពសារពើពន្ធ</Label>
              <Select value={form.taxResidency} onChange={(e) => set("taxResidency", e.target.value as TaxResidency)}>
                <option value="resident">អ្នកស្នាក់នៅ (Resident) — ជាន់ ០–២០%</option>
                <option value="non_resident">មិនស្នាក់នៅ — ២០% ថេរ</option>
              </Select>
            </div>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <Toggle checked={form.isNssfMember} onChange={(v) => set("isNssfMember", v)} label="សមាជិក ប.ស.ស" />
              <Toggle checked={form.isUnionMember} onChange={(v) => set("isUnionMember", v)} label="សមាជិកសហជីព" />
            </div>
            <div>
              <Label>ចំនួនគូស្វាមី/ភរិយាក្នុងបន្ទុក</Label>
              <Select value={String(form.spouseDependents)} onChange={(e) => set("spouseDependents", Number(e.target.value))}>
                <option value="0">០ នាក់</option>
                <option value="1">១ នាក់</option>
              </Select>
            </div>
            <div>
              <Label>ចំនួនកូនក្នុងបន្ទុក (ក្រោម ១៤ ឆ្នាំ)</Label>
              <Select value={String(form.childDependents)} onChange={(e) => set("childDependents", Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} នាក់</option>
                ))}
              </Select>
            </div>
            {form.isUnionMember && (
              <div>
                <Label hint="% នៃប្រាក់ខែគោល">ភាគទានសហជីព</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.unionFeeRate}
                  onChange={(e) => set("unionFeeRate", Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-ink-50 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">ការប៉ាន់ស្មានប្រចាំខែ</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["ប.ស.ស បុគ្គលិក", preview.empNssf],
                ["ពន្ធលើបៀវត្សរ៍", preview.tax],
                ["ប្រាក់ទទួលបាន", preview.net],
                ["កាត់បន្ថយ (នាក់)", preview.deps],
              ].map(([k, v], i) => (
                <div key={i} className="rounded-lg bg-white p-2 ring-1 ring-ink-200">
                  <p className="text-[9px] text-ink-400">{k}</p>
                  <p className="text-[12px] font-bold text-ink-900 tnum">
                    {i === 3 ? v : KHR(v as number)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-ink-400">
              * ការប៉ាន់ស្មានផ្អែកលើប្រាក់ខែពេញខែ មិនរាប់ OT ឬប្រាក់រង្វាន់។ ការគណនាពិតប្រាកដធ្វើឡើងនៅពេលគណនាបៀវត្សរ៍។
            </p>
          </div>
        </div>
      )}

      {/* ---------- bank ---------- */}
      {tab === "bank" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>ធនាគារ</Label>
            <Select value={form.bankName} onChange={(e) => set("bankName", e.target.value)}>
              {[
                "ធនាគារ អេស៊ីលីដា (ACLEDA)",
                "ធនាគារ កាណាឌីយ៉ា (Canadia Bank)",
                "ធនាគារ វឌ្ឍនៈ (Vattanac Bank)",
                "ធនាគារ អាស៊ី សម្បូរណ៍ (ABA)",
                "ធនាគារ ស្ថាបនា (Sathapana Bank)",
                "ធនាគារ ខ្មែរសង្គ្រោះ (Wing / Wing Bank)",
                "ធនាគារ ហត្ថា (Hattha Bank)",
                "ផ្សេងៗ",
              ].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>លេខគណនី</Label>
            <Input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} placeholder="0001-234567-89" />
          </div>
          <div>
            <Label>វិធីបង់ប្រាក់</Label>
            <Select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as any)}>
              <option value="bank_transfer">ផ្ទេរតាមធនាគារ</option>
              <option value="cash">សាច់ប្រាក់</option>
              <option value="cheque">មូលប្បទានប័ត្រ</option>
              <option value="mobile_wallet">កាបូបឌីជីថល</option>
            </Select>
          </div>
          <div className="flex items-end">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
              ព័ត៌មានគណនីត្រូវបានប្រើសម្រាប់បញ្ជីផ្ទេរប្រាក់ធនាគារ (BTF-01)។
              សូមផ្ទៀងផ្ទាត់លេខគណនីឱ្យបានត្រឹមត្រូវមុនពេលបើកប្រាក់។
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
