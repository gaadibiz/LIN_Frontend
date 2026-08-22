"use client";

import Link from "next/link";
import Image from "next/image";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAffiliate } from "@/hooks/useAffiliate";


import React, { useState, useEffect } from "react";

export default function Footer() {
  const { getLinkWithRef } = useAffiliate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const partnerToken = typeof window !== 'undefined' ? localStorage.getItem('partnerAuthToken') : null;
    setIsLoggedIn(!!(userToken || partnerToken));
  }, []);
  return (

    <footer className="bg-[#FEF5F5] py-10 px-6 md:px-12 lg:px-20 mt-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left side */}
        <div className="space-y-6 lg:col-span-1">
          {/* Logo & Info */}
          <Image
            src="/lin-logo.png"
            alt="Loan In Need"
            width={300}
            height={300}
            className="h-16 w-auto"
          />
          <p className="text-sm text-gray-600">
            Welcome to LoanInNeed. We provide loan at very reasonable interest,
            on minimal documentation.
          </p>
          <div className="flex flex-col space-y-2">
            <Input
              type="text"
              placeholder="Enter your mobile number"
              className="px-3 py-2 rounded-md border border-gray-300 text-sm w-full"
            />
            <Link href={isLoggedIn ? "/apply-now" : "/signup"}>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 w-1/2"
              >
                Apply now
              </Button>
            </Link>
          </div>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-primary mb-1">
                Registered address
              </h4>
              <address className="not-italic">
                505, 5th Floor, Mangal Tower,
                <br />
                Old H.B. Road, Ranchi – 834001,
                <br />
                Jharkhand (India)
              </address>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">Corp. address</h4>
              <address className="not-italic">
                10/1, B.T. Road, South Belgharia,
                <br />
                Barrackpore, North 24 Parganas,
                <br />
                West Bengal, India – 700056
              </address>
            </div>
          </div>
          <div className="flex flex-col space-y-3 text-primary">
            <div className="flex space-x-3 text-primary">
              <Link href="https://www.instagram.com/loaninneed/">
                <Image
                  src="/instagram.png"
                  alt="Instagram"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
              <Link href="https://www.facebook.com/loaninneed01/">
                <Image
                  src="/facebook.png"
                  alt="Facebook"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
              <Link href="https://www.linkedin.com/company/loan-in-need/posts/?feedView=all">
                <Image
                  src="/linkedin.png"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
              <Link href="https://x.com/loaninneed?">
                <Image
                  src="/twitter.png"
                  alt="Twitter"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
            </div>

          </div>
        </div>

        {/* Right side (links) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Useful Links */}
          <div>
            <h4 className="font-semibold text-primary mb-3">Useful links</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/personal-loan/insta-loan">Insta loans</Link>
              </li>
              <li>
                <Link href="/track-loan">Track loan</Link>
              </li>
              <li>
                <Link href="/repay-loan">Repay loan</Link>
              </li>
              <li>
                <Link href="/affiliate-program">Affiliate Program</Link>
              </li>
              <li>
                <Link href="/direct-sales-agent">Direct Sales Agent</Link>
              </li>
              <li>
                <Link href="/business-consultant">Business Consultant</Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-primary mb-3">Tools</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/loan-calculators/personal-emi-calculator">
                  Personal loan EMI calculator
                </Link>
              </li>
              <li>
                <Link href="/loan-calculators/eligibility-loan-calculator">
                  Eligibility Loan calculator
                </Link>
              </li>
              {/* <li>
                <Link href="/loan-calculators/cibil-score-checker">
                  Cibil score checker
                </Link>
              </li> */}
              <li>
                <Link href="/loan-calculators/loan-comparison-calculator">
                  Loan comparison calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Insta loan by needs */}
          <div>
            <h4 className="font-semibold text-primary mb-3">
              Insta loan by needs
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/medical-emergency-loan">
                  Medical emergency loan
                </Link>
              </li>
              <li>
                <Link href="/utility-bill-loan">Utility bill loan</Link>
              </li>
              <li>
                <Link href="/house-rent-loan">House rent loan</Link>
              </li>
              <li>
                <Link href="/daily-expense-loan">Daily expense loan</Link>
              </li>
              <li>
                <Link href="/education-purpose-loan">
                  Education purpose loan
                </Link>
              </li>
              <li>
                <Link href="/debt-consolidation-loan">
                  Debt consolidation loan
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-primary mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/about-us">About Us</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contact-us">Contact us</Link>
              </li>
            </ul>
          </div>

          {/* Insta loan by cities */}
          <div>
            <h4 className="font-semibold text-primary mb-3">
              Insta loan by cities
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/cities/payday-loan-in-mumbai">
                  Insta loan in Mumbai
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-delhi">
                  Insta loan in Delhi
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-bengaluru">
                  Insta loan in Bengaluru
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-hyderabad">
                  Insta loan in Hyderabad
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-pune">
                  Insta loan in Pune
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-kolkata">
                  Insta loan in Kolkata
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-chennai">
                  Insta loan in Chennai
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-chandigarh">
                  Insta loan in Chandigarh
                </Link>
              </li>
              <li>
                <Link href="/cities/payday-loan-in-ahmedabad">
                  Insta loan in Ahmedabad
                </Link>
              </li>
            </ul>
          </div>

          {/* Insta loan by states */}
          <div>
            <h4 className="font-semibold text-primary mb-3">
              Insta loan by states
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/states/payday-loan-in-gujarat">
                  Insta loan in Gujarat
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-orissa">
                  Insta loan in Orissa
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-assam">
                  Insta loan in Assam
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-punjab">
                  Insta loan in Punjab
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-chattisgarh">
                  Insta loan in Chattisgarh
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-madhya-pradesh">
                  Insta loan in Madhya Pradesh
                </Link>
              </li>
              <li>
                <Link href="/states/payday-loan-in-west-bengal">
                  Insta loan in West Bengal
                </Link>
              </li>
            </ul>
          </div>

          {/* Insta loan by salary */}
          <div>
            <h4 className="font-semibold text-primary mb-3">
              Personal loan by salary
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/personal-loan/40000-salary-loan">
                  40,000 salary loan
                </Link>
              </li>
              <li>
                <Link href="/personal-loan/50000-salary-loan">
                  50,000 salary loan
                </Link>
              </li>
              <li>
                <Link href="/personal-loan/80000-salary-loan">
                  80,000 salary loan
                </Link>
              </li>
              <li>
                <Link href="/personal-loan/100000-salary-loan">
                  1,00,000 salary loan
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-10 border-t border-gray-300 pt-6 flex flex-col items-center text-center gap-4 md:flex-row md:justify-between md:text-left text-sm text-gray-600">
        <p>
          © 2026 Loan in need. All rights reserved | A Unit of Naveen Finance
          Pvt Ltd ( RBI - Registered NBFC )
        </p>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2">
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/terms-conditions">Terms & conditions</Link>
          <Link href="/refunds-cancellations">Refunds & cancellation</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}
