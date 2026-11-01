"use client";

import React, { useMemo, useState } from "react";
import {
  Calculator, Receipt, ShieldCheck, Wallet, Info, ChevronRight, Users,
  ArrowRight, Sparkles, Printer, TrendingDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, CardHeader, Input, Label, Select, Toggle } from "@/components/ui";
import {
  calculateNssf, calculateTaxOnSalary, dependentCount, TAX_BRACKETS,
} from "@/lib/payroll/cambodia";
import { KHR, KHRs, USD, toKhmerDigits, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function CalculatorPage() {
  const { settings } = useStore();
  const [salary, setSalary] = useState(1_500_000);
  const [spouse, setSpouse] = useState(1);
  const [children, setChildren] = useState(2);
  const [residency, setResidency] = useState<"resident" | "non_resident">("resident");
  const [isMember, setIsMember] = useState(true);
  const [otHours, setOtHours] = useState(0);
  const [allowance, setAllowance] = useState(0);

  const gross = salary + allowance + Math.round((salary / 26 / 8) * otHours * settings.otWeekdayRate);

  const nssf = useMemo(
    () => calculateNssf(gross, settings, { isMember }),
    [gross, settings, isMember]
  );
  const deps = dependentCount(spouse, children);
  const tax = useMemo(
    () => calculateTaxOnSalary(gross, nssf.employeeTotal, deps, settings, residency),
    [gross, nssf.employeeTotal, deps, settings, residency]
  );

  const net = gross - nssf.employeeTotal - tax.tax;
  const employerCost = gross + nssf.employerTotal;

  const bracketRows = useMemo(() => {
    let remaining = tax.taxableIncome;
    return TAX_BRACKETS.map((b) => {
      const upper = b.to ?? Infinity;
      const amt = Math.max(0, Math.min(remaining, upper - b.from));
      remaining -= amt;
      return { ...b, amount: amt, taxInBand: Math.round((amt * b.rate) / 100) };
    }).filter((b) => b.amount > 0);
  }, [tax.taxableIncome]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-900">ម៉ាស៊ីនគិតលុយបៀវត្សរ៍</h1>
        <p className="mt-0.5 text-xs text-ink-400">
          គណនា ប.ស.ស ពន្ធលើបៀវត្សរ៍ និងប្រាក់ទទួលបាន តាមអត្រាផ្លូវការឆ្នាំ ២០២៦
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* ---------- inputs ---------- */}
        <Card className="lg:col-span-2">
          <CardHeader title="ប៉ារ៉ាម៉ែត្រ" subtitle="បំពេញព័ត៌មានដើម្បីគណនា" icon={<Calculator size={15} />} />
          <div className="space-y-3 p-4">
            <div>
              <Label required hint="រៀល/ខែ">ប្រាក់ខែគោល</Label>
              <Input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="text-base font-semibold tnum"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[500_000, 800_000, 1_500_000, 3_000_000, 6_000_000, 12_000_000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSalary(v)}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                      salary === v ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                    )}
                  >
                    {v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}K`}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-ink-400 tnum">≈ {USD(salary / settings.exchangeRate)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label hint="រៀល">ប្រាក់ឧបត្ថម្ភ</Label>
                <Input type="number" value={allowance} onChange={(e) => setAllowance(Number(e.target.value))} />
              </div>
              <div>
                <Label hint="ម៉ោង">ម៉ោង OT (×{settings.otWeekdayRate})</Label>
                <Input type="number" value={otHours} onChange={(e) => setOtHours(Number(e.target.value))} />
              </div>
            </div>

            <div className="rounded-xl border border-ink-200 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">គ្រួសារ & ស្ថានភាព</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>គូស្វាមី/ភរិយា</Label>
                  <Select value={String(spouse)} onChange={(e) => setSpouse(Number(e.target.value))}>
                    <option value="0">០ នាក់</option>
                    <option value="1">១ នាក់</option>
                  </Select>
                </div>
                <div>
                  <Label>កូនក្នុងបន្ទុក</Label>
                  <Select value={String(children)} onChange={(e) => setChildren(Number(e.target.value))}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n} នាក់</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-2">
                <Label>ស្ថានភាពសារពើពន្ធ</Label>
                <Select value={residency} onChange={(e) => setResidency(e.target.value as any)}>
                  <option value="resident">អ្នកស្នាក់នៅ (ជាន់ ០–២០%)</option>
                  <option value="non_resident">មិនស្នាក់នៅ (២០% ថេរ)</option>
                </Select>
              </div>
              <div className="mt-2">
                <Toggle checked={isMember} onChange={setIsMember} label="សមាជិក ប.ស.ស" />
              </div>
            </div>

            <div className="rounded-lg bg-ink-50 p-2.5 text-[10px] leading-relaxed text-ink-500">
              <Info size={11} className="mr-1 inline" />
              ការគណនាផ្អែកលើ ៖ មូលដ្ឋាន ប.ស.ស ៛{KHR(settings.nssfFloor)}–៛{KHR(settings.nssfCeiling)},
              កាត់បន្ថយផ្ទាល់ខ្លួន ៛{KHR(settings.taxPersonalDeduction)},
              កាត់បន្ថយក្នុងបន្ទុក ៛{KHR(settings.taxDependentDeduction)}/នាក់។
            </div>
          </div>
        </Card>

        {/* ---------- results ---------- */}
        <div className="space-y-4 lg:col-span-3">
          {/* summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "ចំណូលសរុប", v: gross, c: "text-ink-900", bg: "bg-white" },
              { k: "ប.ស.ស", v: nssf.employeeTotal, c: "text-teal-700", bg: "bg-teal-50" },
              { k: "ពន្ធ ToS", v: tax.tax, c: "text-gold-700", bg: "bg-gold-50" },
              { k: "ទទួលបាន", v: net, c: "text-emerald-700", bg: "bg-emerald-50" },
            ].map((x) => (
              <Card key={x.k} className={cn("p-3", x.bg)}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{x.k}</p>
                <p className={cn("mt-0.5 text-[15px] font-bold tnum", x.c)}>៛{KHR(x.v)}</p>
                <p className="text-[9px] text-ink-400 tnum">≈ {USD(x.v / settings.exchangeRate)}</p>
              </Card>
            ))}
          </div>

          {/* waterfall */}
          <Card>
            <CardHeader
              title="ដំណើរការគណនា"
              subtitle={`អត្រាពន្ធប្រសិទ្ធភាព ${tax.effectiveRate.toFixed(2)}% · អត្រាជាន់ ${tax.marginalRate}%`}
              icon={<TrendingDown size={15} />}
            />
            <div className="space-y-1.5 p-4">
              {[
                { k: "ប្រាក់ខែគោល", v: salary, sign: "+", tone: "text-ink-900", bold: false },
                ...(allowance > 0 ? [{ k: "ប្រាក់ឧបត្ថម្ភ", v: allowance, sign: "+", tone: "text-ink-700", bold: false }] : []),
                ...(otHours > 0
                  ? [{ k: `ប្រាក់ថែមម៉ោង (${otHours} ម៉ោង)`, v: Math.round((salary / 26 / 8) * otHours * settings.otWeekdayRate), sign: "+", tone: "text-ink-700", bold: false }]
                  : []),
                { k: "ប្រាក់ចំណូលសរុប (Gross)", v: gross, sign: "=", tone: "text-ink-900", bold: true },
                { k: `ប.ស.ស បុគ្គលិក (${(settings.nssfEmployeeHealthRate + settings.nssfEmployeePensionRate).toFixed(1)}%)`, v: nssf.employeeTotal, sign: "−", tone: "text-teal-700", bold: false },
                { k: `កាត់បន្ថយផ្ទាល់ខ្លួន`, v: settings.taxPersonalDeduction, sign: "−", tone: "text-ink-500", bold: false },
                { k: `កាត់បន្ថយក្នុងបន្ទុក (${deps} នាក់)`, v: deps * settings.taxDependentDeduction, sign: "−", tone: "text-ink-500", bold: false },
                { k: "ប្រាក់ជាប់ពន្ធសុទ្ធ", v: tax.taxableIncome, sign: "=", tone: "text-ink-900", bold: true },
                { k: "ពន្ធលើបៀវត្សរ៍", v: tax.tax, sign: "−", tone: "text-gold-700", bold: false },
              ].map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5",
                    r.bold && "bg-ink-50"
                  )}
                >
                  <span className="w-4 shrink-0 text-center text-[11px] font-bold text-ink-400">{r.sign}</span>
                  <span className={cn("flex-1 text-[11px]", r.bold ? "font-semibold text-ink-900" : "text-ink-600")}>
                    {r.k}
                  </span>
                  <span className={cn("text-[12px] tnum", r.bold ? "font-bold" : "font-semibold", r.tone)}>
                    {KHR(r.v)}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-600 px-3 py-2.5 text-white">
                <div>
                  <p className="text-[11px] font-semibold opacity-90">ប្រាក់ខែទទួលបានសុទ្ធ</p>
                  <p className="text-[9px] opacity-70">Net Pay</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tnum">៛{KHR(net)}</p>
                  <p className="text-[10px] opacity-80 tnum">≈ {USD(net / settings.exchangeRate)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* brackets */}
          <Card>
            <CardHeader
              title="ការបែងចែកជាន់ពន្ធ"
              subtitle={residency === "resident" ? "អ្នកស្នាក់នៅ — ជាន់ ០% ដល់ ២០%" : "មិនស្នាក់នៅ — ២០% ថេរ"}
              icon={<Receipt size={15} />}
            />
            <div className="p-4">
              {residency === "non_resident" ? (
                <div className="flex items-center justify-between rounded-lg bg-gold-50 px-3 py-2 ring-1 ring-gold-200">
                  <span className="text-[11px] font-semibold text-gold-800">អត្រាថេរ ២០% លើប្រាក់ចំណូលទាំងអស់</span>
                  <span className="text-[12px] font-bold text-gold-800 tnum">៛{KHR(tax.tax)}</span>
                </div>
              ) : bracketRows.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-ink-400">
                  ប្រាក់ចំណូលទាបជាងកម្រិតជាប់ពន្ធ — មិនជាប់ពន្ធ (០%)
                </p>
              ) : (
                <div className="space-y-2">
                  {bracketRows.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 rounded bg-ink-100 px-1 py-0.5 text-center text-[10px] font-bold text-ink-700">
                        {toKhmerDigits(b.rate)}%
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between text-[10px]">
                          <span className="text-ink-500 tnum">
                            {KHR(b.from)} → {b.to ? KHR(b.to) : "∞"}
                          </span>
                          <span className="font-semibold text-ink-800 tnum">{KHR(b.taxInBand)}</span>
                        </div>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className="h-full rounded-full bg-gold-500"
                            style={{ width: `${(b.amount / (tax.taxableIncome || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-ink-50 p-2.5">
                {[
                  ["ប្រាក់ជាប់ពន្ធ", KHR(tax.taxableIncome)],
                  ["ពន្ធត្រូវបង់", KHR(tax.tax)],
                  ["អត្រាប្រសិទ្ធភាព", `${tax.effectiveRate.toFixed(2)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="text-center">
                    <p className="text-[9px] text-ink-400">{k}</p>
                    <p className="text-[11px] font-bold text-ink-900 tnum">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* employer cost */}
          <Card>
            <CardHeader title="ចំណាយពិតរបស់និយោជក" subtitle="Gross + ភាគទាន ប.ស.ស និយោជក" icon={<Wallet size={15} />} />
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Gross", gross],
                  ["សុខាភិបាល", nssf.employerHealth],
                  ["ប៉ង់ស្យ៊ុង", nssf.employerPension],
                  ["ហានិភ័យ", nssf.employerRisk],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-ink-50 p-2 text-center">
                    <p className="text-[9px] text-ink-400">{k as string}</p>
                    <p className="text-[11px] font-bold text-ink-900 tnum">{KHR(v as number)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-ink-900 px-3 py-2 text-white">
                <span className="text-[11px] font-semibold">ចំណាយសរុបរបស់ក្រុមហ៊ុន</span>
                <div className="text-right">
                  <p className="text-[13px] font-bold tnum">៛{KHR(employerCost)}</p>
                  <p className="text-[9px] opacity-70 tnum">
                    +{(((nssf.employerTotal / gross) * 100) || 0).toFixed(2)}% លើ Gross
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
