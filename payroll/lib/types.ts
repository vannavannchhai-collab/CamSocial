// ============================================================================
// KhmerPayroll — Domain types
// ប្រព័ន្ធគ្រប់គ្រងបៀវភៅបញ្ជីបៀវត្សរ៍ ព្រះរាជាណាចក្រកម្ពុជា
// ============================================================================

export type ID = string;

export type Currency = "KHR" | "USD";

export type PaymentMethod =
  | "bank_transfer" // ផ្ទេរប្រាក់តាមធនាគារ (ABA, ACLEDA, Wing…)
  | "cash" // សាច់ប្រាក់
  | "cheque" // មូលប្បទានប័ត្រ
  | "mobile_wallet"; // កាបូបឌីជីថល

export type EmploymentType =
  | "permanent" // មន្ត្រីអចិន្ត្រៃយ៍ (Unlimited Duration Contract - UDC)
  | "fixed_term" // កិច្ចសន្យាកំណត់រយៈពេល (FDC)
  | "probation" // សម័យសាកល្បង
  | "part_time" // ក្រៅម៉ោង
  | "intern"; // កម្មសិក្សាការី

export type EmployeeStatus = "active" | "probation" | "suspended" | "resigned" | "terminated";

export type TaxResidency = "resident" | "non_resident";

export type PayrollRunStatus = "draft" | "review" | "approved" | "paid" | "cancelled";

export type Gender = "female" | "male" | "other";

/** Seniority / length of service band used by Cambodian labour law for indemnity. */
export interface Employee {
  id: ID;
  code: string; // លេខកូដបុគ្គលិក e.g. KP-0001
  firstNameKh: string;
  lastNameKh: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: Gender;
  dob: string; // ISO date
  nationalId: string; // អត្តសញ្ញាណប័ណ្ណ
  nssfNumber: string; // លេខ ប.ស.ស
  taxNumber: string; // លេខអត្តសញ្ញាណសារពើពន្ធ (TIN)
  phone: string;
  email: string;
  address: string;
  photo?: string;

  departmentId: ID;
  positionId: ID;
  managerId?: ID;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string;
  endDate?: string;

  baseSalary: number; // monthly gross contract salary in KHR
  currency: Currency; // currency the contract is denominated in
  allowances: Allowance[];
  bankName: string;
  bankAccount: string;
  paymentMethod: PaymentMethod;

  // Statutory / tax profile
  taxResidency: TaxResidency;
  spouseDependents: number; // ប្ដី/ប្រពន្ធ (0 or 1)
  childDependents: number; // កូនក្នុងបន្ទុក
  isNssfMember: boolean;
  isUnionMember: boolean;
  unionFeeRate: number; // % of base salary e.g. 1

  // Leave balances (days / year)
  annualLeaveEntitlement: number;
  annualLeaveUsed: number;
  sickLeaveUsed: number;

  seniorityMonths?: number; // computed helper (optional cache)
  notes?: string;
  createdAt: string;
}

export type AllowanceKind =
  | "transport" // ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ
  | "housing" // ប្រាក់ឧបត្ថម្ភផ្ទះ
  | "meal" // ប្រាក់ឧបត្ថម្ភអាហារ
  | "phone"
  | "attendance" // ប្រាក់ឧបត្ថម្ភវត្តមាន
  | "skill" // ប្រាក់ឧបត្ថម្ភជំនាញ
  | "responsibility"
  | "other";

export interface Allowance {
  id: ID;
  kind: AllowanceKind;
  labelKh: string;
  labelEn: string;
  amount: number;
  /** Cambodian practice: some allowances (e.g. $7 garment transport) are tax exempt. */
  taxable: boolean;
  /** Included in NSSF contributable wage. */
  nssfable: boolean;
}

export interface Department {
  id: ID;
  code: string;
  nameKh: string;
  nameEn: string;
  headEmployeeId?: ID;
  color: string;
}

export interface Position {
  id: ID;
  code: string;
  nameKh: string;
  nameEn: string;
  level: number; // 1..6
  minSalary: number;
  maxSalary: number;
}

// ---------------------------------------------------------------------------
// Attendance & leave
// ---------------------------------------------------------------------------

