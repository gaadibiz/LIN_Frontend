import { apiClient } from './api';
import { config } from './config';


let traceStartedAt = Date.now();

const elapsed = (): string => `+${((Date.now() - traceStartedAt) / 1000).toFixed(1)}s`;

/** Starts a fresh attempt: resets the clock so the timings below mean something. */
export const traceStart = (what: string, detail?: unknown): void => {
  traceStartedAt = Date.now();
  console.log(`%c[DigiLocker] ▶ ${what}`, 'color:#1c2b4f;font-weight:bold', detail ?? '');
};

/** A step that happened. */
export const trace = (step: string, detail?: unknown): void => {
  console.log(`[DigiLocker ${elapsed()}] ${step}`, detail ?? '');
};

/** Still waiting, and why — the noisy, repeating lines. */
export const traceWait = (why: string, detail?: unknown): void => {
  console.log(`[DigiLocker ${elapsed()}] … ${why}`, detail ?? '');
};

/** The attempt stopped here. This is the line to read. */
export const traceStop = (why: string, detail?: unknown): void => {
  console.warn(`[DigiLocker ${elapsed()}] ✗ STOPPED: ${why}`, detail ?? '');
};

/** It worked. */
export const traceDone = (what: string, detail?: unknown): void => {
  console.log(`%c[DigiLocker ${elapsed()}] ✓ ${what}`, 'color:#16a34a;font-weight:bold', detail ?? '');
};


export type DigilockerStatus = 'success' | 'failed';

export interface DigilockerSession {
  url: string;
  requestId: string;
  // The 12 digits this consent was raised for. Everything downstream checks the profile
  // record against it, so a record left over from a different number cannot pass.
  aadhaarNumber: string;
}

// Where the backend sends the browser once it knows the outcome. Kept here so the page,
// the request body and the message check all agree on one path.
export const CALLBACK_PATH = '/digilocker/callback';

