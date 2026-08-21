"use client"

import React, { useState } from 'react';
import { ChevronDown, CheckCircle, FileText, Building, CreditCard, User, Users, TrendingUp, Award, Target, Zap, IdCard, Smartphone, Landmark, MapPin, UserCog, FileCheck, ShieldCheck } from 'lucide-react';
import FAQSection from '@/components/FAQSection';
import { BCApplicationModal } from '@/components/bc/BCApplicationModal';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export const dynamic = "force-dynamic";

function BusinessConsultantContent() {
    const { getLinkWithRef } = useAffiliate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const bcFAQData = [
        {
            question: "How do I get started as a Business Consultant Partner with LoanInNeed?",
            answer: "Register online with your details, submit documents, get verified (takes 24-48 hours), and start referring clients. You'll get a partner portal to track everything - referrals, approvals, commissions."
        },
        {
            question: "Is there any registration or partnership fee?",
            answer: "No. Zero charges. Free to join, free to operate. We don't believe in making partners pay to work with us."
        },
        {
            question: "Can I continue my existing consulting work while being a partner?",
            answer: "Of course. That's the whole idea. You keep doing exactly what you're doing. Just add loan referrals when your clients need it. No time commitment, no exclusivity, nothing."
        },
        {
            question: "How long does the registration process take?",
            answer: "Submit documents online, we verify within 24-48 hours. Once approved, you're ready to refer clients and start earning."
        },
        {
            question: "What support will I receive from LoanInNeed as a Consultant Partner?",
            answer: "You get a dedicated relationship manager, marketing materials to share with clients, training on our products, and a dashboard to track everything real-time. We want you to succeed because when you earn, we earn."
        },
        {
            question: "Do I need prior experience in finance to become a partner?",
            answer: "Not needed. You don't process loans or handle approvals - we do all that. You just refer clients. We'll train you on our products and process. If you can talk to clients, you're qualified."
        },
        {
            question: "How will I receive my commission payments?",
            answer: "Direct bank transfer to your registered account. You get statements showing each referral and commission earned. Payments are regular and on time."
        },
        {
            question: "Is there a minimum number of referrals required?",
            answer: "No minimum. Refer when you have clients who need loans. Could be 1 per month or 10 per day. Totally depends on your business and client base. No pressure from our side."
        },
        {
            question: "Can I operate from any city in India as a LoanInNeed Consultant Partner?",
            answer: "Yes, anywhere in India. Metro, tier-2, tier-3 - doesn't matter. As long as you have clients who need loans, you can partner with us."
        },
        {
            question: "What types of clients can I refer?",
            answer: "Anyone who needs instant loans - salaried people, self-employed professionals, business owners, freelancers. Basic eligibility is CIBIL score 650+ and minimum monthly income of ₹20,000. If your client meets this, they're good to apply."
        }
    ];

    return (
        <div className="min-h-screen w-full md:mt-12 mt-24">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-red-50 to-orange-50 pt-16 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <Breadcrumb className="mb-4">
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href={getLinkWithRef("/")}>Home</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-red-500 font-medium">
                                            Business Consultant
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Partner with India&apos;s Leading Instant Loan Provider as a <span className="text-red-500">Business Consultant</span>
                            </h1>
                            <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                                You&apos;re a business consultant. Your clients trust you for advice. But when they need quick funds for their business or personal emergencies, where do they go? Banks take weeks. Friends and family get awkward. That&apos;s where we come in.
                            </p>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Partner with LoanInNeed and help your clients get instant loans - approved in minutes, money in their account the same day. You already have the trust. Now help them solve real money problems while earning good commissions for yourself.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-red-500 hover:bg-red-600 text-white px-10 py-5 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                Become a Partner
                            </button>
                        </div>

                        <div className="hidden md:flex items-center justify-center">
                            <div className="relative w-full h-80 md:h-[450px]">
                                <Image
                                    src="/bc-hero.png"
                                    alt="LoanInNeed Business Consultant Hero"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BCApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Who is a BC Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12">
                        Who is a <span className="text-red-500">Business Consultant Partner?</span>
                    </h2>
                    <div className="text-gray-700 space-y-6 leading-relaxed text-lg">
                        <p className="text-center max-w-4xl mx-auto mb-12">
                            A Business Consultant Partner connects their clients with instant loan solutions. Simple as that. Your clients need money for working capital, business expansion, emergency expenses, or just managing cash flow. You refer them to us, we approve their loan fast, they get money in minutes. Everyone&apos;s happy.
                        </p>

                        <div className="bg-red-50/40 p-8 md:p-12 rounded-3xl border border-red-100">
                            <h3 className="text-2xl font-bold mb-8 text-center text-gray-900">Here&apos;s what happens:</h3>
                            <div className="grid md:grid-cols-5 gap-6">
                                {[
                                    "Client needs a loan, you refer them to LoanInNeed",
                                    "They apply online with minimal documents",
                                    "Loan gets approved within minutes (if eligible)",
                                    "Money hits their account immediately",
                                    "You earn commission on every successful loan"
                                ].map((step, idx) => (
                                    <div key={idx} className="relative flex flex-col items-center text-center">
                                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mb-4 shadow-lg shrink-0">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{step}</p>
                                        {idx < 4 && (
                                            <div className="hidden md:block absolute top-6 -right-3 w-6 h-[2px] bg-red-200"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="mt-8 text-center max-w-4xl mx-auto italic text-gray-600">
                            You&apos;re not becoming a loan officer. You&apos;re just adding one more valuable service to what you already offer. Your clients already ask you for business advice - now you can actually help them get funded too.
                        </p>
                    </div>
                </div>
            </section>

            {/* Why Join Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Why Partner with LoanInNeed as a <span className="text-red-500">Business Consultant?</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-red-500">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <Award className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Attractive Commission Structure</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Earn money on every loan you refer - both upfront and trailing commissions. No earning caps, no limits. Top performers get special bonuses. The more you refer, the more you earn.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Zero Investment Required</h3>
                            <p className="text-gray-600 leading-relaxed">
                                No partnership fee, no registration charges, no security deposit. Nothing. We handle everything on the backend - processing, approvals, disbursal, customer support. You just refer and earn.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-green-500">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <TrendingUp className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Keep Your Independence</h3>
                            <p className="text-gray-600 leading-relaxed">
                                This isn&apos;t a full-time job or exclusive contract. Keep doing your consulting work exactly as before. Add loan referrals whenever it makes sense for your clients. Work however much or little you want.
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-purple-500">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-8 h-8 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Digital & Easy Process</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Everything online. Your clients apply digitally, you track referrals on our portal, commissions get credited to your account automatically. No paperwork, no office visits, no complications.
                            </p>
                        </div>

                        {/* Card 5 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-orange-500">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Support Your Clients Better</h3>
                            <p className="text-gray-600 leading-relaxed">
                                When your client needs money urgently, you can actually help instead of just sympathizing. Loans approved in minutes, money in their account fast. Makes you look good, strengthens your relationship with them.
                            </p>
                        </div>

                        {/* Card 6 */}
                        <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-teal-500">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                                <Target className="w-8 h-8 text-teal-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">High Demand Market</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Almost every business needs funding at some point. Whether it&apos;s for expansion, inventory, paying suppliers, or handling emergencies. The demand is huge and only growing. Might as well earn from it.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Documents Required Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Documents Required for <span className="text-red-500">Consultant Partnership</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Individual Consultants */}
                        <div className="bg-red-50/40 rounded-3xl p-8 border border-red-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <User className="text-red-500" /> For Individual Consultants
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { icon: IdCard, label: "PAN Card", color: "text-yellow-600", bg: "bg-yellow-100" },
                                    { icon: FileText, label: "Aadhaar Card", color: "text-green-600", bg: "bg-green-100" },
                                    { icon: Smartphone, label: "Mobile number", color: "text-orange-600", bg: "bg-orange-100" },
                                    { icon: Landmark, label: "Email & Bank Details", color: "text-blue-600", bg: "bg-blue-100" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center">
                                        <div className={`${item.bg} w-16 h-16 rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                                            <item.icon className={`w-8 h-8 ${item.color}`} />
                                        </div>
                                        <p className="text-sm font-semibold">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consulting Firms */}
                        <div className="bg-red-50/40 rounded-3xl p-8 border border-red-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <Building className="text-blue-500" /> For Consulting Firms
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { icon: FileCheck, label: "GST Certificate", color: "text-purple-600", bg: "bg-purple-100" },
                                    { icon: UserCog, label: "PAN/Aadhaar of Director", color: "text-cyan-600", bg: "bg-cyan-100" },
                                    { icon: ShieldCheck, label: "Registration Certificate", color: "text-pink-600", bg: "bg-pink-100" },
                                    { icon: MapPin, label: "Address & Deed", color: "text-indigo-600", bg: "bg-indigo-100" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center">
                                        <div className={`${item.bg} w-16 h-16 rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                                            <item.icon className={`w-8 h-8 ${item.color}`} />
                                        </div>
                                        <p className="text-sm font-semibold">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Eligibility Criteria Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-8">
                        What are the eligibility criteria to become
                    </h2>
                    <h2 className="text-4xl font-bold text-center mb-12">
                        <span className="text-red-500">LoanInNeed Business Consultant?</span>
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto text-lg leading-relaxed">
                        Pretty straightforward. No minimum qualification, no finance background needed. If you have clients and they need money, you&apos;re eligible.
                    </p>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { label: "Be 18 years or older", icon: User, color: "text-yellow-600", bg: "bg-yellow-100" },
                            { label: "Be an Indian resident", icon: FileText, color: "text-green-600", bg: "bg-green-100" },
                            { label: "Own business or work independently", icon: Building, color: "text-blue-600", bg: "bg-blue-100" },
                            { label: "Have clients who might need loans", icon: Users, color: "text-pink-600", bg: "bg-pink-100" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                                <div className={`${item.bg} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <p className="font-bold text-gray-900">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full"></div>
                            <div className="absolute bottom-10 right-10 w-32 h-32 border-8 border-white rounded-full"></div>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 relative z-10">
                            Become a Business Consultant Partner
                        </h2>
                        <p className="text-white text-lg mb-8 opacity-90 relative z-10 max-w-2xl mx-auto">
                            Help your clients get quick loans while earning commissions. Free to join, easy to start.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-red-600 hover:bg-gray-50 px-12 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl hover:scale-105 relative z-10"
                        >
                            Register Now
                        </button>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection
                faqData={bcFAQData}
            />
        </div>
    );
}

export default function BusinessConsultantPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        }>
            <BusinessConsultantContent />
        </Suspense>
    );
}
