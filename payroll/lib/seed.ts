// Seed dataset for the demo company — realistic Cambodian payroll data.
import type {
  Allowance,
  AttendanceRecord,
  Department,
  Employee,
  LeaveRequest,
  PayrollRun,
  Position,
} from "./types";
import { DEFAULT_SETTINGS } from "./payroll/cambodia";

export const departments: Department[] = [
  { id: "dep_fin", code: "FIN", nameKh: "ដេប៉ាតឺម៉ង់ហិរញ្ញវត្ថុ", nameEn: "Finance & Accounting", color: "#0f9b8e" },
  { id: "dep_hr", code: "HR", nameKh: "ដេប៉ាតឺម៉ង់ធនធានមនុស្ស", nameEn: "Human Resources", color: "#4e5d9c" },
  { id: "dep_prd", code: "PRD", nameKh: "ដេប៉ាតឺម៉ង់ផលិតកម្ម", nameEn: "Production", color: "#eaa92e" },
  { id: "dep_sal", code: "SAL", nameKh: "ដេប៉ាតឺម៉ង់លក់", nameEn: "Sales & Marketing", color: "#d9576b" },
  { id: "dep_it", code: "IT", nameKh: "ដេប៉ាតឺម៉ង់ព័ត៌មានវិទ្យា", nameEn: "Information Technology", color: "#5b8def" },
  { id: "dep_log", code: "LOG", nameKh: "ដេប៉ាតឺម៉ង់ដឹកជញ្ជូន", nameEn: "Logistics & Warehouse", color: "#8e6cd9" },
];

export const positions: Position[] = [
  { id: "pos_ceo", code: "EXEC", nameKh: "នាយកប្រតិបត្តិ", nameEn: "Chief Executive Officer", level: 6, minSalary: 6_000_000, maxSalary: 15_000_000 },
  { id: "pos_cfo", code: "CFO", nameKh: "ប្រធានហិរញ្ញវត្ថុ", nameEn: "Chief Financial Officer", level: 6, minSalary: 5_000_000, maxSalary: 12_000_000 },
  { id: "pos_mgr", code: "MGR", nameKh: "ប្រធានដេប៉ាតឺម៉ង់", nameEn: "Department Manager", level: 5, minSalary: 2_500_000, maxSalary: 6_000_000 },
  { id: "pos_sup", code: "SUP", nameKh: "អ្នកគ្រប់គ្រងផ្នែក", nameEn: "Supervisor", level: 4, minSalary: 1_200_000, maxSalary: 2_800_000 },
  { id: "pos_acc", code: "ACC", nameKh: "គណនេយ្យករ", nameEn: "Accountant", level: 3, minSalary: 700_000, maxSalary: 1_800_000 },
  { id: "pos_hr", code: "HRO", nameKh: "មន្ត្រីធនធានមនុស្ស", nameEn: "HR Officer", level: 3, minSalary: 600_000, maxSalary: 1_600_000 },
  { id: "pos_dev", code: "DEV", nameKh: "អ្នកអភិវឌ្ឍន៍កម្មវិធី", nameEn: "Software Developer", level: 3, minSalary: 900_000, maxSalary: 3_000_000 },
  { id: "pos_sale", code: "SAL", nameKh: "មន្ត្រីលក់", nameEn: "Sales Officer", level: 2, minSalary: 500_000, maxSalary: 1_400_000 },
  { id: "pos_opr", code: "OPR", nameKh: "កម្មករផលិតកម្ម", nameEn: "Production Operator", level: 1, minSalary: 420_000, maxSalary: 780_000 },
  { id: "pos_drv", code: "DRV", nameKh: "អ្នកបើកបរ", nameEn: "Driver", level: 1, minSalary: 400_000, maxSalary: 700_000 },
];

const A = (
  kind: Allowance["kind"],
  labelKh: string,
  labelEn: string,
  amount: number,
  taxable = true,
  nssfable = true
): Allowance => ({ id: `alw_${kind}_${Math.random().toString(36).slice(2, 6)}`, kind, labelKh, labelEn, amount, taxable, nssfable });