export const buildCallbackUrl = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${CALLBACK_PATH}`;
};

// Popup sizing — tall and narrow, like the mobile-first layout DigiLocker renders.
const POPUP_W = 480;
const POPUP_H = 720;
export const POPUP_NAME = 'digilocker-consent';

/**
 * Opens the consent popup EMPTY, synchronously.
 *
 * This must be called straight out of the click handler, before any `await`. Browsers
 * only allow window.open while a user gesture is being handled, and awaiting the
 * request-digilocker call first spends that gesture — the popup would then be blocked.
 * So we take the window while we are allowed to, and point it at the URL afterwards.
 *
 * Returns null when the popup blocker refused anyway; the caller falls back to a link.
 */
export const openConsentPopup = (): Window | null => {
  if (typeof window === 'undefined') return null;

  // Where to send the customer back to if the consent tab cannot close itself. Recorded
  // here, while we are still standing on the application page and know what it was.
  rememberReturnUrl();
  // Any result left over from an earlier attempt must not settle this one.
  resetResultChannel();

  const left = window.screenX + Math.max(0, (window.outerWidth - POPUP_W) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - POPUP_H) / 2);
  // Size features are meaningless on a phone — it opens a full tab whatever we ask for —
  // and passing them makes some mobile browsers treat the call as a popup to block.
  const features = isProbablyMobile()
    ? ''
    : `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},resizable=yes,scrollbars=yes`;

  const popup = window.open('', POPUP_NAME, features);
  if (!popup) {
    traceStop('the browser blocked the consent window (pop-up blocker)');
    return null;
  }

  // Something to look at during the round trip, so the window is not blank-white.
  popup.document.write(
    `<!doctype html><html><head><title>Opening DigiLocker…</title></head>
     <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#1c2b4f">
       <p>Opening DigiLocker…</p>
     </body></html>`,
  );
  popup.document.close();
  
  return popup;
};

/** Sends an already-open popup to the consent URL. */
export const steerPopupTo = (popup: Window | null, url: string): boolean => {
  if (!popup || popup.closed) {
    traceStop('the consent window was gone before it could be pointed at DigiLocker', url);
    return false;
  }
  trace('step 4/7 — sending the consent window to DigiLocker', url);
  popup.location.href = url;
  popup.focus();
  return true;
};

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

// Read a key from the response. `data` is checked FIRST because that is where the
// backend puts them (data.url / data.requestId); the root is only a fallback, and
// checking it second keeps an unrelated root-level `link` or `id` from winning.
const readKey = (res: unknown, keys: string[]): string | null => {
  const root = asRecord(res);
  for (const source of [asRecord(root.data), root]) {
    for (const key of keys) {
      const found = asNonEmptyString(source[key]);
      if (found) return found;
    }
  }
  return null;
};

const URL_KEYS = ['url', 'link', 'redirectUrl', 'redirect_url', 'authUrl', 'auth_url'];
const REQUEST_ID_KEYS = ['requestId', 'request_id', 'id', 'state', 'txnId', 'txn_id'];

/**
 * The reason a session could not be opened, in the backend's own words where it gave one.
 *
 * The backend rejects with a real explanation — "This Aadhaar number is already
 * registered with another account.", for example — either as a non-2xx body (which
 * apiClient re-throws as an Error carrying that message) or as a 200 whose body says
 * `status: "error"`. Both are read here so the caller can show the actual reason instead
 * of a generic "could not open DigiLocker" that tells the user nothing about what to fix.
 */
export interface DigilockerSessionResult {
  session: DigilockerSession | null;
  error?: string;
}

// A 200 body can still be a refusal: `{ status: "error", message: "..." }`.
const readErrorMessage = (res: unknown): string | null => {
  const root = asRecord(res);
  const data = asRecord(root.data);
  const status = asNonEmptyString(root.status) || asNonEmptyString(data.status);
  const success = root.success ?? data.success;
  const failed = status?.toLowerCase() === 'error' || success === false;
  if (!failed) return null;
  return asNonEmptyString(root.message) || asNonEmptyString(data.message) || null;
};

/**
 * Asks the backend to open a DigiLocker session for this Aadhaar number.
 *
 * Never throws — the caller shows the returned `error` (or its own fallback) rather than
 * breaking the form.
 */
export const fetchDigilockerSession = async (
  rawAadhaar: unknown,
): Promise<DigilockerSessionResult> => {
  const cleanAadhaar = String(rawAadhaar ?? '').replace(/\D/g, '');
  if (cleanAadhaar.length !== 12) {
    return { session: null, error: 'Please enter a valid 12-digit Aadhaar number.' };
  }

  try {
    // Debug log of the exact body POSTed to request-digilocker. The Aadhaar is shown in
    // full deliberately, so the number reaching the backend can be checked against the
    // one on screen — it only ever reaches this browser's own console.
    trace('step 3/7 — asking the backend for a consent url', {
      endpoint: `${config.apiUrl}/api/auth/aadhaar/request-digilocker`,
      aadhaarNumber: cleanAadhaar,
      redirectUrl: buildCallbackUrl(),
    });

    const res = await apiClient.requestDigilocker(cleanAadhaar, buildCallbackUrl());
    trace('backend answered', res);

    // A 200 that says `status: "error"` is a refusal with a reason — surface it as-is.
    const refusal = readErrorMessage(res);
    if (refusal) {
      traceStop(`the backend refused to open a session — "${refusal}"`);
      return { session: null, error: refusal };
    }

    const url = readKey(res, URL_KEYS);
    const requestId = readKey(res, REQUEST_ID_KEYS);
    trace('parsed from the answer', { url, requestId });

    if (!url) {
      traceStop('the backend answered without a consent url', res);
      // No url and no stated reason: nothing useful to quote, so let the caller fall back.
      return { session: null, error: asNonEmptyString(asRecord(res).message) || undefined };
    }
    if (!requestId) {
      // Recoverable: the OAuth `state` in the URL is the same value, so fall back to it
      // rather than losing the id the callback is correlated by.
      traceWait('no requestId in the answer — falling back to the OAuth state parameter');
    }

    const session = {
      url,
      requestId: requestId || readStateFromUrl(url) || '',
      aadhaarNumber: cleanAadhaar,
    };
    trace('session ready', session);
    return { session };
  } catch (err) {
    traceStop('the request-digilocker call itself failed', err);
    // apiClient throws an Error whose message IS the backend's `message` field for any
    // non-2xx reply, so this is the rejection reason — not a generic network blip.
    // Its own fallbacks ("HTTP error! status: 500") say nothing to a customer, so those
    // are dropped and the caller's generic wording is used instead.
    const message = err instanceof Error ? asNonEmptyString(err.message) : null;
    const showable = message && !/^HTTP error! status:/i.test(message) ? message : undefined;
    return { session: null, error: showable };
  }
};

// The OAuth `state` the backend put in the consent URL — the same value as requestId.
export const readStateFromUrl = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get('state');
  } catch {
    return null;
  }
};

// Origin DigiLocker redirects to when consent finishes. Belongs to the backend, so it is
// the one foreign origin a completion message is accepted from — useful if the backend
// ever announces the result itself instead of redirecting to our callback page.
export const readRedirectOrigin = (url: string): string | null => {
  try {
    const redirectUri = new URL(url).searchParams.get('redirect_uri');
    return redirectUri ? new URL(redirectUri).origin : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Completion by polling the profile
// ---------------------------------------------------------------------------
// The callback redirect is not guaranteed — the backend may finish the OAuth exchange
// and never send the popup back to CALLBACK_PATH. What it always does is write the
// Aadhaar onto the user's profile. So once the popup is open we poll
// /api/users/profile/complete and wait for aadhaarVerification.verified to turn true,
// whichever way the popup itself ends up. The row appears immediately with
// verified:false, so the flag — not the row, and not the number — is the signal.

export interface AadhaarProfile {
  // Only ever built from a record the backend has marked verified, or one whose
  // e-Aadhaar it has actually fetched — see readAadhaarProfile.
  aadhaarNumber: string;
  // Optional: the backend may write the number before, or without, the name. The number
  // is what proves consent went through, so it alone decides success — the name is only
  // used to auto-fill when it is there.
  name?: string;
  dob?: string;
  gender?: string;
}

/**
 * Finds the aadhaarVerification record in a complete-profile response, wherever it sits.
 *
 * The endpoint has been seen answering `{ profile: { … } }` and `{ data: { profile: … } }`
 * depending on the route, and a wrapper that does not match means every field below reads
 * as missing — which looks exactly like "consent has not finished" and fails a
 * verification that actually worked. Rather than hard-code one shape, the plausible
 * wrappers are tried in order and the first one holding an aadhaarVerification wins.
 */
const locateVerification = (
  res: unknown,
): { profile: Record<string, unknown>; verification: Record<string, unknown> } => {
  const root = asRecord(res);
  const data = asRecord(root.data);

  const candidates = [
    asRecord(root.profile),
    asRecord(data.profile),
    data,
    root,
    asRecord(root.user),
    asRecord(data.user),
  ];

  for (const profile of candidates) {
    const verification = asRecord(profile.aadhaarVerification);
    if (Object.keys(verification).length > 0) return { profile, verification };
  }

  // Nothing found: hand back the conventional shape so the caller reads empty and bails.
  return { profile: asRecord(root.profile), verification: {} };
};

/**
 * Evidence that DigiLocker actually handed the e-Aadhaar over for this person.
 *
 * Needed because the backend does not currently flip `verified` — it fetches the
 * e-Aadhaar, writes the whole record (name, dob, gender, address, photo, and the
 * `eAadhaarFetchedAt` timestamp) and leaves the flag sitting at false. Waiting on a flag
 * that never turns true fails every verification, even the ones that worked.
 *
 * So the fetch itself is accepted as proof. This is NOT the old mistake of trusting the
 * row: the row is created the moment request-digilocker is called, and at that point it
 * holds the aadhaarNumber and nothing else. The fields read here cannot exist until
 * DigiLocker has actually answered, so their presence means consent went through.
 *
 * `eAadhaarFetchedAt` is the field that says so outright; a name together with a date of
 * birth is the fallback for a backend that stores the record without that timestamp.
 * Only the verification record is read — never the profile, whose name and dob the
 * customer may have typed in themselves.
 */
const readFetchedAt = (verification: Record<string, unknown>): string | null =>
  asNonEmptyString(verification.eAadhaarFetchedAt) ||
  asNonEmptyString(verification.eaadhaarFetchedAt) ||
  asNonEmptyString(verification.e_aadhaar_fetched_at) ||
  asNonEmptyString(verification.fetchedAt);

const readFetchEvidence = (verification: Record<string, unknown>): string | null => {
  const fetchedAt = readFetchedAt(verification);
  if (fetchedAt) return `eAadhaarFetchedAt=${fetchedAt}`;

  const name =
    asNonEmptyString(verification.name) ||
    asNonEmptyString(verification.aadhaarName) ||
    asNonEmptyString(verification.nameAsPerAadhaar);
  const dob = asNonEmptyString(verification.dob);
  if (name && dob) return 'name+dob returned by DigiLocker';

  return null;
};

/**
 * Pulls Aadhaar details out of a complete-profile response.
 *
 * Success is `verified === true`, or — while the backend leaves that flag alone — proof
 * that the e-Aadhaar was actually fetched. See readFetchEvidence for why that is safe.
 *
 * The aadhaarNumber on its own is NOT a success signal: the backend creates the
 * aadhaarVerification row the moment request-digilocker is called, with the number
 * already filled in and `verified: false`. Treating the number as proof of consent
 * matched on the very first poll — closing the popup before the customer had signed in,
 * and validating an Aadhaar that DigiLocker had never confirmed.
 */
/**
 * Has the record moved on since the attempt began?
 *
 * Any of these means the backend wrote something new for this attempt: a different
 * number than the one that was there, the verified flag flipping on, or a fresh
 * e-Aadhaar fetch (a timestamp that differs from the one held at the start, including
 * one appearing where there was none).
 */
const hasMovedSince = (
  baseline: AadhaarSnapshot,
  current: { aadhaarNumber: string; verification: Record<string, unknown> },
): boolean => {
  if (baseline.aadhaarNumber !== current.aadhaarNumber) return true;

  const isVerified =
    current.verification.verified === true ||
    String(current.verification.verified).toLowerCase() === 'true';
  if (isVerified && !baseline.verified) return true;

  const fetchedAt = readFetchedAt(current.verification);
  return Boolean(fetchedAt) && fetchedAt !== baseline.fetchedAt;
};

export const readAadhaarProfile = (
  res: unknown,
  { expectedAadhaar, baseline, requireChange = false }: AadhaarCheckOptions = {},
): AadhaarProfile | null => {
  const { profile, verification } = locateVerification(res);

  const aadhaarNumber = asNonEmptyString(verification.aadhaarNumber);
  if (!aadhaarNumber) return null;

  // A record for some other number proves nothing about the one being verified now. This
  // is the case that matters most: change the number in the form, press verify, and the
  // previous number's record would otherwise pass this attempt instantly.
  const wanted = String(expectedAadhaar ?? '').replace(/\D/g, '');
  if (wanted && wanted !== aadhaarNumber.replace(/\D/g, '')) {
    traceWait('the profile holds a DIFFERENT aadhaar number — ignoring that record', {
      onProfile: aadhaarNumber,
      beingVerified: wanted,
    });
    return null;
  }

  // Accepts the boolean and the string form, since JSON from different backends differs.
  const isVerified =
    verification.verified === true || String(verification.verified).toLowerCase() === 'true';

  if (!isVerified) {
    const evidence = readFetchEvidence(verification);
    if (!evidence) {
      traceWait('the aadhaar row exists but nothing has been fetched yet — consent not finished');
      return null;
    }
    // Worth shouting about: the backend has a record it never marked verified. The day it
    // starts setting the flag this branch goes quiet on its own and nothing else changes.
    trace(
      'the backend never set verified=true, but the e-Aadhaar WAS fetched — accepting that as proof',
      evidence,
    );
  }

  // Nothing above can tell a record written a minute ago from one written last week. When
  // the caller has no signal that the customer has finished, the record must have actually
  // moved since this attempt began — otherwise the consent window is closed and the form
  // says "verified" before the customer has even seen DigiLocker.
  if (requireChange && baseline && !hasMovedSince(baseline, { aadhaarNumber, verification })) {
    traceWait('the record has not moved since this attempt started — this is the OLD one, still waiting', {
      baseline,
    });
    return null;
  }

  // DigiLocker's own name, if the backend stored it on the verification record;
  // otherwise the profile name it wrote from the same source.
  const name =
    asNonEmptyString(verification.name) ||
    asNonEmptyString(verification.aadhaarName) ||
    asNonEmptyString(verification.nameAsPerAadhaar) ||
    asNonEmptyString(profile.name) ||
    undefined;

  return {
    aadhaarNumber,
    name,
    dob: asNonEmptyString(verification.dob) || asNonEmptyString(profile.dob) || undefined,
    gender: asNonEmptyString(verification.gender) || asNonEmptyString(profile.gender) || undefined,
  };
};

/**
 * DigiLocker's date of birth, as the form's YYYY-MM-DD.
 *
 * It arrives as DD/MM/YYYY: "05/07/1998" is the 5th of July. Handing that straight to
 * `new Date` reads it as the American MM/DD/YYYY and silently stores the 7th of May,
 * while "25/12/1998" is not a valid American date at all — `new Date` returns Invalid
 * Date and the field is left blank with nothing to show for it. Either way the date of
 * birth on the application is wrong, and it is the date the age eligibility check runs on.
 *
 * Returns null when the value cannot be read as a real calendar date, so the caller
 * leaves the field alone rather than writing something made up.
 */
export const toIsoDate = (raw: unknown): string | null => {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  // Already YYYY-MM-DD, possibly with a time after it.
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/);
  if (iso) return isRealDate(+iso[1], +iso[2], +iso[3]) ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;

  // DD/MM/YYYY or DD-MM-YYYY, which is what DigiLocker sends.
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [day, month, year] = [+dmy[1], +dmy[2], +dmy[3]];
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
};

// Rejects the 31st of February and friends, which a Date built from parts rolls over
// into the next month instead of refusing.
const isRealDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * What the Aadhaar record looked like BEFORE an attempt started.
 *
 * Taken the moment the consent window opens, and compared against every later read. The
 * customer's profile usually already carries a record from an earlier attempt — the
 * backend keeps it, flag and all — and without a baseline that old record satisfies the
 * success check on the very first poll. The window then closes on its own and the form
 * announces "verified" before the customer has typed anything into DigiLocker.
 *
 * Comparing against the baseline, rather than against a clock, is deliberate: the
 * timestamp is written by the backend on its own clock, and a few minutes of skew either
 * way would otherwise reject every genuine verification.
 */
export interface AadhaarSnapshot {
  aadhaarNumber: string | null;
  fetchedAt: string | null;
  verified: boolean;
}

export const readAadhaarSnapshot = (res: unknown): AadhaarSnapshot => {
  const { verification } = locateVerification(res);
  return {
    aadhaarNumber: asNonEmptyString(verification.aadhaarNumber),
    fetchedAt: readFetchedAt(verification),
    verified:
      verification.verified === true ||
      String(verification.verified).toLowerCase() === 'true',
  };
};

/** Reads the baseline. Never throws — a failed read just means no baseline to compare. */
export const captureAadhaarBaseline = async (): Promise<AadhaarSnapshot | null> => {
  try {
    const snapshot = readAadhaarSnapshot(await apiClient.getCompleteProfile());
    trace('step 5/7 — baseline taken (what the profile held BEFORE this attempt)', snapshot);
    return snapshot;
  } catch (err) {
    traceWait('could not read the baseline — an unchanged record will not be rejected', err);
    return null;
  }
};

export interface AadhaarCheckOptions {
  /** The number this attempt is verifying. A record for any other number is ignored. */
  expectedAadhaar?: string;
  /** What the record looked like before the attempt; used to require a real change. */
  baseline?: AadhaarSnapshot | null;
  /**
   * Whether the record must have CHANGED since the baseline.
   *
   * True for the checks that run on their own — the background poll and the focus check —
   * because at that point nothing says the customer has finished, and an unchanged record
   * is just the old one. False once something does say so: the callback announcing this
   * attempt's requestId, or the customer pressing the button themselves.
   */
  requireChange?: boolean;
}

/** One profile read. Returns null when the Aadhaar is not on the profile yet. */
export const checkAadhaarOnProfile = async (
  options: AadhaarCheckOptions = {},
): Promise<AadhaarProfile | null> => {
  try {
    const res = await apiClient.getCompleteProfile();
    const details = readAadhaarProfile(res, options);
    if (details) trace('profile check: usable aadhaar details found', details);
    return details;
  } catch (err) {
    traceWait('the complete-profile call failed — will try again', err);
    return null;
  }
};

const POLL_TIMEOUT_MS = 5 * 60 * 1000; // DigiLocker sign-in + OTP takes a while

// Polling is a fallback, not the intended mechanism — the backend redirecting the popup
// to CALLBACK_PATH would remove it entirely. Until it does, the interval widens the
// longer the customer takes, so a slow sign-in does not mean a hundred profile reads.
// The first minute is polled briskly because that is when a quick customer finishes.
const pollIntervalFor = (elapsedMs: number): number => {
  if (elapsedMs < 60_000) return 4000;
  if (elapsedMs < 150_000) return 8000;
  return 15_000;
};

// While the customer is inside the consent window this tab is hidden, so it polls more
// slowly — but it must NOT stop. On a phone this backgrounded tab is the only thing
// holding a handle to the consent tab, so it is the only thing that can close it and give
// the customer their screen back. It can only do that once it knows consent succeeded,
// and it can only know that by having kept looking. (Mobile browsers throttle background
// timers, so the real gap is often longer than this — that is fine, it still lands.)
const HIDDEN_POLL_INTERVAL_MS = 10_000;

const isHidden = (): boolean =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Polls the complete-profile endpoint until the Aadhaar details land.
 *
 * The first check runs immediately — a returning user may already be verified, and there
 * is no reason to make them watch a spinner for the first interval to learn that.
 *
 * `isCancelled` is checked before every attempt so closing the modal stops the polling
 * immediately rather than leaving requests running against a form that is gone.
 * Resolves null on timeout or cancellation; the caller treats a timeout as a failure.
 */
export const pollForAadhaarDetails = async (
  isCancelled: () => boolean,
  onAttempt?: (attempt: number) => void,
  options: AadhaarCheckOptions = {},
): Promise<AadhaarProfile | null> => {
  const startedAt = Date.now();
  const deadline = startedAt + POLL_TIMEOUT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    if (isCancelled()) {
      trace('profile polling cancelled');
      return null;
    }

    attempt += 1;
    const elapsed = Date.now() - startedAt;
    const nextIn = isHidden() ? HIDDEN_POLL_INTERVAL_MS : pollIntervalFor(elapsed);
    traceWait(`profile poll #${attempt} (next in ${nextIn / 1000}s)`);
    onAttempt?.(attempt);
    // Runs with nothing to say the customer has finished, so it demands a real change.
    const details = await checkAadhaarOnProfile({ ...options, requireChange: true });
    if (details) return details;

    if (isCancelled()) return null;
    await new Promise((resolve) => setTimeout(resolve, nextIn));
  }

  traceStop('profile polling timed out — nothing arrived in 5 minutes');
  return null;
};

