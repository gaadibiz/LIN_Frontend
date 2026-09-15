// DigiLocker Aadhaar verification.
//
// Flow: the user types their 12-digit Aadhaar number — nothing is checked while typing —
// and presses the DigiLocker submit button. That calls request-digilocker, which returns:
//
//   { requestId: "6aa7f3fc...", url: "https://api.digitallocker.gov.in/public/oauth2/1/authorize?..." }
//
// The url is DigiLocker's PKCE OAuth consent page, opened in a POPUP WINDOW, and only
// ever after the backend has answered with a url — nothing is opened speculatively.
//
// Why a popup and not an iframe
// -----------------------------
// DigiLocker forbids embedding. digilocker.meripehchaan.gov.in answers with
// `x-frame-options: SAMEORIGIN` and `content-security-policy: … frame-ancestors 'none'`,
// so any iframe of it renders "refused to connect" no matter what sandbox/allow
// attributes we set. The block is enforced by the browser on their instruction; there is
// nothing to configure on our side. A separate window is the only way their page runs.
//
// How the outcome gets back to us
// -------------------------------
// DigiLocker's `redirect_uri` points at the BACKEND's domain, not ours, so the frontend
// never sees the OAuth code. The backend is the only party that learns the result.
//
// There is NO status endpoint to poll — every candidate path (digilocker-status,
// digilocker/status, digilocker-result, verify-digilocker, …) answers 404, while routes
// that do exist answer 401. So the backend instead REDIRECTS the browser, at the end of
// the flow, to CALLBACK_PATH on this app with the outcome in the query string. That page
// runs inside the popup, so it reports back through `window.opener` rather than
// `window.parent`, and the signup form then runs the validate check.
//
// The Aadhaar number is validated (validate endpoint) only AFTER that success arrives,
// never before — see handleDigilockerComplete in Step2PersonalDetails.

import { apiClient } from './api';
import { config } from './config';

export type DigilockerStatus = 'success' | 'failed';

export interface DigilockerSession {
  url: string;
  requestId: string;
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

  const left = window.screenX + Math.max(0, (window.outerWidth - POPUP_W) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - POPUP_H) / 2);
  const features = `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},resizable=yes,scrollbars=yes`;

  const popup = window.open('', POPUP_NAME, features);
  if (!popup) {
    console.warn('[DigiLocker] popup blocked by the browser');
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
    console.warn('[DigiLocker] popup is gone before it could be pointed at', url);
    return false;
  }
  console.log('[DigiLocker] pointing popup at:', url);
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
 * Asks the backend to open a DigiLocker session for this Aadhaar number.
 *
 * Never throws — the caller shows a toast on null rather than breaking the form.
 */
export const fetchDigilockerSession = async (
  rawAadhaar: unknown,
): Promise<DigilockerSession | null> => {
  const cleanAadhaar = String(rawAadhaar ?? '').replace(/\D/g, '');
  if (cleanAadhaar.length !== 12) return null;

  try {
    // Debug log of the exact body POSTed to request-digilocker. The Aadhaar is shown in
    // full deliberately, so the number reaching the backend can be checked against the
    // one on screen — it only ever reaches this browser's own console.
    console.log('[DigiLocker] POST', `${config.apiUrl}/api/auth/aadhaar/request-digilocker`, 'body:', {
      aadhaarNumber: cleanAadhaar,
      redirectUrl: buildCallbackUrl(),
    });

    const res = await apiClient.requestDigilocker(cleanAadhaar, buildCallbackUrl());
    console.log('[DigiLocker] raw response', res);

    const url = readKey(res, URL_KEYS);
    const requestId = readKey(res, REQUEST_ID_KEYS);
    console.log('[DigiLocker] parsed url:', url);
    console.log('[DigiLocker] parsed requestId:', requestId);

    if (!url) {
      console.error('DigiLocker: no consent URL in response', res);
      return null;
    }
    if (!requestId) {
      // Recoverable: the OAuth `state` in the URL is the same value, so fall back to it
      // rather than losing the id the callback is correlated by.
      console.warn('DigiLocker: no requestId in response, falling back to state param');
    }

    const session = {
      url,
      requestId: requestId || readStateFromUrl(url) || '',
    };
    console.log('[DigiLocker] session ready, url going to popup:', session.url, session);
    return session;
  } catch (err) {
    console.error('DigiLocker initiation failed: ', err);
    return null;
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
// /api/users/profile/complete and treat the arrival of full Aadhaar details as the
// success signal, whichever way the popup itself ends up.

export interface AadhaarProfile {
  aadhaarNumber: string;
  // Optional: the backend may write the number before, or without, the name. The number
  // is what proves consent went through, so it alone decides success — the name is only
  // used to auto-fill when it is there.
  name?: string;
  dob?: string;
  gender?: string;
}

/**
 * Pulls Aadhaar details out of a complete-profile response.
 *
 * The Aadhaar number is the signal: the backend only writes it once DigiLocker has
 * returned the document, so its presence IS the completed consent.
 */
export const readAadhaarProfile = (res: unknown): AadhaarProfile | null => {
  const profile = asRecord(asRecord(res).profile);
  const verification = asRecord(profile.aadhaarVerification);

  const aadhaarNumber = asNonEmptyString(verification.aadhaarNumber);
  if (!aadhaarNumber) return null;

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

/** One profile read. Returns null when the Aadhaar is not on the profile yet. */
export const checkAadhaarOnProfile = async (): Promise<AadhaarProfile | null> => {
  try {
    const res = await apiClient.getCompleteProfile();
    const details = readAadhaarProfile(res);
    console.log('[DigiLocker] complete-profile check:', details ?? 'no aadhaar details yet', res);
    return details;
  } catch (err) {
    console.warn('[DigiLocker] complete-profile check failed', err);
    return null;
  }
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // DigiLocker sign-in + OTP takes a while

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
): Promise<AadhaarProfile | null> => {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    if (isCancelled()) {
      console.log('[DigiLocker] profile polling cancelled');
      return null;
    }

    attempt += 1;
    console.log(`[DigiLocker] profile poll #${attempt}`);
    onAttempt?.(attempt);
    const details = await checkAadhaarOnProfile();
    if (details) return details;

    if (isCancelled()) return null;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.warn('[DigiLocker] profile polling timed out — no aadhaar details after 5 minutes');
  return null;
};

const SUCCESS_WORDS = ['success', 'verified', 'completed', 'complete', 'approved'];
const FAILURE_WORDS = ['fail', 'error', 'denied', 'rejected', 'declined', 'cancel', 'expired'];

/**
 * Reads a completion message posted by the callback page (or by the backend directly).
 *
 * Returns null for anything that is not a decision, so unrelated postMessage traffic —
 * React DevTools, browser extensions, embedded widgets — cannot close the modal.
 */
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
