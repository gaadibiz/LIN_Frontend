"use client"

// Waiting panel for the DigiLocker hand-off.
//
// It does NOT embed DigiLocker — that page sets `frame-ancestors 'none'` and
// `x-frame-options: SAMEORIGIN`, so an iframe of it only ever shows "refused to connect"
// (see the note at the top of lib/digilocker.ts). The consent runs in a popup window
// opened by the form; this panel just holds the form still while that happens, and
// listens for the outcome the callback page reports — through window.opener on a desktop
// popup, and through a broadcast on a phone, where the opener handle does not survive.

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, ExternalLink } from "lucide-react"
import {
  CONFIRM_TIMEOUT_MS,
  captureAadhaarBaseline,
  checkAadhaarOnProfile,
  confirmAadhaarAfterSuccess,
  isProbablyMobile,
  listenForResult,
  readCompletionReason,
  trace,
  traceDone,
  traceStop,
  traceWait,
  pollForAadhaarDetails,
  readCompletionMessage,
  readRedirectOrigin,
  type AadhaarCheckOptions,
  type AadhaarProfile,
  type AadhaarSnapshot,
  type DigilockerSession,
  type DigilockerStatus,
} from "@/lib/digilocker"

// How long to keep checking the profile after each kind of hint. An announced success
// gets the full window (CONFIRM_TIMEOUT_MS) because the backend is known to be mid-write.
// The other two are the customer waiting in front of the form, so they are shorter — but
// never a single read, which is what used to lose the race against the backend's write.
const WINDOW_CLOSED_CONFIRM_MS = 20_000
const MANUAL_CONFIRM_MS = 15_000

interface DigilockerModalProps {
  // Null until the backend has answered with a url — nothing is shown speculatively.
  session: DigilockerSession | null
  // The consent window the form opened. Null when the popup blocker refused it, which is
  // what the "Open DigiLocker" button below is for.
  popup: Window | null
  onClose: () => void
  // `profile` carries the Aadhaar details when the profile poll is what detected the
  // success, so the form can auto-fill from them instead of asking again.
  // `reason` carries the backend's own explanation of a failure, so the form can show
  // what actually went wrong instead of one generic line for every cause.
  onComplete: (
    status: DigilockerStatus,
    profile?: AadhaarProfile,
    reason?: string,
  ) => void | Promise<void>
  // Re-opens the consent window; runs from this component's click, so it counts as a
  // fresh user gesture and the popup blocker allows it.
  onReopen: () => void
}