const std = (transport: number, meal: number): Allowance[] => [
  A("transport", "ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ", "Transport Allowance", transport),
  A("meal", "ប្រាក់ឧបត្ថម្ភអាហារ", "Meal Allowance", meal, true, false),
];

let seq = 0;
const nextCode = () => `KP-${String(++seq).padStart(4, "0")}`;

interface SeedInput {
  lastNameKh: string;
  firstNameKh: string;
  lastNameEn: string;
  firstNameEn: string;
  gender: Employee["gender"];
  dob: string;
  departmentId: string;
  positionId: string;
  baseSalary: number;
  hireDate: string;
  employmentType: Employee["employmentType"];
  status?: Employee["status"];
  allowances: Allowance[];
  spouse?: number;
  children?: number;
  residency?: Employee["taxResidency"];
  union?: boolean;
  managerId?: string;
  bank?: string;
  phone: string;
  email: string;
  position?: string;
}

const build = (i: SeedInput, idx: number): Employee => ({
  id: `emp_${String(idx + 1).padStart(3, "0")}`,
  code: nextCode(),
  firstNameKh: i.firstNameKh,
  lastNameKh: i.lastNameKh,
  firstNameEn: i.firstNameEn,
  lastNameEn: i.lastNameEn,
  gender: i.gender,
  dob: i.dob,
  nationalId: `0${Math.floor(10000000 + Math.random() * 89999999)}`,
  nssfNumber: `NSSF-${Math.floor(100000 + Math.random() * 899999)}`,
  taxNumber: `TIN-${Math.floor(1000000 + Math.random() * 8999999)}`,
  phone: i.phone,
  email: i.email,
  address: "ភ្នំពេញ",
  departmentId: i.departmentId,
  positionId: i.positionId,
  managerId: i.managerId,
  employmentType: i.employmentType,
  status: i.status ?? (i.employmentType === "probation" ? "probation" : "active"),
  hireDate: i.hireDate,
  baseSalary: i.baseSalary,
  currency: "KHR",
  allowances: i.allowances,
  bankName: i.bank ?? "ធនាគារ អេស៊ីលីដា (ACLEDA)",
  bankAccount: `00${Math.floor(1000000 + Math.random() * 8999999)}`,
  paymentMethod: "bank_transfer",
  taxResidency: i.residency ?? "resident",
  spouseDependents: i.spouse ?? 0,
  childDependents: i.children ?? 0,
  isNssfMember: true,
  isUnionMember: i.union ?? false,
  unionFeeRate: i.union ? 1 : 0,
  annualLeaveEntitlement: 18,
  annualLeaveUsed: Math.floor(Math.random() * 12),
  sickLeaveUsed: Math.floor(Math.random() * 4),
  createdAt: i.hireDate,
});

