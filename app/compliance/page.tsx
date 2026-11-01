"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen, ShieldCheck, Receipt, CalendarDays, Scale, Info, ExternalLink,
  CheckCircle2, AlertTriangle, Landmark, Clock, Users, FileText, ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Card, CardHeader, Select, Table, Td, Th } from "@/components/ui";
import { TAX_BRACKETS } from "@/lib/payroll/cambodia";
import { holidaysForYear } from "@/lib/payroll/holidays";
import { KHR, KHRs, toKhmerDigits, formatDate, MONTHS_KH, countKhmer } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function CompliancePage() {
  const { settings, employees } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const holidays = useMemo(() => holidaysForYear(year), [year]);
  const active = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");

  const byMonth = useMemo(() => {
    const m = new Map<number, typeof holidays>();
    holidays.forEach((h) => {
      const mo = new Date(h.date).getMonth();
      m.set(mo, [...(m.get(mo) ?? []), h]);
    });
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [holidays]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-900">ច្បាប់ និងសារពើពន្ធ</h1>
        <p className="mt-0.5 text-xs text-ink-400">
          ឯកសារយោងអត្រាផ្លូវការ · ការអនុលោមភាពការងារ និងប.ស.ស ព្រះរាជាណាចក្រកម្ពុជា
        </p>
      </div>

      {/* ---------- statute cards ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* NSSF */}
        <Card>
          <CardHeader title="បេឡាជាតិសន្តិសុខសង្គម" subtitle="NSSF · ប.ស.ស" icon={<ShieldCheck size={15} />} />
          <div className="p-4">
            <Table>
              <thead>
                <tr>
                  <Th>គម្រោង</Th>
                  <Th align="center">បុគ្គលិក</Th>
                  <Th align="center">និយោជក</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["ហានិភ័យការងារ", 0, settings.nssfEmployerRiskRate],
                  ["សុខាភិបាល", settings.nssfEmployeeHealthRate, settings.nssfEmployerHealthRate],
                  ["ប៉ង់ស្យ៊ុង", settings.nssfEmployeePensionRate, settings.nssfEmployerPensionRate],
                ].map(([k, e, er]) => (
                  <tr key={k as string}>
                    <Td><span className="text-[11px] text-ink-700">{k as string}</span></Td>
                    <Td align="center"><span className="text-[11px] tnum">{e as number}%</span></Td>
                    <Td align="center"><span className="text-[11px] tnum">{er as number}%</span></Td>
                  </tr>
                ))}
                <tr className="bg-ink-50">
                  <Td><b className="text-[11px]">សរុប</b></Td>
                  <Td align="center">
                    <b className="text-[11px] text-teal-700 tnum">
                      {(settings.nssfEmployeeHealthRate + settings.nssfEmployeePensionRate).toFixed(1)}%
                    </b>
                  </Td>
                  <Td align="center">
                    <b className="text-[11px] text-teal-700 tnum">
                      {(settings.nssfEmployerRiskRate + settings.nssfEmployerHealthRate + settings.nssfEmployerPensionRate).toFixed(1)}%
                    </b>
                  </Td>
                </tr>
              </tbody>
            </Table>
            <div className="mt-3 space-y-1.5 rounded-lg bg-ink-50 p-2.5 text-[10px] text-ink-600">
              <p>• មូលដ្ឋានគិតអប្បបរមា: <b>៛{KHR(settings.nssfFloor)}</b></p>
              <p>• មូលដ្ឋានគិតអតិបរមា: <b>៛{KHR(settings.nssfCeiling)}</b></p>
              <p>• ត្រូវបង់មុន <b>ថ្ងៃទី១៥</b> នៃខែបន្ទាប់</p>
              <p>• ប៉ង់ស្យ៊ុងដំណាក់កាលទី១ (២០២២–២០២៧): ៤% សរុប</p>
            </div>
          </div>
        </Card>

        {/* Tax brackets */}
        <Card>
          <CardHeader title="ពន្ធលើបៀវត្សរ៍" subtitle="Tax on Salary (ToS)" icon={<Receipt size={15} />} />
          <div className="p-4">
            <Table>
              <thead>
                <tr>
                  <Th>ជាន់ប្រាក់ចំណូល (៛/ខែ)</Th>
                  <Th align="center">អត្រា</Th>
                  <Th align="right">ពន្ធសន្មត</Th>
                </tr>
              </thead>
              <tbody>
                {TAX_BRACKETS.map((b, i) => (
                  <tr key={i}>
                    <Td>
                      <span className="text-[10px] text-ink-700 tnum">
                        {b.from === 0 ? "០" : KHR(b.from)} – {b.to ? KHR(b.to) : "∞"}
                      </span>
                    </Td>
                    <Td align="center">
                      <Badge tone={b.rate === 0 ? "success" : b.rate === 20 ? "danger" : "neutral"}>
                        {toKhmerDigits(b.rate)}%
                      </Badge>
                    </Td>
                    <Td align="right">
                      <span className="text-[10px] tnum">{b.base ? KHR(b.base) : "—"}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-3 space-y-1.5 rounded-lg bg-ink-50 p-2.5 text-[10px] text-ink-600">
              <p>• កាត់បន្ថយផ្ទាល់ខ្លួន: <b>៛{KHR(settings.taxPersonalDeduction)}</b>/ខែ</p>
              <p>• កាត់បន្ថយក្នុងបន្ទុក: <b>៛{KHR(settings.taxDependentDeduction)}</b>/នាក់/ខែ</p>
              <p>• អ្នកមិនស្នាក់នៅ: <b>២០%</b> ថេរ គ្មានកាត់បន្ថយ</p>
              <p>• ត្រូវបង់មុន <b>ថ្ងៃទី២០</b> នៃខែបន្ទាប់</p>
            </div>
          </div>
        </Card>

        {/* Overtime */}
        <Card>
          <CardHeader title="អត្រាថែមម៉ោង" subtitle="តាមប្រកាសលេខ ២៣៣" icon={<Clock size={15} />} />
          <div className="p-4">
            <Table>
              <thead>
                <tr>
                  <Th>ប្រភេទថ្ងៃ</Th>
                  <Th align="center">មេគុណ</Th>
                  <Th align="right">ឧទាហរណ៍/ម៉ោង</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["ថ្ងៃធ្វើការធម្មតា", settings.otWeekdayRate],
                  ["ថ្ងៃសម្រាកប្រចាំសប្តាហ៍", settings.otRestDayRate],
                  ["ថ្ងៃបុណ្យជាតិ", settings.otHolidayRate],
                ].map(([k, m]) => {
                  const hourly = (800_000 / 26 / 8) * (m as number);
                  return (
                    <tr key={k as string}>
                      <Td><span className="text-[10px] text-ink-700">{k as string}</span></Td>
                      <Td align="center"><b className="text-[11px] tnum">×{m}</b></Td>
                      <Td align="right"><span className="text-[10px] tnum">៛{KHR(hourly)}</span></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <p className="mt-2 text-[9px] leading-relaxed text-ink-400">
              * ឧទាហរណ៍គណនាលើប្រាក់ខែ ៛៨០០,០០០/ខែ (២៦ ថ្ងៃ × ៨ ម៉ោង)
            </p>

            <div className="mt-3 space-y-1.5 rounded-lg bg-ink-50 p-2.5 text-[10px] text-ink-600">
              <p>• ម៉ោងធ្វើការធម្មតា: <b>៤៨ ម៉ោង/សប្តាហ៍</b></p>
              <p>• ច្បាប់សម្រាកប្រចាំឆ្នាំ: <b>១៨ ថ្ងៃ</b></p>
              <p>• ថែមម៉ោងអតិបរមា: <b>២ ម៉ោង/ថ្ងៃ</b></p>
              <p>• ប្រាក់ឈ្នួលអប្បបរមាឧស្សាហកម្ម: <b>៛៤២០,០០០</b></p>
            </div>
          </div>
        </Card>
      </div>

      {/* ---------- deadlines ---------- */}
      <Card>
        <CardHeader title="កាលកំណត់ផ្លូវការ" subtitle="ប្រតិទិនអនុលោមភាពប្រចាំខែ" icon={<CalendarDays size={15} />} />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { d: 25, k: "បើកប្រាក់បុគ្គលិក", en: "Pay salaries", tone: "bg-ink-900 text-white", note: "ថ្ងៃទី២៥ នៃខែ" },
            { d: 15, k: "បង់ភាគទាន ប.ស.ស", en: "NSSF contribution", tone: "bg-teal-600 text-white", note: "ខែបន្ទាប់" },
            { d: 20, k: "បង់ពន្ធលើបៀវត្សរ៍", en: "Tax on salary", tone: "bg-gold-600 text-white", note: "ខែបន្ទាប់" },
            { d: 20, k: "ប្រកាសពន្ធប្រចាំខែ", en: "Monthly tax return", tone: "bg-violet-600 text-white", note: "ខែបន្ទាប់" },
          ].map((x) => (
            <div key={x.k} className={cn("rounded-xl p-3", x.tone)}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wide opacity-70">{x.en}</span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tnum">
                  {toKhmerDigits(x.d)}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] font-semibold">{x.k}</p>
              <p className="text-[9px] opacity-70">{x.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ---------- holidays ---------- */}
      <Card>
        <CardHeader
          title="ប្រតិទិនថ្ងៃឈប់សម្រាកសាធារណៈ"
          subtitle={`${holidays.length} ថ្ងៃក្នុងឆ្នាំ ${toKhmerDigits(year)} · តាមអនុក្រឹត្យរាជរដ្ឋាភិបាល`}
          icon={<CalendarDays size={15} />}
          action={
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} className="h-8 w-28 text-xs">
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {byMonth.map(([month, list]) => (
            <div key={month}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-ink-700">
                <span className="h-1 w-1 rounded-full bg-gold-500" />
                {MONTHS_KH[month]} <span className="text-[9px] font-normal text-ink-400">({list.length})</span>
              </p>
              <ul className="space-y-1">
                {list.map((h) => (
                  <li key={h.date} className="flex items-start gap-1.5 rounded-lg bg-ink-50 px-2 py-1">
                    <span className="mt-0.5 w-5 shrink-0 text-center text-[10px] font-bold text-ink-700 tnum">
                      {toKhmerDigits(new Date(h.date).getDate())}
                    </span>
                    <span className="min-w-0 flex-1 text-[10px] leading-snug text-ink-600">{h.nameKh}</span>
                    {h.provisional && (
                      <span className="shrink-0 text-[8px] text-amber-600" title="កាលបរិច្ឆេទបណ្តោះអាសន្ន">
                        ~
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 px-4 py-2.5">
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-500">
            <Info size={11} className="mt-0.5 shrink-0" />
            កាលបរិច្ឆេទដែលមានសញ្ញា (≈) ជាថ្ងៃបុណ្យតាមចន្ទគតិ ដែលអាចផ្លាស់ប្តូរតាមការប្រកាសផ្លូវការ។
            ថ្ងៃបុណ្យជាតិទាំងអស់ត្រូវបើកប្រាក់ឈ្នួលពេញ (Paid public holidays)។
          </p>
        </div>
      </Card>

      {/* ---------- compliance audit ---------- */}
      <Card>
        <CardHeader title="ការត្រួតពិនិត្យអនុលោមភាព" subtitle="ស្ថានភាពទិន្នន័យបុគ្គលិក" icon={<CheckCircle2 size={15} />} />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              k: "លេខ ប.ស.ស",
              ok: active.filter((e) => e.nssfNumber).length,
              total: active.length,
              note: "បុគ្គលិកទាំងអស់ត្រូវចុះឈ្មោះ",
            },
            {
              k: "លេខសារពើពន្ធ (TIN)",
              ok: active.filter((e) => e.taxNumber).length,
              total: active.length,
              note: "ត្រូវការសម្រាប់ការកាត់ទុកពន្ធ",
            },
            {
              k: "គណនីធនាគារ",
              ok: active.filter((e) => e.bankAccount).length,
              total: active.length,
              note: "សម្រាប់ការផ្ទេរប្រាក់ខែ",
            },
            {
              k: "អត្តសញ្ញាណប័ណ្ណ",
              ok: active.filter((e) => e.nationalId).length,
              total: active.length,
              note: "ត្រូវការសម្រាប់កិច្ចសន្យា",
            },
            {
              k: "ប្រាក់ខែ ≥ អប្បបរមា",
              ok: active.filter((e) => e.baseSalary >= 420_000).length,
              total: active.length,
              note: "៛៤២០,០០០ (ឧស្សាហកម្ម)",
            },
            {
              k: "កិច្ចសន្យាត្រឹមត្រូវ",
              ok: active.filter((e) => e.employmentType !== "probation" || e.hireDate).length,
              total: active.length,
              note: "សម័យសាកល្បង ≤ ៣ ខែ",
            },
          ].map((c) => {
            const pct = c.total ? (c.ok / c.total) * 100 : 0;
            const full = pct === 100;
            return (
              <div key={c.k} className="rounded-xl border border-ink-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink-800">{c.k}</p>
                    <p className="text-[9px] text-ink-400">{c.note}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", full ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {c.ok}/{c.total}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-100">
                  <div className={cn("h-full rounded-full", full ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---------- legal references ---------- */}
      <Card>
        <CardHeader title="ឯកសារច្បាប់យោង" subtitle="Legal references" icon={<Scale size={15} />} />
        <div className="divide-y divide-ink-100">
          {[
            { t: "ច្បាប់ស្តីពីការងារ", d: "ព្រះរាជក្រឹត្យលេខ ១៩២ កស/រកម ចុះថ្ងៃទី ១៣ មីនា ១៩៩៧", note: "សិទ្ធិ និងកាតព្វកិច្ចនិយោជក-និយោជិត" },
            { t: "ច្បាប់ស្តីពីសារពើពន្ធ", d: "ជំពូកទី ៣ — ពន្ធលើបៀវត្សរ៍ (មាត្រា ៤៤–៦២)", note: "អត្រាជាប់ជាន់ និងការកាត់ទុក" },
            { t: "អនុក្រឹត្យស្តីពី ប.ស.ស", d: "លេខ ៣២ អនក្រ.បក ចុះថ្ងៃទី ០២ មីនា ២០២១", note: "ភាគទានប៉ង់ស្យ៊ុង និងសុខាភិបាល" },
            { t: "ប្រកាសស្តីពីអត្ថប្រយោជន៍អានុភាពការងារ", d: "ប្រកាសលេខ ៤៤៣ កស/ប្រក ចុះថ្ងៃទី ២១ កញ្ញា ២០១៨", note: "១៥ ថ្ងៃ/ឆ្នាំ បង់ខែមិថុនា និងធ្នូ" },
            { t: "ប្រកាសស្តីពីម៉ោងធ្វើការ", d: "ប្រកាសលេខ ២៣៣ កស/ប្រក", note: "អត្រាថែមម៉ោង ១.៥× / ២× / ៣×" },
            { t: "ប្រកាសស្តីពីប្រាក់ឈ្នួលអប្បបរមា", d: "ប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ", note: "៛៤២០,០០០/ខែ (ឧស្សាហកម្មកាត់ដេរ)" },
          ].map((l) => (
            <div key={l.t} className="flex items-start gap-3 px-4 py-2.5">
              <FileText size={13} className="mt-0.5 shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-ink-800">{l.t}</p>
                <p className="text-[10px] text-ink-500">{l.d}</p>
              </div>
              <span className="shrink-0 text-[9px] text-ink-400">{l.note}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 bg-amber-50/50 px-4 py-2.5">
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-800">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            ព័ត៌មាននេះជាការណែនាំទូទៅសម្រាប់ការអនុវត្ត។ សូមផ្ទៀងផ្ទាត់ជាមួយឯកសារផ្លូវការចុងក្រោយ ឬទីប្រឹក្សាពន្ធដារមុនការប្រកាសប្រចាំខែ។
          </p>
        </div>
      </Card>
    </div>
  );
}
