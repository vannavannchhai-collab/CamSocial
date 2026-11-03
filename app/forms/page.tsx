"use client";

import React from "react";
import Link from "next/link";
import {
  FileText, ShieldCheck, Receipt, Landmark, Layers, FileSpreadsheet,
  ArrowRight, BadgeCheck, ClipboardList, Users, Printer, Sheet,
  Building2, ScrollText, Table2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Card } from "@/components/ui";
import { monthYearKh } from "@/lib/format";
import { aggregate } from "@/lib/payroll/calc";

const FORMS = [
  {
    href: "/forms/payroll-register",
    code: "REG-01",
    title: "បញ្ជីបៀវត្សរ៍ប្រចាំខែ",
    titleEn: "Monthly Payroll Register",
    desc: "បញ្ជីលម្អិតបុគ្គលិកម្នាក់ៗ រួមប្រាក់ខែគោល ប្រាក់ឧបត្ថម្ភ OT ប.ស.ស ពន្ធ និងប្រាក់ទទួលបាន។ ទម្រង់ A4 ផ្ដេក ច្រើនទំព័រ។",
    icon: ClipboardList,
    tone: "bg-ink-100 text-ink-700",
    pages: "ច្រើនទំព័រ",
    badge: "មូលដ្ឋាន",
  },
  {
    href: "/forms/nssf",
    code: "NSSF-01",
    title: "ទម្រង់បណ្តាយការបង់ភាគទាន ប.ស.ស",
    titleEn: "NSSF Contribution Declaration",
    desc: "តារាងភាគទានសុខាភិបាល ប៉ង់ស្យ៊ុង និងហានិភ័យការងារ តាមមូលដ្ឋានកម្រៃ ៛១,២០០,០០០។",
    icon: ShieldCheck,
    tone: "bg-teal-500/10 text-teal-700",
    pages: "ច្រើនទំព័រ",
    badge: "ប.ស.ស",
  },
  {
    href: "/forms/tos",
    code: "TOS-01",
    title: "បញ្ជីពន្ធលើបៀវត្សរ៍",
    titleEn: "Tax on Salary Withholding Schedule",
    desc: "បញ្ជីកាត់ទុកពន្ធតាមជាន់ ០%–២០% រួមការកាត់បន្ថយផ្ទាល់ខ្លួន និងក្នុងបន្ទុក។",
    icon: Receipt,
    tone: "bg-gold-100 text-gold-700",
    pages: "ច្រើនទំព័រ",
    badge: "ពន្ធដារ",
  },
  {
    href: "/forms/bank-transfer",
    code: "BTF-01",
    title: "បញ្ជីផ្ទេរប្រាក់តាមធនាគារ",
    titleEn: "Bank Transfer Instruction",
    desc: "បញ្ជីអ្នកទទួល លេខគណនី និងចំនួនទឹកប្រាក់សុទ្ធ សម្រាប់បញ្ជូនទៅធនាគារ។",
    icon: Landmark,
    tone: "bg-violet-100 text-violet-700",
    pages: "ច្រើនទំព័រ",
    badge: "ធនាគារ",
  },
  {
    href: "/forms/payroll-summary",
    code: "SUM-01",
    title: "របាយការណ៍សង្ខេបបៀវត្សរ៍",
    titleEn: "Payroll Summary Report",
    desc: "សង្ខេបចំណូល ការកាត់ ចំណាយនិយោជក និងការបែងចែកតាមដេប៉ាតឺម៉ង់។",
    icon: Table2,
    tone: "bg-sky-100 text-sky-700",
    pages: "១ ទំព័រ",
    badge: "សង្ខេប",
  },
  {
    href: "/forms/employee-detail",
    code: "EMP-01",
    title: "បញ្ជីព័ត៌មានបុគ្គលិក",
    titleEn: "Employee Master Listing",
    desc: "បញ្ជីព័ត៌មានបុគ្គលិកទាំងអស់ រួមលេខ ប.ស.ស TIN ប្រាក់ខែ និងគណនីធនាគារ។",
    icon: Users,
    tone: "bg-rose-100 text-rose-700",
    pages: "ច្រើនទំព័រ",
    badge: "រដ្ឋបាល",
  },
  {
    href: "/forms/attendance",
    code: "ATM-01",
    title: "តារាងវត្តមានប្រចាំខែ",
    titleEn: "Monthly Attendance Sheet",
    desc: "តារាងវត្តមានបុគ្គលិក × ថ្ងៃក្នុងខែ រួមថ្ងៃបុណ្យជាតិ និងថ្ងៃសម្រាក។",
    icon: FileSpreadsheet,
    tone: "bg-emerald-100 text-emerald-700",
    pages: "១ ទំព័រ",
    badge: "វត្តមាន",
  },
  {
    href: "/forms/org-structure",
    code: "ORG-01",
    title: "បញ្ជីរចនាសម្ព័ន្ធអង្គភាព និងមុខតំណែង",
    titleEn: "Org Structure & Position List",
    desc: "បញ្ជីដេប៉ាតឺមង់ និងមុខតំណែងទាំងអស់ រួមកម្រិត និងជួроб្រាក់ខែ — ទម្រង់ស្តង់ដារ A4 បញ្ឈរ។",
    icon: Building2,
    tone: "bg-indigo-100 text-indigo-700",
    pages: "ច្រើនទំព័រ",
    badge: "រចនាសម្ព័ន្ធ",
  },
  {
    href: "/forms/contract",
    code: "CTR-01",
    title: "កិច្ចសន្យាការងារ",
    titleEn: "Employment Contract (UDC)",
    desc: "គំរូកិច្ចសន្យាការងារគ្មានកំណត់រយៈពេល ស្របតាមច្បាប់ការងារកម្ពុជា។",
    icon: ScrollText,
    tone: "bg-amber-100 text-amber-700",
    pages: "២ ទំព័រ",
    badge: "ច្បាប់",
  },
];

