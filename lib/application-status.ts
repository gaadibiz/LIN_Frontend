// An application row only exists once the user pressed Apply Now at the end of the form —
// see the createApplication helper in hooks/useSignup.ts, which is called from the final
// submit of every flow and nowhere else, and is the only place that sends `submitted` to
// the backend at all. Dropping out earlier leaves a CRM lead behind, but no application.
//
// This filter is the second line of defence, for rows the frontend did not create in that
// way: applications that predate the rule, or anything the backend marks as unfinished.
// Only submitted applications unlock the dashboard, appear in loan history, or are
// findable under "Track Loan".

export interface ApplicationLike {
  id?: number | string;
  submitted?: boolean;
}

export function isSubmittedApplication(application: ApplicationLike | null | undefined): boolean {
  if (!application) return false;

  // Rows created before the flag existed have no value at all. Those keep counting as
  // submitted, so live users don't lose applications they really did apply for.
  return application.submitted !== false;
}

export function getSubmittedApplications<T extends ApplicationLike>(applications: unknown): T[] {
  if (!Array.isArray(applications)) return [];
  return (applications as T[]).filter(isSubmittedApplication);
}
