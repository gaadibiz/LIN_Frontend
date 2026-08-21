// Rejected applicants must wait out a cooldown before applying again. The clock starts on
// the rejection date, and the same phone number cannot file a new application until it runs
// out — a rejected user coming back with the number they signed up with is stopped at OTP
// verification, and every path that files an application re-checks before submitting.
//
// This is the frontend half of the rule. It reads the applications on the logged-in
// profile, so it only knows what /api/users/profile/complete returns; the backend must
// reject a submission inside the window too, for anything that bypasses this UI.

import { getSubmittedApplications, type ApplicationLike } from "./application-status";

export const REAPPLY_COOLDOWN_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RejectableApplication extends ApplicationLike {
  status?: string | null;
  // Whichever of these the backend sends; see getRejectionDate for the order of preference.
  rejectedAt?: string | null;
  statusUpdatedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface ReapplyBlock {
  rejectedOn: Date;
  reapplyFrom: Date;
  daysRemaining: number;
}

// Raised when an application is attempted inside the cooldown. A distinct type so the
// submit flow can tell a hard stop apart from the sync errors it deliberately swallows.
export class ReapplyCooldownError extends Error {
  readonly block: ReapplyBlock;

  constructor(block: ReapplyBlock) {
    super(reapplyBlockMessage(block));
    this.name = "ReapplyCooldownError";
    this.block = block;
  }
}

export function isRejectedApplication(application: RejectableApplication | null | undefined): boolean {
  const status = String(application?.status ?? "").trim().toUpperCase();
  return status === "REJECTED" || status === "DECLINED";
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// When the rejection happened. The backend may or may not stamp the status change, so
// createdAt is the last resort — a rejected row with no timestamp at all still enforces
// a cooldown, just measured from when the application was filed.
export function getRejectionDate(application: RejectableApplication | null | undefined): Date | null {
  if (!application) return null;
  return (
    parseDate(application.rejectedAt) ??
    parseDate(application.statusUpdatedAt) ??
    parseDate(application.updatedAt) ??
    parseDate(application.createdAt)
  );
}

// The active block, or null when the user is free to apply. The most recent rejection
// governs: an older one that has already expired cannot re-block anybody.
export function getReapplyBlock(applications: unknown, now: Date = new Date()): ReapplyBlock | null {
  const rejections = getSubmittedApplications<RejectableApplication>(applications)
    .filter(isRejectedApplication)
    .map(getRejectionDate)
    .filter((date): date is Date => date !== null);

  if (rejections.length === 0) return null;

  const rejectedOn = new Date(Math.max(...rejections.map(date => date.getTime())));
  const reapplyFrom = new Date(rejectedOn.getTime() + REAPPLY_COOLDOWN_DAYS * DAY_MS);

  if (now.getTime() >= reapplyFrom.getTime()) return null;

  return {
    rejectedOn,
    reapplyFrom,
    // Part of a day still counts as a day left to wait, so this never reads "0 days".
    daysRemaining: Math.max(1, Math.ceil((reapplyFrom.getTime() - now.getTime()) / DAY_MS)),
  };
}

export function formatCooldownDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function reapplyBlockMessage(block: ReapplyBlock): string {
  const days = block.daysRemaining === 1 ? "1 day" : `${block.daysRemaining} days`;
  return `Your previous loan application was rejected on ${formatCooldownDate(block.rejectedOn)}. `
    + `As per our credit policy a new application can be submitted only after ${REAPPLY_COOLDOWN_DAYS} days, `
    + `so you can apply again from ${formatCooldownDate(block.reapplyFrom)} (${days} to go).`;
}

// Checks the cooldown for whoever the stored auth token belongs to — i.e. the phone number
// that just verified. Fails open on a network or auth error: a fetch that never arrived is
// not evidence of a rejection, and the backend still guards the submission itself.
//
// Deliberately a plain fetch rather than apiClient: this runs mid-signup, and apiClient
// treats any 401 as an expired session, wiping the token and bouncing the user to /signup.
// A read that only asks "is this account in cooldown?" must never be able to log anyone out,
// so a non-200 here is simply treated as unknown.
export async function getReapplyBlockForCurrentUser(): Promise<ReapplyBlock | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) return null; // Anonymous: no account yet, so nothing to be in cooldown for.

  try {
    const { config } = await import("./config");
    const response = await fetch(`${config.apiUrl.replace(/\/+$/, "")}/api/users/profile/complete`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { profile?: { loanApplications?: unknown } } | null;
    return getReapplyBlock(body?.profile?.loanApplications);
  } catch (error) {
    console.error("Could not check the reapply cooldown", error);
    return null;
  }
}

// Throws if the current user is inside the cooldown. Call before anything is written.
export async function assertReapplyAllowed(): Promise<void> {
  const block = await getReapplyBlockForCurrentUser();
  if (block) throw new ReapplyCooldownError(block);
}
