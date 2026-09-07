"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAffiliate } from "@/hooks/useAffiliate";
import {
  Building2,
  MapPin,
  Mail,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export default function Footer() {
  const router = useRouter();
  const { getLinkWithRef } = useAffiliate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    const userToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const partnerToken = typeof window !== "undefined" ? localStorage.getItem("partnerAuthToken") : null;
    setIsLoggedIn(!!(userToken || partnerToken));
  }, []);

  const handleQuickApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneInput.replace(/\D/g, "").slice(-10);
    const targetPath = isLoggedIn ? "/apply-now" : "/signup";
    const url = cleanDigits.length === 10 ? `${targetPath}?phone=${cleanDigits}` : targetPath;
    router.push(getLinkWithRef(url));
  };

  return (
    <footer className="bg-[#FEF5F5] pt-14 pb-8 px-5 sm:px-8 md:px-12 mt-28 border-t border-red-100/80 text-gray-700">
      <div className="max-w-8xl mx-auto space-y-12">
        {/* Top Quick Apply & Trust Action Banner */}
        <div className="bg-white border border-red-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Teaser */}
            <div className="lg:col-span-7 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Instant Personal Loans</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1c2b4f] tracking-tight">
                Need Fast Cash? Get Loans Up to ₹1,50,000
              </h3>
              <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
                100% digital, zero physical paperwork, and direct bank disbursal within 30 minutes.
              </p>
            </div>

            {/* Right Quick Mobile Input */}
            <div className="lg:col-span-5">
              <form onSubmit={handleQuickApply} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                    +91
                  </span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter mobile number"
                    className="pl-12 h-11 bg-gray-50/70 border-gray-300 rounded-xl text-sm focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  size="default"
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">RBI Registered NBFC</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-medium">Disbursal in 30 Mins</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">100% Digital Process</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium">256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main Footer Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1: Brand Info & Addresses (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <Image
                src="/lin-logo.png"
                alt="Loan In Need"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                LoanInNeed is India&apos;s trusted digital lending platform providing instant personal loans
                at fair interest rates with minimal documentation and complete transparency.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <Link
                href="https://www.instagram.com/loaninneed/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                aria-label="Instagram"
              >
                <Image src="/instagram.png" alt="Instagram" width={18} height={18} className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="https://www.facebook.com/loaninneed01/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                aria-label="Facebook"
              >
                <Image src="/facebook.png" alt="Facebook" width={18} height={18} className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/loan-in-need/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                aria-label="LinkedIn"
              >
                <Image src="/linkedin.png" alt="LinkedIn" width={18} height={18} className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="https://x.com/loaninneed?"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                aria-label="Twitter / X"
              >
                <Image src="/twitter.png" alt="Twitter" width={18} height={18} className="h-4.5 w-4.5" />
              </Link>
            </div>

            {/* Address Details */}
            <div className="space-y-4 pt-2 text-xs text-gray-600">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-0.5">Registered Office</h4>
                  <address className="not-italic leading-relaxed">
                    505, 5th Floor, Mangal Tower, Old H.B. Road, Ranchi – 834001, Jharkhand (India)
                  </address>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-0.5">Corporate Office</h4>
                  <address className="not-italic leading-relaxed">
                    10/1, B.T. Road, South Belgharia, Barrackpore, North 24 Parganas, West Bengal, India – 700056
                  </address>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Useful links (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[#1c2b4f] text-sm tracking-wide uppercase">Useful links</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/personal-loan/insta-loan" className="hover:text-primary transition-colors">
                  Insta loans
                </Link>
              </li>
              <li>
                <Link href="/track-loan" className="hover:text-primary transition-colors">
                  Track loan
                </Link>
              </li>
              <li>
                <Link href="/repay-loan" className="hover:text-primary transition-colors">
                  Repay loan
                </Link>
              </li>
              <li>
                <Link href="/affiliate-program" className="hover:text-primary transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/direct-sales-agent" className="hover:text-primary transition-colors">
                  Direct Sales Agent
                </Link>
              </li>
              <li>
                <Link href="/business-consultant" className="hover:text-primary transition-colors">
                  Business Consultant
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tools (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[#1c2b4f] text-sm tracking-wide uppercase">Tools</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/loan-calculators/personal-emi-calculator" className="hover:text-primary transition-colors">
                  Personal loan EMI calculator
                </Link>
              </li>
              <li>
                <Link href="/loan-calculators/eligibility-loan-calculator" className="hover:text-primary transition-colors">
                  Eligibility Loan calculator
                </Link>
              </li>
              <li>
                <Link href="/loan-calculators/loan-comparison-calculator" className="hover:text-primary transition-colors">
                  Loan comparison calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Insta loan by needs (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[#1c2b4f] text-sm tracking-wide uppercase">Insta loan by needs</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/medical-emergency-loan" className="hover:text-primary transition-colors">
                  Medical emergency loan
                </Link>
              </li>
              <li>
                <Link href="/utility-bill-loan" className="hover:text-primary transition-colors">
                  Utility bill loan
                </Link>
              </li>
              <li>
                <Link href="/house-rent-loan" className="hover:text-primary transition-colors">
                  House rent loan
                </Link>
              </li>
              <li>
                <Link href="/daily-expense-loan" className="hover:text-primary transition-colors">
                  Daily expense loan
                </Link>
              </li>
              <li>
                <Link href="/education-purpose-loan" className="hover:text-primary transition-colors">
                  Education purpose loan
                </Link>
              </li>
              <li>
                <Link href="/debt-consolidation-loan" className="hover:text-primary transition-colors">
                  Debt consolidation loan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-[#1c2b4f] text-sm tracking-wide uppercase">Company</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/about-us" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-primary transition-colors">
                  Contact us
                </Link>
              </li>
            </ul>

            {/* Support Box */}
            <div className="pt-3 border-t border-red-100/90 text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <a href="mailto:customerservice@loaninneed.in" className="hover:text-primary font-medium truncate">
                  customerservice@loaninneed.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Mon – Sat: 9:30 AM – 6:30 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Service Locations Strip */}
        <div className="pt-6 border-t border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-700 shrink-0">Popular Locations:</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Link href="/cities/payday-loan-in-delhi" className="hover:text-primary transition-colors">
                Delhi
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-mumbai" className="hover:text-primary transition-colors">
                Mumbai
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-bengaluru" className="hover:text-primary transition-colors">
                Bengaluru
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-hyderabad" className="hover:text-primary transition-colors">
                Hyderabad
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-pune" className="hover:text-primary transition-colors">
                Pune
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-kolkata" className="hover:text-primary transition-colors">
                Kolkata
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-ahmedabad" className="hover:text-primary transition-colors">
                Ahmedabad
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-chennai" className="hover:text-primary transition-colors">
                Chennai
              </Link>
              <span>•</span>
              <Link href="/cities/payday-loan-in-chandigarh" className="hover:text-primary transition-colors">
                Chandigarh
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>
            © {new Date().getFullYear()} Loan In Need. All rights reserved | A Unit of Naveen Finance Pvt Ltd
            (RBI - Registered NBFC)
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2 font-medium">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-primary transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refunds-cancellations" className="hover:text-primary transition-colors">
              Refunds & Cancellation
            </Link>
            <Link href="/disclaimer" className="hover:text-primary transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