/**
 * Confirms an announced success against the profile before it is believed.
 *
 * The backend cannot build a redirect per request — it is configured with two FIXED urls,
 * one for success and one for failure — so the announcement carries no requestId and
 * nothing ties it to this attempt. Anything that reaches the success url announces
 * success: a stale tab, a reload, a link opened twice.
 *
 * So the announcement is treated as a hint that it is worth looking, not as the result.
 * `aadhaarVerification.verified` on the profile is the result, and it is the backend's own
 * record of what DigiLocker actually returned.
 *
 * Polled rather than read once because the redirect can outrun the write: the browser may
 * arrive here in the same moment the backend is still saving. Resolves null when the flag
 * has not turned true within the window, which the caller treats as a failure.
 */
export const CONFIRM_TIMEOUT_MS = 30_000;
const CONFIRM_INTERVAL_MS = 2000;

export const confirmAadhaarAfterSuccess = async (
  isCancelled: () => boolean = () => false,
  timeoutMs: number = CONFIRM_TIMEOUT_MS,
  options: AadhaarCheckOptions = {},
): Promise<AadhaarProfile | null> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (isCancelled()) return null;

    const details = await checkAadhaarOnProfile(options);
    if (details) return details;

    if (isCancelled()) return null;
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_INTERVAL_MS));
  }

  traceStop('success was announced but the profile never confirmed it within the window');
  return null;
};

