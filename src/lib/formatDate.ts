import { format, parseISO, isValid } from "date-fns";
import { nl } from "date-fns/locale";

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, "d MMM yyyy", { locale: nl });
}
