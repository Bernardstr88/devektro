import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

export const WARN_DAYS = 30;

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, "d MMM yyyy", { locale: nl });
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  return differenceInDays(d, new Date());
}