export const seedEmployees: Employee[] = [
  // Leadership
  build({
    lastNameKh: "សុខ", firstNameKh: "ច័ន្ទថា", lastNameEn: "Sok", firstNameEn: "Chanthy",
    gender: "male", dob: "1979-04-12", departmentId: "dep_fin", positionId: "pos_ceo",
    baseSalary: 9_500_000, hireDate: "2014-03-01", employmentType: "permanent",
    allowances: [A("housing", "ប្រាក់ឧបត្ថម្ភផ្ទះ", "Housing Allowance", 800_000),
      A("transport", "ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ", "Transport Allowance", 600_000),
      A("phone", "ប្រាក់ឧបត្ថម្ភទូរស័ព្ទ", "Phone Allowance", 150_000)],
    spouse: 1, children: 3, phone: "012 888 001", email: "chanthy.sok@sophamangkol.com.kh",
  }, 0),
  build({
    lastNameKh: "លឹម", firstNameKh: "សុជាតា", lastNameEn: "Lim", firstNameEn: "Socheata",
    gender: "female", dob: "1984-08-21", departmentId: "dep_fin", positionId: "pos_cfo",
    baseSalary: 6_800_000, hireDate: "2016-07-18", employmentType: "permanent",
    allowances: [A("housing", "ប្រាក់ឧបត្ថម្ភផ្ទះ", "Housing Allowance", 500_000),
      A("responsibility", "ប្រាក់ឧបត្ថម្ភការទទួលខុសត្រូវ", "Responsibility Allowance", 400_000)],
    spouse: 1, children: 2, phone: "012 888 002", email: "socheata.lim@sophamangkol.com.kh", managerId: "emp_001",
  }, 1),
  // HR
  build({
    lastNameKh: "ចាន់", firstNameKh: "ស្រីនី", lastNameEn: "Chan", firstNameEn: "Siney",
    gender: "female", dob: "1988-11-03", departmentId: "dep_hr", positionId: "pos_mgr",
    baseSalary: 3_200_000, hireDate: "2017-02-06", employmentType: "permanent",
    allowances: std(250_000, 120_000), spouse: 1, children: 2,
    phone: "012 888 003", email: "siney.chan@sophamangkol.com.kh", managerId: "emp_001",
  }, 2),
  build({
    lastNameKh: "ហ៊ុន", firstNameKh: "សុភា", lastNameEn: "Hun", firstNameEn: "Sophea",
    gender: "female", dob: "1995-05-30", departmentId: "dep_hr", positionId: "pos_hr",
    baseSalary: 950_000, hireDate: "2022-09-01", employmentType: "fixed_term",
    allowances: std(150_000, 80_000), spouse: 0, children: 1,
    phone: "012 888 004", email: "sophea.hun@sophamangkol.com.kh", managerId: "emp_003",
  }, 3),
  // IT
  build({
    lastNameKh: "សេង", firstNameKh: "វិចិត្រ", lastNameEn: "Seng", firstNameEn: "Vichet",
    gender: "male", dob: "1992-01-19", departmentId: "dep_it", positionId: "pos_mgr",
    baseSalary: 2_900_000, hireDate: "2018-06-11", employmentType: "permanent",
    allowances: std(200_000, 100_000), spouse: 1, children: 0,
    phone: "012 888 005", email: "vichet.seng@sophamangkol.com.kh", managerId: "emp_001",
  }, 4),
  build({
    lastNameKh: "មាស", firstNameKh: "បញ្ញា", lastNameEn: "Meas", firstNameEn: "Pannha",
    gender: "male", dob: "1998-09-08", departmentId: "dep_it", positionId: "pos_dev",
    baseSalary: 1_650_000, hireDate: "2023-04-03", employmentType: "permanent",
    allowances: std(180_000, 90_000), spouse: 0, children: 0,
    phone: "012 888 006", email: "pannha.meas@sophamangkol.com.kh", managerId: "emp_005",
  }, 5),
  build({
    lastNameKh: "រី", firstNameKh: "ដារា", lastNameEn: "Ry", firstNameEn: "Dara",
    gender: "male", dob: "2001-02-14", departmentId: "dep_it", positionId: "pos_dev",
    baseSalary: 1_100_000, hireDate: "2025-11-03", employmentType: "probation",
    allowances: std(120_000, 60_000), spouse: 0, children: 0,
    phone: "012 888 007", email: "dara.ry@sophamangkol.com.kh", managerId: "emp_005",
  }, 6),
  // Sales
  build({
    lastNameKh: "កែវ", firstNameKh: "សុជាតា", lastNameEn: "Keo", firstNameEn: "Socheata",
    gender: "female", dob: "1990-12-25", departmentId: "dep_sal", positionId: "pos_mgr",
    baseSalary: 2_700_000, hireDate: "2019-01-14", employmentType: "permanent",
    allowances: [A("transport", "ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ", "Transport Allowance", 300_000),
      A("skill", "ប្រាក់ឧបត្ថម្ភជំនាញ", "Skill Allowance", 250_000)], spouse: 1, children: 1,
    phone: "012 888 008", email: "socheata.keo@sophamangkol.com.kh", managerId: "emp_001",
  }, 7),
  build({
    lastNameKh: "ណុប", firstNameKh: "សុវណ្ណ", lastNameEn: "Nop", firstNameEn: "Sovann",
    gender: "male", dob: "1996-06-06", departmentId: "dep_sal", positionId: "pos_sale",
    baseSalary: 780_000, hireDate: "2021-08-16", employmentType: "permanent",
    allowances: std(200_000, 80_000), spouse: 0, children: 0, union: true,
    phone: "012 888 009", email: "sovann.nop@sophamangkol.com.kh", managerId: "emp_008",
  }, 8),
  build({
    lastNameKh: "ស៊ីម", firstNameKh: "ម៉ាលី", lastNameEn: "Sim", firstNameEn: "Maly",
    gender: "female", dob: "1999-03-17", departmentId: "dep_sal", positionId: "pos_sale",
    baseSalary: 620_000, hireDate: "2024-02-19", employmentType: "fixed_term",
    allowances: std(150_000, 70_000), spouse: 0, children: 0, union: true,
    phone: "012 888 010", email: "maly.sim@sophamangkol.com.kh", managerId: "emp_008",
  }, 9),
  // Production
  build({
    lastNameKh: "ព្រាប", firstNameKh: "សំណាង", lastNameEn: "Preap", firstNameEn: "Samnang",
    gender: "male", dob: "1986-07-09", departmentId: "dep_prd", positionId: "pos_sup",
    baseSalary: 1_350_000, hireDate: "2016-10-03", employmentType: "permanent",
    allowances: std(150_000, 90_000), spouse: 1, children: 3, union: true,
    phone: "012 888 011", email: "samnang.preap@sophamangkol.com.kh", managerId: "emp_001",
  }, 10),
  build({
    lastNameKh: "យិន", firstNameKh: "សុខាន", lastNameEn: "Yin", firstNameEn: "Sokhan",
    gender: "female", dob: "1994-10-22", departmentId: "dep_prd", positionId: "pos_opr",
    baseSalary: 520_000, hireDate: "2020-05-04", employmentType: "permanent",
    allowances: std(80_000, 60_000), spouse: 0, children: 2, union: true,
    phone: "012 888 012", email: "sokhan.yin@sophamangkol.com.kh", managerId: "emp_011",
  }, 11),
  build({
    lastNameKh: "ស្រ៊ុន", firstNameKh: "ចន្ថា", lastNameEn: "Srun", firstNameEn: "Chantha",
    gender: "female", dob: "1997-01-31", departmentId: "dep_prd", positionId: "pos_opr",
    baseSalary: 480_000, hireDate: "2022-03-14", employmentType: "permanent",
    allowances: std(80_000, 60_000), spouse: 1, children: 1, union: true,
    phone: "012 888 013", email: "chantha.srun@sophamangkol.com.kh", managerId: "emp_011",
  }, 12),
  build({
    lastNameKh: "ខៀវ", firstNameKh: "វណ្ណា", lastNameEn: "Khiev", firstNameEn: "Vanna",
    gender: "male", dob: "1993-04-05", departmentId: "dep_prd", positionId: "pos_opr",
    baseSalary: 560_000, hireDate: "2019-11-11", employmentType: "permanent",
    allowances: std(80_000, 60_000), spouse: 1, children: 0, union: true,
    phone: "012 888 014", email: "vanna.khiev@sophamangkol.com.kh", managerId: "emp_011",
  }, 13),
  build({
    lastNameKh: "ទូច", firstNameKh: "សុភាព", lastNameEn: "Touch", firstNameEn: "Sopheak",
    gender: "male", dob: "2000-08-28", departmentId: "dep_prd", positionId: "pos_opr",
    baseSalary: 440_000, hireDate: "2025-10-06", employmentType: "probation",
    allowances: std(80_000, 60_000), spouse: 0, children: 0, union: true,
    phone: "012 888 015", email: "sopheak.touch@sophamangkol.com.kh", managerId: "emp_011",
  }, 14),
  // Logistics
  build({
    lastNameKh: "ផល", firstNameKh: "វិសាល", lastNameEn: "Phal", firstNameEn: "Visal",
    gender: "male", dob: "1989-02-02", departmentId: "dep_log", positionId: "pos_sup",
    baseSalary: 1_180_000, hireDate: "2018-08-20", employmentType: "permanent",
    allowances: std(180_000, 90_000), spouse: 1, children: 2,
    phone: "012 888 016", email: "visal.phal@sophamangkol.com.kh", managerId: "emp_001",
  }, 15),
  build({
    lastNameKh: "ម៉ៅ", firstNameKh: "សំរិទ្ធ", lastNameEn: "Mao", firstNameEn: "Samrith",
    gender: "male", dob: "1991-09-15", departmentId: "dep_log", positionId: "pos_drv",
    baseSalary: 620_000, hireDate: "2021-01-25", employmentType: "fixed_term",
    allowances: std(120_000, 70_000), spouse: 1, children: 3, union: true,
    phone: "012 888 017", email: "samrith.mao@sophamangkol.com.kh", managerId: "emp_016",
  }, 16),
  build({
    lastNameKh: "លី", firstNameKh: "សុខា", lastNameEn: "Ly", firstNameEn: "Sokha",
    gender: "male", dob: "1985-05-11", departmentId: "dep_log", positionId: "pos_drv",
    baseSalary: 580_000, hireDate: "2017-04-10", employmentType: "permanent",
    allowances: std(120_000, 70_000), spouse: 1, children: 4,
    phone: "012 888 018", email: "sokha.ly@sophamangkol.com.kh", managerId: "emp_016",
  }, 17),
  // A foreign / non-resident specialist (flat 20% ToS)
  build({
    lastNameKh: "វ៉ាង", firstNameKh: "វេយ", lastNameEn: "Wang", firstNameEn: "Wei",
    gender: "male", dob: "1987-03-08", departmentId: "dep_prd", positionId: "pos_mgr",
    baseSalary: 5_200_000, hireDate: "2024-07-01", employmentType: "fixed_term",
    allowances: [A("housing", "ប្រាក់ឧបត្ថម្ភផ្ទះ", "Housing Allowance", 900_000),
      A("transport", "ប្រាក់ឧបត្ថម្ភធ្វើដំណើរ", "Transport Allowance", 300_000)],
    residency: "non_resident", spouse: 0, children: 0,
    phone: "012 888 019", email: "wei.wang@sophamangkol.com.kh", managerId: "emp_001",
    bank: "ធនាគារ កាណាឌីយ៉ា (Canadia Bank)",
  }, 18),
];

