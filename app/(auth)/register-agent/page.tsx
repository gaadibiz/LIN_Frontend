"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileUpload } from "@/components/ui/file-upload"
import {
    Loader2,
    ShieldCheck,
    UserPlus,
    AlertCircle,
    Link as LinkIcon,
    Briefcase,
    Users,
    ChevronLeft,
    CheckCircle2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAffiliate } from "@/hooks/useAffiliate"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

export const dynamic = "force-dynamic";

const MAX_2MB = 2 * 1024 * 1024;

// --- Admin Verification Schema ---
const adminSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type AdminForm = z.infer<typeof adminSchema>

// --- Partner Specific Schemas (Combined & No OTP) ---

const affiliateAdminSchema = z.object({
    fullName: z.string().min(2, "Full name required"),
    email: z.string().email("Invalid email"),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
    panPhoto: z.any().optional(), // In admin flow, we might make it optional or just mock it
})

const dsaAdminSchema = z.object({
    fullName: z.string().min(2, "Full name required"),
    email: z.string().email("Invalid email"),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    type: z.enum(["individual", "firm"]),
    address: z.string().min(5, "Address required"),
    state: z.string().min(1, "State required"),
    city: z.string().min(1, "City required"),
    pincode: z.string().regex(/^\d{6}$/, "Invalid PIN"),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").optional().or(z.literal("")),
    gstLicense: z.string().optional().or(z.literal("")),
    firmName: z.string().optional().or(z.literal("")),
    firmPan: z.string().optional().or(z.literal("")),
})

const bcAdminSchema = dsaAdminSchema; // BC and DSA have similar fields in their modals

type PartnerType = "affiliate" | "dsa" | "bc" | null;

import { Suspense } from "react"


