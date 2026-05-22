"use client"

import React from "react"
import Link from "next/link"
import { useAffiliate } from "@/hooks/useAffiliate"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { phoneNumberSchema, otpVerificationSchema, type PhoneVerificationForm } from "@/lib/signup-schemas"
import { Phone, ShieldCheck, Lock } from "lucide-react"

interface Step1Props {
  onSubmit: (data: PhoneVerificationForm) => void
  otpSent: boolean
  resendTimer: number
  onResend: () => void
  formData: PhoneVerificationForm
  setFormData: (data: PhoneVerificationForm) => void
  isLoading?: boolean
  serverError?: string | null
}

export function Step1PhoneVerification({
  onSubmit,
  otpSent,
  resendTimer,
  onResend,
  formData,
  setFormData,
  isLoading = false,
  serverError
}: Step1Props) {
  const { getLinkWithRef } = useAffiliate();
  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<PhoneVerificationForm>({
    mode: "onChange",
    resolver: zodResolver(otpSent ? otpVerificationSchema : phoneNumberSchema),
    defaultValues: formData
  })

  const phoneNumber = watch("phoneNumber")

  const handleFormSubmit = (data: PhoneVerificationForm) => {
    setFormData(data)
    onSubmit(data)
  }

  const handleOtpChange = (value: string) => {
    setValue("otp", value, { shouldValidate: true })
    setFormData({ ...formData, otp: value })
  }

  const handleResendClick = () => {
    if (resendTimer > 0) return // Prevent click if timer is running
    onResend()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-6">

        {/* Step Info Box */}
        <div className="bg-red-50 rounded-xl p-4 flex items-start space-x-4 border border-red-100">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0 border border-red-200">
            <Phone className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-red-600 mb-0.5">Step 1 of 3</div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight mb-1">Verify Your Mobile Number</h2>
            <p className="text-xs text-gray-500 font-medium">We'll send you a 6-digit OTP to verify your number</p>
          </div>
        </div>

        {/* Phone Number Input Section */}
        <div>
          <label className="block text-sm font-bold text-[#1c2b4f] mb-3">
            Mobile Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium">
              <Phone className="w-4 h-4 mr-1 text-gray-500" /> +91
            </span>
            <Input
              {...register("phoneNumber")}
              type="tel"
              placeholder="Enter 10-digit mobile number"
              className="rounded-l-none h-12 text-base font-medium shadow-none focus-visible:ring-red-600 border-gray-300"
              maxLength={10}
              disabled={otpSent}
            />
          </div>
          {errors.phoneNumber ? (
            <p className="text-red-500 text-sm mt-2">{errors.phoneNumber.message}</p>
          ) : serverError && serverError.includes("already registered") ? (
            <p className="text-red-500 text-sm mt-2 font-medium">
              This mobile number is already registered. <Link href="/login" className="font-bold underline">Please login.</Link>
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium mt-2">You will receive an OTP on this number</p>
          )}
        </div>

        {/* OTP Input Section */}
        {otpSent && (
          <div className="bg-[#f5f8ff] rounded-xl p-6 border border-[#e5edff]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-blue-700 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 mr-2" /> Enter OTP
              </div>
              <div className="text-sm">
                {resendTimer > 0 ? (
                  <span className="text-blue-500 font-medium">
                    Resend OTP (00:{resendTimer.toString().padStart(2, '0')})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendClick}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-start">
              <InputOTP
                maxLength={6}
                value={formData.otp || ""}
                onChange={handleOtpChange}
              >
                <InputOTPGroup className="gap-2 sm:gap-4 w-full">
                  <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                  <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                  <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                  <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                  <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                  <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12 border bg-white rounded-md text-lg font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {errors.otp ? (
              <p className="text-red-500 text-sm mt-3">{errors.otp.message}</p>
            ) : (
              <p className="text-xs text-gray-500 font-medium mt-3">Enter the 6-digit code sent to your mobile</p>
            )}

          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white h-14 rounded-xl text-lg font-bold shadow-md transition-all"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (otpSent ? 'Verifying...' : 'Sending...') : (otpSent ? 'Verify & Continue' : 'Get OTP')}
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