export function DigilockerModal({ session, popup, onClose, onComplete, onReopen }: DigilockerModalProps) {
  // Both completion signals below can fire for the same session; whichever lands first
  // wins and the other is ignored.
  const settledRef = React.useRef(false)
  const [popupClosed, setPopupClosed] = React.useState(false)
  // Shown in the panel, so it is visible whether the profile is actually being polled.
  const [pollAttempt, setPollAttempt] = React.useState(0)
  // True while the profile is being checked, so the panel can say so instead of showing
  // a spinner that looks identical to still waiting.
  const [isConfirming, setIsConfirming] = React.useState(false)
  // A decision is already in flight. Not state: state would change `decide`'s identity
  // and restart the watcher effect that calls it.
  const decisionRef = React.useRef(false)

  // What the Aadhaar record looked like before this attempt, and whether it has been read
  // yet. Nothing may check the profile until it has: the customer's profile usually still
  // carries the record from an earlier attempt, and without something to compare against
  // that old record passes on the first poll — the consent window closes on its own and
  // the form announces "verified" before DigiLocker has even been opened.
  const baselineRef = React.useRef<AadhaarSnapshot | null>(null)
  const [baselineReady, setBaselineReady] = React.useState(false)

  // `decide` is tied to no props, so the current session reaches it through a ref.
  const sessionRef = React.useRef(session)
  React.useEffect(() => {
    sessionRef.current = session
  }, [session])

  // The number and baseline every profile read is judged against.
  const checkOptions = React.useCallback(
    (requireChange: boolean): AadhaarCheckOptions => ({
      expectedAadhaar: sessionRef.current?.aadhaarNumber,
      baseline: baselineRef.current,
      requireChange,
    }),
    [],
  )
  // What the customer is actually looking at: a floating window on a desktop, a full tab
  // on a phone. Only the wording depends on it, and it is worked out after mount so the
  // server render and the first client render agree.
  const [surface, setSurface] = React.useState<"window" | "tab">("window")
  React.useEffect(() => {
    setSurface(isProbablyMobile() ? "tab" : "window")
  }, [])

  // Mirrors the popup prop, so the poll can close whichever window is current without
  // being restarted every time that handle changes.
  const popupRef = React.useRef<Window | null>(popup)
  React.useEffect(() => {
    popupRef.current = popup
  }, [popup])

  const settle = React.useCallback(
    (status: DigilockerStatus, profile?: AadhaarProfile, reason?: string) => {
      if (settledRef.current) return
      settledRef.current = true
      if (status === "success") traceDone('VERIFIED — handing the details to the form', profile ?? '')
      else traceStop('this attempt is being reported to the form as FAILED', reason ?? '(no reason given)')
      onComplete(status, profile, reason)
    },
    [onComplete],
  )

  // onComplete is redefined on every render of the parent form, so settle changes
  // identity constantly. Holding it in a ref keeps the effects below tied to `session`
  // alone — otherwise each parent render tore down the poll and started it again from
  // attempt #1, and it never got far enough to find anything.
  const settleRef = React.useRef(settle)
  React.useEffect(() => {
    settleRef.current = settle
  }, [settle])

  React.useEffect(() => {
    if (!session) return
    trace('step 5/7 — waiting panel open, consent window pointed at DigiLocker')
    settledRef.current = false
    setPopupClosed(false)
    setPollAttempt(0)
    setIsConfirming(false)
    decisionRef.current = false

    let cancelled = false
    baselineRef.current = null
    setBaselineReady(false)
    captureAadhaarBaseline().then((snapshot) => {
      if (cancelled) return
      baselineRef.current = snapshot
      setBaselineReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [session])

  // The ONE place an attempt is decided, whatever prompted the look: the callback page
  // announcing an outcome, the consent window closing, or the customer pressing "I have
  // completed verification".
  //
  // Every one of those is a HINT that it is worth checking, never the answer. An
  // announced success proves nothing on its own — the backend is configured with two
  // fixed callback urls, so anything that reaches the success url announces success. The
  // profile is the backend's own record of what DigiLocker returned, so that decides.
  //
  // It is CHECKED REPEATEDLY, not once. The consent window now closes itself the moment
  // the callback page loads, and that close fires the watcher below at almost the same
  // instant the backend is still writing the record. A single read there loses the race
  // and fails a verification that worked — which is exactly what was happening.
  //
  // `decisionRef` makes sure only one of these runs: the announcement and the window
  // closing arrive together, and two overlapping checks would race each other instead.
  const decide = React.useCallback(async (
    reason: string,
    timeoutMs: number,
    requireChange: boolean,
  ) => {
    if (settledRef.current || decisionRef.current) return
    decisionRef.current = true
    setIsConfirming(true)
    trace(`step 6/7 — deciding the attempt, prompted by: ${reason}`, {
      willCheckProfileFor: `${timeoutMs / 1000}s`,
      recordMustHaveChanged: requireChange,
    })

    // The consent window has done its job either way. Closing it from here is the second
    // of the two ways a phone customer gets their screen back, the first being the
    // callback page closing itself.
    popupRef.current?.close()

    const profile = await confirmAadhaarAfterSuccess(
      () => settledRef.current,
      timeoutMs,
      checkOptions(requireChange),
    )

    setIsConfirming(false)
    decisionRef.current = false
    if (settledRef.current) return

    if (!profile) {
      traceStop(`nothing usable on the profile after ${reason} — failing the attempt`)
      settleRef.current("failed")
      return
    }
    settleRef.current("success", profile)
  }, [checkOptions])

  // A failure needs no confirming: nothing was written, so there is nothing to check.
  const handleAnnouncedResult = React.useCallback(
    (status: DigilockerStatus, reason?: string) => {
      if (settledRef.current) return
      if (status !== "success") {
        popupRef.current?.close()
        settleRef.current("failed", undefined, reason)
        return
      }
      // The requestId has already been matched against this attempt, so the record is
      // not required to have visibly moved — the announcement is the proof it did.
      decide("the callback announced success", CONFIRM_TIMEOUT_MS, false)
    },
    [decide],
  )

  // Held in refs for the same reason settle is: the listeners below are tied to
  // `session` alone and must not be torn down every time the parent re-renders.
  const announcedRef = React.useRef(handleAnnouncedResult)
  React.useEffect(() => {
    announcedRef.current = handleAnnouncedResult
  }, [handleAnnouncedResult])

  const decideRef = React.useRef(decide)
  React.useEffect(() => {
    decideRef.current = decide
  }, [decide])

  // The outcome. The backend redirects the popup to our own /digilocker/callback page,
  // which posts the result up through window.opener. There is no status endpoint to poll
  // — see the note at the top of lib/digilocker.ts.
  React.useEffect(() => {
    if (!session) return
    const redirectOrigin = readRedirectOrigin(session.url)
    trace('listening for the outcome', {
      postMessageFrom: [window.location.origin, redirectOrigin],
      broadcastRequestId: session.requestId || '(none — cannot correlate)',
    })

    const handleMessage = (event: MessageEvent) => {
      // Our callback page is same-origin. The backend's origin is accepted too, in case
      // it ever announces the result itself rather than redirecting.
      if (event.origin !== window.location.origin && event.origin !== redirectOrigin) return

      const status = readCompletionMessage(event.data)
      if (!status) return // unrelated traffic — React DevTools, extensions, widgets

      trace('outcome arrived by postMessage', { origin: event.origin, data: event.data })
      announcedRef.current(status, readCompletionReason(event.data))
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [session])

  // The same outcome, over a route that does not need `window.opener`.
  //
  // postMessage above only works while the opener handle survives, which on a phone it
  // usually does not: there the consent runs in a full TAB, and browsers sever the opener
  // across DigiLocker's cross-origin redirect chain. The callback page therefore also
  // broadcasts the result (BroadcastChannel + a localStorage write), and this is where
  // that is picked up — it reaches this tab even while it sits in the background.
  //
  // Closing the consent tab from here matters as much as the result itself: it is the
  // second of the two ways the customer gets their screen back, the first being the
  // callback page closing itself. Whichever wins, they land on the application again.
  React.useEffect(() => {
    if (!session) return
    const expected = session.requestId

    return listenForResult((result) => {
      // The callback carries the requestId the backend put in the redirect. When both
      // sides have one they must agree, so a result left over from an earlier attempt —
      // or from another tab mid-verification — cannot settle this one. Either side
      // missing it means there is nothing to compare, and the profile check that follows
      // is the real gate anyway.
      if (expected && result.requestId && expected !== result.requestId) {
        traceWait('ignoring a result that belongs to a DIFFERENT attempt', {
          expected,
          received: result.requestId,
        })
        return
      }

      trace(`outcome arrived by broadcast: ${result.status}`, {
        requestId: result.requestId || '(none)',
        reason: result.reason || '(none)',
      })
      announcedRef.current(result.status, result.reason)
    })
  }, [session])

  // Primary success detection. The callback redirect may never happen, but the backend
  // always writes the Aadhaar onto the profile, so the profile is polled from the moment
  // the popup opens. Full details arriving means consent went through — the popup is
  // closed here and the form takes over.
  React.useEffect(() => {
    // Nothing may be read before the baseline is in hand — see baselineRef above.
    if (!session || !baselineReady) return

    let cancelled = false

    pollForAadhaarDetails(
      () => cancelled || settledRef.current,
      setPollAttempt,
      checkOptions(true),
    ).then((profile) => {
      if (cancelled || settledRef.current) return

      if (!profile) {
        // Ran out of time with no Aadhaar on the profile. Consent either never finished
        // or the backend never recorded it — either way this is not a verified Aadhaar,
        // so it fails rather than waiting on a spinner indefinitely.
        traceStop('the 5-minute poll finished with nothing on the profile')
        popupRef.current?.close()
        settleRef.current("failed")
        return
      }

      trace('the background poll found the details — closing the consent window')
      popupRef.current?.close()
      settleRef.current("success", profile)
    })

    return () => {
      cancelled = true
    }
  }, [session, baselineReady, checkOptions])

  // The customer says they are done. Shorter window than an announced success: they are
  // sitting in front of the form waiting, and if the backend has written nothing by now
  // it is not about to.
  const decideFromProfile = React.useCallback(() => {
    decideRef.current("the customer said they had finished", MANUAL_CONFIRM_MS, true)
  }, [])

  // Returning to this tab is the strongest hint that the customer has finished in the
  // consent window, so it triggers one read straight away. This is what makes the backoff
  // above safe: the slow path covers the waiting, and the moment something is likely to
  // have changed, we look.
  React.useEffect(() => {
    if (!session) return

    const checkNow = () => {
      if (document.visibilityState !== "visible" || settledRef.current || !baselineReady) return
      traceWait('this tab regained focus — checking the profile once')
      // A single read, and only ever to succeed early: coming back to this tab does not
      // mean the customer finished, so nothing here may fail the attempt.
      checkAadhaarOnProfile(checkOptions(true)).then((profile) => {
        if (profile && !settledRef.current && !decisionRef.current) {
          popupRef.current?.close()
          settleRef.current("success", profile)
        }
      })
    }

    window.addEventListener("focus", checkNow)
    document.addEventListener("visibilitychange", checkNow)
    return () => {
      window.removeEventListener("focus", checkNow)
      document.removeEventListener("visibilitychange", checkNow)
    }
  }, [session, baselineReady, checkOptions])

  // A popup gives no "closed" event, so it has to be watched. Closing it without a result
  // is not treated as a failure — the user may have dismissed it by accident, so the
  // panel just offers to open it again.
  React.useEffect(() => {
    if (!session || !popup) return

    const timer = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(timer)
      if (settledRef.current) return

      // The consent window closing means the customer is done with DigiLocker one way or
      // the other, so this decides the outcome rather than going back to waiting.
      //
      // It must keep checking rather than read once: the callback page closes this window
      // ITSELF the moment it loads, which is the same instant the backend is still writing
      // the record. A single read here fails verifications that actually worked.
      trace('the consent window closed')
      decideRef.current("the consent window closed", WINDOW_CLOSED_CONFIRM_MS, true)
    }, 500)

    return () => window.clearInterval(timer)
  }, [session, popup])

  const needsAction = popupClosed || !popup

  return (
    <Dialog open={Boolean(session)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[17px] font-bold text-[#1c2b4f]">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Verify your Aadhaar with DigiLocker
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {needsAction
              ? `The DigiLocker ${surface} is not open. Open it to give consent for your Aadhaar.`
              : `Sign in to DigiLocker in the ${surface} that just opened and give consent. It closes by itself and brings you back here once it is done.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {needsAction ? (
            <>
              <ExternalLink className="w-10 h-10 text-[#1c2b4f]" />
              <Button
                type="button"
                onClick={onReopen}
                className="w-full h-12 rounded-xl bg-[#1c2b4f] hover:bg-[#16223f] text-white text-base font-bold"
              >
                Open DigiLocker
              </Button>
              <p className="text-[11px] text-gray-500 text-center">
                If nothing happens, allow pop-ups for this site and try again.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <p className="text-sm text-gray-600 text-center">
                {isConfirming
                  ? "Confirming your Aadhaar details…"
                  : `Waiting for you to finish in the DigiLocker ${surface}…`}
              </p>
              <p className="text-[11px] text-gray-400 text-center">
                {isConfirming
                  ? "DigiLocker is done — saving the details to your application."
                  : pollAttempt > 0
                    ? `Checking your Aadhaar details… (attempt ${pollAttempt})`
                    : "Starting verification check…"}
              </p>
              <Button
                type="button"
                onClick={decideFromProfile}
                disabled={isConfirming}
                className="w-full h-11 rounded-xl bg-[#1c2b4f] hover:bg-[#16223f] text-white text-sm font-bold"
              >
                {isConfirming ? "Checking…" : "I have completed verification"}
              </Button>
              <button
                type="button"
                onClick={onReopen}
                className="text-[12px] font-semibold text-[#1c2b4f] underline underline-offset-2 hover:text-red-600 transition-colors"
              >
                {surface === "tab"
                  ? "Open the DigiLocker tab again"
                  : "Bring the DigiLocker window back to the front"}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <p className="text-[11px] text-gray-500">
            Your form is saved — closing this will not lose anything.
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="shrink-0">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