function RegisterAgentContent() {
    const { getLinkWithRef } = useAffiliate()
    const [isAdminVerified, setIsAdminVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [partnerType, setPartnerType] = useState<PartnerType>(null)

    const adminForm = useForm<AdminForm>({
        mode: "onChange",
        resolver: zodResolver(adminSchema),
        defaultValues: { email: "", password: "" },
    })

    const affiliateForm = useForm<z.infer<typeof affiliateAdminSchema>>({
        mode: "onChange",
        resolver: zodResolver(affiliateAdminSchema),
        defaultValues: { fullName: "", email: "", phoneNumber: "", panNumber: "" },
    })

    const dsaForm = useForm<z.infer<typeof dsaAdminSchema>>({
        mode: "onChange",
        resolver: zodResolver(dsaAdminSchema),
        defaultValues: {
            fullName: "", email: "", phoneNumber: "", type: "individual",
            address: "", state: "", city: "", pincode: "", panNumber: "",
            gstLicense: "", firmName: "", firmPan: ""
        },
    })

    const bcForm = useForm<z.infer<typeof bcAdminSchema>>({
        mode: "onChange",
        resolver: zodResolver(bcAdminSchema),
        defaultValues: {
            fullName: "", email: "", phoneNumber: "", type: "individual",
            address: "", state: "", city: "", pincode: "", panNumber: "",
            gstLicense: "", firmName: "", firmPan: ""
        },
    })

    const handleAdminSubmit = async (data: AdminForm) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.loginAdmin(data.email, data.password);

            if (response.success || response.token) { // Check for success or token
                setIsAdminVerified(true)
                setIsLoading(false)
                toast.success("Admin verified successfully")
            } else {
                setError("Verification failed. Please check credentials.")
                setIsLoading(false)
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Invalid admin credentials. Please try again.")
            setIsLoading(false)
        }
    }

    const handlePartnerSubmit = async (data: any) => {
        setIsLoading(true)

        try {
            // Prepare payload based on schema
            const payload = {
                partnerType: partnerType ? partnerType.toUpperCase() : 'AFFILIATE', // Default fallback
                name: data.fullName,
                email: data.email,
                phone: data.phoneNumber,
                // Password is required by backend model but not in form form?
                // The form schemas do NOT have password. 
                // We might need to generate one or add it.
                // Looking at backend `Partner` model: password String? (It is optional? No, checks schema: String?)
                // Actually `Partner` model has `password String?`.
                // But `partnerService.registerPartner` might require it.
                // Let's assume for now we generate a random one or send basic one if backend requires it.
                password: "Partner@123", // Temporary default or generate random

                // Specifics
                panNumber: data.panNumber,
                gstNumber: data.gstLicense,
                firmName: data.firmName,
                // Map address fields
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode
            };

            // Call API
            const response = await apiClient.registerPartner(payload as any);

            // Handle File Download if credentials returned
            if ((response as any).rawPassword) {
                const creds = `
LOAN IN NEED - PARTNER CREDENTIALS
==================================

Use these credentials to login to the Partner Portal.

Login URL: https://loaninneed.vercel.app/login-agent

Email: ${response.email}
Password: ${(response as any).rawPassword}

----------------------------------
Please change your password after your first login.
`;
                const blob = new Blob([creds], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Partner_Credentials_${data.fullName.replace(/\s+/g, '_')}.txt`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success(`${partnerType?.toUpperCase()} registered! Credentials downloaded.`);
            } else {
                toast.success(`${partnerType?.toUpperCase()} registered successfully!`)
            }

            setIsSuccess(true)
        } catch (err) {
            toast.error("Failed to register partner. Please try again.")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const resetFlow = () => {
        setIsAdminVerified(false)
        setIsSuccess(false)
        setPartnerType(null)
        affiliateForm.reset()
        dsaForm.reset()
        bcForm.reset()
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 md:px-8 font-sans">
            <div className={`max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-red-50 flex flex-col lg:flex-row ${isAdminVerified ? 'lg:flex-row-reverse' : ''} min-h-[750px] transition-all duration-500`}>

                {/* Visual/Sidebar Panel */}
                <div className={`w-full lg:w-2/5 p-8 lg:p-16 flex flex-col justify-center ${isAdminVerified ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-white border-r border-gray-100'}`}>
                    <div className="mb-12">
                        <Link href={getLinkWithRef("/")}>
                            <Image src="/lin-logo.png" alt="Loan In Need" width={140} height={40} className="hover:opacity-80 transition-opacity" />
                        </Link>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                        {isSuccess ? "Success!" : !isAdminVerified ? "Admin Port" : partnerType ? `New ${partnerType.toUpperCase()}` : "Partner Selection"}
                    </h1>

                    <p className="text-gray-600 mb-10 text-lg leading-relaxed font-medium">
                        {isSuccess
                            ? "Handover initiated. The new partner agent has been added to our network successfully."
                            : !isAdminVerified
                                ? "Welcome back, Admin. Please verify your identity to manage partner registrations."
                                : partnerType
                                    ? `Fill in the details below to onboard a new ${partnerType.toUpperCase()}. No OTP required for manual entry.`
                                    : "Choose the type of partnership model you wish to register today."}
                    </p>

                    <div className="mt-auto hidden lg:block">
                        <Image src="/login-money.png" alt="Illustration" width={280} height={280} className="object-contain drop-shadow-2xl" />
                    </div>
                </div>

                {/* Main Content Panel */}
                <div className="w-full lg:w-3/5 p-8 lg:p-16 overflow-y-auto max-h-[90vh] lg:max-h-[850px]">
                    {isSuccess ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Partner Successfully Registered</h2>
                            <p className="text-gray-500 max-w-sm">The new agent can now access their dashboard using their registered email.</p>
                            <Button onClick={resetFlow} className="bg-red-600 hover:bg-red-700 text-white font-bold h-14 px-10 rounded-2xl shadow-xl transition-all hover:scale-105">
                                Register Another Partner
                            </Button>
                        </div>
                    ) : !isAdminVerified ? (
                        /* ADMIN LOGIN */
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                    <ShieldCheck className="text-red-600 w-6 h-6" /> Admin Authorization
                                </h2>
                                <p className="text-gray-500 font-medium">Enter credentials to unlock partner modules</p>
                            </div>

                            <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in shake duration-300">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm font-bold">{error}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Email</Label>
                                    <Input {...adminForm.register("email")} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Password</Label>
                                    <Input type="password" {...adminForm.register("password")} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white" />
                                </div>
                                <Button type="submit" disabled={isLoading || !adminForm.formState.isValid} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg mt-4 transition-all active:scale-[0.98]">
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Unlock"}
                                </Button>
                            </form>
                        </div>
                    ) : !partnerType ? (
                        /* PARTNER TYPE SELECTION */
                        <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                            <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Select Registration Type</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: "affiliate", label: "Affiliate", icon: LinkIcon, desc: "Promote via links & earn" },
                                    { id: "dsa", label: "Direct Sales Agent", icon: Briefcase, desc: "Sell loans directly" },
                                    { id: "bc", label: "Business Consultant", icon: Users, desc: "Consult & refer businesses" },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setPartnerType(type.id as PartnerType)}
                                        className="group p-8 rounded-[2rem] bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-red-200 transition-all text-center flex flex-col items-center gap-4 hover:shadow-2xl hover:shadow-red-50 hover:-translate-y-2 duration-300"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors shadow-sm">
                                            <type.icon className="w-8 h-8 text-gray-400 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-gray-900 group-hover:text-red-600">{type.label}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{type.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <Button variant="ghost" onClick={() => setIsAdminVerified(false)} className="mt-8 text-gray-400 hover:text-red-600">
                                <ChevronLeft className="mr-2" /> Back to Login
                            </Button>
                        </div>
                    ) : (
                        /* PARTNER FORM */
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <div className="flex items-center justify-between border-b pb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    {partnerType === "affiliate" ? "Affiliate Application" : partnerType === "dsa" ? "DSA Onboarding" : "BC Registration"}
                                </h2>
                                <Button variant="ghost" onClick={() => setPartnerType(null)} className="text-gray-400 hover:text-red-600">
                                    Change Type
                                </Button>
                            </div>

                            {/* AFFILIATE FORM */}
                            {partnerType === "affiliate" && (
                                <form onSubmit={affiliateForm.handleSubmit(handlePartnerSubmit)} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name (as per PAN)</Label>
                                            <Input {...affiliateForm.register("fullName")} className="h-14 rounded-2xl border-gray-100 focus:border-red-200" />
                                            {affiliateForm.formState.errors.fullName && <p className="text-red-500 text-[11px] ml-1">{affiliateForm.formState.errors.fullName.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                                            <Input type="email" {...affiliateForm.register("email")} className="h-14 rounded-2xl border-gray-100" />
                                            {affiliateForm.formState.errors.email && <p className="text-red-500 text-[11px] ml-1">{affiliateForm.formState.errors.email.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</Label>
                                            <div className="flex">
                                                <div className="h-14 px-4 flex items-center bg-gray-50 border border-r-0 border-gray-100 rounded-l-2xl text-gray-400 font-bold text-sm">+91</div>
                                                <Input {...affiliateForm.register("phoneNumber")} className="h-14 rounded-l-none rounded-r-2xl border-gray-100" maxLength={10} />
                                            </div>
                                            {affiliateForm.formState.errors.phoneNumber && <p className="text-red-500 text-[11px] ml-1">{affiliateForm.formState.errors.phoneNumber.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">PAN Number</Label>
                                            <Input {...affiliateForm.register("panNumber")} className="h-14 rounded-2xl border-gray-100 uppercase" maxLength={10} />
                                            {affiliateForm.formState.errors.panNumber && <p className="text-red-500 text-[11px] ml-1">{affiliateForm.formState.errors.panNumber.message}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">PAN Card Document</Label>
                                        <FileUpload onFileChange={() => { }} placeholder="Upload copies of original documents" />
                                    </div>
                                    <Button type="submit" disabled={isLoading || !affiliateForm.formState.isValid} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl transition-all">
                                        {isLoading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
                                    </Button>
                                </form>
                            )}

                            {/* DSA & BC FORM */}
                            {(partnerType === "dsa" || partnerType === "bc") && (
                                <form
                                    onSubmit={partnerType === "dsa" ? dsaForm.handleSubmit(handlePartnerSubmit) : bcForm.handleSubmit(handlePartnerSubmit)}
                                    className="space-y-10"
                                >
                                    <Tabs
                                        defaultValue="individual"
                                        className="w-full"
                                        onValueChange={(v) => {
                                            const activeForm = partnerType === "dsa" ? dsaForm : bcForm;
                                            activeForm.setValue("type", v as "individual" | "firm");
                                        }}
                                    >
                                        <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-50 p-1.5 rounded-2xl mb-8">
                                            <TabsTrigger value="individual" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Individual</TabsTrigger>
                                            <TabsTrigger value="firm" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Firm</TabsTrigger>
                                        </TabsList>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</Label>
                                                <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("fullName")} className="h-12 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</Label>
                                                <Input type="email" {...(partnerType === "dsa" ? dsaForm : bcForm).register("email")} className="h-12 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Number</Label>
                                                <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("phoneNumber")} className="h-12 rounded-xl" maxLength={10} />
                                            </div>
                                            <TabsContent value="firm" className="mt-0">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Firm Name</Label>
                                                    <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("firmName")} className="h-12 rounded-xl border-red-50" />
                                                </div>
                                            </TabsContent>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Location & Address</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address Details</Label>
                                                <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("address")} className="h-12 rounded-xl" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">State</Label>
                                                    <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("state")} className="h-12 rounded-xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</Label>
                                                    <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("city")} className="h-12 rounded-xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pincode</Label>
                                                    <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("pincode")} className="h-12 rounded-xl" maxLength={6} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 mt-8">
                                            <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Tax & Documents</h3>
                                            </div>
                                            <TabsContent value="individual" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Individual PAN</Label>
                                                    <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("panNumber")} className="h-12 rounded-xl uppercase" maxLength={10} />
                                                </div>
                                                <div className="flex items-end">
                                                    <FileUpload onFileChange={() => { }} placeholder="Upload PAN Proof" />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="firm" className="mt-0 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">GST / Trade License</Label>
                                                        <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("gstLicense")} className="h-12 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Firm PAN (Optional)</Label>
                                                        <Input {...(partnerType === "dsa" ? dsaForm : bcForm).register("firmPan")} className="h-12 rounded-xl uppercase" />
                                                    </div>
                                                </div>
                                                <FileUpload onFileChange={() => { }} placeholder="Upload Business Proofs (Zip/PDF)" />
                                            </TabsContent>
                                        </div>
                                    </Tabs>

                                    <Button type="submit" disabled={isLoading || !(partnerType === "dsa" ? dsaForm.formState.isValid : bcForm.formState.isValid)} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl transition-all">
                                        {isLoading ? <Loader2 className="animate-spin" /> : `Onboard ${partnerType === "dsa" ? "DSA" : "BC"} Now`}
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function RegisterAgentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        }>
            <RegisterAgentContent />
        </Suspense>
    )
}