export const seedSettings = DEFAULT_SETTINGS;

export const currentPeriod = (() => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
})();

export const seedRuns: PayrollRun[] = (() => {
  const now = new Date();
  const runs: PayrollRun[] = [];
  for (let back = 2; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const status: PayrollRun["status"] = back === 0 ? "draft" : back === 1 ? "approved" : "paid";
    runs.push({
      id: `run_${year}_${String(month).padStart(2, "0")}`,
      code: `PAY-${year}-${String(month).padStart(2, "0")}`,
      periodMonth: month,
      periodYear: year,
      payDate: `${year}-${String(month).padStart(2, "0")}-25`,
      status,
      workingDays: 22,
      note: back === 0 ? "រង់ចាំការត្រួតពិនិត្យ" : "",
      createdAt: `${year}-${String(month).padStart(2, "0")}-26`,
      approvedBy: back === 0 ? undefined : "លោក សុខ ច័ន្ទថា",
      approvedAt: back === 0 ? undefined : `${year}-${String(month).padStart(2, "0")}-24`,
      exchangeRate: 4100,
    });
  }
  return runs;
})();

/** Deterministic pseudo-random attendance for a run. */
export function seedAttendance(employees: Employee[], run: PayrollRun): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  const seedBase = run.periodYear * 100 + run.periodMonth;
  employees.forEach((e, idx) => {
    const rnd = (n: number) => {
      const x = Math.sin(seedBase + idx * 37 + n * 91) * 10000;
      return x - Math.floor(x);
    };
    const isOperator = e.positionId === "pos_opr";
    const otWeekday = isOperator ? Math.round(rnd(1) * 18) + 4 : Math.round(rnd(1) * 6);
    const otRest = isOperator ? Math.round(rnd(2) * 8) : Math.round(rnd(2) * 2);
    const otHoli = run.periodMonth === 4 || run.periodMonth === 10 || run.periodMonth === 11 ? Math.round(rnd(3) * 6) : 0;
    out.push({
      employeeId: e.id,
      date: `${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}-01`,
      status: "present",
      hoursWorked: 208,
      overtimeHours: otWeekday + otRest + otHoli,
      overtimeType: "weekday",
      note: "",
    });
  });
  return out;
}

