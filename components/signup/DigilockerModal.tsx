"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import {
  CALLBACK_PATH,
  readCompletionMessage,
  readRedirectOrigin,
  type DigilockerSession,
  type DigilockerStatus,
} from "@/lib/digilocker";

interface DigilockerModalProps {
  // Null until the backend has answered with a url — the iframe is never mounted
  // speculatively, only once there is a real consent URL to load.
  session: DigilockerSession | null;
  onClose: () => void;
  onComplete: (status: DigilockerStatus) => void | Promise<void>;
}

export function DigilockerModal({
  session,
  onClose,
  onComplete,
}: DigilockerModalProps) {
  const [isFrameLoading, setIsFrameLoading] = React.useState(true);
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);

  // Both completion signals below can fire for the same session; whichever lands first
  // wins and the other is ignored.
  const settledRef = React.useRef(false);

  const settle = React.useCallback(
    (status: DigilockerStatus) => {
      if (settledRef.current) return;
      settledRef.current = true;
      onComplete(status);
    },
    [onComplete],
  );

  console.log(">>>>>>>>>>>>>>>>>>>>>", session?.url);

  // Set when the iframe has not reported a load in time. The consent URL is a short
  // link that redirects to DigiLocker's own page, and pages like that often refuse to be
  // framed (X-Frame-Options / frame-ancestors) — the iframe then just sits blank with no
  // error event to listen for. This is the only signal we get, so it drives the new-tab
  // fallback below rather than leaving the user staring at a spinner.
  const [isFrameSlow, setIsFrameSlow] = React.useState(false);

  React.useEffect(() => {
    if (!session) return;
    settledRef.current = false;
    setIsFrameLoading(true);
    setIsFrameSlow(false);

    const timer = window.setTimeout(() => setIsFrameSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [session]);

  // Fallback path: DigiLocker in a real tab. The callback page messages back through
  // window.opener, so completion is still detected by the listener above.
  const openInNewTab = React.useCallback(() => {
    if (!session) return;
    window.open(session.url, "_blank", "noopener=false,noreferrer=false");
  }, [session]);

  // Primary signal. The backend, having exchanged the OAuth code, redirects the iframe to
  // our own /digilocker/callback page, which posts the outcome up to this window. There is
  // no status endpoint to poll — see the note at the top of lib/digilocker.ts.
  React.useEffect(() => {
    if (!session) return;
    const redirectOrigin = readRedirectOrigin(session.url);

    const handleMessage = (event: MessageEvent) => {
      // Our callback page is same-origin. The backend's origin is accepted too, in case
      // it ever announces the result itself rather than redirecting.
      if (
        event.origin !== window.location.origin &&
        event.origin !== redirectOrigin
      )
        return;

      const status = readCompletionMessage(event.data);
      if (status) settle(status);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [session, settle]);

  // Backup signal, for when the callback page's script cannot run or postMessage is
  // blocked. Once the iframe lands back on our own origin its URL is readable; reading a
  // cross-origin one throws, which is the normal case while the user is still on
  // DigiLocker, so the failure is swallowed.
  const handleFrameLoad = React.useCallback(() => {
    setIsFrameLoading(false);
    setIsFrameSlow(false);

    try {
      const href = frameRef.current?.contentWindow?.location?.href;
      if (!href || !href.includes(CALLBACK_PATH)) return;

      const params = new URLSearchParams(new URL(href).search);
      const raw = (
        params.get("status") ||
        params.get("result") ||
        ""
      ).toLowerCase();
      const failed =
        Boolean(params.get("error")) ||
        ["fail", "error", "denied", "cancel", "reject"].some((w) =>
          raw.includes(w),
        );
      settle(failed ? "failed" : "success");
    } catch {
      // Still on DigiLocker's own origin — nothing to read, keep waiting.
    }
  }, [settle]);

  return (
    <Dialog
      open={Boolean(session)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-[17px] font-bold text-[#1c2b4f]">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Verify your Aadhaar with DigiLocker
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Sign in to DigiLocker and give consent to share your Aadhaar. This
            window closes on its own once it is done.
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative bg-gray-50"
          style={{ height: "min(70vh, 620px)" }}
        >
          {isFrameLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 z-10">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-sm text-gray-600">Opening DigiLocker…</p>
            </div>
          )}

          {session && (
            <iframe
              ref={frameRef}
              src={session.url}
              title="DigiLocker Aadhaar verification"
              className="w-full h-full border-0"
              onLoad={handleFrameLoad}
              allow="camera; microphone; clipboard-write"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100">
          {isFrameSlow ? (
            <button
              type="button"
              onClick={openInNewTab}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1c2b4f] underline underline-offset-2 hover:text-red-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Not loading? Open DigiLocker in a new tab
            </button>
          ) : (
            <p className="text-[11px] text-gray-500">
              Your form is saved — closing this will not lose anything.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="shrink-0"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
