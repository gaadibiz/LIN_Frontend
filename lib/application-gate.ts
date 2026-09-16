// Answers one question for the whole app: may this user file a new loan application?
//
// Two rules can say no:
//   1. In process — an application they already filed has not been decided yet. One case
//      per applicant is worked at a time, so a second application cannot be opened while
//      the first is still being processed.
//   2. Cooldown — their last application was rejected less than 15 days ago
//      (see lib/reapply-cooldown.ts).
//
// A case becomes available again the moment it is decided: approved (reloan) or rejected
// (after the cooldown). Like the cooldown, this is the frontend half — it reads the
// applications on the logged-in profile, and the backend must refuse a second application
// too, for anything that bypasses this UI.

import { getSubmittedApplications } from "./application-status";
import {
  REAPPLY_COOLDOWN_DAYS,
  getReapplyBlock,
  isRejectedApplication,
  reapplyBlockMessage,
  type ReapplyBlock,
  type RejectableApplication,
} from "./reapply-cooldown";

export type GateApplication = RejectableApplication & {
  loanAmount?: number | null;
};

// Statuses that mean the case is finished, one way or another. Anything else — including a
// row with no status at all — counts as still in process: an undecided application must
// never read as free to reapply just because the backend used a status we don't know yet.
const DECIDED_STATUSES = new Set([
  "APPROVED",
  "REJECTED",
  "DECLINED",
  "DISBURSED",
  "CLOSED",
  "CANCELLED",
  "CANCELED",
  "WITHDRAWN",
  "COMPLETED",
  "SETTLED",
]);

export const IN_PROCESS_LABEL = "In Process";

// Repayment is only ever collected against a loan whose money has actually gone out —
// the backend marks those DISBURSED or COMPLETED. Everything else (still in process,
// approved but not yet paid out, rejected) has nothing to pay back yet, so the Repay Loan
// tab lists exactly the applications the dashboard shows as "Disbursed" or "Completed".
const REPAYABLE_STATUSES = new Set(["DISBURSED", "COMPLETED"]);

export function isRepayableApplication(application: GateApplication | null | undefined): boolean {
  if (!application) return false;
  return REPAYABLE_STATUSES.has(String(application.status ?? "").trim().toUpperCase());
}

// A loan that ran its full course and is finished. Reloan is offered on the strength of a
// repaid loan, so "approved" and "disbursed" do not count: the money is still outstanding
// and that case is not yet evidence of anything. An applicant with no finished loan is
// offered Reapply instead — same form, but it is a fresh application, not a repeat one.
const COMPLETED_STATUSES = new Set(["COMPLETED", "CLOSED", "SETTLED"]);

export function isCompletedApplication(application: GateApplication | null | undefined): boolean {
  if (!application) return false;
  return COMPLETED_STATUSES.has(String(application.status ?? "").trim().toUpperCase());
}

// True when the profile carries at least one finished loan, i.e. the user qualifies for Reloan.
export function hasCompletedApplication(applications: unknown): boolean {
  return getSubmittedApplications<GateApplication>(applications).some(isCompletedApplication);
}

// ---------------------------------------------------------------------------
// Reapply / Reloan eligibility
// ---------------------------------------------------------------------------
// The dashboard offers both, side by side, and they are NOT the same rule:
//
//   Reapply — file another application after waiting out the gap. Allowed once 15 days
//             have passed since the last application was filed (and, as before, once any
//             rejection cooldown has expired).
//   Reloan  — take a fresh loan on the strength of a finished one. Allowed only when the
//             customer has NOTHING still in process: every application they have filed
//             must have reached a completed status. One undecided application anywhere
//             blocks it, however many completed ones sit alongside.
//
// Both are the frontend half of the rule. The backend must enforce the same thing for
// anything that bypasses this UI.

export const REAPPLY_AFTER_DAYS = 15;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Why a customer may not reapply or reloan yet.
 *
 * Carries the applications behind the decision, not just a sentence, so the dashboard can
 * show it as a full panel — each application with its status and the date it was filed —
 * rather than a one-line alert the customer cannot act on.
 */
