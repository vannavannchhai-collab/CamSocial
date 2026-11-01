// Number, currency, date and Khmer-numeral formatting helpers.

export const KHR = (n: number, opts?: { decimals?: boolean; sign?: boolean }) => {
  if (!isFinite(n)) n = 0;
  const decimals = opts?.decimals ?? false;
  const v = decimals ? n : Math.round(n);
  const s = v.toLocaleString("en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  const pre = opts?.sign && v > 0 ? "+" : "";
  return `${pre}${s}`;
};

export const KHRs = (n: number) => `៛${KHR(n)}`;
export const USD = (n: number, decimals = 2) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** Amounts in the app are stored in KHR (riels). */
export const money = (n: number, currency: "KHR" | "USD" = "KHR", rate = 4100) => {
  if (currency === "USD") return USD(n / (rate || 4100));
  return KHRs(n);
};

const KH_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

/** Convert latin digits inside a string to Khmer numerals. */
export const toKhmerDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => KH_DIGITS[Number(d)]);

export const countKhmer = (n: number): string => {
  const words = [
    "សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន",
    "ដប់", "ដប់មួយ", "ដប់ពីរ", "ដប់បី", "ដប់បួន", "ដប់ប្រាំ", "ដប់ប្រាំមួយ", "ដប់ប្រាំពីរ", "ដប់ប្រាំបី", "ដប់ប្រាំបួន",
    "ម្ភៃ",
  ];
  if (n < 0 || n > 20) return String(n);
  return words[Math.round(n)] ?? String(n);
};

export const MONTHS_KH = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

export const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Khmer lunar-style era year used on official forms (e.g. ២០២៦). */
export const monthYearKh = (month: number, year: number) =>
  `ខែ${MONTHS_KH[month - 1]} ឆ្នាំ${toKhmerDigits(year)}`;

export const monthYearEn = (month: number, year: number) =>
  `${MONTHS_EN[month - 1]} ${year}`;

export const formatDate = (iso: string | undefined | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const formatDateKh = (iso: string | undefined | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return toKhmerDigits(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
};

export const isoToday = () => new Date().toISOString().slice(0, 10);

/** Days between two ISO dates inclusive. */
export const daysBetween = (from: string, to: string) => {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
};

/** Months of continuous service between hire date and a reference date. */
export const serviceMonths = (hireDate: string, ref = new Date()) => {
  const h = new Date(hireDate);
  if (isNaN(h.getTime())) return 0;
  let m = (ref.getFullYear() - h.getFullYear()) * 12 + (ref.getMonth() - h.getMonth());
  if (ref.getDate() < h.getDate()) m -= 1;
  return Math.max(0, m);
};

export const serviceLabel = (hireDate: string, ref = new Date()) => {
  const m = serviceMonths(hireDate, ref);
  const y = Math.floor(m / 12);
  const mm = m % 12;
  return `${y} ឆ្នាំ ${mm} ខែ`;
};

export const pct = (n: number, decimals = 2) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;

export const initials = (a: string, b: string) =>
  `${(a || "").trim().charAt(0)}${(b || "").trim().charAt(0)}`.toUpperCase();

export const fullNameKh = (e: { lastNameKh: string; firstNameKh: string }) =>
  `${e.lastNameKh} ${e.firstNameKh}`.trim();

export const fullNameEn = (e: { lastNameEn: string; firstNameEn: string }) =>
  `${e.lastNameEn} ${e.firstNameEn}`.trim();

export const roundTo = (n: number, step: number) => (step > 1 ? Math.round(n / step) * step : Math.round(n));

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export const numeralSafe = (v: number) => (Number.isFinite(v) ? v : 0);

/** Strip trailing .00 for compact tables */
export const compact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
};
