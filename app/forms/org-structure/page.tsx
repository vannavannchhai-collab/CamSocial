"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { OrgStructureDocument } from "@/components/documents/OrgDocument";
import { DocumentToolbar, PaperStage } from "@/components/documents/DocumentToolbar";
import { exportCsv } from "@/lib/pdf/export";
import { KHR } from "@/lib/format";

export default function OrgStructurePage() {
  const { departments, positions, employees } = useStore();

  const pageCount = useMemo(
    () => 1 + Math.max(1, Math.ceil(positions.length / 16)),
    [positions.length]
  );

  const onCsv = () => {
    const head = ["ល.រ", "កូដ", "មុខតំណែង", "មុខតំណែងឡាតាំង", "កម្រិត", "អប្បបរមា", "អតិបរមា", "អ្នកកាន់"];
    const body = [...positions]
      .sort((a, b) => b.level - a.level || a.code.localeCompare(b.code))
      .map((p, i) => [
        i + 1,
        p.code,
        p.nameKh,
        p.nameEn,
        `L${p.level}`,
        p.minSalary,
        p.maxSalary,
        employees.filter((e) => e.positionId === p.id && e.status !== "resigned" && e.status !== "terminated").length,
      ]);
    exportCsv("positions-list.csv", [head, ...body]);
  };

  return (
    <div>
      <DocumentToolbar
        title="បញ្ជីរចនាសម្ព័ន្ធអង្គភាព និងមុខតំណែង"
        subtitle={`${departments.length} ដេប៉ាតឺមង់ · ${positions.length} មុខតំណែង · ${pageCount} ទំព័រ`}
        filename="org-structure-positions.pdf"
        docCode="ORG-01/02"
        orientation="portrait"
        backHref="/organization"
        pageCount={pageCount}
        scale={3.2}
        onCsv={onCsv}
        note="ទម្រង់ A4 បញ្ឈរ · ១៦ នាក់/ទំព័រ · មានសរុបទំព័រ និងសរុបរួម · បន្ថែមសេចក្តីសង្ខេបបង់ពន្ធនៅទំព័រចុងក្រោយ"
      />

      <PaperStage orientation="portrait">
        <OrgStructureDocument
          departments={departments}
          positions={positions}
          employees={employees}
        />
      </PaperStage>
    </div>
  );
}