export interface EligibilityBlock {
  kind: "reapply-wait" | "cooldown" | "in-process" | "no-completed-loan";
  title: string;
  message: string;
  // The applications that explain the block, newest first. Empty when nothing is pending.
  applications: GateApplication[];
  // Set for the two waits: when the customer becomes eligible, and how long that is.
  availableFrom?: Date;
  daysRemaining?: number;
}

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function formatApplicationDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Newest first, so the panel lists the most recent application at the top.
const byNewest = (applications: GateApplication[]): GateApplication[] =>
  [...applications].sort(
    (a, b) =>
      (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0),
  );

// The application the customer filed most recently, or null if they never filed one.
export function getLatestApplication(applications: unknown): GateApplication | null {
  const submitted = byNewest(getSubmittedApplications<GateApplication>(applications));
  return submitted[0] ?? null;
}

export function getApplicationDate(application: GateApplication | null | undefined): Date | null {
  return parseDate(application?.createdAt);
}

const daysUntil = (target: Date, now: Date): number =>
  // Part of a day still counts as a day left to wait, so this never reads "0 days".
  Math.max(1, Math.ceil((target.getTime() - now.getTime()) / DAY_IN_MS));

/**
 * Why the customer may not reapply yet, or null when they may.
 *
 * Two independent waits, both 15 days: since the last application was filed, and — from
 * the existing cooldown — since a rejection. Whichever is still running is reported.
 */
export function getReapplyEligibilityBlock(
  applications: unknown,
  now: Date = new Date(),
): EligibilityBlock | null {
  const cooldown = getReapplyBlock(applications, now);
  if (cooldown) {
    return {
      kind: "cooldown",
      title: `You can apply again after ${REAPPLY_COOLDOWN_DAYS} days`,
      message: reapplyBlockMessage(cooldown),
      applications: byNewest(
        getSubmittedApplications<GateApplication>(applications).filter(isRejectedApplication),
      ),
      availableFrom: cooldown.reapplyFrom,
      daysRemaining: cooldown.daysRemaining,
    };
  }

  const latest = getLatestApplication(applications);
  const appliedOn = getApplicationDate(latest);
  if (!latest || !appliedOn) return null; // Never applied: nothing to wait for.

  const availableFrom = new Date(appliedOn.getTime() + REAPPLY_AFTER_DAYS * DAY_IN_MS);
  if (now.getTime() >= availableFrom.getTime()) return null;

  const daysRemaining = daysUntil(availableFrom, now);
  return {
    kind: "reapply-wait",
    title: `You can reapply after ${REAPPLY_AFTER_DAYS} days`,
    message:
      `You submitted your last loan application on ${formatApplicationDate(appliedOn)}. `
      + `A new application can be submitted ${REAPPLY_AFTER_DAYS} days after the previous one, `
      + `so you can reapply from ${formatApplicationDate(availableFrom)}.`,
    applications: [latest],
    availableFrom,
    daysRemaining,
  };
}

/**
 * Why the customer may not take a reloan, or null when they may.
 *
 * Every application has to be finished — one still in process blocks it, whether they
 * have one application or several. A customer with no completed loan has nothing to
 * reloan against and is pointed at Reapply instead.
 */
export function getReloanEligibilityBlock(applications: unknown): EligibilityBlock | null {
  const submitted = getSubmittedApplications<GateApplication>(applications);
  const inProcess = byNewest(submitted.filter(isInProcessApplication));

  if (inProcess.length > 0) {
    const many = inProcess.length > 1;
    return {
      kind: "in-process",
      title: many
        ? "Your loan applications are still in process"
        : "Your loan application is still in process",
      message: many
        ? `You have ${inProcess.length} loan applications still being processed. A reloan can `
          + "be taken once all of them have been completed."
        : "Our team is still processing the loan application you have already submitted. "
          + "A reloan can be taken once it has been completed.",
      applications: inProcess,
    };
  }

  if (!submitted.some(isCompletedApplication)) {
    return {
      kind: "no-completed-loan",
      title: "A reloan needs a completed loan",
      message:
        "A reloan is available once you have completed a loan with us. Until then, please "
        + "use Reapply to submit a new loan application.",
      applications: byNewest(submitted).slice(0, 1),
    };
  }

  return null;
}

