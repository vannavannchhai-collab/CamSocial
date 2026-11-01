// ============================================================================
// Payroll calculation engine
// Produces a full, auditable payslip per employee for a monthly run.
// ============================================================================

import type {
  DeductionLine,
  EarningsLine,
  Employee,
  PayrollRun,
  PayrollSettings,
  Payslip,
} from "../types";
import { calculateNssf, calculateTaxOnSalary, dependentCount } from "./cambodia";
import { daysInMonth, isPublicHoliday, workingDaysInMonth } from "./holidays";
import { roundTo, uid } from "../format";

export interface AttendanceSummary {
  daysWorked: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  lateCount: number;
  overtimeWeekday: number;
  overtimeRestDay: number;
  overtimeHoliday: number;
  totalOvertimeHours: number;
}

export interface PayrollInput {
  employee: Employee;
  run: PayrollRun;
  settings: PayrollSettings;
  attendance?: AttendanceSummary;
  /** one-off additions for this run, keyed by employee */
  bonus?: { labelKh: string; labelEn: string; amount: number; taxable: boolean }[];
  /** recurring advance / loan repayment to deduct this month */
  advanceRepayment?: number;
  /** include seniority indemnity this month (June / December payout) */
  includeSeniority?: boolean;
  monthsOfService?: number;
}

export const emptyAttendance = (): AttendanceSummary => ({
  daysWorked: 0,
  paidLeaveDays: 0,
  unpaidLeaveDays: 0,
  absentDays: 0,
  lateCount: 0,
  overtimeWeekday: 0,
  overtimeRestDay: 0,
  overtimeHoliday: 0,
  totalOvertimeHours: 0,
});

/**
 * Monthly gross → daily & hourly rates.
 * Cambodian labour law uses 26 working days per month and 8 hours per day
 * for wage-in-lieu and overtime base calculations (Prakas 233).
 */
export const LABOUR_DAYS_PER_MONTH = 26;
export const LABOUR_HOURS_PER_DAY = 8;

export function dailyRate(monthlySalary: number) {
  return monthlySalary / LABOUR_DAYS_PER_MONTH;
}
export function hourlyRate(monthlySalary: number) {
  return dailyRate(monthlySalary) / LABOUR_HOURS_PER_DAY;
}

