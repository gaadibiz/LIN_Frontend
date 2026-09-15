"use client"

// Waiting panel for the DigiLocker hand-off.
//
// It does NOT embed DigiLocker — that page sets `frame-ancestors 'none'` and
// `x-frame-options: SAMEORIGIN`, so an iframe of it only ever shows "refused to connect"
// (see the note at the top of lib/digilocker.ts). The consent runs in a popup window
// opened by the form; this panel just holds the form still while that happens, and
// listens for the outcome the callback page posts back through window.opener.

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, ExternalLink } from "lucide-react"
import {
  checkAadhaarOnProfile,
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
  }, [session])

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
      settleRef.current(status)
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
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

  // A popup gives no "closed" event, so it has to be watched. Closing it without a result
  // is not treated as a failure — the user may have dismissed it by accident, so the
  // panel just offers to open it again.
  React.useEffect(() => {
    if (!session || !popup) return

    const timer = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(timer)
      if (settledRef.current) return

      // The popup closing usually means the customer just finished. Check the profile
      // immediately rather than waiting for the next poll tick.
      console.log('[DigiLocker] popup closed — checking the profile right away')
      checkAadhaarOnProfile().then((profile) => {
        if (settledRef.current) return
        if (profile) {
          settleRef.current("success", profile)
          return
        }
        setPopupClosed(true)
      })
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
              ? "The DigiLocker window is not open. Open it to give consent for your Aadhaar."
              : "Sign in to DigiLocker in the window that just opened and give consent. This closes on its own once it is done."}
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
                Waiting for you to finish in the DigiLocker window…
              </p>
              <p className="text-[11px] text-gray-400 text-center">
                {pollAttempt > 0
                  ? `Checking your Aadhaar details… (attempt ${pollAttempt})`
                  : "Starting verification check…"}
              </p>
              <button
                type="button"
                onClick={onReopen}
                className="text-[12px] font-semibold text-[#1c2b4f] underline underline-offset-2 hover:text-red-600 transition-colors"
              >
                Bring the DigiLocker window back to the front
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
