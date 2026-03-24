import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** PesaPal expects separate first/last names; split on the first space. */
export function splitFullNameForPesapal(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) return { firstName: "", lastName: "" };
  const i = trimmed.indexOf(" ");
  if (i === -1) {
    return { firstName: trimmed, lastName: "-" };
  }
  const firstName = trimmed.slice(0, i);
  const lastName = trimmed.slice(i + 1).trim() || "-";
  return { firstName, lastName };
}
