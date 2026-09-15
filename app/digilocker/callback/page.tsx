"use client"

// Where the backend sends the browser once DigiLocker consent is finished.
//
// This page is loaded INSIDE the modal's iframe, on our own origin, so it can talk to
// the signup form with postMessage — which the DigiLocker page itself cannot do, being
// cross-origin. It reads the outcome the backend put in the query string and hands it up.
//
// It also renders standalone: if the user ended up here in a full tab (framing blocked,
// or they opened DigiLocker in a new tab), there is no parent to message, so it shows
// the outcome and tells them to return to the form.

import React from "react"
import { ShieldCheck, XCircle, Loader2 } from "lucide-react"

const FAILURE_WORDS = ["fail", "error", "denied", "rejected", "declined", "cancel", "expired"]

type Outcome = "pending" | "success" | "failed"

export default function DigilockerCallbackPage() {
  const [outcome, setOutcome] = React.useState<Outcome>("pending")
  const [isFramed, setIsFramed] = React.useState(true)

  React.useEffect(() => {
    console.log('[DigiLocker] callback page loaded at:', window.location.href)

    const params = new URLSearchParams(window.location.search)
    console.log('[DigiLocker] callback query params:', Object.fromEntries(params.entries()))

    const raw = (params.get("status") || params.get("result") || "").toLowerCase()

    // A `code` with no explicit status is DigiLocker's own success shape.
    const failed =
      Boolean(params.get("error")) || FAILURE_WORDS.some((w) => raw.includes(w))
    const status: Exclude<Outcome, "pending"> = failed ? "failed" : "success"

    console.log('[DigiLocker] callback outcome:', status)
    setOutcome(status)

    // The modal is the parent when framed, and the opener when the user took the
    // new-tab fallback. Either way it is the window waiting to hear the outcome.
    const host = window.parent !== window ? window.parent : window.opener
    setIsFramed(window.parent !== window)
    console.log('[DigiLocker] callback host window:', window.parent !== window ? 'parent (iframe)' : host ? 'opener (popup)' : 'none — standalone')
    if (!host) return

    // The modal only accepts messages from its own origin, so target it explicitly
    // rather than "*" — the query string can carry identifiers.
    host.postMessage(
      {
        source: "digilocker-callback",
        status,
        requestId: params.get("requestId") || params.get("request_id") || params.get("state") || "",
      },
      window.location.origin,
    )
    console.log('[DigiLocker] callback posted result to', window.location.origin)
  }, [])

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
      <p className="text-sm text-gray-600 max-w-sm">
        {isFramed
          ? "You can close this window — we are taking you back to your application."
          : ok
            ? "Your Aadhaar has been verified. Please return to the application tab to continue."
            : "Nothing was saved. Please return to the application tab and try again."}
      </p>
    </div>
  )
}