export type AttendanceStatus =
  | "present" // មានវត្តមាន
  | "late" // មកយឺត
  | "absent" // អវត្តមាន
  | "leave_paid" // ច្បាប់សម្រាកមានប្រាក់
  | "leave_unpaid" // សម្រាកគ្មានប្រាក់
  | "holiday" // ថ្ងៃឈប់សម្រាកសាធារណៈ
  | "weekend" // ថ្ងៃសម្រាកប្រចាំសប្តាហ៍
  | "overtime" // ធ្វើការបន្ថែមម៉ោង
  | "half_day"; // កន្លះថ្ងៃ

export interface AttendanceRecord {
  employeeId: ID;
  date: string; // ISO yyyy-mm-dd
  status: AttendanceStatus;
  hoursWorked: number;
  overtimeHours: number;
  overtimeType?: OvertimeType;
  note?: string;
}

export type OvertimeType = "weekday" | "rest_day" | "public_holiday";

export type LeaveType =
  | "annual" // ច្បាប់សម្រាកប្រចាំឆ្នាំ (18 days)
  | "sick" // ច្បាប់ឈឺ (6 months / 100 days)
  | "maternity" // ច្បាប់សម្រាកពេលសម្រាលកូន (90 days)
  | "paternity" // ច្បាប់សម្រាកពេលប្រពន្ធសម្រាល (10 days)
  | "special" // ច្បាប់សម្រាកពិសេស (7 days)
  | "unpaid"; // គ្មានប្រាក់

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  paid: boolean;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export interface PayrollRun {
  id: ID;
  code: string; // PAY-2026-11
  periodMonth: number; // 1..12
  periodYear: number;
  payDate: string;
  status: PayrollRunStatus;
  workingDays: number;
  note?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  exchangeRate: number; // KHR per USD
}

export interface EarningsLine {
  code: string;
  labelKh: string;
  labelEn: string;
  amount: number;
  taxable: boolean;
  nssfable: boolean;
  category: "base" | "allowance" | "overtime" | "bonus" | "leave" | "seniority" | "other";
}

export interface DeductionLine {
  code: string;
  labelKh: string;
  labelEn: string;
  amount: number;
  category:
    | "nssf"
    | "tax"
    | "union"
    | "advance"
    | "loan"
    | "unpaid_leave"
    | "attendance"
    | "other";
  /** employer-borne statutory cost — not deducted from net pay */
  employerBorne?: boolean;
}

export interface Payslip {
  id: ID;
  runId: ID;
  employeeId: ID;
  earnings: EarningsLine[];
  deductions: DeductionLine[];
  gross: number;
  taxableGross: number;
  nssfBase: number;
  nssfEmployee: number;
  nssfEmployer: number;
  tax: number;
  totalDeductions: number;
  netPay: number;
  employerCost: number;
  daysWorked: number;
  overtimeHours: number;
  unpaidLeaveDays: number;
  exchangeRate: number;
  netPayUsd: number;
}

// ---------------------------------------------------------------------------
// Settings / company
// ---------------------------------------------------------------------------

export interface Company {
  nameKh: string;
  nameEn: string;
  taxId: string; // អត្តសញ្ញាណកម្មសារពើពន្ធ (VAT TIN)
  nssfEmployerNumber: string;
  addressKh: string;
  addressEn: string;
  phone: string;
  email: string;
  logoText: string;
  /** NSSF / GDT registered province */
  province: string;
  signatoryNameKh: string;
  signatoryPositionKh: string;
  accountantNameKh: string;
  bankName: string;
  bankAccount: string;
}

export interface PayrollSettings {
  company: Company;
  exchangeRate: number;
  /** NSSF scheme rates (%) — Sub-Decree on NSSF */
  nssfEmployeeHealthRate: number;
  nssfEmployeePensionRate: number;
  nssfEmployerHealthRate: number;
  nssfEmployerPensionRate: number;
  nssfEmployerRiskRate: number;
  nssfCeiling: number; // KHR 1,200,000
  nssfFloor: number; // KHR 200,000
  /** Tax on Salary */
  taxPersonalDeduction: number; // 150,000
  taxDependentDeduction: number; // 150,000
  /** overtime multipliers per Cambodian Labour Law (Prakas 233) */
  otWeekdayRate: number; // 1.5
  otRestDayRate: number; // 2.0
  otHolidayRate: number; // 3.0
  nightShiftPremium: number; // 1.3 (22:00-05:00)
  standardMonthlyHours: number; // 208 (48h/wk)
  annualLeaveDays: number; // 18
  socialSecurityEnabled: boolean;
  taxEnabled: boolean;
  roundNetPay: number; // 100 or 1000 riel
}
