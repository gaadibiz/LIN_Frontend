"use client";

import React from "react";
import { useAffiliate } from "@/hooks/useAffiliate";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

import {
    LayoutDashboard,
    IndianRupee,
    FileSearch,
    UserCircle,
    Headphones,
    Copy,
    Calendar,
    Mail,
    Lock,
    PencilLine,
    Check,
    MessageCircle,
    ChevronDown,
    Globe,
    LogOut
} from "lucide-react";

import { useRouter } from "next/navigation";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

function BCDashboardContent() {
    const { affiliateRef, getLinkWithRef } = useAffiliate();
    const [activeTab, setActiveTab] = React.useState("Dashboard");
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('partnerAuthToken');
        localStorage.removeItem('partnerData');
        window.location.replace(getLinkWithRef("/"));
    };

    const [editingFields, setEditingFields] = React.useState<Record<string, boolean>>({});
    const [selectedDate, setSelectedDate] = React.useState({ month: "October", year: "2025", isLifetime: false });
    const [tempDate, setTempDate] = React.useState({ month: "October", year: "2025", isLifetime: false });
    const [isDateMenuOpen, setIsDateMenuOpen] = React.useState(false);

    const [referralLink, setReferralLink] = React.useState<string | null>(null);

    const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

    // Fetch Referral Link on Mount
    React.useEffect(() => {
        const fetchLink = async () => {
            try {
                const res = await apiClient.getPartnerReferralLink();
                if (res.link) {
                    setReferralLink(res.link);
                }
            } catch (err) {
                console.error("Failed to fetch referral link", err);
            }
        };
        fetchLink();
    }, []);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = ["2023", "2024", "2025"];

    const [loading, setLoading] = React.useState(true);
    const [dashboardData, setDashboardData] = React.useState<any>(null);
    const [profileData, setProfileData] = React.useState<any>(null);
    const [earningsData, setEarningsData] = React.useState<any[]>([]);

    // Fetch dashboard data on mount
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Check authentication
                const partnerToken = localStorage.getItem('partnerAuthToken');
                if (!partnerToken) {
                    toast.error("Please login to access dashboard");
                    router.push('/login-agent');
                    return;
                }

                // Fetch dashboard stats
                console.log("Fetching dashboard stats...");
                const dashboardResponse = await apiClient.getPartnerDashboard();
                setDashboardData(dashboardResponse);

                // Fetch referral link
                console.log("Fetching referral link...");
                const linkResponse = await apiClient.getPartnerReferralLink();
                if (linkResponse.link) {
                    setReferralLink(linkResponse.link);
                }

                // Fetch profile data
                console.log("Fetching profile...");
                const profileResponse = await apiClient.getPartnerProfile();
                setProfileData(profileResponse);

                // Fetch earnings
                console.log("Fetching earnings...");
                const earningsResponse = await apiClient.getPartnerEarnings();
                setEarningsData(earningsResponse || []);

            } catch (error: any) {
                console.error('Failed to fetch dashboard data:', error);
                if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                    localStorage.removeItem('partnerAuthToken');
                    router.push('/login-agent');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    const handleApplyFilter = () => {
        setSelectedDate(tempDate);
        setIsDateMenuOpen(false);
    };

    const toggleEdit = (fieldId: string) => {
        const isNowEditing = !editingFields[fieldId];
        setEditingFields(prev => ({
            ...prev,
            [fieldId]: isNowEditing
        }));

        if (isNowEditing) {
            setTimeout(() => {
                inputRefs.current[fieldId]?.focus();
            }, 0);
        }
    };

    const handleBlur = (fieldId: string) => {
        setTimeout(() => {
            setEditingFields(prev => ({
                ...prev,
                [fieldId]: false
            }));
        }, 150);
    };

    const sidebarItems = [
        { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Consultant earnings", icon: <IndianRupee size={20} /> },
        { name: "Track loan", icon: <FileSearch size={20} /> },
        { name: "Profile", icon: <UserCircle size={20} /> },
        { name: "Support", icon: <Headphones size={20} /> },
    ];

    const stats = [
        {
            label: "Total referrals",
            value: loading ? "..." : (dashboardData?.stats?.totalUsers?.toString() || "0"),
            icon: <Calendar size={20} className="text-blue-500" />,
            bgColor: "bg-blue-50"
        },
        {
            label: "Approved referrals",
            value: loading ? "..." : (dashboardData?.stats?.totalApplications?.toString() || "0"),
            icon: <Calendar size={20} className="text-orange-500" />,
            bgColor: "bg-orange-50"
        },
        {
            label: "Earnings",
            value: loading ? "..." : "₹0", // TODO: Add earnings calculation
            icon: <IndianRupee size={20} className="text-green-500" />,
            bgColor: "bg-green-50"
        },
    ];



    const renderDashboard = () => (
        <div className="space-y-12">
            <div className="relative">
                <button
                    onClick={() => {
                        setTempDate(selectedDate);
                        setIsDateMenuOpen(!isDateMenuOpen);
                    }}
                    className="flex items-center justify-between gap-4 bg-white hover:border-red-200 transition-all min-w-[200px] px-5 py-2.5 rounded-2xl text-[14px] font-bold text-gray-900 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-red-500" />
                        <span>{selectedDate.isLifetime ? "Lifetime Performance" : `${selectedDate.month}, ${selectedDate.year}`}</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isDateMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDateMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDateMenuOpen(false)}></div>
                        <div className="absolute top-14 left-0 w-[calc(100vw-3rem)] sm:w-[320px] bg-white rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] border border-gray-100 p-5 sm:p-7 z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="space-y-8">
                                <div className="flex bg-gray-50/80 p-1.5 rounded-2xl">
                                    <button
                                        onClick={() => setTempDate(prev => ({ ...prev, isLifetime: false }))}
                                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${!tempDate.isLifetime ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Custom
                                    </button>
                                    <button
                                        onClick={() => setTempDate(prev => ({ ...prev, isLifetime: true }))}
                                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${tempDate.isLifetime ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Lifetime
                                    </button>
                                </div>

                                {!tempDate.isLifetime ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Select Year</p>
                                            <div className="flex gap-2">
                                                {years.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => setTempDate(prev => ({ ...prev, year }))}
                                                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all border ${tempDate.year === year ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Select Month</p>
                                            <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {months.map(month => (
                                                    <button
                                                        key={month}
                                                        onClick={() => setTempDate(prev => ({ ...prev, month }))}
                                                        className={`py-2 rounded-xl text-[12px] font-bold transition-all border ${tempDate.month === month ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        {month.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                            <Globe size={28} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-bold text-gray-900">Lifetime Tracking</p>
                                            <p className="text-[12px] text-gray-400 leading-relaxed px-4">View your total performance and historical data from day one.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-50">
                                    <button
                                        onClick={handleApplyFilter}
                                        className="w-full bg-[#EF4444] text-white py-4 rounded-2xl font-bold text-[15px] shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-[0.98]"
                                    >
                                        Apply Filter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex justify-between items-start group hover:-translate-y-1 transition-all duration-300">
                        <div className="space-y-4">
                            <p className="text-[15px] font-medium text-gray-500">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                            <p className="text-[13px] font-bold text-gray-900">
                                {selectedDate.isLifetime ? "Overall" : `${selectedDate.month} ${selectedDate.year}`}
                            </p>
                        </div>
                        <div className={`${stat.bgColor} p-4 rounded-2xl transition-transform group-hover:scale-110`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 space-y-4">
                    <p className="text-[15px] font-medium text-gray-500">My consultant referral link</p>
                    <div className="flex items-center justify-between bg-red-50/30 p-4 rounded-2xl border border-red-50/50">
                        <span className="text-[14px] text-gray-600 truncate mr-4">
                            {referralLink || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://seahorse-app-92emo.ondigitalocean.app'}/signup?ref=${affiliateRef || 'YOUR_CODE'}`}
                        </span>
                        <button
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => {
                                if (referralLink) {
                                    navigator.clipboard.writeText(referralLink);
                                    toast.success("Link copied to clipboard!");
                                } else {
                                    const fallbackLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://seahorse-app-92emo.ondigitalocean.app'}/signup?ref=${affiliateRef || 'YOUR_CODE'}`;
                                    navigator.clipboard.writeText(fallbackLink);
                                    toast.success("Link copied!");
                                }
                            }}
                        >
                            <Copy size={18} />
                        </button>
                    </div>

                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 space-y-4">
                    <p className="text-[15px] font-medium text-gray-500">Referral link impression</p>
                    <h3 className="text-3xl font-bold text-gray-900">1.3k</h3>
                    <p className="text-[13px] font-bold text-gray-900">October 2025</p>
                </div>
            </div>
        </div>
    );

    const renderEarnings = () => (
        <div className="space-y-10">
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444]">Consultant Earnings</h2>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/30">
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Loan amount</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">Status</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Applied on</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[12px] md:text-[13px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Earning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {earningsData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-6 text-center text-gray-400 font-medium">No earnings found yet.</td>
                                </tr>
                            ) : (
                                earningsData.map((item, index) => (
                                    <tr key={index} className="group hover:bg-red-50/20 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-bold text-gray-900">{item.name}</span>
                                                <span className="text-[13px] text-gray-400 font-medium">{item.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[17px] font-extrabold text-[#111827]">
                                            {item.amount}
                                        </td>
                                        <td className="px-8 py-6 text-left">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-[13px] font-bold tracking-tight ${(item.status === 'Approved' || item.rawStatus === 'APPROVED') ? 'bg-green-50 text-green-600' :
                                                (item.status === 'Rejected' || item.rawStatus === 'REJECTED') ? 'bg-red-50 text-red-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right text-[14px] text-gray-600 font-medium">
                                            {item.date}
                                        </td>
                                        <td className="px-8 py-6 text-right text-[17px] font-extrabold text-gray-900">
                                            {item.earnings}
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50/50 px-8 py-4 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-400">Total {earningsData.length} earnings filtered.</p>
                </div>
            </div>
        </div>
    );

    const renderTrackLoan = () => (
        <div className="max-w-5xl space-y-12">
            <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444]">Track Loan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2.5">
                    <label className="text-[15px] font-medium text-[#111827] block px-1">
                        Application number
                    </label>
                    <input
                        type="text"
                        placeholder="Enter application number"
                        className="w-full bg-[#F9FAFB] border border-gray-50 rounded-2xl px-6 py-4 text-gray-700 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-red-50 transition-all"
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[15px] font-medium text-[#111827] block px-1">
                        Mobile number
                    </label>
                    <input
                        type="text"
                        placeholder="Enter mobile number"
                        className="w-full bg-[#F9FAFB] border border-gray-50 rounded-2xl px-6 py-4 text-gray-700 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-red-50 transition-all"
                    />
                </div>
            </div>
            <div>
                <button className="bg-[#EF4444] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-[15px]">
                    Track now
                </button>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-16">
            <section className="max-w-5xl">
                <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#EF4444] mb-8">Profile Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
                    {[
                        { id: "fullName", label: "Full Name", value: loading ? "Loading..." : (profileData?.name || ""), editable: false },
                        { id: "email", label: "Email Address", value: loading ? "Loading..." : (profileData?.email || ""), editable: false },
                        { id: "phoneNumber", label: "Phone Number", value: loading ? "Loading..." : (profileData?.phone || ""), editable: false },
                        { id: "firmName", label: "Firm Name (if applicable)", value: loading ? "Loading..." : (profileData?.firmName || "N/A"), editable: false },
                        { id: "address", label: "Address", value: loading ? "Loading..." : (profileData?.address || ""), editable: true },
                        { id: "city", label: "City", value: loading ? "Loading..." : (profileData?.city || ""), editable: true },
                        { id: "state", label: "State", value: loading ? "Loading..." : (profileData?.state || ""), editable: true },
                        { id: "pincode", label: "PIN Code", value: loading ? "Loading..." : (profileData?.pincode || ""), editable: true },
                        { id: "panNumber", label: "PAN Number", value: loading ? "Loading..." : (profileData?.panNumber || "NOT UPDATED"), editable: false },
                        { id: "gstLicense", label: "GST/Trade License", value: loading ? "Loading..." : (profileData?.gstNumber || "NOT UPDATED"), editable: false },
                    ].map((field) => (
                        <div key={field.id} className="space-y-2.5">
                            <label className="text-[15px] font-medium text-[#111827] block px-1">{field.label}</label>
                            <div className="relative group">
                                <input
                                    ref={el => { inputRefs.current[field.id] = el; }}
                                    type={field.id === "email" ? "email" : field.id === "phoneNumber" ? "tel" : "text"}
                                    defaultValue={field.value}
                                    readOnly={!editingFields[field.id] || !field.editable}
                                    onBlur={() => field.editable && handleBlur(field.id)}
                                    className={`w-full border rounded-2xl px-6 py-4 font-medium outline-none pr-12 transition-all shadow-sm ${!field.editable
                                        ? "bg-[#F3F4F6] border-none text-gray-500 cursor-default"
                                        : editingFields[field.id]
                                            ? "bg-white border-red-200 ring-2 ring-red-50 text-gray-900"
                                            : "bg-[#F9FAFB] border-gray-50 text-gray-700 cursor-default"
                                        } ${["panNumber", "gstLicense"].includes(field.id) ? "uppercase" : ""}`}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center">
                                    {field.editable ? (
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => toggleEdit(field.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                                        >
                                            {editingFields[field.id] ? <Check size={18} className="text-green-500" /> : <PencilLine size={18} />}
                                        </button>
                                    ) : (
                                        <Lock size={18} className="text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={async () => {
                        try {
                            const updates: Record<string, string> = {};
                            document.querySelectorAll<HTMLInputElement>('[data-profile-field]').forEach(el => {
                                if (el.dataset.profileField) updates[el.dataset.profileField] = el.value;
                            });
                            // Collect from inputRefs
                            const fieldMap: Record<string, string> = {
                                address: inputRefs.current['address']?.value || '',
                                city: inputRefs.current['city']?.value || '',
                                state: inputRefs.current['state']?.value || '',
                                pincode: inputRefs.current['pincode']?.value || '',
                            };
                            await apiClient.updatePartnerProfile(fieldMap);
                            toast.success('Profile updated successfully!');
                        } catch (err) {
                            console.error('Failed to update profile:', err);
                            toast.error('Failed to update profile. Please try again.');
                        }
                    }}
                    className="bg-[#EF4444] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-[15px]">
                    Update now
                </button>
            </section>
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
                    <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col h-fit space-y-2">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => setActiveTab(item.name)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-medium ${activeTab === item.name
                                        ? "bg-[#EF4444] text-white shadow-lg shadow-red-200"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <span className={activeTab === item.name ? "text-white" : "text-gray-400 group-hover:text-gray-900"}>
                                        {item.icon}
                                    </span>
                                    <span className="text-[15px]">{item.name}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="pt-2 border-t border-gray-50">
                            <button
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 group"
                                onClick={handleLogout}
                            >
                                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                <span className="text-[15px]">Log out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {activeTab === "Dashboard" && renderDashboard()}
                    {activeTab === "Consultant earnings" && renderEarnings()}
                    {activeTab === "Track loan" && renderTrackLoan()}
                    {activeTab === "Profile" && renderProfile()}
                    {activeTab === "Support" && renderSupport()}
                </main>
            </div>
        </div>
    );
}

export default function BCDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        }>
            <BCDashboardContent />
        </Suspense>
    );
}
