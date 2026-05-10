"use client"

import React, { useState, useEffect } from "react"
import { useSignup } from "@/hooks/useSignup"
import { Step0EligibilityCheck } from "@/components/signup/Step0EligibilityCheck"
import { Step4DocumentVerification } from "@/components/signup/Step4DocumentVerification"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAffiliate } from "@/hooks/useAffiliate"

import { EligibilityForm, DocumentVerificationForm } from "@/lib/signup-schemas"
import { apiClient } from "@/lib/api"

export const dynamic = "force-dynamic";

interface Step {
    id: number;
    title: string;
    description: string;
}

const STEPS: Step[] = [
    { id: 1, title: "Check Eligibility", description: "Get Instant Financial Support You Can Rely On" },
    { id: 2, title: "Verifying documents", description: "Upload the required documents for verification" },
]

import { Suspense } from "react"
import { Check, ClipboardList, Clock, IndianRupee, MessageCircle } from "lucide-react"
import { formatAppNumber } from "@/lib/utils"

function ApplyNowContent() {
    const { getLinkWithRef } = useAffiliate();
    const {

        currentStep,
        formData,
        isLoading,
        error,
        applicationId,
        applicationCreatedAt,
        setCurrentStep,
        updateFormData,
        submitStep,
    } = useSignup()

    const [internalStep, setInternalStep] = useState(1)

    const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false)
    const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false)
    const [eligibilityStatus, setEligibilityStatus] = useState<'pending' | 'eligible' | 'rejected'>('pending')
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)

    const progress = (internalStep / STEPS.length) * 100

    const handleNext = (): void => {
        if (internalStep < STEPS.length) {
            setInternalStep(internalStep + 1)
        }
    }

    const handlePrevious = (): void => {
        if (internalStep > 1) {
            setInternalStep(internalStep - 1)
        }
    }

    const handleEligibilitySubmit = async (data: EligibilityForm) => {
        setIsCheckingEligibility(true);
        
        updateFormData('basicDetails', {
            ...formData.basicDetails,
            loanAmount: data.loanAmount,
            purposeOfLoan: data.purposeOfLoan,
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
                const combinedData = {
                    ...formData.basicDetails,
                    loanAmount: data.loanAmount,
                    purposeOfLoan: data.purposeOfLoan,
                };
                const success = await submitStep(3, combinedData);
                if (success) {
                    handleNext();
                } else {
                    alert("Failed to create application. Please try again.");
                }
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
                const combinedData = {
                    ...formData.basicDetails,
                    loanAmount: data.loanAmount,
                    purposeOfLoan: data.purposeOfLoan,
                };
                const success = await submitStep(3, combinedData);
                if (success) {
                    handleNext();
                } else {
                    alert("Failed to create application. Please try again.");
                }
            }
        } finally {
            setIsCheckingEligibility(false);
        }
    }

    const handleDocumentVerificationSubmit = async (data: DocumentVerificationForm): Promise<void> => {
        updateFormData('documentVerification', data)
        
        if (data.panImage && data.panImage instanceof File) {
            try {
                await apiClient.uploadDocument('PAN', data.panImage);
            } catch (err) {
                console.error("Failed to upload PAN:", err);
            }
        }

        if (data.aadhaarImage && data.aadhaarImage instanceof File) {
            try {
                await apiClient.uploadDocument('AADHAAR', data.aadhaarImage);
            } catch (err) {
                console.error("Failed to upload Aadhaar:", err);
            }
        }

        const success = await submitStep(4, data)
        if (success) {
            setApplicationSubmitted(true)
        }
    }



    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            setIsAuthenticated(true);
            apiClient.getCompleteProfile().then(res => {
                if (res && res.profile) {
                    const p = res.profile as any;
                    if (p.employment || p.address) {
                        updateFormData('basicDetails', {
                            loanAmount: formData.basicDetails.loanAmount || 0,
                            purposeOfLoan: formData.basicDetails.purposeOfLoan || "",
                            companyName: p.employment?.employerName || "",
                            professionName: "",
                            companyAddress: p.employment?.companyAddress || "",
                            monthlyIncome: p.employment?.monthlyIncome || 0,
                            jobStability: p.employment?.stability || "Stable",
                            currentAddress: p.address?.currentAddress || "",
                            currentAddressType: p.address?.currentAddressType || "Owner(Self or Family)",
                            permanentAddress: p.address?.permanentAddress || "",
                            pinCode: p.address?.postalCode || ""
                        });
                    }
                }
            }).catch(e => console.error("Failed to load existing profile:", e));
        } else {
            setIsAuthenticated(false);
        }
    }, [updateFormData]);

    // Show auth gate if not authenticated
    if (isAuthenticated === false) {
        return (
            <div className="min-h-screen w-full max-w-7xl bg-white mt-32 mx-auto px-4">
                <div className="max-w-md mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-gray-900">Please Log In to Apply</h2>
                        <p className="text-gray-600 text-lg">
                            You need an account to submit a loan application.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-6 border border-red-100 rounded-2xl bg-red-50/50 space-y-4">
                            <h3 className="font-semibold text-gray-900">New to LoanInNeed?</h3>
                            <Button
                                onClick={() => router.push(getLinkWithRef('/signup'))}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium rounded-xl"
                            >
                                Create an Account
                            </Button>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => router.push(getLinkWithRef('/login'))}
                            className="w-full h-12 text-base font-medium rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900"
                        >
                            Log In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    // We use formatAppNumber from lib/utils instead

    const handleDownloadPdf = async () => {
        if (!applicationId) return;
        setIsDownloadingPdf(true);
        try {
            await apiClient.downloadApplicationPdf(applicationId);
        } catch (err) {
            console.error('Failed to download PDF:', err);
            alert('Failed to download PDF. Please try again from your dashboard.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    if (applicationSubmitted) {
        const appNumber = applicationId
            ? formatAppNumber(applicationId, formData.personalDetails?.aadhaarNumber)
            : null;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col py-10 px-4 items-center justify-center font-sans tracking-wide">
              <div className="mb-6">
                 <Image src="/lin-logo.png" alt="LoanInNeed Logo" width={180} height={60} className="object-contain" />
              </div>
              <div className="max-w-[850px] w-full bg-white rounded-3xl shadow-xl p-8 lg:p-10 transition-all duration-500">
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
                      
                      {appNumber && (
                        <div className="bg-[#f0fdf4] rounded-2xl flex items-center justify-center py-2 px-1 mb-8 mt-4 mx-auto inline-flex gap-3 pr-4 shadow-sm border border-green-100">
                           <div className="bg-[#dcfce7] w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ml-1">
                              <Bookmark className="text-[#16a34a] w-6 h-6" />
                           </div>
                           <div className="flex flex-col text-left">
                              <span className="text-xs text-gray-500 font-bold mb-0.5">Application Reference Number</span>
                              <span className="text-[#14532d] font-black text-xl tracking-wide">{appNumber}</span>
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
                               <p className="text-[10px] text-gray-600">Chat with our customer care on WhatsApp.<br/>Our virtual assistant is here to help you instantly!</p>
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
                             onClick={() => router.push(getLinkWithRef('/dashboard'))}
                             className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white h-14 rounded-xl text-lg font-bold shadow-md transition-all flex justify-center items-center gap-2"
                         >
                             Go to Dashboard
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                         </button>
                      </div>

                      <p className="text-[10px] text-gray-400 font-medium">We're here to make your loan journey simple and hassle-free.</p>
                   </div>
              </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full max-w-7x bg-white mt-24 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
                {/* Left Panel - Branding (hidden on mobile so form shows first) */}
                <div className="hidden lg:flex bg-gradient-to-br from-purple-50 to-pink-50 flex-col justify-center p-8 lg:p-12 rounded-l-3xl">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8">
                            <Link href={getLinkWithRef("/")} className="flex items-center">
                                <Image src="/lin-logo.png" alt="Logo" width={120} height={40} />
                            </Link>
                        </div>

                        <h2 className="text-3xl font-semibold text-gray-800 mb-6 leading-tight">
                            {STEPS[internalStep - 1].description}
                        </h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            No paperwork. No waiting. Just quick approvals and easy access to instant funds, anytime, anywhere.
                        </p>
                        <Image src="/signup-money.png" alt="Wallet Illustration" width={256} height={192} />
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
                    <div className="max-w-md mx-auto w-full">
                        {/* Step Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-red-600">{STEPS[internalStep - 1].title}</h3>
                                <span className="text-sm text-gray-600">{internalStep}/{STEPS.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Form Content */}
                        <div className="space-y-6">
                            {eligibilityStatus === 'rejected' ? (
                                <div className="w-full py-8 flex flex-col items-center">
                                    <div className="w-48 h-48 bg-[#f5f3ff] rounded-full flex items-center justify-center mb-8 relative border-4 border-white shadow-sm">
                                        <FileX2 className="w-20 h-20 text-[#c2bdf1]" />
                                        <div className="absolute -bottom-2 -left-2 text-6xl">🥲</div>
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
                                            You may reapply after <span className="font-bold text-[#312c5b]">14 days</span><br/> to reassess your eligibility.
                                        </div>
                                    </div>
                                    <a href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="font-bold text-[#5b4dff] hover:text-[#4236cc] hover:underline text-sm transition-colors mt-2 pb-6">
                                        Chat with us
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {internalStep === 1 && (
                                        <Step0EligibilityCheck
                                            onSubmit={handleEligibilitySubmit}
                                            isLoading={isCheckingEligibility}
                                        />
                                    )}

                                    {internalStep === 2 && (
                                        <Step4DocumentVerification
                                            onSubmit={handleDocumentVerificationSubmit}
                                            formData={formData.documentVerification}
                                            setFormData={(data) => updateFormData('documentVerification', data)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ApplyNowPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        }>
            <ApplyNowContent />
        </Suspense>
    )
}
