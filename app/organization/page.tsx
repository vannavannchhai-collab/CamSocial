"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2, Users, Wallet, Plus, ChevronRight, Briefcase, TrendingUp,
  UserCheck, Layers, Search, Pencil, Trash2, FileDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Position } from "@/lib/types";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, Label,
  Modal, Stat, Table, Td, Th,
} from "@/components/ui";
import { KHR, KHRs, fullNameKh, compact, uid } from "@/lib/format";
import { cn } from "@/lib/cn";
import { exportCsv } from "@/lib/pdf/export";

export default function OrganizationPage() {
  const {
    departments, positions, employees, addDepartment, addPosition,
    updatePosition, removePosition, toast,
  } = useStore();

  const [showDept, setShowDept] = useState(false);
  const [showPos, setShowPos] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [deletingPos, setDeletingPos] = useState<Position | null>(null);
  const [q, setQ] = useState("");
  const [pq, setPq] = useState("");
  const [expanded, setExpanded] = useState<string | null>(departments[0]?.id ?? null);

  const active = employees.filter((e) => e.status !== "resigned" && e.status !== "terminated");

  const deptStats = useMemo(
    () =>
      departments.map((d) => {
        const members = active.filter((e) => e.departmentId === d.id);
        const total = members.reduce(
          (s, e) => s + e.baseSalary + e.allowances.reduce((a, x) => a + x.amount, 0),
          0
        );
        return { d, members, total, avg: members.length ? total / members.length : 0 };
      }),
    [departments, active]
  );

  const posStats = useMemo(
    () =>
      positions
        .filter((p) =>
          `${p.code} ${p.nameKh} ${p.nameEn}`.toLowerCase().includes(pq.toLowerCase())
        )
        .map((p) => {
          const holders = active.filter((e) => e.positionId === p.id);
          return { p, holders };
        }),
    [positions, active, pq]
  );

  const totalPayroll = deptStats.reduce((s, x) => s + x.total, 0);

  const filteredDepts = deptStats.filter((x) =>
    `${x.d.code} ${x.d.nameKh} ${x.d.nameEn}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">រចនាសម្ព័ន្ធអង្គភាព</h1>
          <p className="mt-0.5 text-xs text-ink-400">
            {departments.length} ដេប៉ាតឺមង់ · {positions.length} មុខតំណែង · {active.length} បុគ្គលិក
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/forms/org-structure"
            className="inline-flex h-8 select-none items-center justify-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 text-xs font-semibold text-ink-800 transition-all hover:border-ink-400 hover:bg-ink-50"
          >
            <FileDown size={14} /> នាំចេញ PDF
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowPos(true)}>
            <Briefcase size={14} /> មុខតំណែងថ្មី
          </Button>
          <Button size="sm" onClick={() => setShowDept(true)}>
            <Plus size={14} /> ដេប៉ាតឺមង់ថ្មី
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="ដេប៉ាតឺមង់" value={departments.length} sub={`${departments.filter((d) => active.some((e) => e.departmentId === d.id)).length} សកម្ម`} icon={<Building2 size={16} />} tone="info" />
        <Stat label="បុគ្គលិកសកម្ម" value={active.length} sub={`${active.filter((e) => e.gender === "female").length} ស្ត្រី`} icon={<Users size={16} />} tone="success" />
        <Stat label="ថ្លៃដើមបៀវត្សរ៍/ខែ" value={KHRs(totalPayroll)} sub={`≈ $${compact(totalPayroll / 4100)}`} icon={<Wallet size={16} />} tone="gold" />
        <Stat label="មុខតំណែង" value={positions.length} sub={`${positions.filter((p) => p.level >= 5).length} ថ្នាក់គ្រប់គ្រង`} icon={<Briefcase size={16} />} tone="violet" />
      </div>

      {/* ---------- departments ---------- */}
      <Card>
        <CardHeader
          title="ដេប៉ាតឺមង់"
          subtitle="ចុចលើដេប៉ាតឺមង់ដើម្បីមើលបុគ្គលិក"
          icon={<Building2 size={15} />}
          action={
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរក…" className="h-7 w-36 pl-7 text-[11px]" />
            </div>
          }
        />
        <div className="divide-y divide-ink-100">
          {filteredDepts.map(({ d, members, total, avg }) => {
            const isOpen = expanded === d.id;
            const pct = totalPayroll ? (total / totalPayroll) * 100 : 0;
            return (
              <div key={d.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50/60"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                    style={{ background: d.color }}
                  >
                    {d.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink-900">{d.nameKh}</p>
                    <p className="truncate text-[10px] text-ink-400">{d.nameEn}</p>
                  </div>
                  <div className="hidden items-center gap-6 sm:flex">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wide text-ink-400">បុគ្គលិក</p>
                      <p className="text-[12px] font-bold text-ink-800 tnum">{members.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wide text-ink-400">ប្រាក់ខែសរុប</p>
                      <p className="text-[11px] font-bold text-ink-800 tnum">{KHR(total)}</p>
                    </div>
                    <div className="w-20">
                      <div className="h-1 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                      </div>
                      <p className="mt-0.5 text-right text-[9px] text-ink-400 tnum">{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={cn("shrink-0 text-ink-300 transition-transform", isOpen && "rotate-90")} />
                </button>

                {isOpen && (
                  <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-3">
                    <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-ink-500">
                      <span>ប្រាក់ខែមធ្យម: <b className="text-ink-800">{KHRs(avg)}</b></span>
                      <span>ចំណែកថវិកា: <b className="text-ink-800">{pct.toFixed(1)}%</b></span>
                    </div>
                    {members.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-ink-400">គ្មានបុគ្គលិក</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((e) => (
                          <div key={e.id} className="flex items-center gap-2 rounded-lg bg-white p-2 ring-1 ring-ink-100">
                            <Avatar name={fullNameKh(e)} size={26} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-medium text-ink-800">{fullNameKh(e)}</p>
                              <p className="truncate text-[9px] text-ink-400">
                                {positions.find((p) => p.id === e.positionId)?.nameKh}
                              </p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-ink-700 tnum">{KHR(e.baseSalary)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---------- positions ---------- */}
      <Card>
        <CardHeader
          title="មុខតំណែង និងជួរប្រាក់ខែ"
          subtitle="កម្រិតថ្នាក់ ១–៦ · ជួរប្រាក់ខែអប្បបរមា–អតិបរមា"
          icon={<Briefcase size={15} />}
          action={
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="ស្វែងរក…" className="h-7 w-40 pl-7 text-[11px]" />
            </div>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>មុខតំណែង</Th>
              <Th align="center">កម្រិត</Th>
              <Th align="right">ជួរប្រាក់ខែ (៛)</Th>
              <Th align="center">អ្នកកាន់តំណែង</Th>
              <Th align="right">ប្រាក់ខែសរុប</Th>
              <Th align="center">ស្ថានភាពជួរ</Th>
              <Th align="center">សកម្មភាព</Th>
            </tr>
          </thead>
          <tbody>
            {posStats.map(({ p, holders }) => {
              const sum = holders.reduce((s, e) => s + e.baseSalary, 0);
              const outOfRange = holders.filter((e) => e.baseSalary > p.maxSalary || e.baseSalary < p.minSalary).length;
              return (
                <tr key={p.id} className="hover:bg-ink-50/60">
                  <Td>
                    <div>
                      <p className="text-[11px] font-semibold text-ink-900">{p.nameKh}</p>
                      <p className="text-[9px] text-ink-400">{p.nameEn} · {p.code}</p>
                    </div>
                  </Td>
                  <Td align="center">
                    <Badge tone={p.level >= 5 ? "violet" : p.level >= 3 ? "info" : "neutral"}>
                      L{p.level}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <span className="text-[10px] text-ink-600 tnum">
                      {KHR(p.minSalary)} – {KHR(p.maxSalary)}
                    </span>
                  </Td>
                  <Td align="center"><span className="text-[11px] font-semibold text-ink-800 tnum">{holders.length}</span></Td>
                  <Td align="right"><span className="text-[11px] font-bold text-ink-900 tnum">{KHR(sum)}</span></Td>
                  <Td align="center">
                    {outOfRange > 0 ? (
                      <Badge tone="warning">{outOfRange} ក្រៅជួរ</Badge>
                    ) : (
                      <Badge tone="success">ត្រឹមត្រូវ</Badge>
                    )}
                  </Td>
                  <Td align="center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingPos(p)}
                        className="grid h-7 w-7 place-items-center rounded-md text-ink-500 ring-1 ring-ink-200 hover:bg-ink-50 hover:text-ink-900"
                        title="កែប្រែ"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeletingPos(p)}
                        disabled={holders.length > 0}
                        className="grid h-7 w-7 place-items-center rounded-md text-rose-500 ring-1 ring-ink-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={holders.length > 0 ? "មានអ្នកកាន់តំណែងនេះ" : "លុប"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {posStats.length === 0 && (
              <tr><Td colSpan={7}><p className="py-6 text-center text-[11px] text-ink-400">មិនមានលទ្ធផល</p></Td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      <NewDeptModal open={showDept} onClose={() => setShowDept(false)} onCreate={(d) => { addDepartment(d); toast({ title: "បានបង្កើតដេប៉ាតឺមង់", tone: "success" }); }} />
      <PositionModal
        open={showPos || editingPos !== null}
        initial={editingPos ?? undefined}
        onClose={() => { setShowPos(false); setEditingPos(null); }}
        onSubmit={(p) => {
          if (editingPos) {
            updatePosition(editingPos.id, p);
            toast({ title: "បានកែប្រែមុខតំណែង", tone: "success" });
          } else {
            addPosition({ id: uid("pos"), ...p } as Position);
            toast({ title: "បានបង្កើតមុខតំណែង", tone: "success" });
          }
          setShowPos(false);
          setEditingPos(null);
        }}
      />
      <ConfirmDeletePos
        position={deletingPos}
        holders={deletingPos ? active.filter((e) => e.positionId === deletingPos.id).length : 0}
        onClose={() => setDeletingPos(null)}
        onConfirm={() => {
          if (deletingPos) {
            removePosition(deletingPos.id);
            toast({ title: "បានលុបមុខតំណែង", tone: "info" });
          }
          setDeletingPos(null);
        }}
      />
    </div>
  );
}

function NewDeptModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (d: any) => void }) {
  const [code, setCode] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [color, setColor] = useState("#0f9b8e");

  const COLORS = ["#0f9b8e", "#4e5d9c", "#eaa92e", "#d9576b", "#5b8def", "#8e6cd9", "#0b7d73", "#bc6c11"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="បង្កើតដេប៉ាតឺមង់ថ្មី"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>បោះបង់</Button>
          <Button
            size="sm"
            disabled={!code || !nameKh}
            onClick={() => {
              onCreate({ id: uid("dep"), code: code.toUpperCase(), nameKh, nameEn: nameEn || nameKh, color });
              setCode(""); setNameKh(""); setNameEn("");
              onClose();
            }}
          >
            បង្កើត
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label required hint="៣–៤ តួអក្សរ">លេខកូដ</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MKT" maxLength={5} />
        </div>
        <div>
          <Label required>ឈ្មោះខ្មែរ</Label>
          <Input value={nameKh} onChange={(e) => setNameKh(e.target.value)} placeholder="ដេប៉ាតឺមង់ទីផ្សារ" />
        </div>
        <div>
          <Label>ឈ្មោះឡាតាំង</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Marketing" />
        </div>
        <div>
          <Label>ពណ៌សម្គាល់</Label>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-7 w-7 rounded-lg transition-transform",
                  color === c && "ring-2 ring-ink-900 ring-offset-1"
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PositionModal({
  open, initial, onClose, onSubmit,
}: {
  open: boolean;
  initial?: Position;
  onClose: () => void;
  onSubmit: (p: Omit<Position, "id">) => void;
}) {
  const [code, setCode] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [level, setLevel] = useState(2);
  const [min, setMin] = useState(500_000);
  const [max, setMax] = useState(1_500_000);

  // sync when opening for a different position
  React.useEffect(() => {
    if (open) {
      setCode(initial?.code ?? "");
      setNameKh(initial?.nameKh ?? "");
      setNameEn(initial?.nameEn ?? "");
      setLevel(initial?.level ?? 2);
      setMin(initial?.minSalary ?? 500_000);
      setMax(initial?.maxSalary ?? 1_500_000);
    }
  }, [open, initial]);

  const invalid = !code || !nameKh || max < min;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "កែប្រែមុខតំណែង" : "បង្កើតមុខតំណែងថ្មី"}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>បោះបង់</Button>
          <Button
            size="sm"
            disabled={invalid}
            onClick={() => {
              onSubmit({
                code: code.toUpperCase(), nameKh, nameEn: nameEn || nameKh,
                level: Math.min(6, Math.max(1, level)),
                minSalary: min, maxSalary: max,
              });
            }}
          >
            {initial ? "រក្សាទុក" : "បង្កើត"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>លេខកូដ</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MKT" maxLength={5} />
        </div>
        <div>
          <Label>កម្រិត (១–៦)</Label>
          <Input type="number" min={1} max={6} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <Label required>ឈ្មោះខ្មែរ</Label>
          <Input value={nameKh} onChange={(e) => setNameKh(e.target.value)} placeholder="មន្ត្រីទីផ្សារ" />
        </div>
        <div className="col-span-2">
          <Label>ឈ្មោះឡាតាំង</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Marketing Officer" />
        </div>
        <div>
          <Label>អប្បបរមា (៛)</Label>
          <Input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </div>
        <div>
          <Label>អតិបរមា (៛)</Label>
          <Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
          {max < min && <p className="mt-1 text-[10px] text-rose-500">អតិបរមาต្រូវធំជាងអប្បបរមា</p>}
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDeletePos({
  position, holders, onClose, onConfirm,
}: {
  position: Position | null;
  holders: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={position !== null}
      onClose={onClose}
      title="លុបមុខតំណែង"
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>បោះបង់</Button>
          <Button variant="danger" size="sm" disabled={holders > 0} onClick={onConfirm}>លុប</Button>
        </>
      }
    >
      {position && (
        <p className="text-xs leading-relaxed text-ink-600">
          តើអ្នកពិតជាចង់លុបមុខតំណែង <b className="text-ink-900">{position.nameKh}</b> ({position.code})?
          {holders > 0 && (
            <span className="mt-1 block text-rose-600">
              មានអ្នកកាន់តំណែងនេះ {holders} នាក់ — សូមផ្លាស់ប្តូរមុខតំណែងរបស់ពួកគេជាមុនសិន។
            </span>
          )}
        </p>
      )}
    </Modal>
  );
}