// ---------------------------------------------------------------------------
// Why it failed
// ---------------------------------------------------------------------------
// The backend puts a reason in the failure redirect — Signzy's own words, or whatever
// went wrong reaching it: a 502 while DigiLocker is down, a 404 for a request it no
// longer has, a cancelled consent. All of it used to be thrown away, and every failure
// showed the same "not completed, please try again", which tells the customer nothing
// about whether to retry now, retry later, or stop.
//
// So the reason is carried through to the toast. Two things happen to it on the way.
//
// It is CLEANED, because it arrives in a query string and a query string can be written
// by anyone who can get a link in front of the customer. Sonner renders text, so this is
// not about markup — it is about not repeating a stranger's sentence to someone filling
// in a loan application. Length is capped, brackets and control characters go, and
// anything carrying a url or a phone number is dropped entirely rather than shown.
//
// It is DESCRIBED, because "ECONNREFUSED" and "502 Bad Gateway" mean nothing to a
// customer. The technical shapes map to a sentence that says what to actually do; the
// raw text is still written to the trace, so the real reason is one console line away.

const REASON_KEYS = [
  'message',
  'error_description',
  'errorDescription',
  'reason',
  'errorMessage',
  'error_message',
  'description',
  'statusMessage',
  'status_message',
  'msg',
  'error',
];

