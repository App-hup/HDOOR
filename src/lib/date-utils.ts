// Date utilities for Arabic locale

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const arabicDays = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

export function todayStr(): string {
  const d = new Date();
  return toDateStr(d);
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatArabicDate(s: string): string {
  try {
    const d = parseDate(s);
    return `${arabicDays[d.getDay()]}، ${d.getDate()} ${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return s;
  }
}

export function formatArabicDateShort(s: string): string {
  try {
    const d = parseDate(s);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return s;
  }
}

export function formatArabicDateTime(s: string): string {
  try {
    const d = new Date(s);
    return `${arabicDays[d.getDay()]}، ${d.getDate()} ${arabicMonths[d.getMonth()]} ${d.getFullYear()} - ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return s;
  }
}

export function currentTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getMonthLabel(month: number): string {
  return arabicMonths[month] || "";
}

export function lastNMonths(n: number): { label: string; key: string }[] {
  const result: { label: string; key: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return result;
}

export function isSameMonth(dateStr: string, monthKey: string): boolean {
  return dateStr.startsWith(monthKey);
}
