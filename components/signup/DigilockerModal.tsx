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
  checkAadhaarOnProfile,
  confirmAadhaarAfterSuccess,
  isProbablyMobile,
  listenForResult,
  pollForAadhaarDetails,
  readCompletionMessage,
  readRedirectOrigin,
  type AadhaarProfile,
  type DigilockerSession,
  type DigilockerStatus,
} from "@/lib/digilocker"

interface DigilockerModalProps {
  // Null until the backend has answered with a url — nothing is shown speculatively.
  session: DigilockerSession | null
  // The consent window the form opened. Null when the popup blocker refused it, which is
  // what the "Open DigiLocker" button below is for.
  popup: Window | null
  onClose: () => void
  // `profile` carries the Aadhaar details when the profile poll is what detected the
  // success, so the form can auto-fill from them instead of asking again.
  onComplete: (status: DigilockerStatus, profile?: AadhaarProfile) => void | Promise<void>
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
  const [isDeciding, setIsDeciding] = React.useState(false)
  const decidingRef = React.useRef(false)
  // True while an announced success is being checked against the profile.
  const [isConfirming, setIsConfirming] = React.useState(false)
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

  console.log('[DigiLocker] modal render, session =', session)

  const settle = React.useCallback(
    (status: DigilockerStatus, profile?: AadhaarProfile) => {
      if (settledRef.current) return
      settledRef.current = true
      console.log('[DigiLocker] settled as:', status, profile ?? '')
      onComplete(status, profile)
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
    console.log('[DigiLocker] consent url handed to the popup:', session.url)
    settledRef.current = false
    setPopupClosed(false)
    setPollAttempt(0)
    setIsDeciding(false)
    setIsConfirming(false)
    decidingRef.current = false
  }, [session])

  // What to do with an outcome announced by the callback page, however it reached us.
  //
  // An announced success is a HINT, not the result. The backend cannot build a redirect
  // per request — it is configured with two fixed urls, one per outcome — so nothing in
  // the announcement ties it to this attempt, and any hit on the success url announces
  // success. The profile is the record of what DigiLocker actually returned, so that is
  // what decides; the announcement only says it is worth looking now.
  //
  // A failure needs no confirming: nothing was written, and there is nothing to check.
  const handleAnnouncedResult = React.useCallback((status: DigilockerStatus) => {
    if (settledRef.current) return

    // Either way the consent window has done its job. Closing it from here is the second
    // of the two ways a phone customer gets their screen back, the first being the
    // callback page closing itself.
    popupRef.current?.close()

    if (status !== "success") {
      settleRef.current("failed")
      return
    }

    setIsConfirming(true)
    confirmAadhaarAfterSuccess(() => settledRef.current).then((profile) => {
      if (settledRef.current) return
      setIsConfirming(false)
      if (!profile) {
        console.warn('[DigiLocker] announced success did not show up on the profile')
        settleRef.current("failed")
        return
      }
      settleRef.current("success", profile)
    })
  }, [])

  // Held in a ref for the same reason settle is: the listeners below are tied to
  // `session` alone and must not be torn down every time the parent re-renders.
  const announcedRef = React.useRef(handleAnnouncedResult)
  React.useEffect(() => {
    announcedRef.current = handleAnnouncedResult
  }, [handleAnnouncedResult])

