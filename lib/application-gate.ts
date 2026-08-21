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
  getReapplyBlock,
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
