/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { personalDetailsSchema, type PersonalDetailsForm } from "@/lib/signup-schemas"
import { Lock, User, Mail, FileText, UploadCloud, FileBadge2, AlertTriangle, ShieldCheck, MapPin } from "lucide-react"
import { FileUpload } from "../ui/file-upload"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { calculateAge, isAgeEligible, MIN_ELIGIBLE_AGE, MAX_ELIGIBLE_AGE } from "@/lib/utils"
import { DigilockerModal } from "@/components/signup/DigilockerModal"
import { describeFailure, fetchDigilockerSession, openConsentPopup, steerPopupTo, toIsoDate, trace, traceStart, traceStop, type AadhaarProfile, type DigilockerSession, type DigilockerStatus } from "@/lib/digilocker"
import { cn } from "../../lib/utils";

interface Step2Props {
  onSubmit: (data: PersonalDetailsForm) => void;
  onGoToDashboard: () => void;
  formData: PersonalDetailsForm;
  setFormData: (data: PersonalDetailsForm) => void;
  phoneNumber: string;
  kylasLeadId?: number;
}

export function Step2PersonalDetails({ onSubmit, onGoToDashboard, formData, setFormData, phoneNumber, kylasLeadId }: Step2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingPan, setIsVerifyingPan] = useState(false);
  const [aadhaarStatus, setAadhaarStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [emailOtp, setEmailOtp] = useState("");
  const [emailResendIn, setEmailResendIn] = useState(0);

  const [showNameMismatch, setShowNameMismatch] = useState(false);
  const [showAgeAlert, setShowAgeAlert] = useState(false);

  // DigiLocker session (consent URL + requestId); null keeps the modal closed.
  const [digilockerSession, setDigilockerSession] = useState<DigilockerSession | null>(null);
  const [isRequestingDigilocker, setIsRequestingDigilocker] = useState(false);
  const [digilockerStatus, setDigilockerStatus] = useState<'idle' | 'verified' | 'failed'>('idle');
  // The consent window. Held in a ref so re-renders do not lose the handle, and mirrored
  // into state so the modal re-renders when it appears or is refused.
  const digilockerPopupRef = React.useRef<Window | null>(null);
  // The number the consent was raised for. The validate call after a success must use
  // this, not whatever is in the field by then.
  const digilockerAadhaarRef = React.useRef<string | null>(null);
  const [digilockerPopup, setDigilockerPopup] = useState<Window | null>(null);

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isValid }, trigger } = useForm<PersonalDetailsForm>({
    resolver: zodResolver(personalDetailsSchema) as any,
    defaultValues: formData,
    mode: "onChange",
  });

  const gender = watch("gender");

  // The DOB is never typed — it arrives from the PAN/Aadhaar KYC response — so the
  // age it implies is the eligibility signal. Outside 21-58 the application stops here.
  const dateOfBirth = watch("dateOfBirth");
  const applicantAge = calculateAge(dateOfBirth);
  const isAgeBlocked = !!String(dateOfBirth || "").trim() && !isAgeEligible(dateOfBirth);

  // Pop the alert as soon as an ineligible DOB lands (fresh PAN verification, or a
  // returning applicant whose saved profile prefills the field).
  React.useEffect(() => {
    if (isAgeBlocked) setShowAgeAlert(true);
  }, [isAgeBlocked, dateOfBirth]);

  // last email the otp confirmed
  const verifiedEmailRef = React.useRef<string | null>(null);
  const email = watch("email");

  React.useEffect(() => {
    if (email === verifiedEmailRef.current) return;
    verifiedEmailRef.current = null;
    setEmailStatus('idle');
    setEmailOtp("");
  }, [email]);

  React.useEffect(() => {
    if (emailResendIn <= 0) return;
    const timer = setTimeout(() => setEmailResendIn(emailResendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailResendIn]);

  const handleSendEmailOtp = async () => {
    const address = String(watch("email") || "").trim();
    if (!(await trigger("email"))) return;

    setEmailStatus('sending');
    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.requestEmailOtp(address);
      setEmailStatus('sent');
      setEmailOtp("");
      setEmailResendIn(30);
      toast.success("OTP sent to your email.");
    } catch (e: any) {
      setEmailStatus('idle');
      toast.error(e.message || "Could not send the OTP. Please try again.");
    }
  };

  const handleVerifyEmailOtp = async (otp: string) => {
    const address = String(watch("email") || "").trim();
    setEmailStatus('verifying');
    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.verifyEmailOtp(address, otp);
      verifiedEmailRef.current = address;
      setEmailStatus('verified');
      toast.success("Email verified.");
    } catch (e: any) {
      const msg = (e.message || '').toLowerCase();
      // already done on the account, treat as ok
      if (msg.includes('already verified')) {
        verifiedEmailRef.current = address;
        setEmailStatus('verified');
        return;
      }
      setEmailStatus('sent');
      setEmailOtp("");
      toast.error(e.message || "Invalid OTP. Please try again.");
    }
  };

  const handleEmailOtpChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setEmailOtp(digits);
    if (digits.length === 6) handleVerifyEmailOtp(digits);
  };

  const handleFileChange = (field: keyof PersonalDetailsForm) => (file: File | null) => {
    if (file) setValue(field, file as any, { shouldValidate: true });
  };

  const onValidSubmit = async (data: PersonalDetailsForm) => {
    // Age gate first — an ineligible applicant must not reach the backend at all.
    if (!isAgeEligible(data.dateOfBirth)) {
      setShowAgeAlert(true);
      toast.error(`Age must be between ${MIN_ELIGIBLE_AGE} and ${MAX_ELIGIBLE_AGE} years. The application cannot be submitted.`);
      return;
    }

    // Fuzzy matching logic
    const panName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim().toLowerCase();
    const aadhaarName = (data.aadhaarName || '').trim().toLowerCase();

    if (panName && aadhaarName) {
      const panWords = panName.split(/\s+/);
      const aadhaarWords = aadhaarName.split(/\s+/);
      const hasOverlap = panWords.some(word => aadhaarWords.includes(word));

      if (!hasOverlap) {
        setShowNameMismatch(true);
        toast.error("Name on PAN and Aadhaar do not match. The application cannot be submitted.");
        return;
      }
    }

    setShowNameMismatch(false);

    // email must be the verified one — DISABLED: email verification is optional
    // if (verifiedEmailRef.current !== String(data.email || '').trim()) {
    //   toast.error("Please verify your email with the OTP before continuing.");
    //   return;
    // }

    // Aadhaar gate. The submit button's `disabled` prop is a hint, not a guarantee —
    // it can be bypassed by a programmatic submit, or be a render behind the real
    // status. The number that goes into the payload must be exactly the 12 digits
    // the backend just confirmed, or the application does not get submitted at all.
    const aadhaarDigits = String(data.aadhaarNumber || '').replace(/\D/g, '');

    if (aadhaarDigits.length !== 12) {
      setAadhaarStatus('invalid');
      setAadhaarError('Please enter a valid 12-digit Aadhaar number.');
      toast.error('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    // No validate call here either. DigiLocker is the gate: if consent did not succeed
    // the number was never validated, and the answer is to run DigiLocker — not to call
    // validate behind its back.
    if (digilockerStatus !== 'verified' || verifiedAadhaarRef.current !== aadhaarDigits) {
      toast.error('Please verify your Aadhaar with DigiLocker before continuing.');
      return;
    }

    // Normalise to bare digits so the payload never carries spaces or dashes.
    data.aadhaarNumber = aadhaarDigits;

    setIsLoading(true);
    setFormData(data);
    await onSubmit(data); // Defer the backend API calls to page.tsx's handler
    setIsLoading(false);
  };

  const handleVerifyPan = async () => {
    const pan = watch("panNumber");
    const isValid = await trigger("panNumber");

    if (!isValid || !pan || pan.length !== 10) return;

    setIsVerifyingPan(true);

    try {
      // Hit the real backend API (imported from lib/api or via standard fetch)
      const { apiClient } = await import('@/lib/api');
      // Send only the panNumber text. The new backend expects optional panImage.
      const response = await apiClient.verifyPan(pan);

      if (response && response.data) {
        // Surepass returns properties in snake_case like full_name, first_name, dob
        const p = response.data;

        let finalFirstName = "";
        let finalLastName = "";

        if (p.full_name) {
          const parts = p.full_name.trim().split(' ');
          if (parts.length === 1) {
            finalFirstName = parts[0];
            setValue("firstName", parts[0], { shouldValidate: true });
          } else if (parts.length === 2) {
            finalFirstName = parts[0];
            finalLastName = parts[1];
            setValue("firstName", parts[0], { shouldValidate: true });
            setValue("lastName", parts[1], { shouldValidate: true });
          } else if (parts.length > 2) {
            finalFirstName = parts[0];
            finalLastName = parts[parts.length - 1];
            setValue("firstName", parts[0], { shouldValidate: true });
            setValue("lastName", parts[parts.length - 1], { shouldValidate: true });
            setValue("middleName", parts.slice(1, -1).join(' '), { shouldValidate: true });
          }
        } else {
          // Fallback if surepass returned specific parts
          if (p.first_name) {
            finalFirstName = p.first_name;
            setValue("firstName", p.first_name, { shouldValidate: true });
          }
          if (p.last_name) {
            finalLastName = p.last_name;
            setValue("lastName", p.last_name, { shouldValidate: true });
          }
          if (p.middle_name) setValue("middleName", p.middle_name, { shouldValidate: true });
        }

        if (p.gender) {
          const g = p.gender.toUpperCase();
          setValue("gender", (g === "M" || g === "MALE") ? "Male" : "Female", { shouldValidate: true });
        }

        if (p.dob) {
          // Assuming Surepass returns YYYY-MM-DD or DD/MM/YYYY. HTML5 date input strictly requires YYYY-MM-DD.
          let finalDob = p.dob;
          if (p.dob.includes('/')) {
            const [d, m, y] = p.dob.split('/');
            finalDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          setValue("dateOfBirth", finalDob, { shouldValidate: true });
        }

        try {
          const { submitLeadToKylas } = await import('@/lib/kylas');
          await submitLeadToKylas(
            { firstName: finalFirstName, lastName: finalLastName, panNumber: pan },
            phoneNumber,
            {},
            kylasLeadId
          );
        } catch (kylasErr) {
          console.error("Failed to push lead to Kylas after PAN verification", kylasErr);
        }
      }
    } catch (e: any) {
      console.error("PAN Verification execution failed", e);
      const errorMsg = e.message?.toLowerCase() || '';
      if (errorMsg.includes('already registered') || errorMsg.includes('another account')) {
        toast.error('This PAN number is already registered with another account.');
      } else {
        toast.error(e.message || 'Failed to verify PAN. Please try again.');
      }
    } finally {
      setIsVerifyingPan(false);
    }
  };

  // Every keystroke past the 12th digit fires a check, so responses can land out of
  // order. Only the newest request is allowed to write the status, otherwise a slow
  // reply for an older number can mark the current one 'valid'.
  const aadhaarReqIdRef = React.useRef(0);
  const verifiedAadhaarRef = React.useRef<string | null>(null);

  const verifyAadhaarNumber = React.useCallback(async (digits: string): Promise<boolean> => {
    const reqId = ++aadhaarReqIdRef.current;
    setAadhaarStatus('checking');
    setAadhaarError(null);
    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.validateAadhaar(digits);
      if (response && response.success === false) {
        throw new Error(response.message || 'Please enter a valid Aadhaar card number.');
      }
      if (reqId !== aadhaarReqIdRef.current) return false; // superseded
      verifiedAadhaarRef.current = digits;
      setAadhaarStatus('valid');
      return true;
    } catch (e: any) {
      const msg = (e.message || '').toLowerCase();
      if (reqId !== aadhaarReqIdRef.current) return false; // superseded
      // A returning user's Aadhaar may already be verified on this session —
      // the backend refuses to verify it twice, but that still means it's valid
      if (msg.includes('already verified') || msg.includes('already validated')) {
        verifiedAadhaarRef.current = digits;
        setAadhaarStatus('valid');
        return true;
      }
      verifiedAadhaarRef.current = null;
      setAadhaarStatus('invalid');
      setAadhaarError(e.message || 'Please enter a valid Aadhaar card number.');
      return false;
    }
  }, []);

  // Session resume: a returning user's saved profile prefills the Aadhaar, and no typing
  // happens, so the field is populated here. It is NOT validated — a prefilled number
  // still has to go through DigiLocker before the validate call is allowed to run.
  React.useEffect(() => {
    const prefilled = String(formData?.aadhaarNumber || "").replace(/\D/g, "");
    if (prefilled.length === 12) {
      setValue("aadhaarNumber", prefilled, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.aadhaarNumber]);

  // Aadhaar verification through DigiLocker. Its own submit, separate from the
  // application submit at the bottom of the form — the user verifies the number here and
  // only then goes on to file the application.
  const handleDigilockerSubmit = async () => {
    const digits = String(watch("aadhaarNumber") || "").replace(/\D/g, "");

    traceStart('step 1/7 — DigiLocker button pressed', { aadhaarNumber: digits });

    if (digits.length !== 12) {
      traceStop(`the aadhaar number is ${digits.length} digits, not 12 — nothing was sent`);
      return;
    }

    // Taken BEFORE the await: window.open is only permitted while the click is still
    // being handled, and awaiting the backend first would spend that gesture and get the
    // popup blocked. It opens empty and is pointed at the URL once we have one.
    const popup = openConsentPopup();
    digilockerPopupRef.current = popup;
    setDigilockerPopup(popup);
    digilockerAadhaarRef.current = digits;
    trace(`step 2/7 — consent window ${popup ? 'opened' : 'REFUSED by the browser'}`);

    setIsRequestingDigilocker(true);
    try {
      const { session, error } = await fetchDigilockerSession(digits);
      if (!session) {
        popup?.close();
        digilockerPopupRef.current = null;
        setDigilockerPopup(null);
        // The backend's own wording when it gave one — "This Aadhaar number is already
        // registered with another account." tells the user what to do; the generic line
        // below does not, so it is only the fallback for a refusal with no reason.
        traceStop('no session, so DigiLocker was never opened', error ?? '(no reason given)');
        toast.error(error || "Could not open DigiLocker right now. Please try again.");
        return;
      }

      steerPopupTo(popup, session.url);
      setDigilockerSession(session);

      if (!popup) {
        traceStop('the consent url is ready but the window was blocked — waiting for the customer to open it manually');
        toast.error("Please allow pop-ups for this site, then use the Open DigiLocker button.");
      }
    } finally {
      setIsRequestingDigilocker(false);
    }
  };

  const handleDigilockerCancel = () => {
    digilockerPopupRef.current?.close();
    digilockerPopupRef.current = null;
    setDigilockerPopup(null);
    setDigilockerSession(null);
  };

  // Re-opens the consent window from a fresh click, so the popup blocker allows it. The
  // URL is already known here, so it can be opened and pointed in one go.
  const handleDigilockerReopen = () => {
    if (!digilockerSession) return;

    const existing = digilockerPopupRef.current;
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }

    const popup = openConsentPopup();
    digilockerPopupRef.current = popup;
    setDigilockerPopup(popup);

    if (!popup) {
      toast.error("Pop-ups are blocked. Allow them for this site and try again.");
      return;
    }
    steerPopupTo(popup, digilockerSession.url);
  };

  // The one place the Aadhaar validate endpoint is allowed to run.
  //
  // On a DigiLocker failure it is NOT called — the number never reaches the validate
  // endpoint unless the customer actually completed consent. This is deliberate: consent
  // is the gate, and a failed or abandoned DigiLocker leaves the Aadhaar unvalidated.
  const handleDigilockerComplete = async (
    status: DigilockerStatus,
    profile?: AadhaarProfile,
    reason?: string,
  ) => {
    // The consent window has served its purpose either way.
    digilockerPopupRef.current?.close();
    digilockerPopupRef.current = null;
    setDigilockerPopup(null);
    setDigilockerSession(null);

    if (status !== "success") {
      traceStop('the attempt failed, so the aadhaar validate call is being skipped');
      setDigilockerStatus('failed');
      setAadhaarStatus('idle');
      setAadhaarError(null);
      verifiedAadhaarRef.current = null;
      // The backend's own reason when it gave one — "DigiLocker is not responding right
      // now" tells the customer whether to retry now or later; the generic line does not.
      toast.error(describeFailure(reason));
      return;
    }

    // Consent succeeded, so the validate call is now allowed. 'verified' is held back
    // until it answers — announcing it earlier would show a green "verified" panel while
    // the call is still in flight, and have to take it back if the number is rejected.
    // Auto-fill from the DigiLocker record before validating, so the name on the form is
    // the name DigiLocker returned rather than anything typed by hand.
    if (profile) {
      trace('step 7/7 — auto-filling the form from the DigiLocker record', profile);

      // The backend may write the Aadhaar number before the name, so the name is only
      // filled when it actually came back.
      if (profile.name) {
        setValue("aadhaarName", profile.name, { shouldValidate: true });

        // Only fill the applicant name if it is still blank — a name already typed is the
        // user's own entry and the mismatch check downstream exists to compare the two.
        const [first = "", ...rest] = profile.name.trim().split(/\s+/);
        if (!String(watch("firstName") || "").trim()) {
          setValue("firstName", first, { shouldValidate: true });
        }
        if (rest.length && !String(watch("lastName") || "").trim()) {
          setValue("lastName", rest[rest.length - 1], { shouldValidate: true });
        }
      }

      // DigiLocker sends DD/MM/YYYY, which `new Date` misreads as MM/DD/YYYY — see
      // toIsoDate. The date of birth decides age eligibility, so it has to be the real one.
      if (profile.dob && !String(watch("dateOfBirth") || "").trim()) {
        const iso = toIsoDate(profile.dob);
        if (iso) {
          setValue("dateOfBirth", iso, { shouldValidate: true });
        } else {
          traceStop(`could not read the date of birth "${profile.dob}" — leaving the field empty`);
        }
      }

      const gender = (profile.gender || "").toUpperCase();
      if ((gender === "MALE" || gender === "FEMALE") && !watch("gender")) {
        setValue("gender", gender === "MALE" ? "Male" : "Female", { shouldValidate: true });
      }
    }

    // The profile's own number wins — it is what DigiLocker actually consented to.
    const digits =
      (profile?.aadhaarNumber || "").replace(/\D/g, "") ||
      digilockerAadhaarRef.current ||
      String(watch("aadhaarNumber") || "").replace(/\D/g, "");

    if (digits && digits !== String(watch("aadhaarNumber") || "").replace(/\D/g, "")) {
      setValue("aadhaarNumber", digits, { shouldValidate: true });
    }

    trace('consent confirmed — now calling the aadhaar validate endpoint', digits);

    const ok = await verifyAadhaarNumber(digits);
    if (ok) {
      trace('VERIFIED — the form is unlocked');
      setDigilockerStatus('verified');
      toast.success("Aadhaar verified through DigiLocker.");
      return;
    }

    // Consent went through but the number was rejected by validate, so this is not a
    // verified Aadhaar and the form must not proceed on it.
    traceStop('consent went through but the validate endpoint rejected the number', aadhaarError ?? '');
    setDigilockerStatus('failed');
    toast.error(aadhaarError || "Aadhaar could not be validated. Please try again.");
  };

  const handleAadhaarChange = async (val: string, fieldOnChange: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    fieldOnChange(digits);

    // Reset status on edit
    if (digits.length < 12) {
      aadhaarReqIdRef.current++; // invalidate any in-flight check
      verifiedAadhaarRef.current = null;
      setAadhaarStatus('idle');
      setAadhaarError(null);
      // A DigiLocker consent belongs to the number it was raised for, so editing the
      // number invalidates it.
      setDigilockerStatus('idle');
      return;
    }

    // No validate call here. The Aadhaar is only validated once DigiLocker has come back
    // successful — see handleDigilockerComplete. Typing 12 digits just unlocks the
    // DigiLocker button.
    setAadhaarStatus('idle');
    setAadhaarError(null);
    setDigilockerStatus('idle');
  };

  // DigiLocker is now the first step, so the button only needs a complete number — not a
  // validate result, which by design cannot exist yet.
  const hasTwelveAadhaarDigits =
    String(watch("aadhaarNumber") || "").replace(/\D/g, "").length === 12;

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className={cn('space-y-6', 'form-fade-in', 'pb-4')}>

      {/* Header element */}
      <div className={cn('flex', 'items-center', 'space-x-3', 'mb-6', 'border-b', 'border-gray-100', 'pb-3')}>
        <User className={cn('w-6', 'h-6', 'text-blue-600')} />
        <h2 className={cn('text-xl', 'font-bold', 'text-[#1c2b4f]')}>Personal Details</h2>
      </div>

      {/* PAN row */}
      <div className={cn('w-full', 'mb-6')}>
        <div className={cn('flex', 'justify-between', 'items-end', 'mb-2')}>
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]')}>
            PAN Number <span className="text-red-500">*</span>
          </label>
        </div>
        <div className={cn('flex', 'flex-col', 'sm:flex-row', 'gap-4', 'sm:items-start')}>
          <div className="flex-1">
            <Controller
              control={control}
              name="panNumber"
              render={({ field }) => {
                return (
                  <InputOTP
                    maxLength={10}
                    value={field.value}
                    inputMode="text"
                    pattern="^[A-Za-z0-9]*$"
                    onChange={(value) => {
                      field.onChange(value.toUpperCase());
                    }}
                    containerClassName="justify-between w-full gap-2 md:gap-4"
                  >
                    <InputOTPGroup className="flex-1">
                      <InputOTPSlot index={0} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={1} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={2} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={3} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={4} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                    </InputOTPGroup>
                    <InputOTPSeparator className={cn('scale-[0.8]', 'mx-0', 'px-0')} />
                    <InputOTPGroup className="flex-1">
                      <InputOTPSlot index={5} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={6} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={7} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                      <InputOTPSlot index={8} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                    </InputOTPGroup>
                    <InputOTPSeparator className={cn('scale-[0.8]', 'mx-0', 'px-0')} />
                    <InputOTPGroup className="flex-[0.25]">
                      <InputOTPSlot index={9} className={cn('w-full', 'h-10', 'sm:h-12', 'lg:h-14', 'text-sm', 'sm:text-base', 'lg:text-lg', 'uppercase')} />
                    </InputOTPGroup>
                  </InputOTP>
                );
              }}
            />
            {errors.panNumber && (
              <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.panNumber.message}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className={cn('h-10', 'sm:h-11', 'border-green-600', 'text-green-700', 'hover:bg-green-50', 'font-bold', 'px-4', 'sm:px-6', 'shadow-sm', 'whitespace-nowrap', 'min-w-[100px]', 'w-full', 'sm:w-auto')}
            onClick={handleVerifyPan}
            disabled={isVerifyingPan}
          >
            {isVerifyingPan ? (
              <div className={cn('flex', 'items-center')}>
                <div className={cn('w-4', 'h-4', 'border-2', 'border-green-700', 'border-t-transparent', 'rounded-full', 'animate-spin', 'mr-2')}></div>
                ...
              </div>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </div>

      {/* Name row */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-4')}>
        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>First Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-gray-400')} />
            <Input {...register("firstName")} className={cn('pl-10', 'h-11', 'border-gray-300', 'shadow-sm', 'bg-gray-50', 'text-gray-500', 'cursor-not-allowed', 'focus-visible:ring-0')} placeholder="First Name" readOnly />
          </div>
          {errors.firstName && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.firstName.message}</p>}
        </div>
        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Middle Name <span className={cn('font-normal', 'text-gray-500')}>(Optional)</span></label>
          <div className="relative">
            <User className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-gray-400')} />
            <Input {...register("middleName")} className={cn('pl-10', 'h-11', 'border-gray-300', 'shadow-sm', 'bg-gray-50', 'text-gray-500', 'cursor-not-allowed', 'focus-visible:ring-0')} placeholder="Middle Name" readOnly />
          </div>
        </div>
        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Surname <span className={cn('font-normal', 'text-gray-500')}>(Optional)</span></label>
          <div className="relative">
            <User className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-gray-400')} />
            <Input {...register("lastName")} className={cn('pl-10', 'h-11', 'border-gray-300', 'shadow-sm', 'bg-gray-50', 'text-gray-500', 'cursor-not-allowed', 'focus-visible:ring-0')} placeholder="Surname" readOnly />
          </div>
          {errors.lastName && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Sex, DOB, Email row */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-4')}>
        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Sex <span className="text-red-500">*</span></label>
          <div className={cn('flex', 'bg-gray-100', 'p-1', 'rounded-lg', 'h-11', 'pointer-events-none', 'opacity-80')}>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm font-bold transition-all ${gender === 'Male' ? 'bg-[#e5edff] text-blue-600 shadow-sm border border-blue-200' : 'text-gray-500'}`}
              disabled
            >
              <div className={cn('mr-1', 'text-lg')}>♂</div> Male
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm font-bold transition-all ${gender === 'Female' ? 'bg-[#e5edff] text-blue-600 shadow-sm border border-blue-200' : 'text-gray-500'}`}
              disabled
            >
              <div className={cn('mr-1', 'text-lg')}>♀</div> Female
            </button>
          </div>
          <input type="hidden" {...register("gender")} />
          {errors.gender && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.gender.message}</p>}
        </div>

        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Date of Birth <span className="text-red-500">*</span></label>
          <div className="relative">
            <Input type="date" {...register("dateOfBirth")} className={cn('h-11', 'border-gray-300', 'shadow-sm', 'bg-gray-50', 'text-gray-500', 'cursor-not-allowed', 'focus-visible:ring-0', 'font-medium')} readOnly />
          </div>
          {errors.dateOfBirth && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.dateOfBirth.message}</p>}
        </div>

        <div className="w-full">
          <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Email ID <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className={cn('absolute', 'left-3', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-blue-400')} />
            <Input
              {...register("email")}
              type="email"
              className="pl-10 h-11 border-gray-300 shadow-sm"
              placeholder="example@email.com"
            />
            {/* Email verification disabled — Verify button hidden
            {emailStatus === 'verified' ? (
              <span className={cn('absolute', 'right-3', 'top-1/2', '-translate-y-1/2', 'flex', 'items-center', 'text-xs', 'font-bold', 'text-green-600')}>
                <ShieldCheck className={cn('w-4', 'h-4', 'mr-1')} /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={emailStatus === 'sending' || emailStatus === 'verifying' || emailResendIn > 0}
                className={cn('absolute', 'right-3', 'top-1/2', '-translate-y-1/2', 'text-xs', 'font-bold', 'text-green-700', 'hover:underline', 'disabled:text-gray-400', 'disabled:no-underline')}
              >
                {emailStatus === 'sending' ? "Sending..." : emailResendIn > 0 ? `Resend in ${emailResendIn}s` : emailStatus === 'sent' ? "Resend OTP" : "Verify"}
              </button>
            )}
            */}
          </div>
          {errors.email && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.email.message}</p>}

          {/* Email OTP input disabled
          {(emailStatus === 'sent' || emailStatus === 'verifying') && (
            <div className="mt-2">
              <InputOTP
                maxLength={6}
                value={emailOtp}
                inputMode="numeric"
                pattern="^[0-9]*$"
                onChange={handleEmailOtpChange}
                containerClassName="justify-between w-full gap-1"
              >
                <InputOTPGroup className="flex-1">
                  <InputOTPSlot index={0} className={cn('w-full', 'h-10', 'text-sm')} />
                  <InputOTPSlot index={1} className={cn('w-full', 'h-10', 'text-sm')} />
                  <InputOTPSlot index={2} className={cn('w-full', 'h-10', 'text-sm')} />
                  <InputOTPSlot index={3} className={cn('w-full', 'h-10', 'text-sm')} />
                  <InputOTPSlot index={4} className={cn('w-full', 'h-10', 'text-sm')} />
                  <InputOTPSlot index={5} className={cn('w-full', 'h-10', 'text-sm')} />
                </InputOTPGroup>
              </InputOTP>
              <p className={cn('text-[11px]', 'text-gray-500', 'mt-1', 'font-medium')}>
                {emailStatus === 'verifying' ? "Verifying OTP..." : "Enter the 6-digit OTP sent to your email."}
              </p>
            </div>
          )}
          */}
        </div>
      </div>

      {/* Aadhaar row */}
      <div className={cn('w-full', 'mt-4')}>
        <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Aadhaar Card Number <span className="text-red-500">*</span></label>
        <Controller
          control={control}
          name="aadhaarNumber"
          render={({ field }) => {
            const slotBase = "w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg transition-colors duration-200";
            const slotClass = aadhaarStatus === 'valid'
              ? `${slotBase} border-green-500 bg-green-50 text-green-700 ring-green-400`
              : aadhaarStatus === 'invalid'
                ? `${slotBase} border-red-500 bg-red-50 text-red-700 ring-red-400`
                : slotBase;
            return (
              <div className="relative">
                <InputOTP
                  maxLength={12}
                  value={field.value}
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  onChange={(val) => handleAadhaarChange(val, field.onChange)}
                  containerClassName="justify-between w-full gap-2 md:gap-4"
                >
                  <InputOTPGroup className="flex-1">
                    <InputOTPSlot index={0} className={slotClass} />
                    <InputOTPSlot index={1} className={slotClass} />
                    <InputOTPSlot index={2} className={slotClass} />
                    <InputOTPSlot index={3} className={slotClass} />
                  </InputOTPGroup>
                  <InputOTPSeparator className={cn('scale-[0.8]', 'mx-0', 'px-0')} />
                  <InputOTPGroup className="flex-1">
                    <InputOTPSlot index={4} className={slotClass} />
                    <InputOTPSlot index={5} className={slotClass} />
                    <InputOTPSlot index={6} className={slotClass} />
                    <InputOTPSlot index={7} className={slotClass} />
                  </InputOTPGroup>
                  <InputOTPSeparator className={cn('scale-[0.8]', 'mx-0', 'px-0')} />
                  <InputOTPGroup className="flex-1">
                    <InputOTPSlot index={8} className={slotClass} />
                    <InputOTPSlot index={9} className={slotClass} />
                    <InputOTPSlot index={10} className={slotClass} />
                    <InputOTPSlot index={11} className={slotClass} />
                  </InputOTPGroup>
                </InputOTP>
                {/* Inline status indicator */}
                {aadhaarStatus === 'checking' && (
                  <div className={cn('flex', 'items-center', 'gap-2', 'mt-2', 'text-sm', 'text-gray-500')}>
                    <div className={cn('w-4', 'h-4', 'border-2', 'border-gray-400', 'border-t-transparent', 'rounded-full', 'animate-spin')} />
                    Verifying Aadhaar...
                  </div>
                )}
                {aadhaarStatus === 'valid' && (
                  <div className={cn('flex', 'items-center', 'gap-2', 'mt-2', 'text-sm', 'text-green-600', 'font-medium')}>
                    <svg className={cn('w-4', 'h-4')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Aadhaar verified successfully!
                  </div>
                )}
              </div>
            );
          }}
        />
        {/* Show Aadhaar API error OR zod format error */}
        {aadhaarError
          ? <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{aadhaarError}</p>
          : errors.aadhaarNumber && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.aadhaarNumber.message}</p>
        }

        {/* Aadhaar verification through DigiLocker. type="button" is load-bearing: this
            sits inside the application form, and a bare <button> would submit it. */}
        <div className="mt-3">
          {digilockerStatus === 'verified' ? (
            <div className={cn('flex', 'items-center', 'gap-2', 'rounded-xl', 'border', 'border-green-200', 'bg-green-50', 'px-4', 'py-3')}>
              <ShieldCheck className={cn('w-5', 'h-5', 'text-green-600', 'shrink-0')} />
              <p className={cn('text-sm', 'font-medium', 'text-green-700')}>
                Aadhaar verified through DigiLocker
              </p>
            </div>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleDigilockerSubmit}
                disabled={!hasTwelveAadhaarDigits || isRequestingDigilocker}
                className={cn('w-full', 'h-12', 'rounded-xl', 'bg-[#1c2b4f]', 'hover:bg-[#16223f]', 'text-white', 'text-base', 'font-bold', 'shadow-sm', 'transition-all', 'disabled:opacity-50')}
              >
                {isRequestingDigilocker ? (
                  <span className={cn('flex', 'items-center', 'justify-center', 'gap-2')}>
                    <span className={cn('w-4', 'h-4', 'border-2', 'border-white/70', 'border-t-transparent', 'rounded-full', 'animate-spin')} />
                    Opening DigiLocker...
                  </span>
                ) : (
                  <span className={cn('flex', 'items-center', 'justify-center', 'gap-2')}>
                    <ShieldCheck className={cn('w-4', 'h-4')} />
                    {digilockerStatus === 'failed' ? 'Retry DigiLocker verification' : 'Verify Aadhaar with DigiLocker'}
                  </span>
                )}
              </Button>
              <p className={cn('text-[11px]', 'text-gray-500', 'mt-2', 'text-center')}>
                {hasTwelveAadhaarDigits
                  ? 'Submit to open DigiLocker and give consent for your Aadhaar.'
                  : 'Enter all 12 digits of your Aadhaar to continue.'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className={cn('w-full', 'mt-4')}>
        <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Name as per Aadhaar <span className="text-red-500">*</span></label>
        <div className="relative">
          <User className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-gray-400')} />
          <Input {...register("aadhaarName")} className={cn('pl-10', 'h-11', 'border-gray-300', 'shadow-sm', 'focus-visible:ring-blue-500')} placeholder="Enter exactly as printed on Aadhaar" />
        </div>
        {errors.aadhaarName && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.aadhaarName.message}</p>}
      </div>

      {/* Current address details — present address (addressLine) is mandatory to proceed.
          It is sent to the KYC API (POST /api/kyc) as currentAddress / currentCity /
          currentState / currentPostalCode — see withCurrentAddress in hooks/useSignup.ts. */}
      <div className={cn('pt-4', 'border-t', 'border-gray-100')}>
        <div className={cn('flex', 'items-start', 'space-x-3', 'mb-4')}>
          <MapPin className={cn('w-6', 'h-6', 'text-blue-600', 'mt-1')} />
          <div>
            <h2 className={cn('text-[17px]', 'font-bold', 'text-[#1c2b4f]')}>
              Current address details <span className={cn('text-gray-400', 'font-medium', 'text-[13px]')}>(Address is mandatory to proceed)</span>
            </h2>
          </div>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
          <div className="md:col-span-2">
            <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Present Address <span className="text-red-500">*</span></label>
            <Input
              {...register("addressLine")}
              className={cn('h-11', 'border-gray-300', 'shadow-sm', 'focus-visible:ring-blue-500')}
              placeholder="House / flat no., street, landmark"
            />
            {errors.addressLine && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.addressLine.message as string}</p>}
          </div>

          <div>
            <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>State</label>
            <Input
              {...register("state")}
              className={cn('h-11', 'border-gray-300', 'shadow-sm', 'focus-visible:ring-blue-500')}
              placeholder="Enter your state"
            />
            {errors.state && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.state.message as string}</p>}
          </div>

          <div>
            <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>City</label>
            <Input
              {...register("city")}
              className={cn('h-11', 'border-gray-300', 'shadow-sm', 'focus-visible:ring-blue-500')}
              placeholder="Enter your city"
            />
            {errors.city && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.city.message as string}</p>}
          </div>

          <div>
            <label className={cn('block', 'text-sm', 'font-bold', 'text-[#1c2b4f]', 'mb-2')}>Pincode</label>
            <Input
              {...register("pinCode")}
              inputMode="numeric"
              maxLength={6}
              className={cn('h-11', 'border-gray-300', 'shadow-sm', 'focus-visible:ring-blue-500')}
              placeholder="6-digit pincode"
            />
            {errors.pinCode && <p className={cn('text-red-500', 'text-sm', 'mt-1')}>{errors.pinCode.message as string}</p>}
          </div>
        </div>
      </div>

      {/* Document Upload section */}
      <div className={cn('pt-4', 'border-t', 'border-gray-100')}>
        <div className={cn('flex', 'items-start', 'space-x-3', 'mb-4')}>
          <FileText className={cn('w-6', 'h-6', 'text-blue-600', 'mt-1')} />
          <div>
            <h2 className={cn('text-[17px]', 'font-bold', 'text-[#1c2b4f]')}>Document Upload</h2>
            <p className={cn('text-xs', 'text-gray-500', 'font-medium')}>Please upload clear and valid documents.</p>
          </div>
        </div>

        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
          {/* PAN Card */}
          <div className={cn('border', 'border-dashed', 'border-blue-200', 'bg-[#f8fafe]', 'rounded-xl', 'p-4', 'text-center', 'group', 'hover:bg-[#f0f4ff]', 'transition-colors', 'relative')}>
            <FileBadge2 className={cn('w-8', 'h-8', 'text-blue-300', 'mx-auto', 'mb-2')} />
            <div className={cn('text-sm', 'font-bold', 'text-[#1c2b4f]')}>PAN Card Upload <span className="text-red-500">*</span></div>
            <div className={cn('text-[10px]', 'text-gray-500', 'mb-3')}>JPG, PNG or PDF<br />(Max 5MB)</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("panImage")}
              file={watch("panImage")}
            />
            {errors.panImage && <p className={cn('text-red-500', 'text-xs', 'mt-1', 'absolute', 'bottom-1', 'right-0', 'left-0')}>{(errors.panImage as any).message || "Required"}</p>}
          </div>

          {/* Aadhaar Card */}
          <div className={cn('border', 'border-dashed', 'border-blue-200', 'bg-[#f8fafe]', 'rounded-xl', 'p-4', 'text-center', 'group', 'hover:bg-[#f0f4ff]', 'transition-colors', 'relative')}>
            <FileText className={cn('w-8', 'h-8', 'text-blue-300', 'mx-auto', 'mb-2')} />
            <div className={cn('text-sm', 'font-bold', 'text-[#1c2b4f]')}>Aadhaar Card Upload <span className="text-red-500">*</span></div>
            <div className={cn('text-[10px]', 'text-gray-500', 'mb-3')}>JPG, PNG or PDF<br />(Max 5MB)<br />Note: Please upload a single PDF containing both side Aadhaar image</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("aadhaarImage")}
              file={watch("aadhaarImage")}
            />
            {errors.aadhaarImage && <p className={cn('text-red-500', 'text-xs', 'mt-1', 'absolute', 'bottom-1', 'right-0', 'left-0')}>{(errors.aadhaarImage as any).message || "Required"}</p>}
          </div>

          {/* Salary Slip */}
          <div className={cn('border', 'border-dashed', 'border-blue-200', 'bg-[#f8fafe]', 'rounded-xl', 'p-4', 'text-center', 'group', 'hover:bg-[#f0f4ff]', 'transition-colors', 'relative')}>
            <svg className={cn('w-8', 'h-8', 'text-blue-300', 'mx-auto', 'mb-2')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <div className={cn('text-sm', 'font-bold', 'text-[#1c2b4f]')}>salary slip (last 3-month salary slip) <span className="text-red-500">*</span></div>
            <div className={cn('text-[10px]', 'text-gray-500', 'mb-3')}>JPG, PNG or PDF<br />(Max 5MB)</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("salarySlipImage")}
              file={watch("salarySlipImage")}
            />
            {errors.salarySlipImage && <p className={cn('text-red-500', 'text-xs', 'mt-1', 'absolute', 'bottom-1', 'right-0', 'left-0')}>{(errors.salarySlipImage as any).message || "Required"}</p>}
          </div>

          {/* Bank Statement */}
          <div className={cn('border', 'border-dashed', 'border-blue-200', 'bg-[#f8fafe]', 'rounded-xl', 'p-4', 'text-center', 'group', 'hover:bg-[#f0f4ff]', 'transition-colors', 'relative')}>
            <svg className={cn('w-8', 'h-8', 'text-blue-300', 'mx-auto', 'mb-2')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
            <div className={cn('text-sm', 'font-bold', 'text-[#1c2b4f]')}>Bank Statement (latest 6-month Bank Statement) <span className="text-red-500">*</span></div>
            <div className={cn('text-[10px]', 'text-gray-500', 'mb-3')}>PDF Only<br />(Max 10MB)<br />Note: All bank statements should be unprotected</div>
            <FileUpload
              accept=".pdf"
              onFileChange={handleFileChange("bankStatementImage")}
              file={watch("bankStatementImage")}
            />
            {errors.bankStatementImage && <p className={cn('text-red-500', 'text-xs', 'mt-1', 'absolute', 'bottom-1', 'right-0', 'left-0')}>{(errors.bankStatementImage as any).message || "Required"}</p>}
          </div>
        </div>

      </div>

      <div className={cn('space-y-4', 'pt-4', 'border-t', 'border-gray-100')}>
        {/* Checkbox 1 */}
        <div className={cn('flex', 'flex-col')}>
          <label className={cn('flex', 'items-start', 'gap-3', 'cursor-pointer', 'group')}>
            <input
              type="checkbox"
              defaultChecked={true}
              {...register("consentOne")}
              className={cn('mt-1', 'h-4', 'w-4', 'rounded', 'border-gray-300', 'text-red-600', 'focus:ring-red-500')}
            />
            <span className={cn('text-sm', 'text-gray-700', 'leading-relaxed')}>
              I acknowledge that I have carefully read and understood the{" "}
              <span className={cn('text-red-600', 'underline', 'cursor-pointer', 'font-bold')}>
                Product Terms and Conditions
              </span>
              , including loan terms, charges, and disclosures, and hereby expressly
              consent to and agree to be legally bound by the same in accordance
              with applicable RBI regulations. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentOne && <p className={cn('text-red-500', 'text-[10px]', 'ml-7', 'mt-1')}>{errors.consentOne.message as string}</p>}
        </div>

        {/* Checkbox 2 */}
        <div className={cn('flex', 'flex-col')}>
          <label className={cn('flex', 'items-start', 'gap-3', 'cursor-pointer', 'group')}>
            <input
              type="checkbox"
              defaultChecked={true}
              {...register("consentTwo")}
              className={cn('mt-1', 'h-4', 'w-4', 'rounded', 'border-gray-300', 'text-red-600', 'focus:ring-red-500')}
            />
            <span className={cn('text-sm', 'text-gray-700', 'leading-relaxed')}>
              I expressly consent to receive transactional and service-related
              communications through electronic modes, including WhatsApp, SMS, and
              email, in accordance with applicable laws and regulations. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentTwo && <p className={cn('text-red-500', 'text-[10px]', 'ml-7', 'mt-1')}>{errors.consentTwo.message as string}</p>}
        </div>
      </div>



      {isAgeBlocked && (
        <div className={cn('p-4', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'mb-4')}>
          <p className={cn('text-sm', 'text-red-800', 'font-medium')}>
            As per your PAN/Aadhaar records you are {applicantAge} years old. Loans are
            available only to applicants aged {MIN_ELIGIBLE_AGE} to {MAX_ELIGIBLE_AGE} years,
            so this application cannot be submitted.
          </p>
        </div>
      )}

      {showNameMismatch && (
        <div className={cn('p-4', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'mb-4')}>
          <p className={cn('text-sm', 'text-red-800', 'font-medium')}>
            The name on your Aadhaar card does not match the name on your PAN card.
            Please verify your PAN and Aadhaar details — this application cannot be
            submitted until the names match.
          </p>
        </div>
      )}

      <div className="pt-6">
        <Button
          type="submit"
          className={cn('w-full', 'bg-[#c81e1e]', 'hover:bg-red-700', 'text-white', 'h-14', 'rounded-xl', 'text-lg', 'font-bold', 'shadow-md', 'transition-all')}
          // disabled={isLoading || !isValid || isAgeBlocked || emailStatus !== 'verified' || digilockerStatus !== 'verified' || aadhaarStatus !== 'valid'}
          disabled={isLoading || !isValid || isAgeBlocked || digilockerStatus !== 'verified' || aadhaarStatus !== 'valid'}
        >
          {isLoading ? "Submitting..." : "Review & Submit Application"}
        </Button>
        <div className={cn('text-center', 'mt-4')}>
          <span className={cn('flex', 'items-center', 'justify-center', 'text-xs', 'text-gray-500', 'font-medium', 'opacity-80')}>
            <Lock className={cn('w-3', 'h-3', 'mr-1', 'text-green-600')} /> Your information is secure and encrypted
          </span>
        </div>
      </div>

      {/* Lives here rather than in the page, so both the signup and apply-now flows get
          it from the one component that owns the Aadhaar field. */}
      <DigilockerModal
        session={digilockerSession}
        popup={digilockerPopup}
        onClose={handleDigilockerCancel}
        onComplete={handleDigilockerComplete}
        onReopen={handleDigilockerReopen}
      />

      {/* Age eligibility alert — age is derived from the DOB on the verified PAN/Aadhaar */}
      <Dialog open={showAgeAlert} onOpenChange={setShowAgeAlert}>
        <DialogContent className={cn('sm:max-w-[440px]', 'rounded-2xl')}>
          <DialogHeader>
            <div className={cn('w-14', 'h-14', 'bg-red-100', 'rounded-full', 'flex', 'items-center', 'justify-center', 'mx-auto', 'mb-3')}>
              <AlertTriangle className={cn('w-7', 'h-7', 'text-red-600')} />
            </div>
            <DialogTitle className={cn('text-center', 'text-xl', 'font-bold', 'text-[#1c2b4f]')}>
              Not eligible for this loan
            </DialogTitle>
            <DialogDescription className={cn('text-center', 'text-gray-600', 'pt-2')}>
              {applicantAge !== null
                ? `As per the date of birth on your PAN/Aadhaar you are ${applicantAge} years old.`
                : "We could not read a valid date of birth from your PAN/Aadhaar."}{" "}
              Loans are available only to applicants aged {MIN_ELIGIBLE_AGE} to {MAX_ELIGIBLE_AGE} years,
              so we are unable to proceed with this application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={cn('sm:justify-center', 'pt-2')}>
            <Button
              type="button"
              onClick={() => setShowAgeAlert(false)}
              className={cn('bg-[#c81e1e]', 'hover:bg-red-700', 'text-white', 'h-11', 'px-8', 'rounded-xl', 'font-bold')}
            >
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
