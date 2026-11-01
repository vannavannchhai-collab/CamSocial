"use client";

import React, { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { EmployeeMasterDocument } from "@/components/documents/MasterDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { exportCsv } from "@/lib/pdf/export";
import { Badge, Input, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function EmployeeMasterPage() {
  const { employees, departments, positions, settings } = useStore();
  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    let r = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");
    if (dept !== "all") r = r.filter((e) => e.departmentId === dept);
    if (q.trim()) {
      const t = q.toLowerCase();
      r = r.filter((e) =>
        `${e.lastNameKh} ${e.firstNameKh} ${e.lastNameEn} ${e.firstNameEn} ${e.code} ${e.taxNumber} ${e.nssfNumber}`
          .toLowerCase()
          .includes(t)
      );
    }
    return r.sort((a, b) => a.code.localeCompare(b.code));
  }, [employees, dept, q]);

  const pageCount = Math.max(1, Math.ceil(rows.length / 16));

  const onCsv = () => {
    const head = [
      "កូដ", "គោត្តនាម-នាម (ខ្មែរ)", "ឈ្មោះឡាតាំង", "ភេទ", "ថ្ងៃកើត",
      "មុខតំណែង", "ដេប៉ាតឺមង់", "ប្រភេទការងារ", "ថ្ងៃចូលធ្វើការ",
      "ប្រាក់ខែគោល", "ប្រាក់ឧបត្ថម្ភ", "ប.ស.ស", "TIN", "អត្តសញ្ញាណប័ណ្ណ",
      "ធនាគារ", "គណនី", "ទូរស័ព្ទ", "អ៊ីមែល",
    ];
    const body = rows.map((e) => {
      const p = positions.find((x) => x.id === e.positionId);
      const d = departments.find((x) => x.id === e.departmentId);
      return [
        e.code, `${e.lastNameKh} ${e.firstNameKh}`, `${e.lastNameEn} ${e.firstNameEn}`,
        e.gender, e.dob, p?.nameKh ?? "", d?.nameKh ?? "", e.employmentType, e.hireDate,
        e.baseSalary, e.allowances.reduce((s, a) => s + a.amount, 0),
        e.nssfNumber, e.taxNumber, e.nationalId,
        e.bankName, e.bankAccount, e.phone, e.email,
      ];
    });
    exportCsv(`employee-master-${formatDate(new Date().toISOString()).replace(/\//g, "-")}.csv`, [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="បញ្ជីព័ត៌មានបុគ្គលិក"
        subtitle={`${rows.length} នាក់ · ${pageCount} ទំព័រ`}
        filename={`employee-master-list.pdf`}
        docCode="EMP/LIST"
        backHref="/forms"
        pageCount={pageCount}
        onCsv={onCsv}
        note="បញ្ជីនេះមានលេខ ប.ស.ស, TIN, ប្រាក់ខែ និងគណនីធនាគារ សម្រាប់ត្រួតពិនិត្យឯកសារ"
      />

      <div className="no-print sticky top-[57px] z-20 border-b border-ink-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរក…" className="h-8 w-56 pl-8 text-xs" />
          </div>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-8 w-44 text-xs">
            <option value="all">គ្រប់ដេប៉ាតឺម៉ង់</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.nameKh}</option>
            ))}
          </Select>
          <Badge tone="info" className="ml-auto"><Users size={10} /> {rows.length} នាក់</Badge>
        </div>
      </div>

      <PaperStage>
        {rows.length === 0 ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">គ្មានបុគ្គលិក</p>
          </div>
        ) : (
          <EmployeeMasterDocument
            employees={rows} departments={departments} positions={positions}
            settings={settings} pageCount={pageCount}
          />
        )}
      </PaperStage>
    </div>
  );
}
