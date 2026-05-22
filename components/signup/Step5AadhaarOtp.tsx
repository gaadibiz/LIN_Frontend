"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { aadhaarOtpSchema, type AadhaarOtpForm } from "@/lib/signup-schemas"

interface Step5Props {
  onSubmit: (data: AadhaarOtpForm) => void
  onBack?: () => void
  otpSent: boolean
  resendTimer: number
  onResend: () => void
  formData: AadhaarOtpForm
  setFormData: (data: AadhaarOtpForm) => void
}

export function Step5AadhaarOtp({ 
  onSubmit, 
  onBack,
  otpSent, 
  resendTimer, 
  onResend, 
  formData, 
  setFormData 
}: Step5Props) {
  const { handleSubmit, formState: { errors, isValid }, setValue } = useForm<AadhaarOtpForm>({
    mode: "onChange",
    resolver: zodResolver(aadhaarOtpSchema),
    defaultValues: formData
  })

  const handleFormSubmit = async (data: AadhaarOtpForm) => {
    // Simulate OTP verification
    if (data.aadhaarOtp.length === 6) {
      setFormData(data)
      onSubmit(data)
    }
  }

  const handleOtpChange = (value: string) => {
    setValue("aadhaarOtp", value, { shouldValidate: true })
    setFormData({ ...formData, aadhaarOtp: value })
  }

  const handleResendClick = () => {
    if (resendTimer > 0) return // Prevent click if timer is running
    onResend()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-red-600 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Verify Aadhaar number</h3>
          <p className="text-sm text-gray-600">
            OTP sent on registered mobile number linked with your Aadhaar
          </p>
          
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend OTP in {resendTimer}sec
            </p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="text-red-600 hover:underline text-sm font-medium"
            >
              Resend OTP
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enter OTP
          </label>
          <InputOTP
            maxLength={6}
            value={formData.aadhaarOtp}
            onChange={handleOtpChange}
            className="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {errors.aadhaarOtp && (
            <p className="text-red-500 text-sm mt-2">{errors.aadhaarOtp.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium" disabled={!isValid}>
          Verify OTP
        </Button>
      </div>
    </form>
  )
}
