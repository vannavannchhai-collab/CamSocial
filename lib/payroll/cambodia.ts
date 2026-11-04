// ============================================================================
// Cambodian statutory contribution engine
// - NSSF (ប.ស.ស): Occupational Risk 0.8% (employer), Health Care 1.3% + 1.3%,
//   Pension 2% + 2% (Phase 1: 2022-09 → 2027-09), ceiling KHR 1,200,000,
//   floor KHR 200,000 (per MLVT/NSSF sub-decree).
// - Tax on Salary (ToS / ពន្ធលើបៀវត្សរ៍) — GDT monthly progressive brackets.
// ============================================================================

import type { PayrollSettings } from "../types";

export const DEFAULT_SETTINGS: PayrollSettings = {
  company: {
    nameKh: "",
    nameEn: "",
    taxId: "",
    nssfEmployerNumber: "",
    addressKh: "",
    addressEn: "",
    phone: "",
    email: "",
    logoText: "",
    province: "",
    signatoryNameKh: "",
    signatoryPositionKh: "",
    accountantNameKh: "",
    bankName: "",
    bankAccount: "",
  },
  exchangeRate: 4100,
  nssfEmployeeHealthRate: 1.3,
  nssfEmployeePensionRate: 2,
  nssfEmployerHealthRate: 1.3,
  nssfEmployerPensionRate: 2,
  nssfEmployerRiskRate: 0.8,
  nssfCeiling: 1_200_000,
  nssfFloor: 200_000,
  taxPersonalDeduction: 150_000,
  taxDependentDeduction: 150_000,
  otWeekdayRate: 1.5,
  otRestDayRate: 2,
  otHolidayRate: 3,
  nightShiftPremium: 1.3,
  standardMonthlyHours: 208,
  annualLeaveDays: 18,
  socialSecurityEnabled: true,
  taxEnabled: true,
  roundNetPay: 100,
};

export interface NssfResult {
  /** wage used for NSSF calculation after floor/ceiling */
  contributableWage: number;
  employeeHealth: number;
  employeePension: number;
  employeeTotal: number;
  employerHealth: number;
  employerPension: number;
  employerRisk: number;
  employerTotal: number;
  total: number;
}

/**
 * NSSF contributions.
 * The base is the "contributable wage" = gross salary capped between the
 * statutory floor (KHR 200,000) and ceiling (KHR 1,200,000).
 * Occupational risk has no ceiling in law, but NSSF practice applies the same
 * declared wage band; we apply the ceiling to health+pension and let risk use
 * the uncapped declared wage — matching current NSSF monthly declaration form.
 */
export function calculateNssf(
  grossSalary: number,
  settings: PayrollSettings,
  opts?: { isMember?: boolean; cappedRisk?: boolean }
): NssfResult {
  const empty: NssfResult = {
    contributableWage: 0, employeeHealth: 0, employeePension: 0, employeeTotal: 0,
    employerHealth: 0, employerPension: 0, employerRisk: 0, employerTotal: 0, total: 0,
  };
  if (!settings.socialSecurityEnabled) return empty;
  if (opts?.isMember === false) return empty;

  const r1 = (n: number) => Math.round(n);
  const capped = Math.min(Math.max(grossSalary, settings.nssfFloor), settings.nssfCeiling);
  const riskBase = opts?.cappedRisk === false ? Math.max(grossSalary, settings.nssfFloor) : capped;

  const employeeHealth = r1((capped * settings.nssfEmployeeHealthRate) / 100);
  const employeePension = r1((capped * settings.nssfEmployeePensionRate) / 100);
  const employerHealth = r1((capped * settings.nssfEmployerHealthRate) / 100);
  const employerPension = r1((capped * settings.nssfEmployerPensionRate) / 100);
  const employerRisk = r1((riskBase * settings.nssfEmployerRiskRate) / 100);

  return {
    contributableWage: capped,
    employeeHealth,
    employeePension,
    employeeTotal: employeeHealth + employeePension,
    employerHealth,
    employerPension,
    employerRisk,
    employerTotal: employerHealth + employerPension + employerRisk,
    total: employeeHealth + employeePension + employerHealth + employerPension + employerRisk,
  };
}

// ---------------------------------------------------------------------------
// Tax on Salary (ToS)
// ---------------------------------------------------------------------------

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  /** cumulative tax of the lower brackets */
  base: number;
  labelKh: string;
  labelEn: string;
}

export const TAX_BRACKETS: TaxBracket[] = [
  { from: 0, to: 1_300_000, rate: 0, base: 0, labelKh: "មិនជាប់ពន្ធ", labelEn: "Exempt" },
  { from: 1_300_000, to: 2_000_000, rate: 5, base: 0, labelKh: "៥%", labelEn: "5%" },
  { from: 2_000_000, to: 8_500_000, rate: 10, base: 35_000, labelKh: "១០%", labelEn: "10%" },
  { from: 8_500_000, to: 12_500_000, rate: 15, base: 685_000, labelKh: "១៥%", labelEn: "15%" },
  { from: 12_500_000, to: null, rate: 20, base: 1_285_000, labelKh: "២០%", labelEn: "20%" },
];