  // The outcome. The backend redirects the popup to our own /digilocker/callback page,
  // which posts the result up through window.opener. There is no status endpoint to poll
  // — see the note at the top of lib/digilocker.ts.
  React.useEffect(() => {
    if (!session) return
    const redirectOrigin = readRedirectOrigin(session.url)
    console.log('[DigiLocker] accepting messages from:', window.location.origin, 'and', redirectOrigin)

    const handleMessage = (event: MessageEvent) => {
      // Our callback page is same-origin. The backend's origin is accepted too, in case
      // it ever announces the result itself rather than redirecting.
      if (event.origin !== window.location.origin && event.origin !== redirectOrigin) return

      const status = readCompletionMessage(event.data)
      if (!status) return // unrelated traffic — React DevTools, extensions, widgets

      console.log('[DigiLocker] result received', { origin: event.origin, data: event.data })
      announcedRef.current(status)
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
    return listenForResult((result) => {
      console.log('[DigiLocker] broadcast result from the consent window:', result.status)
      announcedRef.current(result.status)
    })
  }, [session])

  // Primary success detection. The callback redirect may never happen, but the backend
  // always writes the Aadhaar onto the profile, so the profile is polled from the moment
  // the popup opens. Full details arriving means consent went through — the popup is
  // closed here and the form takes over.
  React.useEffect(() => {
    if (!session) return

    let cancelled = false

    pollForAadhaarDetails(
      () => cancelled || settledRef.current,
      setPollAttempt,
    ).then((profile) => {
      if (cancelled || settledRef.current) return

      if (!profile) {
        // Ran out of time with no Aadhaar on the profile. Consent either never finished
        // or the backend never recorded it — either way this is not a verified Aadhaar,
        // so it fails rather than waiting on a spinner indefinitely.
        console.warn('[DigiLocker] no aadhaar details found — failing the process')
        popupRef.current?.close()
        settleRef.current("failed")
        return
      }

      console.log('[DigiLocker] aadhaar details found on profile — closing the popup')
      popupRef.current?.close()
      settleRef.current("success", profile)
    })

    return () => {
      cancelled = true
    }
  }, [session])

  // The decision, as a single place both the popup-closed watcher and the "I have
  // finished" button call.
  //
  //   verified === true  -> close the popup and let the form validate the Aadhaar
  //   verified === false -> close the popup and tell the customer to verify again
  //
  // There is no third outcome: the customer has left DigiLocker, so the flag is final
  // as far as this attempt is concerned.
  const decideFromProfile = React.useCallback(async () => {
    // Guarded by a ref, not by the isDeciding state: state would change this callback's
    // identity and restart the watcher effect that calls it. The state exists only to
    // put the button into its "Checking…" label.
    if (settledRef.current || decidingRef.current) return
    decidingRef.current = true
    setIsDeciding(true)

    const profile = await checkAadhaarOnProfile()
    if (settledRef.current) return

    popupRef.current?.close()

    if (profile) {
      console.log('[DigiLocker] verified — closing the popup and validating')
      settleRef.current("success", profile)
      return
    }

    console.warn('[DigiLocker] not verified — closing the popup, customer must verify again')
    settleRef.current("failed")
  }, [])

  // Returning to this tab is the strongest hint that the customer has finished in the
  // consent window, so it triggers one read straight away. This is what makes the backoff
  // above safe: the slow path covers the waiting, and the moment something is likely to
  // have changed, we look.
  React.useEffect(() => {
    if (!session) return

    const checkNow = () => {
      if (document.visibilityState !== "visible" || settledRef.current) return
      console.log('[DigiLocker] tab regained focus — checking the profile now')
      checkAadhaarOnProfile().then((profile) => {
        if (profile && !settledRef.current) {
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
  }, [session])

  // A popup gives no "closed" event, so it has to be watched. Closing it without a result
  // is not treated as a failure — the user may have dismissed it by accident, so the
  // panel just offers to open it again.
  React.useEffect(() => {
    if (!session || !popup) return

    const timer = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(timer)
      if (settledRef.current) return

      // The popup closing means the customer is done with DigiLocker one way or the
      // other, so this check decides the outcome rather than going back to waiting.
      console.log('[DigiLocker] popup closed — deciding on the profile')
      decideFromProfile()
    }, 500)

    return () => window.clearInterval(timer)
  }, [session, popup, decideFromProfile])

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
                disabled={isDeciding}
                className="w-full h-11 rounded-xl bg-[#1c2b4f] hover:bg-[#16223f] text-white text-sm font-bold"
              >
                {isDeciding ? "Checking…" : "I have completed verification"}
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