/** Strips a query-string reason down to something safe to repeat, or drops it. */
export const cleanFailureReason = (raw: unknown): string | null => {
  const text = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;
  // A bare code is a code, not a sentence — describeFailure turns it into one.
  if (text.length > 300) return null;
  // Anything trying to send the customer somewhere, or get them to call someone, is not
  // a failure reason worth repeating.
  if (/https?:\/\/|www\.|\b\d{10}\b|@/i.test(text)) return null;
  return text;
};

/** The reason the backend gave, if it gave one, from wherever it put it. */
export const readFailureReason = (params: URLSearchParams): string | null => {
  for (const key of REASON_KEYS) {
    const value = cleanFailureReason(params.get(key));
    // `error=true` and `error=1` are flags, not reasons.
    if (value && !/^(true|1|0|false|error|failed|failure)$/i.test(value)) return value;
  }
  return null;
};

const UNREACHABLE = /\b(502|503|504|bad gateway|gateway timeout|service unavailable|upstream|econnrefused|econnreset|etimedout|enotfound|network|socket hang up)\b/i;
const NOT_FOUND = /\b(404|not found|no such|unknown request|invalid request id)\b/i;
const CANCELLED = /\b(cancel|cancelled|canceled|denied|declined|rejected|refused|consent not given)\b/i;
const EXPIRED = /\b(expire|expired|timeout|timed out|session ended)\b/i;
const AUTH = /\b(401|403|unauthorized|forbidden|invalid token|authentication)\b/i;

