"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FileUpload } from "@/components/ui/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import {
    affiliateStep1Schema,
    affiliateStep2Schema,
    type AffiliateStep1Data,
    type AffiliateStep2Data
} from "@/lib/affiliate-schemas";
import { apiClient } from "@/lib/api";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface AffiliateApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AffiliateApplicationModal({ isOpen, onClose }: AffiliateApplicationModalProps) {
    const [step, setStep] = useState(1);
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Step 1 Form
    const step1Form = useForm<AffiliateStep1Data>({
        mode: "onChange",
        resolver: zodResolver(affiliateStep1Schema),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            otp: "",
        },
    });

    // Step 2 Form
    const step2Form = useForm<AffiliateStep2Data>({
        mode: "onChange",
        resolver: zodResolver(affiliateStep2Schema),
        defaultValues: {
            panNumber: "",
            acceptance: false,
        },
    });

    const isStep1Valid = step1Form.formState.isValid && (!otpSent || (step1Form.watch("otp")?.length === 6));

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleStep1Submit = async (data: AffiliateStep1Data) => {
        setIsLoading(true);
        try {
            if (!otpSent) {
                // Mock OTP Request
                // Using dummy data '9000000001' logic as requested
                if (data.phoneNumber === "9000000001") {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setOtpSent(true);
                    setResendTimer(30);
                    toast.success("OTP sent to your mobile number");
                } else {
                    // Fallback to real API or dummy error
                    await apiClient.requestPhoneOtp(data.phoneNumber);
                    setOtpSent(true);
                    setResendTimer(30);
                    toast.success("OTP sent successfully");
                }
            } else {
                // Verify OTP
                if (data.phoneNumber === "9000000001" && data.otp === "123456") {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setStep(2);
                    toast.success("Phone verified successfully!");
                } else {
                    await apiClient.verifyPhoneOtp(data.phoneNumber, data.otp || "");
                    setStep(2);
                    toast.success("Phone verified successfully!");
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2Submit = async (data: AffiliateStep2Data) => {
        setIsLoading(true);
        try {
            // Mock Final Submission
            const formData = new FormData();
            formData.append("panNumber", data.panNumber);
            formData.append("panPhoto", data.panPhoto);

            await new Promise(resolve => setTimeout(resolve, 2000));
            setIsSuccess(true);
            toast.success("Application submitted successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit application");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form state when modal is manually closed
    useEffect(() => {
        if (!isOpen) {
            // Tiny delay to allow closing animation to complete
            const resetTimeout = setTimeout(() => {
                setStep(1);
                setOtpSent(false);
                setIsSuccess(false);
                step1Form.reset();
                step2Form.reset();
            }, 300);
            return () => clearTimeout(resetTimeout);
        }
    }, [isOpen, step1Form, step2Form]);

    const handleResendOtp = async () => {
        if (resendTimer === 0) {
            setIsLoading(true);
            try {
                const phoneNumber = step1Form.getValues("phoneNumber");
                if (phoneNumber === "9000000001") {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setResendTimer(30);
                    toast.success("OTP resent successfully");
                } else {
                    await apiClient.requestPhoneOtp(phoneNumber);
                    setResendTimer(30);
                    toast.success("OTP resent successfully");
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to resend OTP");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none">
                <div className="bg-gradient-to-br from-red-50 to-white p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            {isSuccess ? "Application Submitted!" : "Become an Affiliate Partner"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {isSuccess
                                ? "We've received your details and will get back to you soon."
                                : `Step ${step} of 2: ${step === 1 ? "Personal Information" : "Document Verification"}`}
                        </DialogDescription>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-600 animate-in zoom-in duration-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">Application Success!</h3>
                            <p className="text-gray-500 max-w-sm">
                                Your application is being processed. You will receive an email confirmation shortly.
                            </p>
                            <Button onClick={onClose} className="mt-4 bg-red-600 hover:bg-red-700">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-medium">Full Name (as per PAN)</Label>
                                            <Input
                                                id="fullName"
                                                placeholder="Enter full name"
                                                {...step1Form.register("fullName")}
                                                className="h-12 border-gray-200 focus:ring-red-500"
                                                disabled={otpSent || isLoading}
                                            />
                                            {step1Form.formState.errors.fullName && (
                                                <p className="text-xs text-red-500">{step1Form.formState.errors.fullName.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="example@mail.com"
                                                {...step1Form.register("email")}
                                                className="h-12 border-gray-200 focus:ring-red-500"
                                                disabled={otpSent || isLoading}
                                            />
                                            {step1Form.formState.errors.email && (
                                                <p className="text-xs text-red-500">{step1Form.formState.errors.email.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                                    +91
                                                </span>
                                                <Input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    maxLength={10}
                                                    {...step1Form.register("phoneNumber")}
                                                    className="rounded-l-none h-12 border-gray-200 focus:ring-red-500"
                                                    disabled={otpSent || isLoading}
                                                />
                                            </div>
                                            {step1Form.formState.errors.phoneNumber && (
                                                <p className="text-xs text-red-500">{step1Form.formState.errors.phoneNumber.message}</p>
                                            )}
                                        </div>

                                        {otpSent && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <Label className="text-sm font-medium">Enter 6-digit OTP</Label>
                                                <InputOTP
                                                    maxLength={6}
                                                    value={step1Form.watch("otp")}
                                                    onChange={(value) => step1Form.setValue("otp", value, { shouldValidate: true })}
                                                >
                                                    <InputOTPGroup className="w-full justify-between">
                                                        <InputOTPSlot index={0} className="w-12 h-12 text-lg border-gray-300" />
                                                        <InputOTPSlot index={1} className="w-12 h-12 text-lg border-gray-300" />
                                                        <InputOTPSlot index={2} className="w-12 h-12 text-lg border-gray-300" />
                                                        <InputOTPSlot index={3} className="w-12 h-12 text-lg border-gray-300" />
                                                        <InputOTPSlot index={4} className="w-12 h-12 text-lg border-gray-300" />
                                                        <InputOTPSlot index={5} className="w-12 h-12 text-lg border-gray-300" />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Didn&apos;t receive it?</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        className={`font-semibold ${resendTimer > 0 ? "text-gray-400" : "text-red-600 hover:underline"}`}
                                                        disabled={resendTimer > 0}
                                                    >
                                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                                        disabled={isLoading || !isStep1Valid}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : otpSent ? (
                                            "Verify & Continue"
                                        ) : (
                                            "Get Verification OTP"
                                        )}
                                    </Button>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="panNumber" className="text-sm font-medium">PAN Number</Label>
                                            <Input
                                                id="panNumber"
                                                maxLength={10}
                                                {...step2Form.register("panNumber")}
                                                className="h-12 border-gray-200 focus:ring-red-500 uppercase"
                                                disabled={isLoading}
                                            />
                                            {step2Form.formState.errors.panNumber && (
                                                <p className="text-xs text-red-500">{step2Form.formState.errors.panNumber.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Upload PAN Card Image</Label>
                                            <div className="grid w-full items-center gap-1.5 font-sans">
                                                <FileUpload
                                                    accept="image/*,application/pdf"
                                                    placeholder="Click to upload PAN photo"
                                                    onFileChange={(file) => {
                                                        if (file) {
                                                            step2Form.setValue("panPhoto", file, { shouldValidate: true });
                                                            step2Form.clearErrors("panPhoto");
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {step2Form.formState.errors.panPhoto && (
                                                <p className="text-xs text-red-500">{step2Form.formState.errors.panPhoto.message as string}</p>
                                            )}
                                        </div>

                                        <div className="flex items-start space-x-3 pt-2">
                                            <Checkbox
                                                id="acceptance"
                                                checked={step2Form.watch("acceptance")}
                                                onCheckedChange={(checked) => {
                                                    step2Form.setValue("acceptance", checked as boolean, { shouldValidate: true });
                                                }}
                                                className="mt-1 border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                            <Label
                                                htmlFor="acceptance"
                                                className="text-sm text-gray-600 leading-snug cursor-pointer font-normal"
                                            >
                                                I accept that provided information is to the best of my knowledge
                                            </Label>
                                        </div>
                                        {step2Form.formState.errors.acceptance && (
                                            <p className="text-xs text-red-500">{step2Form.formState.errors.acceptance.message}</p>
                                        )}
                                    </div>

                                    <div className="flex">
                                        <Button
                                            type="submit"
                                            className="h-12 w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isLoading || !step2Form.formState.isValid}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
