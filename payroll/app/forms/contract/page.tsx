"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmploymentContractDocument } from "@/components/documents/MasterDocuments";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { Select, Badge } from "@/components/ui";
import { fullNameKh } from "@/lib/format";

export default function ContractFormPage() {
  const { employees, positions, departments, settings } = useStore();
  const list = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");
  const [empId, setEmpId] = useState(list[0]?.id ?? "");

  const employee = useMemo(() => employees.find((e) => e.id === empId), [employees, empId]);
  const position = useMemo(() => positions.find((p) => p.id === employee?.positionId), [positions, employee]);
  const department = useMemo(() => departments.find((d) => d.id === employee?.departmentId), [departments, employee]);

  return (
    <div>
      <DocumentToolbar
        title="កិច្ចសន្យាការងារ (UDC)"
        subtitle={employee ? `${fullNameKh(employee)} · ${employee.code}` : ""}
        filename={`contract-${employee?.code ?? "employee"}.pdf`}
        docCode={employee ? `CTR/${employee.code}` : "CTR"}
        backHref="/forms"
        pageCount={1}
        note="គំរូកិច្ចសន្យាគ្មានកំណត់រយៈពេល តាមច្បាប់ស្តីពីការងារ (១៩៩៧) · មាន ៩ មាត្រា"
      />

      <div className="no-print sticky top-[57px] z-20 border-b border-ink-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-ink-500">ជ្រើសរើសបុគ្គលិក:</span>
          <Select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="h-8 w-64 text-xs"
          >
            {list.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} — {fullNameKh(e)}
              </option>
            ))}
          </Select>
          {employee && (
            <Badge tone="gold">
              {employee.employmentType === "permanent" ? "អចិន្ត្រៃយ៍" : employee.employmentType === "probation" ? "សាកល្បង" : "កំណត់រយៈពេល"}
            </Badge>
          )}
        </div>
      </div>

      <PaperStage>
        {!employee ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-ink-700">សូមជ្រើសរើសបុគ្គលិក</p>
          </div>
        ) : (
          <EmploymentContractDocument
            employee={employee}
            settings={settings}
            positionName={position?.nameKh ?? "—"}
            departmentName={department?.nameKh ?? "—"}
          />
        )}
      </PaperStage>
    </div>
  );
}