// What a failed callback says when the backend gave no reason, and when the reason it
// gave is a network or gateway error. Both are the same thing from the customer's side:
// DigiLocker could not be reached, and the answer is to come back later rather than to
// keep pressing the button.
export const GENERIC_FAILURE = 'DigiLocker upstream is down. Please try again later.';

/**
 * Turns a raw failure reason into a sentence for the customer.
 *
 * Falls back to the generic line when there is nothing useful to say — never to a raw
 * error code, which only makes the customer think the form is broken.
 */
export const describeFailure = (raw?: string | null): string => {
  const reason = cleanFailureReason(raw);
  if (!reason) return GENERIC_FAILURE;

  if (UNREACHABLE.test(reason)) return GENERIC_FAILURE;
  if (NOT_FOUND.test(reason)) {
    return 'This DigiLocker request is no longer valid. Please start the verification again.';
  }
  if (EXPIRED.test(reason)) {
    return 'The DigiLocker session expired before it finished. Please try again.';
  }
  if (CANCELLED.test(reason)) {
    return 'DigiLocker consent was not given. Please try again and allow access to your Aadhaar.';
  }
  if (AUTH.test(reason)) {
    return 'DigiLocker refused the request. Please try again, or contact support if it keeps happening.';
  }

  // A bare status code or error constant is not a sentence — say nothing rather than that.
  if (/^[A-Z0-9_\- ]{1,24}$/.test(reason) || /^\d{3}$/.test(reason)) return GENERIC_FAILURE;

  // The backend wrote a real sentence, so use its words.
  return /[.!?]$/.test(reason) ? reason : `${reason}.`;
};

