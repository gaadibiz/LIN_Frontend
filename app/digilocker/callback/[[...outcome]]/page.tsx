"use client"

// Where the backend sends the browser once DigiLocker consent is finished.
//
// Three URLs land here, because the backend cannot build a redirect per request — it can
// only be configured with two fixed URLs, one for each outcome:
//
//   /digilocker/callback/success          <- configured as the backend's success redirect
//   /digilocker/callback/failed           <- configured as the backend's failure redirect
//   /digilocker/callback?status=success   <- the query form, still honoured
//
// Hence the optional catch-all segment: the outcome is read from the PATH first, and from
// the query string only when the path does not say. A fixed URL carries no requestId, so
// nothing here depends on one; the form tab confirms the result against the profile
// before it trusts it (see DigilockerModal).
//
// This page always runs on OUR origin, inside whatever window the consent happened in.
// Its whole job is to get the customer back to their application, and to make sure the
// application tab learns the outcome — in that order, because on a phone the customer is
// staring at THIS page and has no idea the other tab exists.
//
// What it does, in order:
//
//   1. Reads the outcome the backend put in the query string.
//   2. Announces it to the application tab over a BroadcastChannel and localStorage.
//      Those work even when `window.opener` has been severed, which on mobile it usually
//      has — see the note in lib/digilocker.ts. postMessage is still sent as well, for
//      the desktop popup where the opener is intact.
//   3. CLOSES ITSELF. On desktop that makes the popup disappear; on mobile it drops the
//      consent tab and hands the screen straight back to the application tab. This is the
//      only thing that can return a mobile customer — nothing in the other tab can pull
//      itself to the front.
//   4. If the browser refuses to close the window (it may, when the window was not opened
//      by script), it shows one big button instead. The click is a user gesture, which
//      browsers accept for closing; and if even that is refused, the button navigates
//      this tab back to the application page it started from.

