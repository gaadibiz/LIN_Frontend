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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    dsaStep1Schema,
    dsaStep2Schema,
    type DSAStep1Data,
    type DSAStep2Data
} from "@/lib/dsa-schemas";
import { apiClient } from "@/lib/api";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface DSAApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DSAApplicationModal({ isOpen, onClose }: DSAApplicationModalProps) {
    const [step, setStep] = useState(1);
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Step 1 Form
    const step1Form = useForm<DSAStep1Data>({
        resolver: zodResolver(dsaStep1Schema),
        defaultValues: {
            fullName: "",
            email: "",
            phoneNumber: "",
            otp: "",
        },
    });

    // Step 2 Form
    const step2Form = useForm<DSAStep2Data>({
        resolver: zodResolver(dsaStep2Schema),
        defaultValues: {
            type: "individual",
            address: "",
            state: "",
            city: "",
            pincode: "",
            panNumber: "",
            acceptance: false,
        },
    });

    const step2Errors = step2Form.formState.errors as any;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleStep1Submit = async (data: DSAStep1Data) => {
        if (!otpSent) {
            setIsLoading(true);
            try {
                // Mock API call for OTP sending
                await new Promise(resolve => setTimeout(resolve, 1500));

                toast.success("OTP sent successfully to your mobile");
                setOtpSent(true);
                setResendTimer(30);
            } catch (error) {
                toast.error("Failed to send OTP. Please try again.");
            } finally {
                setIsLoading(false);
            }
        } else {
            // Verify OTP
            if (!data.otp || data.otp.length < 6) {
                toast.error("Please enter a valid 6-digit OTP");
                return;
            }

            setIsLoading(true);
            try {
                // Mock verification
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (data.phoneNumber === "9000000001" && data.otp === "123456") {
                    toast.success("Mobile number verified!");
                    setStep(2);
                } else if (data.otp === "123456") {
                    toast.success("Mobile number verified!");
                    setStep(2);
                } else {
                    toast.error("Invalid OTP. Please try again.");
                }
            } catch (error) {
                toast.error("Verification failed.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleStep2Submit = async (data: DSAStep2Data) => {
        setIsLoading(true);
        try {
            // Mock API submission
            console.log("Submitting DSA Application:", { ...step1Form.getValues(), ...data });
            await new Promise(resolve => setTimeout(resolve, 2000));

            setIsSuccess(true);
            toast.success("Application submitted successfully!");
        } catch (error) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        try {
            const phoneNumber = step1Form.getValues("phoneNumber");
            if (phoneNumber === "9000000001") {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                await apiClient.requestPhoneOtp(phoneNumber);
            }
            toast.success("New OTP sent");
            setResendTimer(30);
        } catch (error: any) {
            toast.error(error.message || "Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle closing and reset
    const handleClose = () => {
        onClose();
        // Reset after animation finishes
        setTimeout(() => {
            setStep(1);
            setOtpSent(false);
            setIsSuccess(false);
            step1Form.reset();
            step2Form.reset();
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            {isSuccess ? "Application Submitted!" : "Become a Direct Sales Agent"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {isSuccess
                                ? "We've received your details and will get back to you soon."
                                : `Step ${step} of 2: ${step === 1 ? "Personal Information" : "DSA Details"}`}
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
                            <Button onClick={handleClose} className="mt-4 bg-red-600 hover:bg-red-700">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
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
                                                    onChange={(value) => step1Form.setValue("otp", value)}
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
                                        disabled={isLoading}
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
                                    <Tabs
                                        defaultValue="individual"
                                        className="w-full"
                                        onValueChange={(val) => {
                                            step2Form.setValue("type", val as "individual" | "firm");
                                            step2Form.clearErrors();
                                        }}
                                    >
                                        <TabsList className="grid w-full grid-cols-2 mb-6">
                                            <TabsTrigger value="individual">Individual</TabsTrigger>
                                            <TabsTrigger value="firm">Firm</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="individual" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ind-address">Address</Label>
                                                <Input
                                                    id="ind-address"
                                                    {...step2Form.register("address")}
                                                    className="border-gray-200"
                                                />
                                                {step2Errors.address && (
                                                    <p className="text-xs text-red-500">{step2Errors.address.message}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ind-state">State</Label>
                                                    <Input id="ind-state" {...step2Form.register("state")} className="border-gray-200" />
                                                    {step2Errors.state && (
                                                        <p className="text-xs text-red-500">{step2Errors.state.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ind-city">City</Label>
                                                    <Input id="ind-city" {...step2Form.register("city")} className="border-gray-200" />
                                                    {step2Errors.city && (
                                                        <p className="text-xs text-red-500">{step2Errors.city.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ind-pincode">PIN Code</Label>
                                                    <Input id="ind-pincode" maxLength={6} {...step2Form.register("pincode")} className="border-gray-200" />
                                                    {step2Errors.pincode && (
                                                        <p className="text-xs text-red-500">{step2Errors.pincode.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ind-pan">PAN Number</Label>
                                                    <Input
                                                        id="ind-pan"
                                                        maxLength={10}
                                                        {...step2Form.register("panNumber")}
                                                        className="uppercase border-gray-200"
                                                        onChange={(e) => {
                                                            const upper = e.target.value.toUpperCase();
                                                            step2Form.setValue("panNumber", upper, { shouldValidate: true });
                                                        }}
                                                        value={step2Form.watch("panNumber")}
                                                    />
                                                    {step2Errors.panNumber && (
                                                        <p className="text-xs text-red-500">{step2Errors.panNumber.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Upload PAN Card Image</Label>
                                                <FileUpload
                                                    accept="image/*,application/pdf"
                                                    onFileChange={(file) => {
                                                        if (file) {
                                                            step2Form.setValue("panPhoto", file as any);
                                                            step2Form.clearErrors("panPhoto");
                                                        }
                                                    }}
                                                />
                                                {step2Errors.panPhoto && (
                                                    <p className="text-xs text-red-500">{step2Errors.panPhoto.message}</p>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="firm" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firm-name">Firm Name</Label>
                                                <Input id="firm-name" {...step2Form.register("firmName" as any)} className="border-gray-200" />
                                                {step2Errors.firmName && (
                                                    <p className="text-xs text-red-500">{step2Errors.firmName.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="firm-address">Address</Label>
                                                <Input id="firm-address" {...step2Form.register("address")} className="border-gray-200" />
                                                {step2Errors.address && (
                                                    <p className="text-xs text-red-500">{step2Errors.address.message}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="firm-state">State</Label>
                                                    <Input id="firm-state" {...step2Form.register("state")} className="border-gray-200" />
                                                    {step2Errors.state && (
                                                        <p className="text-xs text-red-500">{step2Errors.state.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="firm-city">City</Label>
                                                    <Input id="firm-city" {...step2Form.register("city")} className="border-gray-200" />
                                                    {step2Errors.city && (
                                                        <p className="text-xs text-red-500">{step2Errors.city.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="firm-pincode">PIN Code</Label>
                                                    <Input id="firm-pincode" maxLength={6} {...step2Form.register("pincode")} className="border-gray-200" />
                                                    {step2Errors.pincode && (
                                                        <p className="text-xs text-red-500">{step2Errors.pincode.message}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="firm-gst">GST/Trade License</Label>
                                                    <Input
                                                        id="firm-gst"
                                                        {...step2Form.register("gstLicense" as any)}
                                                        className="uppercase border-gray-200"
                                                        onChange={(e) => {
                                                            const upper = e.target.value.toUpperCase();
                                                            step2Form.setValue("gstLicense" as any, upper, { shouldValidate: true });
                                                        }}
                                                        value={(step2Form.watch("gstLicense" as any) as string) || ""}
                                                    />
                                                    {step2Errors.gstLicense && (
                                                        <p className="text-xs text-red-500">{step2Errors.gstLicense.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="firm-pan">Firm&apos;s PAN (Optional)</Label>
                                                <Input
                                                    id="firm-pan"
                                                    maxLength={10}
                                                    {...step2Form.register("firmPan" as any)}
                                                    className="uppercase border-gray-200"
                                                    placeholder="ABCDE1234F"
                                                    onChange={(e) => {
                                                        const upper = e.target.value.toUpperCase();
                                                        step2Form.setValue("firmPan" as any, upper, { shouldValidate: true });
                                                    }}
                                                    value={(step2Form.watch("firmPan" as any) as string) || ""}
                                                />
                                                {step2Errors.firmPan && (
                                                    <p className="text-xs text-red-500">{step2Errors.firmPan.message}</p>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    <div className="flex items-start space-x-3 pt-2">
                                        <Checkbox
                                            id="dsa-acceptance"
                                            checked={step2Form.watch("acceptance")}
                                            onCheckedChange={(checked) => {
                                                step2Form.setValue("acceptance", checked as boolean);
                                            }}
                                            className="mt-1 border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                        <Label
                                            htmlFor="dsa-acceptance"
                                            className="text-sm text-gray-600 leading-snug cursor-pointer font-normal"
                                        >
                                            I accept that provided information is to the best of my knowledge
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-12 w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        disabled={isLoading || !step2Form.watch("acceptance")}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
