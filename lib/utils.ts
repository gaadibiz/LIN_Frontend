import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getSubmittedApplications } from "./application-status"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns true if the user profile already has at least one *submitted* loan application.
// Drafts left behind by the eligibility check don't count — see lib/application-status.ts.
export function hasLoanApplication(profile: unknown): boolean {
  const apps = (profile as { loanApplications?: unknown } | null | undefined)?.loanApplications;
  return getSubmittedApplications(apps).length > 0;
}

// Decides where to send an authenticated user based on their applications.
// No applications yet -> go to Apply. Has at least one -> go to Dashboard.
export function getPostAuthRoute(profile: unknown): string {
  return hasLoanApplication(profile) ? "/dashboard" : "/apply-now";
}

export function formatAppNumber(id: number | string | null | undefined, aadhaar?: string): string {
  if (!id) return "";
  
  const prefix = "PDF";
  const year = new Date().getFullYear().toString();
  
  // Extract last 4 digits of Aadhaar, fallback to "0000"
  const cleanAadhaar = typeof aadhaar === 'string' ? aadhaar.replace(/\D/g, '') : '';
  const aaaa = cleanAadhaar.length >= 4 
    ? cleanAadhaar.slice(-4) 
    : cleanAadhaar.padStart(4, '0');
    
  // Format the ID to 5 digits (12345 -> '12345', 45 -> '00045')
  const serial = String(id).padStart(5, '0');
  
  return `${prefix}${year}${aaaa}${serial}`;
}

// Age eligibility for a personal loan — mirrored in the "Eligibility check" grid
// (see eligibilityCriteria in lib/data.tsx). Keep the two in sync.
export const MIN_ELIGIBLE_AGE = 21;
export const MAX_ELIGIBLE_AGE = 58;

// Age in completed years from a date of birth. Accepts the YYYY-MM-DD the PAN/Aadhaar
// KYC response is normalised to, as well as the DD/MM/YYYY some providers return.
// Returns null when the date is missing or unparseable.
export function calculateAge(dob: string | null | undefined): number | null {
  const raw = String(dob ?? "").trim();
  if (!raw) return null;

  let parsed: Date;
  if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    parsed = new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  } else {
    parsed = new Date(raw);
  }
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  // Not had this year's birthday yet -> one year younger.
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) age--;

  return age;
}

// True only when the DOB parses AND the age falls inside the eligible window.
export function isAgeEligible(dob: string | null | undefined): boolean {
  const age = calculateAge(dob);
  return age !== null && age >= MIN_ELIGIBLE_AGE && age <= MAX_ELIGIBLE_AGE;
}
