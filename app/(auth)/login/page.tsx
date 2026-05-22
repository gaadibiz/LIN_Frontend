"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { loginStep1Schema, loginOtpSchema, type LoginStep1Form, type LoginOtpForm } from "@/lib/login-schemas"
import { useLogin } from "@/hooks/useLogin"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAffiliate } from "@/hooks/useAffiliate"


import { Suspense } from "react"

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter()
  const { getLinkWithRef } = useAffiliate()

  const {
    step,
    phoneNumber,
    otpResendTimer,
    isVerifying,
    error,
    setStep,
    setPhoneNumber,
    setOtpResendTimer,
    setIsVerifying,
    setError,
    loginStep1,
    verifyOtp,
    resendOtp,
    resetLogin,
  } = useLogin()

  const [otpValue, setOtpValue] = useState("")

  const [consentChecked, setConsentChecked] = useState(false)

  const step1Form = useForm<LoginStep1Form>({
    mode: "onChange",
    resolver: zodResolver(loginStep1Schema),
    defaultValues: {
      phoneNumber: "",
    }
  })

  const otpForm = useForm<LoginOtpForm>({
    mode: "onChange",
    resolver: zodResolver(loginOtpSchema),
    defaultValues: {
      otp: ""
    }
  })

  useEffect(() => {
    if (step === 2 && otpResendTimer > 0) {
      const timer = setInterval(() => {
        setOtpResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, otpResendTimer])

  const handleStep1Submit = async (data: LoginStep1Form) => {
    const success = await loginStep1(data)
    if (success) {
      setOtpResendTimer(30)
    }
  }

  const handleOtpSubmit = async (data: LoginOtpForm) => {
    const success = await verifyOtp(data)
    if (success) {
      // Check profile completeness before deciding where to redirect
      setTimeout(async () => {
        try {
          const { apiClient } = await import("@/lib/api");
          const res = await apiClient.getCompleteProfile();
          const p = res?.profile as any;
          const hasName = !!(p?.name && p.name.trim().split(/\s+/).length >= 2);
          const hasPan = !!(p?.panVerification?.panNumber);
          const isComplete = hasName && hasPan;

          if (isComplete) {
            router.push(getLinkWithRef("/dashboard"));
          } else {
            // Profile is incomplete — redirect to apply-now to complete it
            router.push(getLinkWithRef("/apply-now"));
          }
        } catch {
          // Fallback to dashboard if profile check fails
          router.push(getLinkWithRef("/dashboard"));
        }
      }, 2000)
    }
  }

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return // Prevent resend if timer is still running

    const success = await resendOtp()
    if (success) {
      setOtpValue("")
      otpForm.setValue("otp", "")
    }
  }

  const handleBackToStep1 = () => {
    resetLogin()
    otpForm.reset()
  }

  const handleOtpChange = (value: string) => {
    setOtpValue(value)
    otpForm.setValue("otp", value, { shouldValidate: true })
    setError(null) // Clear error when user types
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Branding (hidden on mobile so form shows first) */}
        <div className="hidden lg:flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-md mx-auto">
            {/* Logo */}
            <div className="mb-12">
              <Link href={getLinkWithRef("/")}>
                <Image src="/lin-logo.png" alt="Loan In Need" width={120} height={40} />
              </Link>
            </div>


            {/* Heading */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Because Life Can&apos;t Wait —<br />
              We&apos;re Here to Help
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-12">
              From emergencies to everyday needs, get quick financial support with a process that truly cares about you.
            </p>

            {/* Coin Illustration */}
            <div className="flex justify-start">
              <Image
                src="/login-money.png"
                alt="Coins illustration"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>

            {/* Test Credentials removed as per request */}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-white flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-md mx-auto w-full">
            {/* Step 1: Phone & DOB */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome <span className="text-red-600">Back</span>
                  </h2>
                  <p className="text-gray-600 text-sm">Login to your account</p>
                </div>

                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter registered mobile number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +91
                      </span>
                      <Input
                        {...step1Form.register("phoneNumber")}
                        type="tel"
                        placeholder=""
                        className="rounded-l-none h-12"
                        maxLength={10}
                      />
                    </div>
                    {step1Form.formState.errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {step1Form.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consent"
                      className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      required
                    />
                    <label htmlFor="consent" className="text-sm text-gray-600">
                      By continuing, you agree to our{" "}
                      <a href="#" className="text-red-600 hover:underline">privacy policies</a>{" "}
                      and{" "}
                      <a href="#" className="text-red-600 hover:underline">T&C</a>.
                      You also authorize us to{" "}
                      <a href="#" className="text-red-600 hover:underline">retrieve</a>{" "}
                      & communicate with you via phone, e-mails, WhatsApp, etc.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                    disabled={!step1Form.formState.isValid || !consentChecked}
                  >
                    Get OTP
                  </Button>

                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Didn&apos;t have an account?{" "}
                      <Link href={getLinkWithRef("/signup")} className="text-red-600 hover:underline font-medium">
                        Create now
                      </Link>
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        Are you a partner?{" "}
                        <Link href="/login-agent" className="text-red-600 hover:underline font-medium">
                          Login as a Partner
                        </Link>
                      </p>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <div className="space-y-6">
                <button
                  onClick={handleBackToStep1}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <span className="text-red-600">Verify</span> mobile number
                  </h2>
                  <p className="text-gray-600 text-sm mb-1">
                    OTP sent on XXXXXXX{phoneNumber.slice(-4)}
                  </p>
                  <div className="text-sm">
                    {otpResendTimer > 0 ? (
                      <p className="text-gray-600">
                        Resend OTP in {otpResendTimer}sec
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Enter OTP
                    </label>
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
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
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-500 text-sm mt-2">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                    disabled={isVerifying || !otpForm.formState.isValid}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <span className="text-green-600">Verification</span> successful
                  </h2>
                  <p className="text-gray-600 text-sm">You are being redirected to the dashboard...</p>
                </div>

                <div className="flex justify-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-600 animate-in zoom-in duration-500 ease-out fill-green-50" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

