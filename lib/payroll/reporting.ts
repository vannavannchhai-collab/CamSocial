import type { Department, Employee, PayrollRun, Payslip, Position } from "../types";
import { aggregate } from "./calc";

export interface ReportRow {
  slip: Payslip;
  employee: Employee;
  department?: Department;
  position?: Position;
}

export function buildRows(
  slips: Payslip[],
  employees: Employee[],
  departments: Department[],
  positions: Position[],
  opts?: { sortBy?: "net" | "code" | "name" | "dept"; departmentId?: string }
): ReportRow[] {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const depMap = new Map(departments.map((d) => [d.id, d]));
  const posMap = new Map(positions.map((p) => [p.id, p]));

  let rows: ReportRow[] = slips
    .map((slip) => {
      const employee = empMap.get(slip.employeeId);
      if (!employee) return null;
      return {
        slip,
        employee,
        department: depMap.get(employee.departmentId),
        position: posMap.get(employee.positionId),
      } as ReportRow;
    })
    .filter(Boolean) as ReportRow[];

  if (opts?.departmentId) rows = rows.filter((r) => r.employee.departmentId === opts.departmentId);

  const sortBy = opts?.sortBy ?? "code";
  rows.sort((a, b) => {
    switch (sortBy) {
      case "net":
        return b.slip.netPay - a.slip.netPay;
      case "name":
        return a.employee.lastNameKh.localeCompare(b.employee.lastNameKh, "km");
      case "dept":
        return (a.department?.code ?? "").localeCompare(b.department?.code ?? "");
      default:
        return a.employee.code.localeCompare(b.employee.code);
    }
  });
  return rows;
}

export function departmentTotals(rows: ReportRow[], departments: Department[]) {
  return departments
    .map((d) => {
      const inDept = rows.filter((r) => r.employee.departmentId === d.id);
      const t = aggregate(inDept.map((r) => r.slip));
      return {
        name: d.nameKh,
        code: d.code,
        color: d.color,
        headcount: inDept.length,
        gross: t.gross,
        nssf: t.nssfEmployee,
        tax: t.tax,
        net: t.netPay,
      };
    })
    .filter((d) => d.headcount > 0);
}

export function runLabel(run?: PayrollRun) {
  if (!run) return "—";
  return run.code;
}
