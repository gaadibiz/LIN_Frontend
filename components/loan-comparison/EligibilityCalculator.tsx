"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";

export default function EligibilityCalculator() {
  const router = useRouter();
  const [income, setIncome] = useState(62000);
  const [tenure, setTenure] = useState(2);
  const [expense, setExpense] = useState(18);

  const [eligibleAmount, setEligibleAmount] = useState(0);
  const [emi, setEmi] = useState(0);

  // Calculate eligible loan on state change with debounce calling backend
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/loans/check-eligibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ income, expense, tenure })
        });
        const data = await res.json();
        if (data.eligible) {
          setEligibleAmount(data.eligibleAmount);
          setEmi(data.emi);
        }
      } catch (e) {
        console.error("Failed to check calculator eligibility", e);
        // Fallback local logic
        const expenseAmount = (income * expense) / 100;
        const netIncome = income - expenseAmount;
        const maxEmi = netIncome * 0.4; // 40% EMI rule
        const totalMonths = tenure * 12;
        setEligibleAmount(maxEmi * totalMonths);
        setEmi(maxEmi);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [income, tenure, expense]);

  const handleApplyLoan = () => {
    router.push("/apply-now");
  };

  const formatCurrencyInput = (value: string) =>
    Number(value.replace(/[₹, ]/g, ""));

  const formatPercentInput = (value: string) =>
    Number(value.replace(/[% ]/g, ""));

  return (
    <section className="w-full max-w-7xl mx-auto py-12 px-6 lg:px-20">
      <div className="flex flex-col justify-center items-center space-y-8 w-full">
        <div className="text-center space-y-2">
          <p className="text-primary font-semibold uppercase tracking-wide">
            Loan Calculator
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold">
            Personal loan{" "}
            <span className="text-primary">eligibility calculator</span>
          </h2>
          <p className="text-muted-foreground">
            Our instant loan process is designed for speed and convenience
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8 justify-between items-center gap-4 w-full">
          {/* Left Side Controls */}
          <div className="w-full flex flex-col space-y-4">
            {/* Monthly Income */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-semibold">Monthly Income</label>
                <Input
                  className="justify-end w-1/6 max-w-[80px] bg-gray-200 border-0 focus:ring-0"
                  type="text"
                  value={income.toLocaleString("en-IN")}
                  onChange={(e) =>
                    setIncome(formatCurrencyInput(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <Slider
                value={[income]}
                onValueChange={(value) => setIncome(value[0])}
                min={15000}
                max={200000}
                step={1000}
                className="flex-1"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>15k</span>
                <span>2,00,000</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-semibold">Tenure (in years)</label>
                <Input
                  className="justify-end w-1/6 max-w-[80px] bg-gray-200 border-0 focus:ring-0"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value.replace(/\D/g, "")))}
                />
              </div>
              <Slider
                value={[tenure]}
                onValueChange={(value) => setTenure(value[0])}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            {/* Monthly Expense */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-semibold">Monthly Expense (%)</label>
                <Input
                  className="justify-end w-1/6 max-w-[80px] bg-gray-200 border-0 focus:ring-0"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={expense}
                  onChange={(e) =>
                    setExpense(formatPercentInput(e.target.value.replace(/\D/g, "")))
                  }
                />
              </div>
              <Slider
                value={[expense]}
                onValueChange={(value) => setExpense(value[0])}
                min={0}
                max={70}
                step={1}
                className="flex-1"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0</span>
                <span>70%</span>
              </div>
            </div>
          </div>

          {/* Right Side Result Card */}
          <div className="bg-primary text-white w-full lg:w-1/2 px-6 py-8 rounded-lg flex flex-col space-y-4">
            <div className="text-sm opacity-90">
              You are eligible for loan up to
            </div>
            <h3 className="text-3xl font-bold">
              ₹{" "}
              {eligibleAmount.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
              *
            </h3>

            <Separator className="bg-white/40 my-2" />

            <div className="flex justify-between text-base">
              <span>EMI Amount</span>
              <span>
                ₹ {emi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            <Button
              onClick={handleApplyLoan}
              className="w-full mt-2 bg-white text-black hover:bg-gray-100 font-medium py-3 cursor-pointer"
              type="button"
            >
              Apply Loan
            </Button>

            <p className="text-xs opacity-80 mt-2">*the amount may vary</p>
          </div>
        </div>
      </div>
    </section>
  );
}