export function isInProcessApplication(application: GateApplication | null | undefined): boolean {
  if (!application) return false;
  const status = String(application.status ?? "").trim().toUpperCase();
  return !DECIDED_STATUSES.has(status);
}

// The undecided application holding the applicant up, newest first, or null if none.
export function getInProcessApplication(applications: unknown): GateApplication | null {
  const open = getSubmittedApplications<GateApplication>(applications).filter(isInProcessApplication);
  if (open.length === 0) return null;

  return open.reduce((latest, application) => {
    const a = new Date(String(application.createdAt ?? 0)).getTime() || 0;
    const b = new Date(String(latest.createdAt ?? 0)).getTime() || 0;
    return a > b ? application : latest;
  });
}

export type ApplicationBlock =
  | { kind: "in-process"; application: GateApplication; appliedOn: Date | null }
  | { kind: "cooldown"; cooldown: ReapplyBlock };

// In process wins over the cooldown: an open case is the more immediate reason, and an
// applicant with one is being worked on right now rather than waiting out a rejection.
export function getApplicationBlock(applications: unknown, now: Date = new Date()): ApplicationBlock | null {
  const inProcess = getInProcessApplication(applications);
  if (inProcess) {
    const applied = new Date(String(inProcess.createdAt ?? ""));
    return {
      kind: "in-process",
      application: inProcess,
      appliedOn: Number.isNaN(applied.getTime()) ? null : applied,
    };
  }

  const cooldown = getReapplyBlock(applications, now);
  return cooldown ? { kind: "cooldown", cooldown } : null;
}

export function applicationBlockMessage(block: ApplicationBlock): string {
  if (block.kind === "cooldown") return reapplyBlockMessage(block.cooldown);
  return "Your existing loan application is still in process. A new application can be "
    + "submitted once the current one has been completed.";
}

// Turns a raw backend status into something readable — "IN_PROCESS" -> "In Process".
export function formatApplicationStatus(status: string | null | undefined): string {
  const raw = String(status ?? "").trim();
  if (!raw) return IN_PROCESS_LABEL;

  const upper = raw.toUpperCase();
  if (!DECIDED_STATUSES.has(upper)) return IN_PROCESS_LABEL;

  return upper
    .split(/[_\s]+/)
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Raised when an application is attempted while a block is active.
export class ApplicationBlockedError extends Error {
  readonly block: ApplicationBlock;

  constructor(block: ApplicationBlock) {
    super(applicationBlockMessage(block));
    this.name = "ApplicationBlockedError";
    this.block = block;
  }
}

// Reads the applications for whoever the stored auth token belongs to. Fails open on a
// network or auth error, and deliberately avoids apiClient — see the same note on
// getReapplyBlockForCurrentUser: a read like this must never be able to log a user out.
export async function getApplicationBlockForCurrentUser(): Promise<ApplicationBlock | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) return null; // Anonymous: no account, so no application to be blocked by.

  try {
    const { config } = await import("./config");
    const response = await fetch(`${config.apiUrl.replace(/\/+$/, "")}/api/users/profile/complete`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { profile?: { loanApplications?: unknown } } | null;
    return getApplicationBlock(body?.profile?.loanApplications);
  } catch (error) {
    console.error("Could not check whether a new application is allowed", error);
    return null;
  }
}

// Throws if the current user may not apply. Call before anything is written.
export async function assertCanApply(): Promise<void> {
  const block = await getApplicationBlockForCurrentUser();
  if (block) throw new ApplicationBlockedError(block);
}
