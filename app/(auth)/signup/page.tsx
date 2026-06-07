"use client"

import React, { useState } from "react"
import { useSignup } from "@/hooks/useSignup"
import { Step0EligibilityCheck } from "@/components/signup/Step0EligibilityCheck"
import { Step1PhoneVerification } from "@/components/signup/Step1PhoneVerification"
import { Step2PersonalDetails } from "@/components/signup/Step2PersonalDetails"
import { useRouter } from "next/navigation"
import { useAffiliate } from "@/hooks/useAffiliate"
import {
  PhoneVerificationData,
  PersonalDetailsData,
} from "@/lib/types"
import { EligibilityForm } from "@/lib/signup-schemas"
import { Suspense } from "react"
import Image from "next/image"
import { Loader2, CheckCircle2, Calendar, FileX2, Check, ClipboardList, Clock, IndianRupee, MessageCircle, Bookmark } from "lucide-react"
import { formatAppNumber } from "@/lib/utils"

export const dynamic = "force-dynamic";

interface Step {
  id: number;
  title: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Verify Mobile" },
  { id: 2, title: "Check Eligibility" },
  { id: 3, title: "Complete Application" },
]

function SignupContent() {
  const { getLinkWithRef } = useAffiliate();
  const {
    currentStep, // 1 to 5
    formData,
    isLoading,
    error,
    applicationId,
    setCurrentStep,
    updateFormData,
    submitStep,
  } = useSignup()

  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpResendTimer, setOtpResendTimer] = useState<number>(0)
  const [eligibilityStatus, setEligibilityStatus] = useState<'pending' | 'eligible' | 'rejected'>('pending')
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false)

  const handleNext = (): void => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePhoneSubmit = async (data: PhoneVerificationData): Promise<void> => {
    updateFormData('phoneVerification', data)
    const success = await submitStep(1, data)
    if (success) {
      setOtpSent(true)
      setOtpResendTimer(30)
      startTimer(setOtpResendTimer)
    }
  }

  const handleOtpVerify = async (data: PhoneVerificationData): Promise<void> => {
    updateFormData('phoneVerification', data)
    const success = await submitStep(1, data)
    if (success) {
      handleNext() // Go to Step 2 (Eligibility)
    }
  }

  const handleEligibilitySubmit = async (data: EligibilityForm) => {
    setIsCheckingEligibility(true);

    // Explicitly update global context so the final Step 3 submission can access the loan details
    updateFormData('basicDetails', {
      ...formData.basicDetails,
      loanAmount: data.loanAmount,
      purposeOfLoan: data.purposeOfLoan,
      occupation: data.occupation,
      monthlySalaryRange: data.monthlySalaryRange,
      salaryReceivedIn: data.salaryReceivedIn,
      city: data.city
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/loans/check-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount: data.loanAmount,
          purposeOfLoan: data.purposeOfLoan,
          occupation: data.occupation,
          salaryReceivedIn: data.salaryReceivedIn,
          monthlySalaryRange: data.monthlySalaryRange,
          city: data.city
        })
      });
      const result = await response.json();
      if (result.eligible) {
        setEligibilityStatus('eligible');
        handleNext(); // Go to Step 3
      } else {
        setEligibilityStatus('rejected');
      }
    } catch (e) {
      console.error("Eligibility check failed", e);
      // Local fallback logic
      if (
        data.occupation !== "Salaried" ||
        data.salaryReceivedIn !== "Bank Transfer"
      ) {
        setEligibilityStatus('rejected')
      } else {
        setEligibilityStatus('eligible')
        handleNext(); // Go to Step 3
      }
    } finally {
      setIsCheckingEligibility(false);
    }
  }

  const router = useRouter();

  const handlePersonalDetailsSubmit = async (data: PersonalDetailsData): Promise<void> => {
    updateFormData('personalDetails', data)
    const success = await submitStep(2, data) // Step 2 in hook corresponds to personal details registration
    if (success) {
      setRegistrationSuccessful(true)
    }
  }

  const handleGoToDashboard = (): void => {
    router.push(getLinkWithRef('/dashboard'))
  }

  const startTimer = (setter: React.Dispatch<React.SetStateAction<number>>): void => {
    const timer = setInterval(() => {
      setter(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resendOtp = async (): Promise<void> => {
    try {
      await submitStep(1, { phoneNumber: formData.phoneVerification.phoneNumber });
      setOtpResendTimer(30)
      startTimer(setOtpResendTimer)
    } catch (error) {
      console.error("Failed to resend OTP", error);
    }
  }

  // Current Step UI Data
  const getSubTitle = () => {
    if (currentStep === 1) return "Quick & Easy Application"
    if (currentStep === 2) return "Almost There! Just a Few Details Left"
    return "You're almost there! Please fill in your details to get final approval."
  }

  const getBadges = () => {
    if (currentStep === 1) {
      return (
        <div className="flex gap-4 justify-center mt-2 pb-6">
          <span className="flex items-center text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Instant Approval
          </span>
          <span className="flex items-center text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1" /> No Hidden Fees
          </span>
        </div>
      )
    }
    return (
      <div className="flex gap-4 justify-center mt-2 pb-6">
        <span className="flex items-center text-sm text-green-600 font-medium">
          <CheckCircle2 className="w-4 h-4 mr-1" /> Mobile Verified
        </span>
        <span className="flex items-center text-sm text-green-600 font-medium">
          <CheckCircle2 className="w-4 h-4 mr-1" /> Safe & Secure
        </span>
      </div>
    )
  }

  const getBottomTrustBadges = () => {
    if (currentStep === 1) {
      return (
        <div className="mt-6 bg-green-50 rounded-xl p-4 flex justify-between items-center text-center">
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="text-xs font-bold text-gray-800">Quick Process</div>
            <div className="text-[10px] text-gray-500">Takes less than 5 minutes</div>
          </div>
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-gray-800">Safe & Secure</div>
            <div className="text-[10px] text-gray-500">Bank-level security</div>
          </div>
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
            </div>
            <div className="text-xs font-bold text-gray-800">100% Digital</div>
            <div className="text-[10px] text-gray-500">Paperless application</div>
          </div>
        </div>
      )
    }
    if (currentStep === 2) {
      return (
        <div className="mt-6 bg-green-50 rounded-xl p-4 flex justify-between items-center text-center">
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="text-xs font-bold text-gray-800">Instant Decision</div>
            <div className="text-[10px] text-gray-500">Get Result in Seconds</div>
          </div>
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-gray-800">100% Secure</div>
            <div className="text-[10px] text-gray-500">Bank-Level Security</div>
          </div>
          <div>
            <div className="text-green-600 flex justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
            </div>
            <div className="text-xs font-bold text-gray-800">No Hidden Charges</div>
            <div className="text-[10px] text-gray-500">Transparent Process</div>
          </div>
        </div>
      )
    }
    return (
      <div className="mt-6 bg-green-50 rounded-xl p-4 flex justify-between items-center text-center">
        <div>
          <div className="text-green-600 flex justify-center mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="text-xs font-bold text-gray-800">Quick Processing</div>
          <div className="text-[10px] text-gray-500">Get Decision in Minutes</div>
        </div>
        <div>
          <div className="text-green-600 flex justify-center mb-1">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-gray-800">Bank-Level Security</div>
          <div className="text-[10px] text-gray-500">Your Data is Protected</div>
        </div>
        <div>
          <div className="text-green-600 flex justify-center mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          </div>
          <div className="text-xs font-bold text-gray-800">Trusted by Millions</div>
          <div className="text-[10px] text-gray-500">Transparent & Reliable</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-10 px-4 items-center justify-center font-sans tracking-wide">
      <div className="mb-6">
        <Image src="/lin-logo.png" alt="LoanInNeed Logo" width={180} height={60} className="object-contain" />
      </div>
      <div className="max-w-[850px] w-full bg-white rounded-3xl shadow-xl p-8 lg:p-10 transition-all duration-500">
        {registrationSuccessful ? (
          <div className="flex flex-col items-center py-2 text-center fade-in">
            {/* Checkmark icon */}
            <div className="w-20 h-20 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-6 relative">
              <Check className="w-10 h-10 text-[#4ade80]" strokeWidth={4} />
              <div className="absolute top-0 -left-6 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute top-4 -right-8 w-3 h-3 bg-green-300 rounded-full animate-ping"></div>
              <div className="absolute bottom-2 -left-4 w-3 h-3 bg-red-300 rounded-full opacity-50"></div>
            </div>

            <h1 className="text-3xl font-bold text-[#14532d] mb-3">Thank You!</h1>
            <p className="font-bold text-gray-800 mb-2">Your loan application has been submitted successfully.</p>

            {applicationId && (
              <div className="bg-[#f0fdf4] rounded-2xl flex items-center justify-center py-2 px-1 mb-8 mt-4 mx-auto inline-flex gap-3 pr-4 shadow-sm border border-green-100">
                <div className="bg-[#dcfce7] w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ml-1">
                  <Bookmark className="text-[#16a34a] w-6 h-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs text-gray-500 font-bold mb-0.5">Application Reference Number</span>
                  <span className="text-[#14532d] font-black text-xl tracking-wide">{formatAppNumber(applicationId, formData.personalDetails?.aadhaarNumber)}</span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-8 max-w-[400px]">
              We appreciate your trust in us. Our team will review your application and get back to you soon.
            </p>

            {/* What's Next Container */}
            <div className="w-full bg-[#f8fafc] rounded-2xl p-6 mb-6 text-left border border-[#f1f5f9]">
              <h3 className="text-[#3b82f6] font-bold text-sm mb-4">What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <ClipboardList className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 mb-1">Application Review</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">We will review your details and documents.</p>
                </div>
                <div className="flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Clock className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 mb-1">Quick Update</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">You'll receive an update shortly via SMS or Email.</p>
                </div>
                <div className="flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <IndianRupee className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 mb-1">Loan Decision</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">We will inform you about the next steps.</p>
                </div>
              </div>
            </div>

            {/* Need Help Container */}
            <div className="w-full bg-[#f0fdf4] rounded-2xl p-5 mb-8 text-left border border-[#dcfce7] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm shadow-green-100 shrink-0">
                  <MessageCircle className="w-8 h-8 text-[#22c55e]" fill="#22c55e" stroke="none" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#14532d] mb-0.5">Need Help or Have Questions?</h4>
                  <p className="text-[10px] text-gray-600">Chat with our customer care on WhatsApp.<br />Our virtual assistant is here to help you instantly!</p>
                </div>
              </div>
              <a href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>

            <div className="w-full mt-4 mb-6">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white h-14 rounded-xl text-lg font-bold shadow-md transition-all flex justify-center items-center gap-2"
              >
                Go to Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-medium">We're here to make your loan journey simple and hassle-free.</p>
          </div>
        ) : (
          <>
            {/* Main Headers */}
            {currentStep < 3 ? (
              <h1 className="text-3xl font-extrabold text-center text-[#1c2b4f] mb-2 leading-tight">
                Get Instant Loan
              </h1>
            ) : (
              <h1 className="text-3xl font-extrabold text-center text-[#1c2b4f] mb-2 leading-tight">
                Complete Your Loan Application
              </h1>
            )}
            <p className="text-center text-sm text-gray-500 font-medium mb-2 opacity-90">{getSubTitle()}</p>

            {getBadges()}

            {/* Improved Progress Bar Segment */}
            <div className="mb-10 w-full relative flex items-center justify-between px-2">
              {/* Base line */}
              <div className="absolute left-[8%] right-[8%] h-[3px] bg-gray-200 z-0 top-[14px]"></div>

              {/* Active matching line (red) and complete matching line (green) */}
              <div className="absolute left-[8%] h-[3px] bg-red-600 z-0 top-[14px] transition-all duration-300"
                style={{ width: `${(currentStep - 1) * 25}%` }}></div>

              <div className="absolute left-[8%] h-[3px] bg-green-500 z-0 top-[14px] transition-all duration-300"
                style={{ width: `${Math.max(0, currentStep - 2) * 25}%` }}></div>

              {STEPS.map((step, idx) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-sm transition-colors duration-300 ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                    </div>
                    <div className="whitespace-nowrap text-center mt-2">
                      <span className={`text-[10px] font-bold leading-tight ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {eligibilityStatus === 'rejected' ? (
                <div className="w-full py-8 flex flex-col items-center">
                  <div className="w-48 h-48 bg-[#f5f3ff] rounded-full flex items-center justify-center mb-8 relative border-4 border-white shadow-sm">
                    <FileX2 className="w-20 h-20 text-[#c2bdf1]" />
                    <div className="absolute -bottom-2 -left-2 text-6xl">
                      🥲
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-red-400 rounded-full text-white p-2 shadow-md">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#312c5b] mb-3 text-center">Application Not Approved</h3>
                  <p className="text-[#6b7280] mb-8 text-center text-sm font-medium px-4 max-w-[340px] leading-relaxed">
                    As per our credit policy, we are currently unable to process your loan application.
                  </p>

                  <div className="bg-[#f9f8ff] border border-[#f0edff] w-full max-w-[360px] py-5 px-6 rounded-2xl flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 bg-[#ebe8ff] p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-[#5b4dff]" />
                    </div>
                    <div className="text-[13px] font-medium text-gray-600 leading-relaxed">
                      You may reapply after <span className="font-bold text-[#312c5b]">14 days</span><br /> to reassess your eligibility.
                    </div>
                  </div>

                  <a href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="font-bold text-[#5b4dff] hover:text-[#4236cc] hover:underline text-sm transition-colors mt-2 pb-6">
                    Chat with us
                  </a>
                </div>
              ) : (
                <div className="w-full">
                  {error && !(currentStep === 1 && error.includes("already registered")) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Form Views */}
                  <div className="space-y-6">
                    {currentStep === 1 && (
                      <Step1PhoneVerification
                        onSubmit={otpSent ? handleOtpVerify : handlePhoneSubmit}
                        otpSent={otpSent}
                        resendTimer={otpResendTimer}
                        onResend={resendOtp}
                        formData={formData.phoneVerification}
                        setFormData={(data) => updateFormData('phoneVerification', data)}
                        isLoading={isLoading}
                        serverError={error}
                      />
                    )}

                    {currentStep === 2 && (
                      <Step0EligibilityCheck
                        onSubmit={handleEligibilitySubmit}
                        isLoading={isCheckingEligibility}
                      />
                    )}

                    {currentStep === 3 && (
                      <Step2PersonalDetails
                        onSubmit={handlePersonalDetailsSubmit}
                        onGoToDashboard={handleGoToDashboard}
                        formData={formData.personalDetails}
                        setFormData={(data) => updateFormData('personalDetails', data)}
                        phoneNumber={formData.phoneVerification.phoneNumber}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Badges */}
            {eligibilityStatus !== 'rejected' && getBottomTrustBadges()}
          </>
        )}
      </div>
    </div>
  )
}

export default function SignupForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