const SUCCESS_WORDS = ['success', 'verified', 'completed', 'complete', 'approved'];
const FAILURE_WORDS = ['fail', 'error', 'denied', 'rejected', 'declined', 'cancel', 'expired'];

/**
 * Reads a completion message posted by the callback page (or by the backend directly).
 *
 * Returns null for anything that is not a decision, so unrelated postMessage traffic —
 * React DevTools, browser extensions, embedded widgets — cannot close the modal.
 */
/** The failure reason on a postMessage payload, if it carried one. */
export const readCompletionReason = (data: unknown): string =>
  cleanFailureReason(asRecord(data).reason) ?? '';

export const readCompletionMessage = (data: unknown): DigilockerStatus | null => {
  const payload = asRecord(data);
  if (Object.keys(payload).length === 0) return null;

  if (payload.error) return 'failed';

  const raw = [payload.status, payload.result, payload.type]
    .map((v) => asNonEmptyString(v) || '')
    .join(' ')
    .toLowerCase();

  if (FAILURE_WORDS.some((w) => raw.includes(w))) return 'failed';
  if (SUCCESS_WORDS.some((w) => raw.includes(w))) return 'success';
  if (payload.code) return 'success';

  return null;
};


export const RESULT_CHANNEL = 'digilocker-result';
export const RESULT_STORAGE_KEY = 'digilocker:result';
export const RETURN_URL_KEY = 'digilocker:returnTo';

