"use client";

import Image from "next/image";

import React from "react";
import { Button } from "./ui/button";
import { LucideCircleCheck } from "lucide-react";
import Link from "next/link";
import { useAffiliate } from "@/hooks/useAffiliate";


const HomeHeroSection = () => {
  const { getLinkWithRef } = useAffiliate();
  return (
    <section className="font-sans items-center justify-items-center gap-8 md:gap-16 flex flex-col md:flex-row w-full mt-24 sm:mt-28 md:mt-20 mb-8 md:mb-12">

      <div className="flex relative z-1 items-center justify-center px-4 py-8 sm:p-8 md:p-16 lg:p-24 flex-col md:flex-row gap-6 md:gap-8 w-full max-w-[95rem] mx-auto">
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <div className="space-y-2">
            <p className="text-sm sm:text-base text-primary font-semibold">PAYDAY LOAN</p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-snug">
              Get instant personal loan{" "}
              <span className="text-primary">upto ₹1 lakh</span> in few minutes
            </h2>
          </div>
          <p className="text-base sm:text-lg text-gray-600 leading-tight">
            Whether it&apos;s a medical emergency, monthly bills, travel, or
            unexpected expenses — Loan In Need gives you fast, hassle-free
            personal loans. Simple online process, flexible tenures, and money
            in your account within hours.
          </p>
          <Link href={getLinkWithRef("/signup")}>
            <Button className="w-full sm:w-56 p-5 sm:p-6 text-sm sm:text-base my-3">
              Check loan eligibility now
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex text-gray-500">
              <LucideCircleCheck className="mr-1 mt-0.5 w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm sm:text-base">Fast loan processing</span>
            </div>
            <div className="flex text-gray-500">
              <LucideCircleCheck className="mr-1 mt-0.5 w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm sm:text-base">Cash in bank directly</span>
            </div>
          </div>
        </div>
        <Image
          src="/Graphic-min.png"
          alt="Hero Image"
          width={3000}
          height={3000}
          className="w-full md:w-1/2 h-auto object-cover"
        />
      </div>
      <Image
        src="/bg-gradient.png"
        alt="Background Gradient"
        fill
        className="w-full max-w-full h-full object-cover absolute z-0"
      />
    </section>
  );
};

export default HomeHeroSection;
