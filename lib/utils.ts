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