export function calculatePayslip(input: PayrollInput): Payslip {
  const { employee, run, settings } = input;
  const rate = run.exchangeRate || settings.exchangeRate || 4100;
  const att = input.attendance ?? emptyAttendance();

  const base = Math.max(0, employee.baseSalary);
  const earnings: EarningsLine[] = [];
  const deductions: DeductionLine[] = [];

  // ---- 1. Base salary (pro-rated for mid-month joiners / leavers) ----------
  const dim = daysInMonth(run.periodYear, run.periodMonth);
  const standardWorkDays =
    workingDaysInMonth(run.periodYear, run.periodMonth, { workOnSaturday: false }) ||
    run.workingDays ||
    22;

  const hire = new Date(employee.hireDate);
  const periodStart = new Date(run.periodYear, run.periodMonth - 1, 1);
  const periodEnd = new Date(run.periodYear, run.periodMonth - 1, dim);

  let prorationFactor = 1;
  let prorationNote = "";
  if (!isNaN(hire.getTime()) && hire > periodStart && hire <= periodEnd) {
    const joinDay = hire.getDate();
    const payableDays = Math.max(0, dim - joinDay + 1);
    prorationFactor = payableDays / dim;
    prorationNote = ` (ចូលធ្វើការថ្ងៃទី${joinDay})`;
  }
  if (employee.endDate) {
    const end = new Date(employee.endDate);
    if (!isNaN(end.getTime()) && end >= periodStart && end < periodEnd) {
      prorationFactor = Math.min(prorationFactor, end.getDate() / dim);
      prorationNote = ` (ឈប់ធ្វើការថ្ងៃទី${end.getDate()})`;
    }
  }

  const proratedBase = Math.round(base * prorationFactor);
  earnings.push({
    code: "BASE",
    labelKh: `ប្រាក់ខែគោល${prorationNote}`,
    labelEn: `Basic Salary${prorationNote ? " (pro-rated)" : ""}`,
    amount: proratedBase,
    taxable: true,
    nssfable: true,
    category: "base",
  });

  // ---- 2. Fixed allowances -------------------------------------------------
  let allowanceTotal = 0;
  let taxFreeAllowance = 0;
  let nssfFreeAllowance = 0;
  for (const a of employee.allowances ?? []) {
    if (!a.amount) continue;
    const amount = Math.round(a.amount * prorationFactor);
    allowanceTotal += amount;
    if (!a.taxable) taxFreeAllowance += amount;
    if (!a.nssfable) nssfFreeAllowance += amount;
    earnings.push({
      code: `ALW_${a.kind.toUpperCase()}`,
      labelKh: a.labelKh,
      labelEn: a.labelEn,
      amount,
      taxable: a.taxable,
      nssfable: a.nssfable,
      category: "allowance",
    });
  }

  // ---- 3. Overtime (Labour Law: 1.5x weekday, 2x rest day, 3x holiday) -----
  const hr = hourlyRate(base);
  const otWeekday = Math.round(att.overtimeWeekday * hr * settings.otWeekdayRate);
  const otRestDay = Math.round(att.overtimeRestDay * hr * settings.otRestDayRate);
  const otHoliday = Math.round(att.overtimeHoliday * hr * settings.otHolidayRate);

  if (att.overtimeWeekday > 0)
    earnings.push({
      code: "OT_WD",
      labelKh: `ប្រាក់ធ្វើការបន្ថែមម៉ោង ថ្ងៃធម្មតា (${att.overtimeWeekday} ម៉ោង × ${settings.otWeekdayRate})`,
      labelEn: `Overtime – Normal Day (${att.overtimeWeekday}h × ${settings.otWeekdayRate})`,
      amount: otWeekday,
      taxable: true,
      nssfable: true,
      category: "overtime",
    });
  if (att.overtimeRestDay > 0)
    earnings.push({
      code: "OT_RD",
      labelKh: `ប្រាក់ធ្វើការបន្ថែមម៉ោង ថ្ងៃសម្រាក (${att.overtimeRestDay} ម៉ោង × ${settings.otRestDayRate})`,
      labelEn: `Overtime – Rest Day (${att.overtimeRestDay}h × ${settings.otRestDayRate})`,
      amount: otRestDay,
      taxable: true,
      nssfable: true,
      category: "overtime",
    });
  if (att.overtimeHoliday > 0)
    earnings.push({
      code: "OT_PH",
      labelKh: `ប្រាក់ធ្វើការបន្ថែមម៉ោង ថ្ងៃបុណ្យជាតិ (${att.overtimeHoliday} ម៉ោង × ${settings.otHolidayRate})`,
      labelEn: `Overtime – Public Holiday (${att.overtimeHoliday}h × ${settings.otHolidayRate})`,
      amount: otHoliday,
      taxable: true,
      nssfable: true,
      category: "overtime",
    });

  // ---- 4. Paid leave (paid at daily rate, not counted as days worked) ------
  const leavePay = Math.round(att.paidLeaveDays * dailyRate(base));
  if (leavePay > 0)
    earnings.push({
      code: "LEAVE",
      labelKh: `ប្រាក់ឈ្នួលថ្ងៃឈប់សម្រាកមានប្រាក់ (${att.paidLeaveDays} ថ្ងៃ)`,
      labelEn: `Paid Leave (${att.paidLeaveDays} days)`,
      amount: leavePay,
      taxable: true,
      nssfable: true,
      category: "leave",
    });

  // ---- 5. Bonuses / one-off ------------------------------------------------
  for (const b of input.bonus ?? []) {
    if (!b.amount) continue;
    earnings.push({
      code: "BONUS",
      labelKh: b.labelKh,
      labelEn: b.labelEn,
      amount: Math.round(b.amount),
      taxable: b.taxable,
      nssfable: b.taxable,
      category: "bonus",
    });
  }

  // ---- 6. Seniority indemnity (June / December) ----------------------------
  if (input.includeSeniority) {
    const months = input.monthsOfService ?? 12;
    const days = (months / 12) * 15;
    const amount = Math.round((days * base) / LABOUR_DAYS_PER_MONTH);
    if (amount > 0)
      earnings.push({
        code: "SENIORITY",
        labelKh: `អត្ថប្រយោជន៍អានុភាពការងារ (${days.toFixed(1)} ថ្ងៃ)`,
        labelEn: `Seniority Indemnity (${days.toFixed(1)} days)`,
        amount,
        taxable: true,
        nssfable: false,
        category: "seniority",
      });
  }

  const gross = earnings.reduce((s, e) => s + e.amount, 0);
  const taxableGross = earnings.filter((e) => e.taxable).reduce((s, e) => s + e.amount, 0);
  const nssfBase = Math.max(0, proratedBase + allowanceTotal - nssfFreeAllowance + otWeekday + otRestDay + otHoliday + leavePay);

  // ---- 7. NSSF -------------------------------------------------------------
  const nssf = calculateNssf(nssfBase, settings, { isMember: employee.isNssfMember });
  if (nssf.employeeTotal > 0) {
    deductions.push({
      code: "NSSF_EE",
      labelKh: `ភាគទាន ប.ស.ស បុគ្គលិក (សុខាភិបាល ${settings.nssfEmployeeHealthRate}% + ប៉ង់ស្យ៊ុង ${settings.nssfEmployeePensionRate}%)`,
      labelEn: `NSSF Employee (Health ${settings.nssfEmployeeHealthRate}% + Pension ${settings.nssfEmployeePensionRate}%)`,
      amount: nssf.employeeTotal,
      category: "nssf",
    });
  }

  // ---- 8. Tax on Salary ----------------------------------------------------
  const deps = dependentCount(employee.spouseDependents, employee.childDependents);
  const taxCalc = calculateTaxOnSalary(
    taxableGross,
    nssf.employeeTotal,
    deps,
    settings,
    employee.taxResidency
  );
  if (taxCalc.tax > 0) {
    deductions.push({
      code: "TOS",
      labelKh: "ពន្ធលើបៀវត្សរ៍ (Tax on Salary)",
      labelEn: "Tax on Salary (ToS)",
      amount: taxCalc.tax,
      category: "tax",
    });
  }

  // ---- 9. Union fee --------------------------------------------------------
  if (employee.isUnionMember && employee.unionFeeRate > 0) {
    const union = Math.round((base * employee.unionFeeRate) / 100);
    if (union > 0)
      deductions.push({
        code: "UNION",
        labelKh: `ភាគទានសហជីព (${employee.unionFeeRate}%)`,
        labelEn: `Union Fee (${employee.unionFeeRate}%)`,
        amount: union,
        category: "union",
      });
  }

  // ---- 10. Unpaid leave & absences -----------------------------------------
  const unpaidDays = Math.round((att.unpaidLeaveDays + att.absentDays) * 100) / 100;
  if (unpaidDays > 0) {
    const amt = Math.round(unpaidDays * dailyRate(base));
    deductions.push({
      code: "UNPAID",
      labelKh: `កាត់ប្រាក់ថ្ងៃអវត្តមាន/សម្រាកគ្មានប្រាក់ (${unpaidDays} ថ្ងៃ)`,
      labelEn: `Unpaid Leave / Absence (${unpaidDays} days)`,
      amount: amt,
      category: "unpaid_leave",
    });
  }

  // ---- 11. Advance / loan --------------------------------------------------
  if (input.advanceRepayment && input.advanceRepayment > 0) {
    deductions.push({
      code: "ADVANCE",
      labelKh: "សងប្រាក់បុរេប្រទាន (Salary Advance)",
      labelEn: "Salary Advance Repayment",
      amount: Math.round(input.advanceRepayment),
      category: "advance",
    });
  }

  let totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const netRaw = gross - totalDeductions;
  const netPay = Math.max(0, roundTo(netRaw, settings.roundNetPay));

  // Accounting practice: when the net is rounded to a whole riel step, record the
  // difference as a signed line — an adjustment (+ when rounding up) adds to net,
  // a deduction (−) reduces it — so the printed slip always foots exactly and
  // never shows an unexplainable 1–99 riel gap to the employee or an auditor.
  const roundingDiff = netRaw - netPay;
  if (Math.abs(roundingDiff) >= 1) {
    const roundedUp = roundingDiff < 0;
    deductions.push({
      code: "ROUNDING",
      labelKh: roundedUp ? "ការបង្គត់ឡើង (Rounding up)" : "ការបង្គត់ចុះ (Rounding down)",
      labelEn: roundedUp ? "Rounding up" : "Rounding down",
      amount: roundedUp ? -Math.abs(roundingDiff) : Math.abs(roundingDiff),
      category: "other",
    });
    totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  }

  const employerCost =
    gross + nssf.employerTotal;

  return {
    id: uid("slip"),
    runId: run.id,
    employeeId: employee.id,
    earnings,
    deductions,
    gross,
    taxableGross,
    nssfBase: nssf.contributableWage,
    nssfEmployee: nssf.employeeTotal,
    nssfEmployer: nssf.employerTotal,
    tax: taxCalc.tax,
    totalDeductions,
    netPay,
    employerCost,
    daysWorked: att.daysWorked,
    overtimeHours: att.totalOvertimeHours,
    unpaidLeaveDays: unpaidDays,
    exchangeRate: rate,
    netPayUsd: Math.round((netPay / rate) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface PayrollTotals {
  headcount: number;
  gross: number;
  taxableGross: number;
  nssfEmployee: number;
  nssfEmployer: number;
  nssfTotal: number;
  tax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  employerCost: number;
  netPayUsd: number;
}

export function aggregate(slips: Payslip[]): PayrollTotals {
  const t: PayrollTotals = {
    headcount: slips.length, gross: 0, taxableGross: 0, nssfEmployee: 0, nssfEmployer: 0,
    nssfTotal: 0, tax: 0, otherDeductions: 0, totalDeductions: 0, netPay: 0,
    employerCost: 0, netPayUsd: 0,
  };
  for (const s of slips) {
    t.gross += s.gross;
    t.taxableGross += s.taxableGross;
    t.nssfEmployee += s.nssfEmployee;
    t.nssfEmployer += s.nssfEmployer;
    t.tax += s.tax;
    t.totalDeductions += s.totalDeductions;
    t.otherDeductions += s.deductions
      .filter((d) => !["nssf", "tax"].includes(d.category))
      .reduce((a, d) => a + d.amount, 0);
    t.netPay += s.netPay;
    t.employerCost += s.employerCost;
    t.netPayUsd += s.netPayUsd;
  }
  t.nssfTotal = t.nssfEmployee + t.nssfEmployer;
  return t;
}

/** Sum of a specific deduction/earning category across slips (for journal entries). */
export function sumCategory(slips: Payslip[], category: string, kind: "earning" | "deduction") {
  return slips.reduce((acc, s) => {
    const lines = kind === "earning" ? s.earnings : s.deductions;
    return acc + lines.filter((l) => l.category === category).reduce((a, l) => a + l.amount, 0);
  }, 0);
}

/** Formula used for the payslip's "explain" tooltip. */
export const explainNssf = (settings: PayrollSettings) =>
  `មូលដ្ឋានគិត = ប្រាក់ខែជាប់ពន្ធ កំណត់អប្បបរមា ៛${settings.nssfFloor.toLocaleString()} និងអតិបរមា ៛${settings.nssfCeiling.toLocaleString()}`;

export const explainTax = (settings: PayrollSettings) =>
  `ប្រាក់ជាប់ពន្ធ − ភាគទាន ប.ស.ស − ការកាត់បន្ថយផ្ទាល់ខ្លួន ៛${settings.taxPersonalDeduction.toLocaleString()} − ៛${settings.taxDependentDeduction.toLocaleString()}/នាក់ក្នុងបន្ទុក`;

export { isPublicHoliday };