import React from "react"
import { ShieldCheck, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { announceResult, readReturnUrl, trace, traceStart, traceStop } from "@/lib/digilocker"

const FAILURE_WORDS = ["fail", "error", "denied", "rejected", "declined", "cancel", "expired"]
const SUCCESS_WORDS = ["success", "verified", "complete", "approved", "done"]

type Outcome = "pending" | "success" | "failed"

/**
 * The outcome the backend's fixed redirect URL encodes, or null when this is the bare
 * callback path and the query string has to decide instead.
 */
const readOutcomeFromPath = (pathname: string): Exclude<Outcome, "pending"> | null => {
  const last = pathname.split("/").filter(Boolean).pop()?.toLowerCase() || ""
  if (last === "callback") return null // no segment — the query string decides
  if (FAILURE_WORDS.some((w) => last.includes(w))) return "failed"
  if (SUCCESS_WORDS.some((w) => last.includes(w))) return "success"
  return null
}

// How long to let the automatic close attempts run before showing the manual way back.
// Long enough for a refused close to be certain, short enough not to feel stuck.
const AUTO_CLOSE_GRACE_MS = 1200

export default function DigilockerCallbackPage() {
  const [outcome, setOutcome] = React.useState<Outcome>("pending")
  // True once the browser has clearly refused to close this window on its own.
  const [needsManualReturn, setNeedsManualReturn] = React.useState(false)
  const [isReturning, setIsReturning] = React.useState(false)
  const returnUrlRef = React.useRef("/apply-now")

  React.useEffect(() => {
    // A separate window, so it has its own console and its own clock. Anything printed
    // here belongs to the consent window, not to the tab holding the form.
    traceStart('CONSENT WINDOW — callback page loaded', window.location.href)

    const params = new URLSearchParams(window.location.search)
    trace('query parameters the backend sent', Object.fromEntries(params.entries()))

    const raw = (params.get("status") || params.get("result") || "").toLowerCase()

    // The path wins: it is the one thing the backend can be configured to vary, so when
    // it says something it is the most reliable signal there is. A `code` or a bare hit
    // with no explicit status is DigiLocker's own success shape.
    const failedByQuery =
      Boolean(params.get("error")) || FAILURE_WORDS.some((w) => raw.includes(w))
    const status: Exclude<Outcome, "pending"> =
      readOutcomeFromPath(window.location.pathname) ?? (failedByQuery ? "failed" : "success")
    const requestId =
      params.get("requestId") || params.get("request_id") || params.get("state") || ""

    trace(`outcome read as: ${status}`, {
      fromPath: readOutcomeFromPath(window.location.pathname) ?? '(path said nothing)',
      fromQuery: raw || '(query said nothing)',
      requestId: requestId || '(none)',
    })
    setOutcome(status)
    returnUrlRef.current = readReturnUrl()

    // Tell the application tab first — it must learn the result whether or not this
    // window manages to close, and whether or not the opener handle survived.
    announceResult(status, requestId)

    // The desktop path: the modal is the parent when framed, and the opener when the
    // consent ran in a popup. Same-origin, so the message is targeted, not "*".
    const host = window.parent !== window ? window.parent : window.opener
    if (host) {
      host.postMessage(
        { source: "digilocker-callback", status, requestId },
        window.location.origin,
      )
      trace('posted the result to the opener window')
    } else {
      trace('no opener handle (normal on a phone) — the broadcast is what will be heard')
    }

    // Framed inside the application itself: there is nothing to close, the modal takes
    // over from here.
    if (window.parent !== window) return

    // Now get out of the customer's way. Two attempts: one immediately, one a beat later
    // for browsers that ignore a close issued during load.
    const attemptClose = () => {
      try {
        window.close()
      } catch (err) {
        trace('window.close() threw', err)
      }
    }

    trace('closing this window so the customer lands back on the application')
    attemptClose()
    const retry = window.setTimeout(attemptClose, 400)
    const giveUp = window.setTimeout(() => {
      // Still here, so the browser will not close this window by itself.
      traceStop('the browser refused to close this window — showing the manual way back')
      setNeedsManualReturn(true)
    }, AUTO_CLOSE_GRACE_MS)

    return () => {
      window.clearTimeout(retry)
      window.clearTimeout(giveUp)
    }
  }, [])

  // The manual way back. Closing from a real click is allowed far more widely than
  // closing from a script during load, so that is tried first; navigating this tab back
  // to the application is the last resort.
  const handleReturn = () => {
    setIsReturning(true)
    try {
      window.close()
    } catch {
      // ignored — the navigation below is the fallback
    }
    window.setTimeout(() => {
      if (!window.closed) {
        trace('close refused again — navigating this window back to the application', returnUrlRef.current)
        window.location.replace(returnUrlRef.current)
      }
    }, 400)
  }

  if (outcome === "pending") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <p className="text-sm text-gray-600">Finishing up…</p>
      </div>
    )
  }

  const ok = outcome === "success"

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      {ok ? (
        <ShieldCheck className="w-12 h-12 text-green-600" />
      ) : (
        <XCircle className="w-12 h-12 text-red-600" />
      )}
      <h1 className="text-lg font-bold text-[#1c2b4f]">
        {ok ? "Aadhaar verified" : "Verification not completed"}
      </h1>

      {needsManualReturn ? (
        <>
          <p className="text-sm text-gray-600 max-w-sm">
            {ok
              ? "Your Aadhaar details have been saved. Tap below to go back to your loan application."
              : "Nothing was saved. Tap below to go back to your loan application and try again."}
          </p>
          <button
            type="button"
            onClick={handleReturn}
            disabled={isReturning}
            className="mt-1 inline-flex items-center justify-center gap-2 h-12 w-full max-w-xs rounded-xl bg-[#1c2b4f] px-6 text-base font-bold text-white transition-colors hover:bg-[#16223f] disabled:opacity-70"
          >
            {isReturning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            Back to my application
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Taking you back to your application…</span>
        </div>
      )}
    </div>
  )
}
