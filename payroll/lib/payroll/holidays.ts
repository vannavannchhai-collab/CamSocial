// Official Cambodian public holidays (ថ្ងៃឈប់សម្រាកសាធារណៈ)
// Source: Royal Government sub-decrees / MLVT Prakas on paid public holidays.
// 2025 & 2026 are the officially gazetted lists; 2027 fixed-date holidays are
// included and lunar festivals are marked as provisional.

export interface PublicHoliday {
  date: string; // yyyy-mm-dd
  nameKh: string;
  nameEn: string;
  /** Lunar festivals move each year — flagged for review. */
  provisional?: boolean;
}

export const HOLIDAYS: PublicHoliday[] = [
  // ---------------- 2025 ----------------
  { date: "2025-01-01", nameKh: "ទិវាចូលឆ្នាំសាកល", nameEn: "International New Year Day" },
  { date: "2025-01-07", nameKh: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", nameEn: "Victory over Genocide Day" },
  { date: "2025-03-08", nameKh: "ទិវាអន្តរជាតិនារី", nameEn: "International Women's Day" },
  { date: "2025-04-14", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី១)", nameEn: "Khmer New Year Day 1" },
  { date: "2025-04-15", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី២)", nameEn: "Khmer New Year Day 2" },
  { date: "2025-04-16", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី៣)", nameEn: "Khmer New Year Day 3" },
  { date: "2025-05-01", nameKh: "ទិវាពលកម្មអន្តរជាតិ", nameEn: "International Labour Day" },
  { date: "2025-05-11", nameKh: "ទិវាវិសាខបូជា", nameEn: "Visak Bochea Day" },
  { date: "2025-05-14", nameKh: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្តេចព្រះបរមនាថ នរោត្តម សីហមុនី", nameEn: "King Norodom Sihamoni's Birthday" },
  { date: "2025-06-18", nameKh: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី", nameEn: "Queen Mother's Birthday" },
  { date: "2025-09-21", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី១)", nameEn: "Pchum Ben Day 1" },
  { date: "2025-09-22", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី២)", nameEn: "Pchum Ben Day 2" },
  { date: "2025-09-23", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី៣)", nameEn: "Pchum Ben Day 3" },
  { date: "2025-09-24", nameKh: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", nameEn: "Constitution Day" },
  { date: "2025-10-15", nameKh: "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណា ព្រះបាទសម្តេចព្រះនរោត្តម សីហនុ", nameEn: "King Father Commemoration Day" },
  { date: "2025-10-29", nameKh: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ", nameEn: "King's Coronation Day" },
  { date: "2025-11-04", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី១)", nameEn: "Water Festival Day 1" },
  { date: "2025-11-05", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី២)", nameEn: "Water Festival Day 2" },
  { date: "2025-11-06", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី៣)", nameEn: "Water Festival Day 3" },
  { date: "2025-11-09", nameKh: "ទិវាបុណ្យឯករាជ្យជាតិ", nameEn: "National Independence Day" },
  { date: "2025-12-29", nameKh: "ទិវាសន្តិភាពលើទឹកដីកម្ពុជា", nameEn: "Peace Day in Cambodia" },

  // ---------------- 2026 (Sub-Decree No. 167, 18 Sep 2025) ----------------
  { date: "2026-01-01", nameKh: "ទិវាចូលឆ្នាំសាកល", nameEn: "International New Year Day" },
  { date: "2026-01-07", nameKh: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", nameEn: "Victory over Genocide Day" },
  { date: "2026-03-08", nameKh: "ទិវាអន្តរជាតិនារី", nameEn: "International Women's Day" },
  { date: "2026-04-14", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី១)", nameEn: "Khmer New Year Day 1" },
  { date: "2026-04-15", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី២)", nameEn: "Khmer New Year Day 2" },
  { date: "2026-04-16", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី៣)", nameEn: "Khmer New Year Day 3" },
  { date: "2026-05-01", nameKh: "ទិវាពលកម្មអន្តរជាតិ និងទិវាវិសាខបូជា", nameEn: "International Labour Day & Visak Bochea" },
  { date: "2026-05-05", nameKh: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល", nameEn: "Royal Ploughing Ceremony" },
  { date: "2026-05-14", nameKh: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្តេចព្រះបរមនាថ នរោត្តម សីហមុនី", nameEn: "King Norodom Sihamoni's Birthday" },
  { date: "2026-06-18", nameKh: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី", nameEn: "Queen Mother's Birthday" },
  { date: "2026-09-24", nameKh: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", nameEn: "Constitution Day" },
  { date: "2026-10-10", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី១)", nameEn: "Pchum Ben Day 1" },
  { date: "2026-10-11", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី២)", nameEn: "Pchum Ben Day 2" },
  { date: "2026-10-12", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី៣)", nameEn: "Pchum Ben Day 3" },
  { date: "2026-10-15", nameKh: "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណា ព្រះបាទសម្តេចព្រះនរោត្តម សីហនុ", nameEn: "King Father Commemoration Day" },
  { date: "2026-10-29", nameKh: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ", nameEn: "King's Coronation Day" },
  { date: "2026-11-09", nameKh: "ទិវាបុណ្យឯករាជ្យជាតិ", nameEn: "National Independence Day" },
  { date: "2026-11-23", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី១)", nameEn: "Water Festival Day 1" },
  { date: "2026-11-24", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី២)", nameEn: "Water Festival Day 2" },
  { date: "2026-11-25", nameKh: "បុណ្យអុំទូក អកអំបុក សំពះព្រះខែ (ថ្ងៃទី៣)", nameEn: "Water Festival Day 3" },
  { date: "2026-12-29", nameKh: "ទិវាសន្តិភាពលើទឹកដីកម្ពុជា", nameEn: "Peace Day in Cambodia" },

  // ---------------- 2027 (fixed dates gazetted; lunar provisional) ----------------
  { date: "2027-01-01", nameKh: "ទិវាចូលឆ្នាំសាកល", nameEn: "International New Year Day" },
  { date: "2027-01-07", nameKh: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", nameEn: "Victory over Genocide Day" },
  { date: "2027-03-08", nameKh: "ទិវាអន្តរជាតិនារី", nameEn: "International Women's Day" },
  { date: "2027-04-14", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី១)", nameEn: "Khmer New Year Day 1", provisional: true },
  { date: "2027-04-15", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី២)", nameEn: "Khmer New Year Day 2", provisional: true },
  { date: "2027-04-16", nameKh: "ចូលឆ្នាំថ្មីប្រពៃណីជាតិ (ថ្ងៃទី៣)", nameEn: "Khmer New Year Day 3", provisional: true },
  { date: "2027-05-01", nameKh: "ទិវាពលកម្មអន្តរជាតិ", nameEn: "International Labour Day" },
  { date: "2027-09-24", nameKh: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", nameEn: "Constitution Day" },
  { date: "2027-09-30", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី១)", nameEn: "Pchum Ben Day 1", provisional: true },
  { date: "2027-10-01", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី២)", nameEn: "Pchum Ben Day 2", provisional: true },
  { date: "2027-10-02", nameKh: "បុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី៣)", nameEn: "Pchum Ben Day 3", provisional: true },
  { date: "2027-10-15", nameKh: "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបាទសម្តេចព្រះនរោត្តម សីហនុ", nameEn: "King Father Commemoration Day" },
  { date: "2027-10-29", nameKh: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ", nameEn: "King's Coronation Day" },
  { date: "2027-11-09", nameKh: "ទិវាបុណ្យឯករាជ្យជាតិ", nameEn: "National Independence Day" },
  { date: "2027-11-13", nameKh: "បុណ្យអុំទូក (ថ្ងៃទី១)", nameEn: "Water Festival Day 1", provisional: true },
  { date: "2027-11-14", nameKh: "បុណ្យអុំទូក (ថ្ងៃទី២)", nameEn: "Water Festival Day 2", provisional: true },
  { date: "2027-11-15", nameKh: "បុណ្យអុំទូក (ថ្ងៃទី៣)", nameEn: "Water Festival Day 3", provisional: true },
];

export const holidayMap = new Map(HOLIDAYS.map((h) => [h.date, h]));

export const isPublicHoliday = (iso: string) => holidayMap.has(iso);

export const holidaysInMonth = (year: number, month: number) =>
  HOLIDAYS.filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

export const holidaysForYear = (year: number) =>
  HOLIDAYS.filter((h) => new Date(h.date).getFullYear() === year);

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Calendar days in a month. */
export const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

/**
 * Working days in a month: Monday–Saturday roster minus public holidays.
 * Cambodian garment factories typically work Mon–Sat (6 days); office
 * employers Mon–Fri. Callers choose.
 */
export function workingDaysInMonth(
  year: number,
  month: number,
  opts?: { workOnSaturday?: boolean }
) {
  const workOnSaturday = opts?.workOnSaturday ?? false;
  const total = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month - 1, day);
    const dow = d.getDay(); // 0 Sun … 6 Sat
    if (dow === 0) continue;
    if (dow === 6 && !workOnSaturday) continue;
    if (isPublicHoliday(iso(d))) continue;
    count++;
  }
  return count;
}

/** Expand a month into a day-by-day calendar (used by the attendance grid). */
export function monthCalendar(year: number, month: number, workOnSaturday = false) {
  const total = daysInMonth(year, month);
  const out: {
    date: string;
    day: number;
    dow: number;
    isWeekend: boolean;
    isHoliday: boolean;
    holiday?: PublicHoliday;
    isWorkday: boolean;
  }[] = [];
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month - 1, day);
    const key = iso(d);
    const dow = d.getDay();
    const holiday = holidayMap.get(key);
    const isWeekend = dow === 0 || (dow === 6 && !workOnSaturday);
    out.push({
      date: key,
      day,
      dow,
      isWeekend,
      isHoliday: !!holiday,
      holiday,
      isWorkday: !isWeekend && !holiday,
    });
  }
  return out;
}
