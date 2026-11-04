// ============================================================================
// Attendance summariser — aggregates AttendanceRecords into the monthly
// AttendanceSummary used by the payroll engine. No demo data: with no
// records entered, the employee is treated as having worked all working days.
// ============================================================================

import type { AttendanceRecord, PayrollRun } from "../types";
import type { AttendanceSummary } from "./calc";

export function attendanceSummaryFor(
  employeeId: string,
  run: PayrollRun,
  records: AttendanceRecord[]
): AttendanceSummary {
  const prefix = `${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`;
  const mine = records.filter((r) => r.employeeId === employeeId && r.date.startsWith(prefix));

  const s: AttendanceSummary = {
    daysWorked: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    absentDays: 0,
    lateCount: 0,
    overtimeWeekday: 0,
    overtimeRestDay: 0,
    overtimeHoliday: 0,
    totalOvertimeHours: 0,
  };

  for (const r of mine) {
    if (r.status === "present" || r.status === "late") {
      s.daysWorked += r.status === "late" ? 1 : 1;
      if (r.status === "late") s.lateCount += 1;
    } else if (r.status === "half_day") {
      s.daysWorked += 0.5;
    } else if (r.status === "leave_paid") {
      s.paidLeaveDays += 1;
    } else if (r.status === "leave_unpaid") {
      s.unpaidLeaveDays += 1;
    } else if (r.status === "absent") {
      s.absentDays += 1;
    }
    if (r.overtimeType === "weekday") s.overtimeWeekday += r.overtimeHours;
    else if (r.overtimeType === "rest_day") s.overtimeRestDay += r.overtimeHours;
    else if (r.overtimeType === "public_holiday") s.overtimeHoliday += r.overtimeHours;
    s.totalOvertimeHours += r.overtimeHours;
  }

  // No records at all → assume full month worked.
  if (mine.length === 0) {
    s.daysWorked = run.workingDays;
  } else {
    s.daysWorked = Math.min(s.daysWorked, run.workingDays);
  }
  return s;
}
