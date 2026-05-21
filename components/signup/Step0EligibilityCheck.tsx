"use client"

import React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { eligibilitySchema, type EligibilityForm } from "@/lib/signup-schemas"
import { FileText, Wallet, Target, Briefcase, Landmark, MapPin, Banknote, CreditCard, Lock } from "lucide-react"

interface Step0Props {
  onSubmit: (data: EligibilityForm) => void
  isLoading?: boolean
  formData?: EligibilityForm
  isProfileComplete?: boolean
}

export function Step0EligibilityCheck({ onSubmit, isLoading, formData, isProfileComplete = false }: Step0Props) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<EligibilityForm>({
    resolver: zodResolver(eligibilitySchema),
    defaultValues: {
      loanAmount: formData?.loanAmount || undefined,
      purposeOfLoan: formData?.purposeOfLoan || "",
      monthlySalaryRange: formData?.monthlySalaryRange || (formData as any)?.monthlyIncome?.toString() || "",
      occupation: formData?.occupation || "Salaried",
      salaryReceivedIn: formData?.salaryReceivedIn || "Bank Transfer",
      city: formData?.city || "",
    }
  })

  React.useEffect(() => {
    if (formData) {
      reset({
        loanAmount: formData.loanAmount || undefined,
        purposeOfLoan: formData.purposeOfLoan || "",
        monthlySalaryRange: formData.monthlySalaryRange || (formData as any).monthlyIncome?.toString() || "",
        occupation: formData.occupation || "Salaried",
        salaryReceivedIn: formData.salaryReceivedIn || "Bank Transfer",
        city: formData.city || "",
      })
    }
  }, [formData, reset])

  // We explicitly watch out for specific custom UI behaviors
  const salaryReceivedIn = watch("salaryReceivedIn")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 form-fade-in">
      <div className="space-y-6">

        {/* Step Info Box */}
        <div className="bg-red-50 rounded-xl p-4 flex items-start space-x-4 border border-red-100 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0 border border-red-200">
            <FileText className="w-6 h-6 text-red-600" />
            <div className="absolute ml-5 mt-5 bg-white rounded-full">
              <span className="text-red-500 font-bold block bg-white rounded-full border border-red-200 w-4 h-4 flex items-center justify-center text-[10px]">₹</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-red-600 mb-0.5">Step 2 of 3</div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1c2b4f] leading-tight mb-1">Tell Us Your Loan & Income Details</h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">This helps us check your eligibility and give instant approval.</p>
          </div>
        </div>

        {/* Loan Amount Required */}
        <div>
          <div className="flex items-center mb-3">
            <Wallet className="w-5 h-5 text-blue-500 mr-2" />
            <label className="block text-sm font-bold text-[#1c2b4f]">
              Loan Amount Required
            </label>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
              ₹
            </span>
            <Input
              {...register("loanAmount", { valueAsNumber: true })}
              type="number"
              placeholder="Enter Loan Amount"
              min={0}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
              }}
              className="pl-10 h-12 text-base shadow-sm focus-visible:ring-red-600 border-gray-300"
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-500 mt-2 px-1 font-medium">
            <span>Minimum: ₹5,000</span>
            <span>Maximum: ₹1,50,000</span>
          </div>
          {errors.loanAmount && <p className="text-red-500 text-sm mt-1">{errors.loanAmount.message}</p>}
        </div>

        {/* Purpose of Loan */}
        <div>
          <div className="flex items-center mb-3">
            <Target className="w-5 h-5 text-blue-500 mr-2" />
            <label className="block text-sm font-bold text-[#1c2b4f]">
              Purpose of Loan
            </label>
          </div>
          <select
            {...register("purposeOfLoan")}
            defaultValue=""
            className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-gray-700"
          >
            <option value="" disabled>Select Purpose of Loan</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Education">Education</option>
            <option value="Wedding">Wedding</option>
            <option value="Home Renovation">Home Renovation</option>
            <option value="Travel">Travel</option>
            <option value="Other">Personal</option>
          </select>
          {errors.purposeOfLoan && <p className="text-red-500 text-sm mt-1">{errors.purposeOfLoan.message}</p>}
        </div>

        {/* Occupation */}
        {isProfileComplete ? (
          <input type="hidden" {...register("occupation")} />
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
              <label className="block text-sm font-bold text-[#1c2b4f]">
                Occupation
              </label>
            </div>
            <select
              {...register("occupation")}
              defaultValue=""
              className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-gray-700"
            >
              <option value="" disabled>Select Occupation</option>
              <option value="Salaried">Salaried Employee</option>
              <option value="Self Employed">Self Employed</option>
            </select>
            {errors.occupation && <p className="text-red-500 text-sm mt-1">{errors.occupation.message}</p>}
          </div>
        )}

        {/* Monthly Salary Range */}
        <div>
          <div className="flex items-center mb-3">
            <Wallet className="w-5 h-5 text-blue-500 mr-2" />
            <label className="block text-sm font-bold text-[#1c2b4f]">
              Monthly Salary
            </label>
          </div>

          <input
            type="number"
            min="0"
            {...register("monthlySalaryRange", {
              min: {
                value: 0,
                message: "Salary cannot be negative",
              },
            })}
            placeholder="Enter Monthly Salary"
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault();
              }
            }}
            className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-gray-700"
          />

          {errors.monthlySalaryRange && (
            <p className="text-red-500 text-sm mt-1">
              {errors.monthlySalaryRange.message}
            </p>
          )}
        </div>

        {/* Salary Received In (Segmented Control style) */}
        {isProfileComplete ? (
          <input type="hidden" {...register("salaryReceivedIn")} />
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <Landmark className="w-5 h-5 text-blue-500 mr-2" />
              <label className="block text-sm font-bold text-[#1c2b4f]">
                Salary Received In
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Cash', icon: Banknote, label: 'Cash' },
                { id: 'Bank Transfer', icon: Landmark, label: 'Bank Transfer' },
                { id: 'Cheque', icon: CreditCard, label: 'Cheque' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setValue("salaryReceivedIn", option.id as any, { shouldValidate: true })}
                  className={`flex flex-col items-center justify-center p-3 sm:py-4 rounded-xl border sm:text-sm text-xs transition-colors font-medium h-24 ${salaryReceivedIn === option.id
                    ? 'bg-[#eef2ff] border-[#c7d2fe] text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <option.icon className={`w-6 h-6 mb-2 ${salaryReceivedIn === option.id ? 'text-blue-600' : 'text-blue-400'}`} />
                  <span className="text-center">{option.label}</span>
                </button>
              ))}
            </div>
            {/* Hidden input to register it */}
            <input type="hidden" {...register("salaryReceivedIn")} />
            {errors.salaryReceivedIn && <p className="text-red-500 text-sm mt-2">{errors.salaryReceivedIn.message}</p>}
          </div>
        )}

        <div>
            <div className="flex items-center mb-3 mt-2">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              <label className="block text-sm font-bold text-[#1c2b4f]">
                City <span className="text-red-500">*</span>
              </label>
            </div>
            <select
              {...register("city")}
              defaultValue=""
              className="w-full h-12 px-4 shadow-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 text-gray-700"
            >
              <option value="" disabled>Select City</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Pune">Pune</option>
            </select>
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
          </div>

        <div className="pt-4">
          <Button type="submit" className="w-full bg-[#c81e1e] hover:bg-red-700 text-white h-14 rounded-xl text-lg font-bold shadow-md transition-all" disabled={isLoading}>
            {isLoading ? "Checking..." : "Check Loan Eligibility"}
          </Button>
          <div className="text-center mt-4">
            <span className="flex items-center justify-center text-xs text-gray-500 font-medium opacity-80">
              <Lock className="w-3 h-3 mr-1 text-green-600" /> Your information is secure and encrypted
            </span>
          </div>
        </div>
      </div>
    </form>
  )
}
