"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { basicDetailsSchema, type BasicDetailsForm } from "@/lib/signup-schemas"
import { FileUpload } from "../ui/file-upload"
import { cn } from "@/lib/utils"

interface Step3Props {
  onSubmit: (data: BasicDetailsForm) => void
  onBack?: () => void
  formData: BasicDetailsForm
  setFormData: (data: BasicDetailsForm) => void
  employmentType: "Salaried" | "Self employed" // Received from Step 2
}

export function Step3BasicDetails({ onSubmit, onBack, formData, setFormData, employmentType }: Step3Props) {
  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch, trigger } = useForm<BasicDetailsForm>({
    resolver: zodResolver(basicDetailsSchema),
    defaultValues: formData,
    mode: "onChange"
  })

  // We rely on the prop for rendering, but we might want to ensure the logic knows about it
  // Since schemas are separated, we just handle the view logic here.

  const handleFormSubmit = (data: BasicDetailsForm) => {
    setFormData(data)
    onSubmit(data)
  }

  const handleSelectChange = (field: keyof BasicDetailsForm, value: string) => {
    setValue(field, value as any)
    setFormData({ ...formData, [field]: value })
    trigger(field)
  }

  const handleNumberChange = (field: keyof BasicDetailsForm, value: string) => {
    const numValue = parseFloat(value) || 0
    setValue(field, numValue as any)
    setFormData({ ...formData, [field]: numValue })
    trigger(field)
  }

  const handleFileChange = (field: keyof BasicDetailsForm, file: File | null) => {
    if (file) {
      setValue(field, file as File)
      setFormData({ ...formData, [field]: file })
      trigger(field)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-red-600 mb-4 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Loan details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-600">Loan details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan amount <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                type="number"
                min={0}
                placeholder="Enter loan amount"
                className="pl-8 h-12"
                {...register("loanAmount", { valueAsNumber: true })}
                onChange={(e) => handleNumberChange("loanAmount", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            {errors.loanAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.loanAmount.message}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of loan <span className="text-red-600">*</span>
            </label>
            <Select value={watch("purposeOfLoan")} onValueChange={(value) => handleSelectChange("purposeOfLoan", value)}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Describe your purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Home Renovation">Home Renovation</SelectItem>
                <SelectItem value="Debt Consolidation">Debt Consolidation</SelectItem>
                <SelectItem value="Wedding">Wedding</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.purposeOfLoan && (
              <p className="text-red-500 text-sm mt-1">{errors.purposeOfLoan.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Employment details */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-red-600">
            Employment details ({employmentType})
          </h3>
        </div>

        {/* We no longer show the toggle here, we just show the relevant fields */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employmentType === "Salaried" ? (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company name <span className="text-red-600">*</span>
              </label>
              <Input
                {...register("companyName")}
                placeholder="Enter your company name"
                className="w-full h-12"
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>
          ) : (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profession name <span className="text-red-600">*</span>
              </label>
              <Select onValueChange={(value) => handleSelectChange("professionName", value)}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="Lawyer">Lawyer</SelectItem>
                  <SelectItem value="CA">CA</SelectItem>
                  <SelectItem value="Business Owner">Business Owner</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.professionName && (
                <p className="text-red-500 text-sm mt-1">{errors.professionName.message}</p>
              )}
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company address <span className="text-red-600">*</span>
            </label>
            <Input
              {...register("companyAddress")}
              placeholder="Enter your company address"
              className="w-full h-12"
            />
            {errors.companyAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.companyAddress.message}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {employmentType === "Salaried" ? "Monthly salary" : "Monthly Income"} <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                type="number"
                min={0}
                placeholder={employmentType === "Salaried" ? "Enter monthly salary" : "Enter monthly income"}
                className="pl-8 h-12"
                {...register("monthlyIncome", { valueAsNumber: true })}
                onChange={(e) => handleNumberChange("monthlyIncome", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            {errors.monthlyIncome && (
              <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">? {employmentType === "Salaried" ? "Net take home salary" : "Net monthly income"}</p>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stability in current job <span className="text-red-600">*</span>
            </label>
            <Select value={watch("jobStability")} onValueChange={(value) => handleSelectChange("jobStability", value)}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Very unstable">Very unstable</SelectItem>
                <SelectItem value="Somewhat unstable">Somewhat unstable</SelectItem>
                <SelectItem value="Neutral / moderate">Neutral / moderate</SelectItem>
                <SelectItem value="Stable">Stable</SelectItem>
                <SelectItem value="Very stable">Very stable</SelectItem>
              </SelectContent>
            </Select>
            {errors.jobStability && (
              <p className="text-red-500 text-sm mt-1">{errors.jobStability.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-600">Address details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current address with landmark <span className="text-red-600">*</span>
            </label>
            <Input
              {...register("currentAddress")}
              placeholder="Enter your current address"
              className="w-full h-12"
            />
            {errors.currentAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.currentAddress.message}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current address type <span className="text-red-600">*</span>
            </label>
            <Select value={watch("currentAddressType")} onValueChange={(value) => handleSelectChange("currentAddressType", value)}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner(Self or Family)">Owner(Self or Family)</SelectItem>
                <SelectItem value="Rented">Rented</SelectItem>
              </SelectContent>
            </Select>
            {errors.currentAddressType && (
              <p className="text-red-500 text-sm mt-1">{errors.currentAddressType.message}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permanent address <span className="text-red-600">*</span>
            </label>
            <Input
              {...register("permanentAddress")}
              placeholder="Enter your permanent address"
              className="w-full h-12"
            />
            {errors.permanentAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.permanentAddress.message}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current address proof <span className="text-red-600">*</span>
            </label>
            <FileUpload
              accept="application/pdf"
              placeholder="Current Rent agreement / Gas Bill / Utility Bill / Electricity Bill / WiFi Bill"
              onFileChange={(file) => handleFileChange("addressProof", file)}
              className="h-12"
            />
            {errors.addressProof && (
              <p className="text-red-500 text-sm mt-1">{errors.addressProof.message as string}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN <span className="text-red-600">*</span>
            </label>
            <Input
              {...register("pinCode")}
              placeholder="Enter your PIN code"
              className="w-full h-12"
              maxLength={6}
            />
            {errors.pinCode && (
              <p className="text-red-500 text-sm mt-1">{errors.pinCode.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium"
          disabled={!isValid}
        >
          Next
        </Button>
      </div>
    </form>
  )
}
