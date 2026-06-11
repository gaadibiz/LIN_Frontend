"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { personalDetailsSchema, type PersonalDetailsForm } from "@/lib/signup-schemas"
import { Lock, User, Mail, FileText, UploadCloud, FileBadge2 } from "lucide-react"
import { FileUpload } from "../ui/file-upload"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

interface Step2Props {
  onSubmit: (data: PersonalDetailsForm) => void;
  onGoToDashboard: () => void;
  formData: PersonalDetailsForm;
  setFormData: (data: PersonalDetailsForm) => void;
  phoneNumber: string;
}

export function Step2PersonalDetails({ onSubmit, onGoToDashboard, formData, setFormData, phoneNumber }: Step2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingPan, setIsVerifyingPan] = useState(false);
  const [aadhaarStatus, setAadhaarStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isValid }, trigger } = useForm<PersonalDetailsForm>({
    resolver: zodResolver(personalDetailsSchema) as any,
    defaultValues: formData,
    mode: "onChange",
  });

  const gender = watch("gender");

  const handleFileChange = (field: keyof PersonalDetailsForm) => (file: File | null) => {
    if (file) setValue(field, file as any, { shouldValidate: true });
  };

  const onValidSubmit = async (data: PersonalDetailsForm) => {
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

        if (p.full_name) {
          const parts = p.full_name.trim().split(' ');
          if (parts.length === 1) {
            setValue("firstName", parts[0], { shouldValidate: true });
          } else if (parts.length === 2) {
            setValue("firstName", parts[0], { shouldValidate: true });
            setValue("lastName", parts[1], { shouldValidate: true });
          } else if (parts.length > 2) {
            setValue("firstName", parts[0], { shouldValidate: true });
            setValue("lastName", parts[parts.length - 1], { shouldValidate: true });
            setValue("middleName", parts.slice(1, -1).join(' '), { shouldValidate: true });
          }
        } else {
          // Fallback if surepass returned specific parts
          if (p.first_name) setValue("firstName", p.first_name, { shouldValidate: true });
          if (p.last_name) setValue("lastName", p.last_name, { shouldValidate: true });
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

  const handleAadhaarChange = async (val: string, fieldOnChange: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    fieldOnChange(digits);

    // Reset status on edit
    if (digits.length < 12) {
      setAadhaarStatus('idle');
      setAadhaarError(null);
      return;
    }

    // Trigger real-time validation as soon as all 12 digits are entered
    setAadhaarStatus('checking');
    setAadhaarError(null);
    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.validateAadhaar(digits);
      if (response && response.success === false) {
        throw new Error(response.message || 'Please enter a valid Aadhaar card number.');
      }
      setAadhaarStatus('valid');
    } catch (e: any) {
      setAadhaarStatus('invalid');
      setAadhaarError(e.message || 'Please enter a valid Aadhaar card number.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6 form-fade-in pb-4">

      {/* Header element */}
      <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-3">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-[#1c2b4f]">Personal Details</h2>
      </div>

      {/* PAN row */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-end mb-2">
          <label className="block text-sm font-bold text-[#1c2b4f]">
            PAN Number <span className="text-red-500">*</span>
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
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
                      <InputOTPSlot index={0} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={1} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={2} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={3} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={4} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                    </InputOTPGroup>
                    <InputOTPSeparator className="scale-[0.8] mx-0 px-0" />
                    <InputOTPGroup className="flex-1">
                      <InputOTPSlot index={5} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={6} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={7} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                      <InputOTPSlot index={8} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                    </InputOTPGroup>
                    <InputOTPSeparator className="scale-[0.8] mx-0 px-0" />
                    <InputOTPGroup className="flex-[0.25]">
                      <InputOTPSlot index={9} className="w-full h-10 sm:h-12 lg:h-14 text-sm sm:text-base lg:text-lg uppercase" />
                    </InputOTPGroup>
                  </InputOTP>
                );
              }}
            />
            {errors.panNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.panNumber.message}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:h-11 border-green-600 text-green-700 hover:bg-green-50 font-bold px-4 sm:px-6 shadow-sm whitespace-nowrap min-w-[100px] w-full sm:w-auto"
            onClick={handleVerifyPan}
            disabled={isVerifyingPan}
          >
            {isVerifyingPan ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                ...
              </div>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">First Name <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input {...register("firstName")} className="pl-10 h-11 border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed focus-visible:ring-0" placeholder="First Name" readOnly />
          </div>
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
        </div>
        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Middle Name <span className="font-normal text-gray-500">(Optional)</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input {...register("middleName")} className="pl-10 h-11 border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed focus-visible:ring-0" placeholder="Middle Name" readOnly />
          </div>
        </div>
        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Surname <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input {...register("lastName")} className="pl-10 h-11 border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed focus-visible:ring-0" placeholder="Surname" readOnly />
          </div>
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      {/* Sex, DOB, Email row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Sex <span className="text-red-500">*</span></label>
          <div className="flex bg-gray-100 p-1 rounded-lg h-11 pointer-events-none opacity-80">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm font-bold transition-all ${gender === 'Male' ? 'bg-[#e5edff] text-blue-600 shadow-sm border border-blue-200' : 'text-gray-500'}`}
              disabled
            >
              <div className="mr-1 text-lg">♂</div> Male
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center py-1 rounded-md text-sm font-bold transition-all ${gender === 'Female' ? 'bg-[#e5edff] text-blue-600 shadow-sm border border-blue-200' : 'text-gray-500'}`}
              disabled
            >
              <div className="mr-1 text-lg">♀</div> Female
            </button>
          </div>
          <input type="hidden" {...register("gender")} />
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Date of Birth <span className="text-red-500">*</span></label>
          <div className="relative">
            <Input type="date" {...register("dateOfBirth")} className="h-11 border-gray-300 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed focus-visible:ring-0 font-medium" readOnly />
          </div>
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Email ID <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <Input {...register("email")} type="email" className="pl-10 h-11 border-gray-300 shadow-sm" placeholder="example@email.com" />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
      </div>

      {/* Aadhaar row */}
      <div className="w-full mt-4">
        <label className="block text-sm font-bold text-[#1c2b4f] mb-2">Aadhaar Card Number <span className="text-red-500">*</span></label>
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
                  <InputOTPSeparator className="scale-[0.8] mx-0 px-0" />
                  <InputOTPGroup className="flex-1">
                    <InputOTPSlot index={4} className={slotClass} />
                    <InputOTPSlot index={5} className={slotClass} />
                    <InputOTPSlot index={6} className={slotClass} />
                    <InputOTPSlot index={7} className={slotClass} />
                  </InputOTPGroup>
                  <InputOTPSeparator className="scale-[0.8] mx-0 px-0" />
                  <InputOTPGroup className="flex-1">
                    <InputOTPSlot index={8} className={slotClass} />
                    <InputOTPSlot index={9} className={slotClass} />
                    <InputOTPSlot index={10} className={slotClass} />
                    <InputOTPSlot index={11} className={slotClass} />
                  </InputOTPGroup>
                </InputOTP>
                {/* Inline status indicator */}
                {aadhaarStatus === 'checking' && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Verifying Aadhaar...
                  </div>
                )}
                {aadhaarStatus === 'valid' && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Aadhaar verified successfully!
                  </div>
                )}
              </div>
            );
          }}
        />
        {/* Show Aadhaar API error OR zod format error */}
        {aadhaarError
          ? <p className="text-red-500 text-sm mt-1">{aadhaarError}</p>
          : errors.aadhaarNumber && <p className="text-red-500 text-sm mt-1">{errors.aadhaarNumber.message}</p>
        }
      </div>

      {/* Document Upload section */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-start space-x-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-[17px] font-bold text-[#1c2b4f]">Document Upload</h2>
            <p className="text-xs text-gray-500 font-medium">Please upload clear and valid documents.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PAN Card */}
          <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative">
            <FileBadge2 className="w-8 h-8 text-blue-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-[#1c2b4f]">PAN Card Upload <span className="text-red-500">*</span></div>
            <div className="text-[10px] text-gray-500 mb-3">JPG, PNG or PDF<br />(Max 5MB)</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("panImage")}
              file={watch("panImage")}
            />
            {errors.panImage && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{(errors.panImage as any).message || "Required"}</p>}
          </div>

          {/* Aadhaar Card */}
          <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative">
            <FileText className="w-8 h-8 text-blue-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-[#1c2b4f]">Aadhaar Card Upload <span className="text-red-500">*</span></div>
            <div className="text-[10px] text-gray-500 mb-3">JPG, PNG or PDF<br />(Max 5MB)</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("aadhaarImage")}
              file={watch("aadhaarImage")}
            />
            {errors.aadhaarImage && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{(errors.aadhaarImage as any).message || "Required"}</p>}
          </div>

          {/* Salary Slip */}
          <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative">
            <svg className="w-8 h-8 text-blue-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <div className="text-sm font-bold text-[#1c2b4f]">salary slip (last 3-month salary slip) <span className="text-red-500">*</span></div>
            <div className="text-[10px] text-gray-500 mb-3">JPG, PNG or PDF<br />(Max 5MB)</div>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileChange={handleFileChange("salarySlipImage")}
              file={watch("salarySlipImage")}
            />
            {errors.salarySlipImage && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{(errors.salarySlipImage as any).message || "Required"}</p>}
          </div>

          {/* Bank Statement */}
          <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative">
            <svg className="w-8 h-8 text-blue-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
            <div className="text-sm font-bold text-[#1c2b4f]">Bank Statement (latest 6-month Bank Statement) <span className="text-red-500">*</span></div>
            <div className="text-[10px] text-gray-500 mb-3">PDF Only<br />(Max 10MB)</div>
            <FileUpload
              accept=".pdf"
              onFileChange={handleFileChange("bankStatementImage")}
              file={watch("bankStatementImage")}
            />
            {errors.bankStatementImage && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{(errors.bankStatementImage as any).message || "Required"}</p>}
          </div>
        </div>

      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        {/* Checkbox 1 */}
        <div className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={true}
              {...register("consentOne")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I acknowledge that I have carefully read and understood the{" "}
              <span className="text-red-600 underline cursor-pointer font-bold">
                Product Terms and Conditions
              </span>
              , including loan terms, charges, and disclosures, and hereby expressly
              consent to and agree to be legally bound by the same in accordance
              with applicable RBI regulations. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentOne && <p className="text-red-500 text-[10px] ml-7 mt-1">{errors.consentOne.message as string}</p>}
        </div>

        {/* Checkbox 2 */}
        <div className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              defaultChecked={true}
              {...register("consentTwo")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I expressly consent to receive transactional and service-related
              communications through electronic modes, including WhatsApp, SMS, and
              email, in accordance with applicable laws and regulations. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.consentTwo && <p className="text-red-500 text-[10px] ml-7 mt-1">{errors.consentTwo.message as string}</p>}
        </div>
      </div>



      <div className="pt-6">
        <Button
          type="submit"
          className="w-full bg-[#c81e1e] hover:bg-red-700 text-white h-14 rounded-xl text-lg font-bold shadow-md transition-all"
          disabled={isLoading || !isValid || aadhaarStatus === 'checking' || aadhaarStatus === 'invalid' || aadhaarStatus === 'idle'}
        >
          {isLoading ? "Submitting..." : "Review & Submit Application"}
        </Button>
        <div className="text-center mt-4">
          <span className="flex items-center justify-center text-xs text-gray-500 font-medium opacity-80">
            <Lock className="w-3 h-3 mr-1 text-green-600" /> Your information is secure and encrypted
          </span>
        </div>
      </div>
    </form>
  )
}
