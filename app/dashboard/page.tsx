"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAffiliate } from "@/hooks/useAffiliate";

import {
    LayoutDashboard,
    Search,
    PlusCircle,
    Wallet,
    History,
    Headphones,
    LogOut,
    Lock,
    PencilLine,
    Check,
    ArrowRight,
    Calendar,
    CreditCard,
    ArrowUpRight,
    Mail,
    MessageCircle,
    Loader2,
    ChevronDown
} from "lucide-react";

export const dynamic = "force-dynamic";

function DashboardContent() {
    const router = useRouter();
    const { getLinkWithRef } = useAffiliate();
    const [activeTab, setActiveTab] = React.useState("Dashboard");
    const [isLoading, setIsLoading] = React.useState(true); // Loading state
    const [loanHistoryData, setLoanHistoryData] = React.useState<any[]>([]);
    const [searchQuery, setSearchQuery] = React.useState({ appId: "", phone: "" });
    const [trackResult, setTrackResult] = React.useState<any>(null);

    const [editingFields, setEditingFields] = React.useState<Record<string, boolean>>({});

    const sidebarItems = [
        { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Track loan", icon: <Search size={20} /> },
        { name: "Apply new loan", icon: <PlusCircle size={20} /> },
        { name: "Repay loan", icon: <Wallet size={20} /> },
        { name: "Loan history", icon: <History size={20} /> },
        { name: "Support", icon: <Headphones size={20} /> },
    ];

    // Initial empty states
    const [personalDetails, setPersonalDetails] = React.useState([
        { label: "First name as per PAN", value: "Loading...", locked: true },
        { label: "Last name", value: "Loading...", locked: true },
        { label: "Date of birth as per PAN", value: "Loading...", locked: true },
        { label: "Mobile number", value: "Loading...", locked: true },
        { label: "Gender", value: "Loading...", locked: true },
        { label: "PAN", value: "Loading...", locked: true },
    ]);

    const [employmentData, setEmploymentData] = React.useState([
        { id: "emp_1", label: "Company name", value: "Not added" },
        { id: "emp_2", label: "Company address", value: "Not added" },
        { id: "emp_3", label: "Monthly income", value: "Not added" },
        { id: "emp_4", label: "Stability in current job", value: "Not added" },
    ]);

    const [addressData, setAddressData] = React.useState([
        { id: "addr_1", label: "Current address with landmark", value: "Not added" },
        { id: "addr_2", label: "Current address type", value: "Not added" },
        { id: "addr_3", label: "Permanent address", value: "Not added" },
    ]);

    // State for real loan history already declared above

    // Fetch data on mount
    React.useEffect(() => {
        async function fetchData() {
            try {
                // Import apiClient dynamically or assume it's imported at top (Added import below)
                const { apiClient } = await import("@/lib/api");
                const response = await apiClient.getCompleteProfile();

                if (response && response.profile) {
                    const p = response.profile as any;

                    // Split name into first and last (simple logic)
                    const fullName = p.name || "";
                    const nameParts = fullName.split(" ");
                    const firstName = nameParts[0] || "-";
                    const lastName = nameParts.slice(1).join(" ") || "-";
                    const dob = p.dob ? new Date(p.dob).toLocaleDateString("en-GB") : "-";

                    setPersonalDetails([
                        { label: "First name as per PAN", value: firstName, locked: true },
                        { label: "Last name", value: lastName, locked: true },
                        { label: "Date of birth as per PAN", value: dob, locked: true },
                        { label: "Mobile number", value: p.phone || "-", locked: true },
                        { label: "Gender", value: p.gender || "-", locked: true },
                        { label: "PAN", value: p.panVerification?.panNumber || "Not Verified", locked: true },
                    ]);

                    if (p.employment) {
                        setEmploymentData([
                            { id: "emp_1", label: "Company name", value: p.employment.employerName || "-" },
                            { id: "emp_2", label: "Company address", value: p.employment.companyAddress || "-" },
                            { id: "emp_3", label: "Monthly income", value: p.employment.monthlyIncome ? `₹${p.employment.monthlyIncome}` : "-" },
                            { id: "emp_4", label: "Stability in current job", value: p.employment.stability || "-" },
                        ]);
                    }

                    if (p.address) {
                        setAddressData([
                            { id: "addr_1", label: "Current address with landmark", value: p.address.currentAddress || "-" },
                            { id: "addr_2", label: "Current address type", value: p.address.currentAddressType || "-" },
                            { id: "addr_3", label: "Permanent address", value: p.address.permanentAddress || "-" },
                        ]);
                    }

                    // Extract and merge actual loan applications/loans from the profile
                    const allData: any[] = [];

                    if (p.loanApplications && Array.isArray(p.loanApplications)) {
                        p.loanApplications.forEach((app: any) => {
                            allData.push({
                                id: `APP-${app.id}`,
                                rawId: app.id,
                                number: `LN${app.id.toString().padStart(10, '0')}`,
                                amount: app.loanAmount ? `₹${app.loanAmount.toLocaleString()}` : "Evaluating",
                                rawAmount: app.loanAmount,
                                date: new Date(app.createdAt).toLocaleDateString("en-GB", {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                }),
                                status: app.status || "PENDING",
                                type: app.loanType?.replace(/_/g, " ") || "Personal Loan",
                                source: 'Application'
                            });
                        });
                    }

                    if (p.loans && Array.isArray(p.loans)) {
                        p.loans.forEach((loan: any) => {
                            // Check if already captured by application (basic de-dupe attempt by amount/date if needed, but safer to show both if distinct)
                            // Actually, just show both.
                            allData.push({
                                id: `LOAN-${loan.id}`,
                                rawId: loan.id,
                                number: `LN${loan.id.toString().padStart(10, '0')}`,
                                amount: `₹${loan.loanAmount.toLocaleString()}`,
                                rawAmount: loan.loanAmount,
                                date: new Date(loan.createdAt).toLocaleDateString("en-GB", {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                }),
                                status: loan.status || "PENDING",
                                type: loan.purposeOfLoan || "Personal Loan",
                                source: 'Loan'
                            });
                        });
                    }

                    // De-duplicate if they have very similar traits (same date and amount)
                    const uniqueData = allData.filter((item, index, self) =>
                        index === self.findIndex((t) => (
                            t.rawAmount === item.rawAmount && t.date === item.date && t.status === item.status
                        ))
                    );

                    setLoanHistoryData(uniqueData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Refs for all editable inputs to focus them
    const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

    const toggleEdit = (fieldId: string) => {
        const isNowEditing = !editingFields[fieldId];
        setEditingFields(prev => ({
            ...prev,
            [fieldId]: isNowEditing
        }));

        if (isNowEditing) {
            // Focus the input immediately after state update
            setTimeout(() => {
                inputRefs.current[fieldId]?.focus();
            }, 0);
        }
    };

    const handleBlur = (fieldId: string) => {
        // Delay ensures that if we clicked the "Check" button, that click finishes first
        setTimeout(() => {
            setEditingFields(prev => ({
                ...prev,
                [fieldId]: false
            }));
        }, 150);
    };

    const handleInputChange = (id: string, newValue: string, type: 'employment' | 'address') => {
        if (type === 'employment') {
            setEmploymentData(prev => prev.map(item => item.id === id ? { ...item, value: newValue } : item));
        } else {
            setAddressData(prev => prev.map(item => item.id === id ? { ...item, value: newValue } : item));
        }
    };

    const handleUpdateEmployment = async () => {
        setIsLoading(true);
        try {
            const { apiClient } = await import("@/lib/api");

            // Map array back to object
            const data = {
                companyName: employmentData.find(i => i.id === "emp_1")?.value || "",
                companyAddress: employmentData.find(i => i.id === "emp_2")?.value || "",
                monthlyIncome: parseFloat((employmentData.find(i => i.id === "emp_3")?.value || "0").replace(/[^0-9.]/g, "")),
                stability: employmentData.find(i => i.id === "emp_4")?.value || "",
            };

            await apiClient.updateEmployment(data);
            alert("Employment details updated successfully!");
        } catch (error) {
            console.error("Failed to update employment:", error);
            alert("Failed to update details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateAddress = async () => {
        setIsLoading(true);
        try {
            const { apiClient } = await import("@/lib/api");

            // Map array back to object
            const data = {
                currentAddress: addressData.find(i => i.id === "addr_1")?.value || "",
                currentAddressType: addressData.find(i => i.id === "addr_2")?.value || "",
                permanentAddress: addressData.find(i => i.id === "addr_3")?.value || "",
            };

            await apiClient.updateAddress(data);
            alert("Address details updated successfully!");
        } catch (error) {
            console.error("Failed to update address:", error);
            alert("Failed to update details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderDashboardContent = () => (
        <div className="space-y-16">
            {/* Personal Details Section */}
            <section className="max-w-5xl">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444] mb-8">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {personalDetails.map((detail) => (
                        <div key={detail.label} className="space-y-2.5">
                            <label className="text-[15px] font-medium text-[#111827] block px-1">
                                {detail.label}
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={detail.value}
                                    readOnly
                                    className="w-full bg-[#F3F4F6] border-none rounded-2xl px-6 py-4 text-gray-500 font-medium outline-none pr-12 cursor-default"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={18} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Employment Details Section */}
            <section className="max-w-5xl">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444] mb-8">Employment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
                    {employmentData.map((detail) => (
                        <div key={detail.id} className="space-y-2.5">
                            <label className="text-[15px] font-medium text-[#111827] block px-1">
                                {detail.label}
                            </label>
                            <div className="relative group">
                                {detail.id === "emp_4" && editingFields[detail.id] ? (
                                    <div className="relative w-full">
                                        <select
                                            ref={el => { inputRefs.current[detail.id] = el as any; }}
                                            value={detail.value === "-" ? "" : detail.value}
                                            onChange={(e) => handleInputChange(detail.id, e.target.value, 'employment')}
                                            onBlur={() => handleBlur(detail.id)}
                                            className="w-full border rounded-2xl px-6 py-4 font-medium outline-none pr-12 transition-all shadow-sm bg-white border-red-200 ring-2 ring-red-50 text-gray-900 appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select Stability</option>
                                            <option value="VERY_UNSTABLE">Very Unstable</option>
                                            <option value="SOMEWHAT_UNSTABLE">Somewhat Unstable</option>
                                            <option value="NEUTRAL">Neutral</option>
                                            <option value="STABLE">Stable</option>
                                            <option value="VERY_STABLE">Very Stable</option>
                                        </select>
                                        <ChevronDown className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                    </div>
                                ) : (
                                    <input
                                        ref={el => { inputRefs.current[detail.id] = el; }}
                                        type="text"
                                        value={detail.value}
                                        onChange={(e) => handleInputChange(detail.id, e.target.value, 'employment')}
                                        onBlur={() => handleBlur(detail.id)}
                                        readOnly={!editingFields[detail.id]}
                                        className={`w-full border rounded-2xl px-6 py-4 font-medium outline-none pr-12 transition-all shadow-sm ${editingFields[detail.id]
                                            ? "bg-white border-red-200 ring-2 ring-red-50 text-gray-900"
                                            : "bg-[#F9FAFB] border-gray-50 text-gray-700 cursor-default"
                                            }`}
                                    />
                                )}
                                <button
                                    onMouseDown={(e) => e.preventDefault()} // Prevents blur when clicking the button
                                    onClick={() => toggleEdit(detail.id)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    {editingFields[detail.id] ? <Check size={18} className="text-green-500" /> : <PencilLine size={18} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleUpdateEmployment}
                    className="bg-[#EF4444] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-[15px]">
                    Update now
                </button>
            </section>

            {/* Address Details Section */}
            <section className="max-w-5xl">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444] mb-8">Address Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
                    {addressData.map((detail) => (
                        <div key={detail.id} className="space-y-2.5">
                            <label className="text-[15px] font-medium text-[#111827] block px-1">
                                {detail.label}
                            </label>
                            <div className="relative group">
                                <input
                                    ref={el => { inputRefs.current[detail.id] = el; }}
                                    type="text"
                                    value={detail.value}
                                    onChange={(e) => handleInputChange(detail.id, e.target.value, 'address')}
                                    onBlur={() => handleBlur(detail.id)}
                                    readOnly={!editingFields[detail.id]}
                                    className={`w-full border rounded-2xl px-6 py-4 font-medium outline-none pr-12 transition-all shadow-sm ${editingFields[detail.id]
                                        ? "bg-white border-red-200 ring-2 ring-red-50 text-gray-900"
                                        : "bg-[#F9FAFB] border-gray-50 text-gray-700 cursor-default"
                                        }`}
                                />
                                <button
                                    onMouseDown={(e) => e.preventDefault()} // Prevents blur when clicking the button
                                    onClick={() => toggleEdit(detail.id)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    {editingFields[detail.id] ? <Check size={18} className="text-green-500" /> : <PencilLine size={18} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleUpdateAddress}
                    className="bg-[#EF4444] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-[15px]">
                    Update now
                </button>
            </section>
        </div>
    );

    const renderTrackLoanContent = () => (
        <div className="max-w-5xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2.5">
                    <label className="text-[15px] font-bold text-gray-900 block px-1">
                        Application number
                    </label>
                    <input
                        type="text"
                        placeholder="Enter application number"
                        value={searchQuery.appId}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, appId: e.target.value }))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-gray-700 font-medium outline-none focus:ring-1 focus:ring-red-100 transition-all"
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[15px] font-bold text-gray-900 block px-1">
                        Mobile number
                    </label>
                    <input
                        type="text"
                        placeholder="Enter mobile number"
                        value={searchQuery.phone}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-gray-700 font-medium outline-none focus:ring-1 focus:ring-red-100 transition-all"
                    />
                </div>
            </div>
            <div>
                <button
                    onClick={() => {
                        const found = loanHistoryData.find(l =>
                            l.number.toLowerCase().includes(searchQuery.appId.toLowerCase()) && searchQuery.appId.length > 3
                        );
                        setTrackResult(found || "NOT_FOUND");
                    }}
                    className="bg-[#EF4444] text-white px-10 py-4 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100">
                    Track now
                </button>
            </div>

            {trackResult && (
                <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    {trackResult === "NOT_FOUND" ? (
                        <p className="text-red-500 font-bold text-center">No application found with these details.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-bold">Application Number:</span>
                                <span className="text-gray-600">{trackResult.number}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-bold">Status:</span>
                                <span className={`font-bold ${trackResult.status === 'PENDING' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {trackResult.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Last Update:</span>
                                <span className="text-gray-600">{trackResult.date}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderRepayLoanContent = () => (
        <div className="max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-[28px] font-extrabold text-[#EF4444] tracking-tight">Repay Loan</h2>
            </div>
            
            {loanHistoryData.length > 0 ? (
                <div className="grid gap-6">
                    {loanHistoryData.map((loan, index) => (
                        <div key={loan.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-center p-6 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(239,68,68,0.08)] transition-all">
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Loan Reference</p>
                                <p className="text-[16px] font-bold text-gray-900">{loan.number}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                                <p className="text-[18px] font-extrabold text-[#111827]">{loan.amount}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                <span className={`inline-block text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider
                                    ${loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            loan.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'}`}>
                                    {loan.status}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button className="bg-[#EF4444] text-white px-5 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 w-full text-center text-[14px]">
                                    Repay via WhatsApp
                                </button>
                                <button className="text-gray-500 font-bold hover:text-gray-900 transition-colors text-[13px] underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900">
                                    Net bank details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-gray-100">
                        <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">You do not currently have any active loans requiring repayment.</p>
                </div>
            )}
        </div>
    );

    const renderLoanHistoryContent = () => (
        <div className="max-w-5xl space-y-10">
            <div className="flex items-center justify-between">
                <h2 className="text-[28px] font-extrabold text-[#111827] tracking-tight text-[#EF4444]">Loan History</h2>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/30">
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Loan Reference</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Disbursement Date</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loanHistoryData.length > 0 ? (
                                loanHistoryData.map((loan) => (
                                    <tr key={loan.id} className="group hover:bg-red-50/20 transition-all">
                                        <td className="px-8 py-6 text-[15px] font-bold text-gray-900 flex flex-col items-start gap-1">
                                            <span>{loan.number}</span>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                                                ${loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                        loan.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="text-[17px] font-extrabold text-[#111827]">{loan.amount}</p>
                                                <p className="text-[12px] text-gray-500">{loan.type}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-300" />
                                                <span className="text-[14px]">{loan.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="inline-flex items-center gap-2 text-red-500 font-bold text-sm bg-red-50 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 group/btn">
                                                <span>Reapply</span>
                                                <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium">
                                        No loan history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer simple summary */}
                <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-400">Showing {loanHistoryData.length} loan records found in your account.</p>
                </div>
            </div>
        </div>
    );

    const renderSupport = () => (
        <div className="space-y-12">
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444]">Connect us</h2>

            <div className="flex flex-col md:flex-row items-start gap-12 md:gap-24">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-50 flex-shrink-0 bg-gray-50">
                        <img
                            src="/support.png"
                            alt="Support"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[17px] font-bold text-gray-900">Call us: +91 92663 28731</p>
                        <p className="text-[13px] text-gray-500 font-medium">Mon- Fri | 9:00AM to 10:00PM</p>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#1D4E89] rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <Mail size={24} />
                    </div>
                    <div>
                        <p className="text-[17px] font-bold text-gray-900">Email: support@loaninneed.in</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                    <div className="bg-[#25D366] p-1.5 rounded-full text-white">
                        <MessageCircle size={18} fill="currentColor" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900">WhatsApp us</p>
                </div>
                <button className="bg-[#25D366] text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100 text-[15px]">
                    Click here
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pt-24 sm:pt-32 md:pt-40 pb-12 md:pb-24 px-4 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16">
                {/* Sidebar */}
                <aside className="w-full lg:w-72 lg:sticky lg:top-40 h-fit self-start">
                    <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col h-fit space-y-2">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        if (item.name === "Apply new loan") {
                                            router.push(getLinkWithRef("/apply-now"));
                                        } else {
                                            setActiveTab(item.name);
                                        }
                                    }}

                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-medium ${activeTab === item.name
                                        ? "bg-[#EF4444] text-white shadow-lg shadow-red-200"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    {item.icon}
                                    <span className="text-[15px]">{item.name}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="pt-2 border-t border-gray-50">
                            <button
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 group"
                                onClick={() => {
                                    localStorage.removeItem('authToken');
                                    localStorage.removeItem('userData');
                                    window.location.replace(getLinkWithRef("/"));
                                }}
                            >

                                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                <span className="text-[15px]">Log out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === "Dashboard" ? renderDashboardContent() :
                        activeTab === "Track loan" ? renderTrackLoanContent() :
                            activeTab === "Repay loan" ? renderRepayLoanContent() :
                                activeTab === "Loan history" ? renderLoanHistoryContent() :
                                    activeTab === "Support" ? renderSupport() :
                                        <div className="text-center py-20 text-gray-400">Content for {activeTab} coming soon...</div>}
                </main>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