// A result older than this is from an abandoned attempt, not this one.
const RESULT_MAX_AGE_MS = 10 * 60 * 1000;

export interface DigilockerResultBroadcast {
  source: 'digilocker-callback';
  status: DigilockerStatus;
  requestId: string;
  /** The backend's own reason for a failure, already cleaned. Empty on success. */
  reason: string;
  at: number;
}

/** Coarse pointer or a mobile UA — used only to word the UI, never to gate the flow. */
export const isProbablyMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/android|iphone|ipad|ipod|mobile|silk|kindle|blackberry|opera mini|iemobile/i.test(ua)) {
    return true;
  }
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
};

/**
 * Notes the page the customer left, so the callback can send them back to it if closing
 * the consent tab is refused. Called as the consent window is opened, while we are still
 * on the application page.
 */
export const rememberReturnUrl = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RETURN_URL_KEY, window.location.pathname + window.location.search);
  } catch {
    // Storage disabled (private mode, blocked cookies) — readReturnUrl's default covers it.
  }
};

/** Only ever a path on this site — never an absolute URL that landed in storage. */
export const readReturnUrl = (): string => {
  if (typeof window === 'undefined') return '/apply-now';
  try {
    const saved = localStorage.getItem(RETURN_URL_KEY);
    if (saved && saved.startsWith('/') && !saved.startsWith('//')) return saved;
  } catch {
    // ignored — fall through to the default below
  }
  return '/apply-now';
};

const clearStoredResult = (): void => {
  try {
    localStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // ignored
  }
};

/** Dropped when a new session starts, so a stale result cannot settle the next attempt. */
export const resetResultChannel = (): void => clearStoredResult();

const parseResult = (raw: string | null | undefined): DigilockerResultBroadcast | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DigilockerResultBroadcast>;
    if (parsed?.source !== 'digilocker-callback') return null;
    if (parsed.status !== 'success' && parsed.status !== 'failed') return null;
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > RESULT_MAX_AGE_MS) return null;
    return {
      source: 'digilocker-callback',
      status: parsed.status,
      requestId: typeof parsed.requestId === 'string' ? parsed.requestId : '',
      reason: cleanFailureReason(parsed.reason) ?? '',
      at: parsed.at,
    };
  } catch {
    return null;
  }
};

/**
 * Announces the outcome to the application tab. Called from the callback page, which
 * cannot rely on `window.opener` being there — see the note above.
 */
export const announceResult = (
  status: DigilockerStatus,
  requestId = '',
  reason = '',
): void => {
  if (typeof window === 'undefined') return;
  const payload: DigilockerResultBroadcast = {
    source: 'digilocker-callback',
    status,
    requestId,
    reason: cleanFailureReason(reason) ?? '',
    at: Date.now(),
  };

  try {
    const channel = new BroadcastChannel(RESULT_CHANNEL);
    channel.postMessage(payload);
    // Left open briefly: closing in the same tick can drop the message in some browsers.
    window.setTimeout(() => channel.close(), 1000);
  } catch {
    // No BroadcastChannel (older iOS Safari) — the storage write below is the fallback.
  }

  try {
    // Written twice so a listener that is already holding this exact value still sees a
    // change event; the key is removed first, which is itself a no-op for the reader.
    localStorage.removeItem(RESULT_STORAGE_KEY);
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignored
  }

  trace('result announced to the application tab', payload);
};

/**
 * Listens for a result announced by the callback page in the other tab.
 *
 * Fires at most once, then stops listening. Returns the unsubscribe.
 */
export const listenForResult = (onResult: (result: DigilockerResultBroadcast) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let done = false;
  let channel: BroadcastChannel | null = null;

  const deliver = (result: DigilockerResultBroadcast | null) => {
    if (done || !result) return;
    done = true;
    clearStoredResult();
    trace('result picked up from the consent window', result);
    onResult(result);
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== RESULT_STORAGE_KEY) return;
    deliver(parseResult(event.newValue));
  };

  window.addEventListener('storage', onStorage);

  try {
    channel = new BroadcastChannel(RESULT_CHANNEL);
    channel.onmessage = (event) => deliver(parseResult(JSON.stringify(event.data)));
  } catch {
    channel = null;
  }

  // A result written while this tab was asleep raises no event, so read once on start.
  try {
    deliver(parseResult(localStorage.getItem(RESULT_STORAGE_KEY)));
  } catch {
    // ignored
  }

  return () => {
    done = true;
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
};
