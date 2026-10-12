"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import useEMIcalc from "@/hooks/useEMIcalc";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { useAffiliate } from "@/hooks/useAffiliate";

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function LoanCalculator({ loanType }: { loanType?: string }) {
  const router = useRouter();
  const { getLinkWithRef } = useAffiliate();
  const { calculateEMI } = useEMIcalc();


  const [principal, setPrincipal] = useState(5000); // Default principal amount
  const [annualInterestRate, setAnnualInterestRate] = useState(12); // Default interest rate
  const [tenureMonths, setTenureMonths] = useState(2); // Default tenure in months

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  // Real-time calculation on any value change
  useEffect(() => {
    const { emi, totalInterest, totalPayment } = calculateEMI(
      principal,
      annualInterestRate,
      tenureMonths
    );
    setEmi(emi);
    setTotalInterest(totalInterest);
    setTotalPayment(totalPayment);
  }, [principal, annualInterestRate, tenureMonths, calculateEMI]);

  const handleApplyLoan = () => {
    router.push(getLinkWithRef("/apply-now"));
  };


  return (
    <section className="w-full max-w-7xl mx-auto py-4 p-6 md:p-12 lg:p-20">
      <div className="flex flex-col justify-center items-center-safe space-y-6 w-full">
        <div className="flex flex-col justify-center items-center-safe space-y-2 text-center w-full mb-18">
          <span className="text-primary font-semibold leading-tight uppercase">
            LOAN CALCULATOR
          </span>
          <h2 className="lg:text-4xl text-3xl font-bold">
            {loanType ? loanType : "Personal"} loan{" "}
            <span className="text-primary">EMI Calculator</span>
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8 justify-between items-center gap-4 w-full">
          {/* Left side sliders/inputs */}
          <div className="w-full flex flex-col space-y-4">
            {/* Principal */}
            <div className="w-full flex flex-col space-y-3">
              <div className="w-full flex justify-between items-center">
                <span className="text-start font-medium">Principal Amount</span>
                <Input
                  className="justify-end w-1/4 max-w-[100px] bg-gray-200 border-0 focus:ring-0 text-sm"
                  type="text"
                  value={`₹ ${principal}`}
                  onChange={(e) =>
                    setPrincipal(Number(e.target.value.replace(/[₹ ,]/g, "")))
                  }
                />
              </div>
              <Slider
                value={[principal]}
                onValueChange={(value) => setPrincipal(value[0])}
                min={5000}
                max={500000}
                step={1000}
                className="flex-1"
              />
              <div className="w-full flex justify-between text-sm">
                <span>₹5k</span>
                <span>₹5,00,000</span>
              </div>
            </div>

            {/* Interest rate */}
            <div className="w-full flex flex-col space-y-3">
              <div className="w-full flex justify-between items-center">
                <span className="font-medium">Annual Interest Rate</span>
                <Input
                  className="justify-end w-1/4 max-w-[100px] bg-gray-200 border-0 focus:ring-0 text-sm"
                  type="text"
                  value={annualInterestRate}
                  onChange={(e) =>
                    setAnnualInterestRate(Number(e.target.value))
                  }
                />
              </div>
              <Slider
                value={[annualInterestRate]}
                onValueChange={(value) => setAnnualInterestRate(value[0])}
                min={12}
                max={30}
                step={1}
                className="flex-1"
              />
              <div className="w-full flex justify-between text-sm">
                <span>12%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Tenure (Months) */}
            <div className="w-full flex flex-col space-y-3">
              <div className="w-full flex justify-between items-center">
                <span className="font-semibold">Tenure (In Months)</span>
                <Input
                  className="justify-end w-1/4 max-w-[100px] bg-gray-200 border-0 focus:ring-0 text-sm"
                  type="text"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                />
              </div>
              <Slider
                value={[tenureMonths]}
                onValueChange={(value) => setTenureMonths(value[0])}
                min={2}
                max={36}
                step={1}
                className="flex-1"
              />
              <div className="w-full flex justify-between text-sm">
                <span>2</span>
                <span>36</span>
              </div>
            </div>
          </div>

          {/* Right side results */}
          <div className="bg-primary text-white w-full lg:w-1/2 px-6 py-8 rounded-lg flex flex-col space-y-4">
            <div className="space-y-2 flex flex-col">
              <p className="capitalize leading-tight text-sm">Monthly EMI</p>
              <h3 className="lg:text-3xl text-2xl font-bold">
                ₹ {formatAmount(emi)}
              </h3>
            </div>

            <Separator className="bg-white" />

            <div className="w-full flex justify-between items-center">
              <p>Total Interest</p>
              <p>₹ {formatAmount(totalInterest)}</p>
            </div>

            <div className="w-full flex justify-between items-center">
              <p>Total Payable</p>
              <p>₹ {formatAmount(totalPayment)}</p>
            </div>

            <Button
              onClick={handleApplyLoan}
              className="w-full mt-2 bg-white text-black hover:bg-gray-100 font-medium py-3 cursor-pointer"
              type="button"
            >
              Apply Loan
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
