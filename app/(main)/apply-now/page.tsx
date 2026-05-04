"use client"

import React, { useState, useEffect } from "react"
import { useSignup } from "@/hooks/useSignup"
import { Step3BasicDetails } from "@/components/signup/Step3BasicDetails"
import { Step4DocumentVerification } from "@/components/signup/Step4DocumentVerification"
import { Step6PhotoGPS } from "@/components/signup/Step6PhotoGPS"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAffiliate } from "@/hooks/useAffiliate"

import { AadhaarOtpForm, BasicDetailsForm, PhotoLocationForm, DocumentVerificationForm } from "@/lib/signup-schemas"
import { apiClient } from "@/lib/api"

export const dynamic = "force-dynamic";

interface Step {
    id: number;
    title: string;
    description: string;
}

const STEPS: Step[] = [
    { id: 1, title: "Basic details", description: "Get Instant Financial Support You Can Rely On" },
    { id: 2, title: "Verifying documents", description: "Get Instant Financial Support You Can Rely On" },
    { id: 3, title: "Photo & Location", description: "Get Instant Financial Support You Can Rely On" },
]

import { Suspense } from "react"
import { Loader2, Bookmark } from "lucide-react"
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

    // Adjust currentStep for the apply-now flow
    // apply-now step 1 = useSignup step 3
    // apply-now step 2 = useSignup step 4
    // apply-now step 3 = useSignup step 5
    // apply-now step 4 = useSignup step 6
    const [internalStep, setInternalStep] = useState(1)

    const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false)
    const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false)

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

    const handleBasicDetailsSubmit = async (data: BasicDetailsForm): Promise<void> => {
        updateFormData('basicDetails', data)
        const success = await submitStep(3, data)
        if (success) {
            handleNext()
        }
    }

    const handleDocumentVerificationSubmit = async (data: DocumentVerificationForm): Promise<void> => {
        updateFormData('documentVerification', data)
        const success = await submitStep(4, data)
        if (success) {
            handleNext()
        }
    }

    const handlePhotoLocationSubmit = async (data: PhotoLocationForm): Promise<void> => {
        updateFormData('photoAndLocationSchema', data)
        const success = await submitStep(6, data)
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
            <div className="min-h-screen w-full max-w-7xl bg-white mt-20 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
                    {/* Left Panel - Branding (hidden on mobile so form shows first) */}
                    <div className="hidden lg:flex bg-gradient-to-br from-purple-50 to-pink-50 flex-col justify-center p-8 lg:p-12 rounded-l-3xl">
                        <div className="max-w-md mx-auto">
                            <div className="mb-8">
                                <Link href={getLinkWithRef("/")} className="flex items-center">
                                    <Image src="/lin-logo.png" alt="Logo" width={120} height={40} />
                                </Link>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-tight">
                                No paperwork. No waiting. Just quick approvals and easy access to instant funds, anytime, anywhere.
                            </h2>
                            <Image src="/signup-money.png" alt="Wallet Illustration" width={256} height={192} />
                        </div>
                    </div>

                    {/* Right Panel - Success */}
                    <div className="bg-white flex flex-col justify-center p-8 lg:p-12">
                        <div className="max-w-md mx-auto w-full text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Loan application submitted</h3>
                            <p className="text-gray-600 mb-6">Our representative will contact you soon</p>

                            {appNumber && (
                                <div className="bg-[#f0fdf4] rounded-2xl flex items-center justify-center py-2 px-1 mb-8 mx-auto inline-flex gap-3 pr-4 shadow-sm border border-green-100">
                                   <div className="bg-[#dcfce7] w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ml-1">
                                      <Bookmark className="text-[#16a34a] w-6 h-6" />
                                   </div>
                                   <div className="flex flex-col text-left">
                                      <span className="text-xs text-gray-500 font-bold mb-0.5">Application Reference Number</span>
                                      <span className="text-[#14532d] font-black text-xl tracking-wide">{appNumber}</span>
                                   </div>
                                </div>
                            )}

                            {/* WhatsApp Contact Link */}
                            <a 
                                href="https://wa.me/1234567890" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center gap-2 mb-6 text-green-600 hover:text-green-700 font-medium transition-colors"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                </svg>
                                Contact us on WhatsApp
                            </a>

                            <Button
                                onClick={() => router.push(getLinkWithRef('/dashboard'))}
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium rounded-xl"
                            >
                                View dashboard
                            </Button>
                        </div>
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
                            {internalStep === 1 && (
                                <Step3BasicDetails
                                    onSubmit={handleBasicDetailsSubmit}
                                    onBack={() => router.back()}
                                    formData={formData.basicDetails}
                                    setFormData={(data) => updateFormData('basicDetails', data)}
                                    // Default to salaried as a stopgap since occupation moved to eligibility step
                                    employmentType={"Salaried"}
                                />
                            )}

                            {internalStep === 2 && (
                                <Step4DocumentVerification
                                    onSubmit={handleDocumentVerificationSubmit}
                                    formData={formData.documentVerification}
                                    setFormData={(data) => updateFormData('documentVerification', data)}
                                />
                            )}

                            {internalStep === 3 && (
                                <Step6PhotoGPS
                                    onSubmit={handlePhotoLocationSubmit}
                                    onBack={handlePrevious}
                                    formData={formData.photoAndLocationSchema}
                                    setFormData={(data) => updateFormData('photoAndLocationSchema', data)}
                                />
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
