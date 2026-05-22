"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { ArrowLeft, Loader2, CheckCircle2, UserCircle2, Briefcase, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

// Types & Schemas
type AgentRole = "affiliate" | "dsa" | "bc"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

function AgentLoginForm() {
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Role (Visual), 2: Credentials
    const [phone, setPhone] = useState("")
    const [loginOtp, setLoginOtp] = useState("")
    const [resetInput, setResetInput] = useState("")
    const [resetOtp, setResetOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const loginForm = useForm<LoginFormData>({
        mode: "onChange",
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" }
    })

    const handleRoleSelect = (selectedRole: AgentRole) => {
        console.log(`[Login] Role selected: ${selectedRole}`);
        setRole(selectedRole)
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
        setError(null)
        loginForm.reset()
    }

    const handleLoginSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log("[Login] Calling API...");
            const response = await apiClient.loginPartner(data.email, data.password);



            if (response.token) {
                console.log("[Login] Success! Token received for:", response.partnerType);
                toast.success("Login Successful!");

                // Determine redirect path
                let redirectPath = "/affiliate-dashboard"; // Default
                const partnerType = response.partnerType?.toLowerCase();

                if (partnerType === 'dsa') redirectPath = "/dsa-dashboard";
                else if (partnerType === 'bc') redirectPath = "/bc-dashboard";
                else if (partnerType === 'affiliate') redirectPath = "/affiliate-dashboard";

                console.log(`[Login] Redirecting to ${redirectPath}...`);

                // Small delay for UX
                setTimeout(() => {
                    router.push(redirectPath);
                }, 1000);
            } else {
                console.warn("[Login] No token in response");
                setError("Login failed. No access token provided.");
            }

        } catch (err: any) {
            console.error("[Login] Error:", err);
            setError(err.message || "Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                {/* Left Panel - Branding (hidden on mobile so form shows first) */}
                <div className="hidden lg:flex flex-col justify-center p-8 lg:p-16">
                    <div className="max-w-md mx-auto">
                        {/* Logo */}
                        <div className="mb-12">
                            <Link href="/">
                                <Image src="/lin-logo.png" alt="Loan In Need" width={120} height={40} />
                            </Link>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Agent <span className="text-blue-600">Partner</span> Portal —<br />
                            Grow With Us
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 mb-12">
                            Join our network of professionals and help people get the financial support they need while building your own success story.
                        </p>

                        {/* Illustration */}
                        <div className="flex justify-start">
                            <Image
                                src="/login-money.png"
                                alt="Agent illustration"
                                width={200}
                                height={200}
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="bg-white flex flex-col justify-center p-8 lg:p-16">
                    <div className="max-w-md mx-auto w-full">

                        {/* Step 1: Role Selection */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Welcome <span className="text-blue-600">Partner</span>
                                    </h2>
                                    <p className="text-gray-600 text-sm">Please select your partnership type to login</p>
                                </div>

                                <div className="grid gap-4">
                                    <button
                                        onClick={() => handleRoleSelect("affiliate")}
                                        className="flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                                    >
                                        <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-gray-900">Affiliate</p>
                                            <p className="text-sm text-gray-500">Earn through referrals</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleRoleSelect("dsa")}
                                        className="flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                                    >
                                        <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                            <Briefcase className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-gray-900">Direct Sales Agent</p>
                                            <p className="text-sm text-gray-500">Expert in loan processing</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleRoleSelect("bc")}
                                        className="flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                                    >
                                        <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                                            <UserCircle2 className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-gray-900">Business Consultant</p>
                                            <p className="text-sm text-gray-500">Professional advisory</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Phone Entry (OTP Flow) */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    <span>Back to roles</span>
                                </button>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                                        {role === "dsa" ? "Direct Sales Agent" : role === "bc" ? "Business Consultant" : "Affiliate"} <span className="text-blue-600">Login</span>
                                    </h2>
                                    <p className="text-gray-600 text-sm">Enter your registered mobile number to receive an OTP</p>
                                </div>

                                <div className="space-y-6">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-red-600 text-sm font-medium">{error}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mobile Number
                                            </label>
                                            <div className="flex gap-2">
                                                <div className="w-16 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400">
                                                    +91
                                                </div>
                                                <Input
                                                    id="login-phone"
                                                    placeholder="98309 12345"
                                                    className="h-12 flex-1"
                                                    maxLength={10}
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            if (!phone || phone.length !== 10) return toast.error("Please enter a valid 10-digit number");

                                            setIsLoading(true);
                                            setError(null);
                                            try {
                                                const res = await apiClient.requestPartnerLoginOtp(phone);
                                                toast.success(res.message);
                                                localStorage.setItem('loginPhone', phone);
                                                setStep(5); // Go to OTP verification step
                                            } catch (err: any) {
                                                setError(err.message || "Failed to send OTP. Is your number registered?");
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-semibold shadow-lg shadow-blue-100"
                                        disabled={isLoading || phone.length !== 10}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Send Login OTP"}
                                    </Button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">OR</span></div>
                                    </div>

                                    <button
                                        onClick={() => setStep(6)} // Step 6: Email/Password login
                                        className="w-full text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                                    >
                                        Login with Email & Password
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 5: OTP Verification for Login */}
                        {step === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    <span>Back</span>
                                </button>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Mobile</h2>
                                    <p className="text-gray-600 text-sm">Enter the 6-digit code sent to your registered number.</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex justify-center py-4">
                                        <InputOTP maxLength={6} value={loginOtp} onChange={setLoginOtp}>
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={0} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                                <InputOTPSlot index={1} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                                <InputOTPSlot index={2} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                                <InputOTPSlot index={3} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                                <InputOTPSlot index={4} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                                <InputOTPSlot index={5} className="rounded-xl border-2 h-14 w-11 text-xl font-bold" />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            const phone = localStorage.getItem('loginPhone');

                                            if (!loginOtp || loginOtp.length !== 6) return toast.error("Please enter 6-digit OTP");
                                            if (!phone) return setStep(2);

                                            setIsLoading(true);
                                            try {
                                                const response = await apiClient.verifyPartnerLoginOtp(phone, loginOtp);
                                                toast.success("Welcome back!");

                                                // Handle redirection logic
                                                let redirectPath = "/affiliate-dashboard";
                                                const pType = response.partnerType?.toLowerCase();
                                                if (pType === 'dsa') redirectPath = "/dsa-dashboard";
                                                else if (pType === 'bc') redirectPath = "/bc-dashboard";

                                                router.push(redirectPath);
                                            } catch (err: any) {
                                                toast.error(err.message || "Invalid OTP");
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl font-bold text-lg shadow-xl shadow-blue-100"
                                        disabled={isLoading || loginOtp.length !== 6}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify & Sign In"}
                                    </Button>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">Didn't receive code?</p>
                                        <button onClick={() => setStep(2)} className="text-blue-600 text-sm font-bold hover:underline">Resend OTP</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Legacy Email/Password Login (Hidden by default unless toggled) */}
                        {step === 6 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    <span>Back to OTP Login</span>
                                </button>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                                    <p className="text-gray-600 text-sm">Login with your email and password</p>
                                </div>

                                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <Input {...loginForm.register("email")} type="email" placeholder="partner@loaninneed.com" className="h-12" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                            <div className="relative">
                                                <Input {...loginForm.register("password")} type={showPassword ? "text" : "password"} placeholder="Enter your password" className="h-12 pr-10" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                    {showPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button type="button" onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline">Forgot password?</button>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-semibold" disabled={isLoading || !loginForm.formState.isValid}>
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Login Securely"}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Forgot Password - Request OTP */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    <span>Back to login</span>
                                </button>

                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                                    <p className="text-gray-600 text-sm">Enter your registered email or phone to reset your password</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email or Phone Number
                                            </label>
                                            <Input
                                                id="reset-input"
                                                placeholder="Enter email or phone"
                                                className="h-12"
                                                value={resetInput}
                                                onChange={(e) => setResetInput(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            if (!resetInput) return toast.error("Please enter email or phone");

                                            setIsLoading(true);
                                            try {
                                                const res = await apiClient.forgotPartnerPassword(resetInput);
                                                toast.success(res.message);
                                                // Store the phone number for next step if returned, otherwise assume input was phone
                                                localStorage.setItem('resetPhone', (res as any).phone || resetInput);
                                                setStep(4);
                                            } catch (err: any) {
                                                toast.error(err.message || "Failed to send OTP");
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-semibold"
                                        disabled={isLoading || !resetInput}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Forgot Password - Verify OTP & Set Password */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                                    <p className="text-gray-600 text-sm">Enter the OTP sent to your mobile and set a new password.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Enter OTP (Master: 261102)
                                            </label>
                                            <InputOTP maxLength={6} value={resetOtp} onChange={setResetOtp}>
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                placeholder="Enter new password"
                                                className="h-12"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            const phone = localStorage.getItem('resetPhone');

                                            if (!resetOtp || resetOtp.length !== 6) return toast.error("Please enter valid OTP");
                                            if (!newPassword) return toast.error("Please enter new password");
                                            if (!phone) {
                                                toast.error("Session expired, please start again");
                                                setStep(3);
                                                return;
                                            }

                                            setIsLoading(true);
                                            try {
                                                const res = await apiClient.resetPartnerPassword(phone, resetOtp, newPassword);
                                                toast.success("Password reset successful! Please login.");
                                                setStep(2);
                                            } catch (err: any) {
                                                toast.error(err.message || "Failed to reset password");
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-semibold"
                                        disabled={isLoading || resetOtp.length !== 6 || !newPassword}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
                                    </Button>

                                    <button
                                        onClick={() => setStep(3)}
                                        className="w-full text-sm text-gray-500 hover:text-gray-900"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AgentLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        }>
            <AgentLoginForm />
        </Suspense>
    )
}