export interface TaxComputation {
  grossTaxable: number;
  nssfDeduction: number;
  personalDeduction: number;
  dependentDeduction: number;
  dependents: number;
  taxableIncome: number;
  tax: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: { labelKh: string; labelEn: string; rate: number; amount: number; taxInBand: number }[];
}

/**
 * Monthly Tax on Salary for a resident employee.
 * taxable income = taxable salary − employee NSSF contributions
 *                  − KHR 150,000 personal allowance
 *                  − KHR 150,000 per dependent (spouse / child under 14)
 * Non-residents are taxed at a flat 20% with no allowances.
 */
export function calculateTaxOnSalary(
  taxableSalary: number,
  employeeNssf: number,
  dependents: number,
  settings: PayrollSettings,
  residency: "resident" | "non_resident" = "resident"
): TaxComputation {
  const gross = Math.max(0, Math.round(taxableSalary));

  if (!settings.taxEnabled) {
    return {
      grossTaxable: gross, nssfDeduction: 0, personalDeduction: 0, dependentDeduction: 0,
      dependents: 0, taxableIncome: gross, tax: 0, effectiveRate: 0, marginalRate: 0, breakdown: [],
    };
  }

  if (residency === "non_resident") {
    const tax = Math.round(gross * 0.2);
    return {
      grossTaxable: gross, nssfDeduction: 0, personalDeduction: 0, dependentDeduction: 0,
      dependents: 0, taxableIncome: gross, tax, effectiveRate: gross ? 20 : 0, marginalRate: 20,
      breakdown: [
        { labelKh: "អ្នកស្នាក់នៅក្រៅប្រទេស ២០%", labelEn: "Non-resident flat 20%", rate: 20, amount: gross, taxInBand: tax },
      ],
    };
  }

  const nssfDed = Math.round(employeeNssf);
  const personal = settings.taxPersonalDeduction;
  const dependentDed = Math.round(dependents * settings.taxDependentDeduction);
  const taxable = Math.max(0, gross - nssfDed - personal - dependentDed);

  let tax = 0;
  let marginal = 0;
  const breakdown: TaxComputation["breakdown"] = [];

  for (const b of TAX_BRACKETS) {
    if (taxable <= b.from) continue;
    const upper = b.to ?? taxable;
    const amount = Math.min(taxable, upper) - b.from;
    if (amount <= 0) continue;
    const taxInBand = (amount * b.rate) / 100;
    tax += taxInBand;
    if (b.rate > 0) marginal = b.rate;
    breakdown.push({
      labelKh: `${b.labelKh} (${fmtRange(b.from, b.to)})`,
      labelEn: b.labelEn,
      rate: b.rate,
      amount,
      taxInBand: Math.round(taxInBand),
    });
  }

  tax = Math.round(tax);

  return {
    grossTaxable: gross,
    nssfDeduction: nssfDed,
    personalDeduction: personal,
    dependentDeduction: dependentDed,
    dependents,
    taxableIncome: taxable,
    tax,
    effectiveRate: gross ? (tax / gross) * 100 : 0,
    marginalRate: marginal,
    breakdown,
  };
}

const fmtRange = (from: number, to: number | null) =>
  `${from.toLocaleString("en-US")}${to ? ` – ${to.toLocaleString("en-US")}` : "+"}`;

/** Total number of dependents recognised for tax purposes. */
export const dependentCount = (spouse: number, children: number) =>
  Math.min(10, Math.max(0, (spouse > 0 ? 1 : 0) + Math.max(0, Math.min(8, children))));

// ---------------------------------------------------------------------------
// Seniority indemnity (អត្ថប្រយោជន៍អានុភាពការងារ) — Prakas 443
// ---------------------------------------------------------------------------

/**
 * Seniority indemnity: 15 days of pay per year of service, paid twice a year
 * (June & December) to employees on unlimited-duration contracts, prorated.
 */
export function seniorityIndemnity(baseSalary: number, monthsOfService: number) {
  const dailyRate = baseSalary / 26; // labour-law daily rate
  const days = (Math.max(0, monthsOfService) / 12) * 15;
  const amount = Math.round(days * dailyRate);
  return { days: Math.round(days * 100) / 100, dailyRate: Math.round(dailyRate), amount };
}

/** Severity-free severance on termination (indemnity for dismissal/layoff). */
export function severancePay(baseSalary: number, monthsOfService: number) {
  const years = monthsOfService / 12;
  let months = 0;
  if (years >= 6) months = 3;
  else if (years >= 3) months = 2.5;
  else if (years >= 1) months = 2;
  else months = 1;
  return Math.round(baseSalary * months);
}
