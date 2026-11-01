"use client";

import React, { useState } from "react";
import {
  Settings, Building2, ShieldCheck, Receipt, Clock, RotateCcw, Save,
  Download, Upload, Database, Info, CheckCircle2, Calculator,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge, Button, Card, CardHeader, Input, Label, Modal, Select, Toggle,
} from "@/components/ui";
import { KHR, KHRs, formatDate } from "@/lib/format";
import { exportJson } from "@/lib/pdf/export";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "company", label: "ក្រុមហ៊ុន", icon: Building2 },
  { id: "nssf", label: "ប.ស.ស", icon: ShieldCheck },
  { id: "tax", label: "ពន្ធដារ", icon: Receipt },
  { id: "work", label: "ការងារ", icon: Clock },
  { id: "data", label: "ទិន្នន័យ", icon: Database },
] as const;

export default function SettingsPage() {
  const { settings, updateSettings, resetDemo, employees, payslips, runs, toast, departments } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("company");
  const [confirmReset, setConfirmReset] = useState(false);
  const [draft, setDraft] = useState(settings);

  const setCompany = (k: keyof typeof settings.company, v: string) =>
    setDraft((d) => ({ ...d, company: { ...d.company, [k]: v } }));

  const setNum = (k: keyof typeof settings, v: number) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    updateSettings(draft);
    toast({ title: "បានរក្សាទុកការកំណត់", description: "ការផ្លាស់ប្តូរនឹងអនុវត្តលើការគណនាបន្ទាប់", tone: "success" });
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">ការកំណត់ប្រព័ន្ធ</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            ព័ត៌មានក្រុមហ៊ុន អត្រាច្បាប់ និងការគ្រប់គ្រងទិន្នន័យ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge tone="warning" dot>មានការផ្លាស់ប្តូរមិនបានរក្សាទុក</Badge>}
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save size={14} /> រក្សាទុក
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                tab === t.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
              )}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ---------- company ---------- */}
      {tab === "company" && (
        <Card>
          <CardHeader title="ព័ត៌មានក្រុមហ៊ុន" subtitle="បង្ហាញលើឯកសារ PDF ទាំងអស់" icon={<Building2 size={15} />} />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {[
              ["nameKh", "ឈ្មោះខ្មែរ", "ក្រុមហ៊ុន សុភមង្គល ខេមបូឌា"],
              ["nameEn", "ឈ្មោះឡាតាំង", "Sophamangkol Cambodia Co., Ltd."],
              ["taxId", "អត្តសញ្ញាណសារពើពន្ធ (VAT TIN)", "K001-901234567"],
              ["nssfEmployerNumber", "លេខ ប.ស.ស និយោជក", "NSSF-EMP-004521"],
              ["phone", "ទូរស័ព្ទ", "+855 23 900 128"],
              ["email", "អ៊ីមែល", "payroll@company.com.kh"],
              ["bankName", "ធនាគារ", "ACLEDA Bank"],
              ["bankAccount", "លេខគណនីក្រុមហ៊ុន", "0001-234567-89"],
              ["signatoryNameKh", "ឈ្មោះអ្នកចុះហត្ថលេខា", "លោក សុខ ច័ន្ទថា"],
              ["signatoryPositionKh", "តំណែងអ្នកចុះហត្ថលេខា", "នាយកប្រតិបត្តិ"],
              ["accountantNameKh", "គណនេយ្យករ", "អ្នកស្រី លឹម សុជាតា"],
              ["logoText", "អក្សរកាត់និមិត្តសញ្ញា", "SPM"],
            ].map(([k, label, ph]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input
                  value={(draft.company as any)[k]}
                  onChange={(e) => setCompany(k as any, e.target.value)}
                  placeholder={ph}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label>អាសយដ្ឋាន (ខ្មែរ)</Label>
              <Input value={draft.company.addressKh} onChange={(e) => setCompany("addressKh", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>អាសយដ្ឋាន (ឡាតាំង)</Label>
              <Input value={draft.company.addressEn} onChange={(e) => setCompany("addressEn", e.target.value)} />
            </div>
            <div>
              <Label>ខេត្ត/ក្រុង</Label>
              <Input value={draft.company.province} onChange={(e) => setCompany("province", e.target.value)} />
            </div>
            <div>
              <Label hint="៛/USD">អត្រាប្តូរប្រាក់</Label>
              <Input type="number" value={draft.exchangeRate} onChange={(e) => setNum("exchangeRate", Number(e.target.value))} />
            </div>
          </div>
        </Card>
      )}

      {/* ---------- NSSF ---------- */}
      {tab === "nssf" && (
        <Card>
          <CardHeader
            title="អត្រាភាគទាន ប.ស.ស"
            subtitle="អនុវត្តតាមអនុក្រឹត្យលេខ ៣២ អនក្រ.បក (ដំណាក់កាលទី១: ២០២២–២០២៧)"
            icon={<ShieldCheck size={15} />}
          />
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["nssfEmployeeHealthRate", "សុខាភិបាល — បុគ្គលិក", "%"],
                ["nssfEmployerHealthRate", "សុខាភិបាល — និយោជក", "%"],
                ["nssfEmployeePensionRate", "ប៉ង់ស្យ៊ុង — បុគ្គលិក", "%"],
                ["nssfEmployerPensionRate", "ប៉ង់ស្យ៊ុង — និយោជក", "%"],
                ["nssfEmployerRiskRate", "ហានិភ័យការងារ — និយោជក", "%"],
                ["", "", ""],
              ].map(([k, label, unit], i) =>
                k ? (
                  <div key={i}>
                    <Label hint={unit}>{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={(draft as any)[k]}
                      onChange={(e) => setNum(k as any, Number(e.target.value))}
                    />
                  </div>
                ) : null
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label hint="រៀល">មូលដ្ឋានគិតអប្បបរមា</Label>
                <Input type="number" value={draft.nssfFloor} onChange={(e) => setNum("nssfFloor", Number(e.target.value))} />
              </div>
              <div>
                <Label hint="រៀល">មូលដ្ឋានគិតអតិបរមា</Label>
                <Input type="number" value={draft.nssfCeiling} onChange={(e) => setNum("nssfCeiling", Number(e.target.value))} />
              </div>
            </div>

            <div className="mt-3">
              <Toggle
                checked={draft.socialSecurityEnabled}
                onChange={(v) => setDraft((d) => ({ ...d, socialSecurityEnabled: v }))}
                label="បើកការគណនា ប.ស.ស"
              />
            </div>

            <div className="mt-4 rounded-xl bg-ink-50 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">សង្ខេបអត្រា</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["បុគ្គលិក", (draft.nssfEmployeeHealthRate + draft.nssfEmployeePensionRate).toFixed(1) + "%"],
                  ["និយោជក", (draft.nssfEmployerRiskRate + draft.nssfEmployerHealthRate + draft.nssfEmployerPensionRate).toFixed(1) + "%"],
                  ["កម្រៃ", "៛" + KHR(draft.nssfCeiling)],
                  ["អតិបរមា/នាក់", "៛" + KHR((draft.nssfCeiling * (draft.nssfEmployeeHealthRate + draft.nssfEmployeePensionRate + draft.nssfEmployerRiskRate + draft.nssfEmployerHealthRate + draft.nssfEmployerPensionRate)) / 100)],
                ].map(([k, v]) => (
                  <div key={k} className="text-center">
                    <p className="text-[9px] text-ink-400">{k}</p>
                    <p className="text-[12px] font-bold text-ink-900 tnum">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- tax ---------- */}
      {tab === "tax" && (
        <Card>
          <CardHeader
            title="ពន្ធលើបៀវត្សរ៍ (ToS)"
            subtitle="ការកាត់បន្ថយតាមច្បាប់ស្តីពីសារពើពន្ធ"
            icon={<Receipt size={15} />}
          />
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label hint="រៀល/ខែ">កាត់បន្ថយផ្ទាល់ខ្លួន</Label>
                <Input type="number" value={draft.taxPersonalDeduction} onChange={(e) => setNum("taxPersonalDeduction", Number(e.target.value))} />
                <p className="mt-1 text-[10px] text-ink-400">ស្តង់ដារ: ៛១៥០,០០០</p>
              </div>
              <div>
                <Label hint="រៀល/នាក់/ខែ">កាត់បន្ថយក្នុងបន្ទុក</Label>
                <Input type="number" value={draft.taxDependentDeduction} onChange={(e) => setNum("taxDependentDeduction", Number(e.target.value))} />
                <p className="mt-1 text-[10px] text-ink-400">ស្តង់ដារ: ៛១៥០,០០០/នាក់</p>
              </div>
            </div>

            <div className="mt-3">
              <Toggle
                checked={draft.taxEnabled}
                onChange={(v) => setDraft((d) => ({ ...d, taxEnabled: v }))}
                label="បើកការគណនាពន្ធ"
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">ជាន់ពន្ធ (អ្នកស្នាក់នៅ)</p>
              <div className="overflow-hidden rounded-xl border border-ink-200">
                {[
                  ["០ – ១,៣០០,០០០", "០%", "មិនជាប់ពន្ធ"],
                  ["១,៣០០,០០១ – ២,០០០,០០០", "៥%", "+២៥,០០០"],
                  ["២,០០០,០០១ – ៨,៥០០,០០០", "១០%", "+២១០,០០០"],
                  ["៨,៥០០,០០១ – ១២,៥០០,០០០", "១៥%", "+៨៦០,០០០"],
                  ["លើស ១២,៥០០,០០០", "២០%", "+១,៤៦០,០០០"],
                ].map(([range, rate, note], i) => (
                  <div key={i} className={cn("flex items-center justify-between px-3 py-2 text-[11px]", i % 2 === 0 ? "bg-white" : "bg-ink-50/60")}>
                    <span className="text-ink-600 tnum">{range}</span>
                    <span className="font-bold text-ink-900">{rate}</span>
                    <span className="text-ink-400">{note}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex items-start gap-1 text-[10px] text-ink-400">
                <Info size={10} className="mt-0.5 shrink-0" />
                អត្រាពន្ធជាប់ជាន់ត្រូវបានកំណត់ដោយច្បាប់ — មិនអាចកែប្រែបានទេ។ គ្រាន់តែអាចកែការកាត់បន្ថយបាន។
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- work ---------- */}
      {tab === "work" && (
        <Card>
          <CardHeader title="ម៉ោងធ្វើការ & អត្រាថែមម៉ោង" subtitle="តាមប្រកាសលេខ ២៣៣ កស/ប្រក" icon={<Clock size={15} />} />
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["otWeekdayRate", "ថ្ងៃធ្វើការធម្មតា", "×"],
                ["otRestDayRate", "ថ្ងៃសម្រាក", "×"],
                ["otHolidayRate", "ថ្ងៃបុណ្យជាតិ", "×"],
                ["nightShiftPremium", "វេនយប់ (២២:០០–០៥:០០)", "×"],
              ].map(([k, label, u]) => (
                <div key={k}>
                  <Label hint={u}>{label}</Label>
                  <Input type="number" step="0.1" value={(draft as any)[k]} onChange={(e) => setNum(k as any, Number(e.target.value))} />
                </div>
              ))}
              <div>
                <Label hint="ម៉ោង/ខែ">ម៉ោងធ្វើការស្តង់ដារ</Label>
                <Input type="number" value={draft.standardMonthlyHours} onChange={(e) => setNum("standardMonthlyHours", Number(e.target.value))} />
              </div>
              <div>
                <Label hint="ថ្ងៃ/ឆ្នាំ">ច្បាប់ប្រចាំឆ្នាំ</Label>
                <Input type="number" value={draft.annualLeaveDays} onChange={(e) => setNum("annualLeaveDays", Number(e.target.value))} />
              </div>
              <div>
                <Label hint="រៀល">បង្គត់ប្រាក់ទទួលបាន</Label>
                <Select value={String(draft.roundNetPay)} onChange={(e) => setNum("roundNetPay", Number(e.target.value))}>
                  <option value="1">មិនបង្គត់</option>
                  <option value="100">១០០ រៀល</option>
                  <option value="1000">១,០០០ រៀល</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-sky-900">
                <Calculator size={11} /> ឧទាហរណ៍ការគណនាថែមម៉ោង
              </p>
              <p className="text-[10px] leading-relaxed text-sky-800">
                បុគ្គលិកប្រាក់ខែ ៛៨០០,០០០ → ថ្លៃម៉ោង ៛{(800_000 / 26 / 8).toFixed(0)} →
                ថែមម៉ោងថ្ងៃធម្មតា ៛{((800_000 / 26 / 8) * draft.otWeekdayRate).toFixed(0)}/ម៉ោង,
                ថ្ងៃសម្រាក ៛{((800_000 / 26 / 8) * draft.otRestDayRate).toFixed(0)}/ម៉ោង,
                ថ្ងៃបុណ្យ ៛{((800_000 / 26 / 8) * draft.otHolidayRate).toFixed(0)}/ម៉ោង
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- data ---------- */}
      {tab === "data" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="ស្ថិតិទិន្នន័យ" subtitle="រក្សាទុកក្នុងឧបករណ៍ (localStorage)" icon={<Database size={15} />} />
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["បុគ្គលិក", employees.length],
                  ["វដ្តបៀវត្សរ៍", runs.length],
                  ["ប័ណ្ណបៀវត្សរ៍", payslips.length],
                  ["ដេប៉ាតឺមង់", departments.length],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-ink-50 p-2.5 text-center">
                    <p className="text-[9px] uppercase tracking-wide text-ink-400">{k as string}</p>
                    <p className="text-lg font-bold text-ink-900 tnum">{v as number}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    exportJson("khmerpayroll-backup.json", {
                      exportedAt: new Date().toISOString(),
                      settings: draft,
                      employees,
                      runs,
                      payslips,
                    });
                    toast({ title: "បាននាំចេញទិន្នន័យបម្រុង", tone: "success" });
                  }}
                >
                  <Download size={14} /> នាំចេញទិន្នន័យ (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled
                  title="ត្រូវការការភ្ជាប់ម៉ាស៊ីនមេ"
                >
                  <Upload size={14} /> នាំចូលទិន្នន័យ
                </Button>
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
                ទិន្នន័យត្រូវបានរក្សាទុកក្នុងកម្មវិធីរុករករបស់អ្នក។ សម្រាប់ការប្រើប្រាស់ពហុអ្នកប្រើ
                ត្រូវភ្ជាប់ទៅមូលដ្ឋានទិន្នន័យ Supabase/PostgreSQL។
              </p>
            </div>
          </Card>

          <Card className="border-rose-200">
            <CardHeader title="តំបន់គ្រោះថ្នាក់" subtitle="សកម្មភាពមិនអាចត្រឡប់វិញ" icon={<RotateCcw size={15} />} />
            <div className="p-4">
              <p className="text-[11px] leading-relaxed text-ink-600">
                ការកំណត់ទិន្នន័យឡើងវិញនឹងលុបបុគ្គលិក វដ្តបៀវត្សរ៍ និងប័ណ្ណទាំងអស់
                ហើយជំនួសដោយទិន្នន័យគំរូដើម។ សូមនាំចេញទិន្នន័យបម្រុងជាមុន។
              </p>
              <Button variant="danger" size="sm" className="mt-3 w-full" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={14} /> កំណត់ទិន្នន័យគំរូឡើងវិញ
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="កំណត់ទិន្នន័យឡើងវិញ?"
        subtitle="បុគ្គលិក វដ្ត និងប័ណ្ណទាំងអស់នឹងត្រូវលុប"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>បោះបង់</Button>
            <Button variant="danger" size="sm" onClick={() => { resetDemo(); setConfirmReset(false); setDraft(settings); }}>
              បញ្ជាក់ការកំណត់ឡើងវិញ
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          ទិន្នន័យបច្ចុប្បន្នរួមមាន <b>{employees.length} បុគ្គលិក</b>, <b>{runs.length} វដ្ត</b> និង{" "}
          <b>{payslips.length} ប័ណ្ណបៀវត្សរ៍</b>។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
        </p>
      </Modal>
    </div>
  );
}