export default function FormsPage() {
  const { activeRun, payslips, settings } = useStore();
  const slips = payslips.filter((s) => s.runId === activeRun?.id);
  const totals = aggregate(slips);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-900">ទម្រង់ឯកសារផ្លូវការ</h1>
        <p className="mt-0.5 text-xs text-ink-400">
          ទម្រង់ស្តង់ដារតាមការអនុវត្តគណនេយ្យកម្ពុជា — នាំចេញ PDF A4 ដោយរក្សាភាសាខ្មែរពេញលេញ
        </p>
      </div>

      {/* context banner */}
      <Card className="overflow-hidden border-ink-200">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-800 px-5 py-4 text-white">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/20 text-gold-200 ring-1 ring-gold-300/30">
            <Building2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{settings.company.nameKh}</p>
            <p className="truncate text-[10px] text-ink-300">
              {settings.company.nameEn} · VAT {settings.company.taxId} · NSSF {settings.company.nssfEmployerNumber}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-400">វដ្តបច្ចុប្បន្ន</p>
              <p className="font-semibold">{activeRun ? activeRun.code : "—"}</p>
            </div>
            {activeRun && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-ink-400">ប្រចាំ</p>
                <p className="font-semibold">{monthYearKh(activeRun.periodMonth, activeRun.periodYear)}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-400">បុគ្គលិក</p>
              <p className="font-semibold tnum">{slips.length} នាក់</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-ink-400">ចំនួនសុទ្ធ</p>
              <p className="font-semibold tnum">៛{totals.netPay.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FORMS.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href} className="group">
              <Card className="flex h-full flex-col p-4 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-ink-300 group-hover:shadow-pop">
                <div className="flex items-start justify-between gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${f.tone}`}>
                    <Icon size={17} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="neutral" className="!text-[9px]">{f.pages}</Badge>
                    <Badge tone="gold" className="!text-[9px]">{f.badge}</Badge>
                  </div>
                </div>
                <h3 className="mt-3 text-[13px] font-semibold leading-snug text-ink-900">
                  {f.title}
                </h3>
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                  {f.titleEn}
                </p>
                <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-ink-500">{f.desc}</p>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2.5">
                  <span className="font-mono text-[10px] text-ink-400">{f.code}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-700 group-hover:text-ink-900">
                    បើកមើល <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* print guidance */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <BadgeCheck size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink-900">គុណភាពនៃការនាំចេញ PDF</p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink-500">
              <li>• <b>នាំចេញ PDF</b> — បង្កើតឯកសារ A4 ពិតប្រាកដ (២១០×២៩៧ ម.ម) ដោយអក្សរខ្មែរត្រឹមត្រូវ ១០០%។</li>
              <li>• <b>បោះពុម្ព</b> — បើកប្រអប់បោះពុម្ពរបស់កម្មវិធីរុករក (ជ្រើស "Save as PDF" ដើម្បីទទួលបានឯកសារ vector)។</li>
              <li>• <b>CSV</b> — នាំចេញទិន្នន័យសម្រាប់ Excel ដោយរក្សាអក្សរខ្មែរ (UTF-8 BOM)។</li>
              <li>• រាល់ទម្រង់មាន <b>ក្បាលឯកសារជាតិ</b>, <b>លេខឯកសារ</b>, <b>តារាងមានស៊ុម</b> និង <b>ប្លុកហត្ថលេខា</b> តាមស្តង់ដារ។</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