export function attendanceSummaryFor(employeeId: string, run: PayrollRun, employees: Employee[]) {
  const idx = employees.findIndex((e) => e.id === employeeId);
  const e = employees[idx];
  if (!e) {
    return {
      daysWorked: 22, paidLeaveDays: 0, unpaidLeaveDays: 0, absentDays: 0, lateCount: 0,
      overtimeWeekday: 0, overtimeRestDay: 0, overtimeHoliday: 0, totalOvertimeHours: 0,
    };
  }
  const seedBase = run.periodYear * 100 + run.periodMonth;
  const rnd = (n: number) => {
    const x = Math.sin(seedBase + idx * 37 + n * 91) * 10000;
    return x - Math.floor(x);
  };
  const isOperator = e.positionId === "pos_opr";
  const otWeekday = isOperator ? Math.round(rnd(1) * 18) + 4 : Math.round(rnd(1) * 6);
  const otRest = isOperator ? Math.round(rnd(2) * 8) : Math.round(rnd(2) * 2);
  const otHoli =
    run.periodMonth === 4 || run.periodMonth === 10 || run.periodMonth === 11
      ? Math.round(rnd(3) * 6)
      : 0;
  const unpaid = rnd(4) > 0.82 ? Math.round(rnd(5) * 2) : 0;
  const paidLeave = rnd(6) > 0.7 ? Math.round(rnd(7) * 3) : 0;
  const absent = rnd(8) > 0.9 ? 1 : 0;
  const late = rnd(9) > 0.75 ? Math.round(rnd(10) * 3) : 0;
  const daysWorked = Math.max(0, 22 - unpaid - absent - paidLeave);
  return {
    daysWorked,
    paidLeaveDays: paidLeave,
    unpaidLeaveDays: unpaid,
    absentDays: absent,
    lateCount: late,
    overtimeWeekday: otWeekday,
    overtimeRestDay: otRest,
    overtimeHoliday: otHoli,
    totalOvertimeHours: otWeekday + otRest + otHoli,
  };
}

export const seedLeaves: LeaveRequest[] = [
  {
    id: "lv_001", employeeId: "emp_012", type: "annual", from: "2026-11-16", to: "2026-11-18",
    days: 3, paid: true, reason: "ទៅលេងស្រុកកំណើតនៅកំពង់ចាម", status: "approved",
    createdAt: "2026-10-28",
  },
  {
    id: "lv_002", employeeId: "emp_004", type: "sick", from: "2026-11-03", to: "2026-11-04",
    days: 2, paid: true, reason: "គ្រុនផ្តាសាយ", status: "approved", createdAt: "2026-11-02",
  },
  {
    id: "lv_003", employeeId: "emp_006", type: "special", from: "2026-11-27", to: "2026-11-27",
    days: 1, paid: true, reason: "រៀបការ", status: "pending", createdAt: "2026-10-30",
  },
  {
    id: "lv_004", employeeId: "emp_013", type: "maternity", from: "2026-12-01", to: "2027-02-28",
    days: 90, paid: true, reason: "សម្រាលកូន", status: "pending", createdAt: "2026-10-25",
  },
];
