"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { documentVerificationSchema, documentVerificationSchemaOptionalPayslip, type DocumentVerificationForm } from "@/lib/signup-schemas"

interface Step4Props {
  onSubmit: (data: DocumentVerificationForm) => void
  formData: DocumentVerificationForm
  setFormData: (data: DocumentVerificationForm) => void
  isPayslipOptional?: boolean
}

export function Step4DocumentVerification({ onSubmit, formData, setFormData, isPayslipOptional = false }: Step4Props) {
  const schema = isPayslipOptional ? documentVerificationSchemaOptionalPayslip : documentVerificationSchema
  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<DocumentVerificationForm>({
    mode: "onChange",
    resolver: zodResolver(schema) as any,
    defaultValues: formData
  })

  const [consentChecked, setConsentChecked] = React.useState(false)

  const handleFormSubmit = (data: DocumentVerificationForm) => {
    setFormData(data)
    onSubmit(data)
  }

  const handleFileChange = (field: keyof DocumentVerificationForm, file: File | null) => {
    if (file) {
      setValue(field, file as File, { shouldValidate: true })
      setFormData({ ...formData, [field]: file })
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-6">
        <div className="pt-4">
          <div className="flex items-start space-x-3 mb-4">
            <svg className="w-6 h-6 text-blue-600 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <div>
              <h2 className="text-[17px] font-bold text-[#1c2b4f]">Document Upload</h2>
              <p className="text-xs text-gray-500 font-medium">Please upload clear and valid documents.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salary Slip */}
            <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative flex flex-col justify-between">
              <div>
                <svg className="w-8 h-8 text-blue-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <div className="text-sm font-bold text-[#1c2b4f]">Salary Slip (Last 3 Months) {!isPayslipOptional && <span className="text-red-500">*</span>}</div>
                <div className="text-[10px] text-gray-500 mb-3">JPG, PNG or PDF<br />(Max 5MB)</div>
              </div>
              <div className="mt-auto">
                <FileUpload
                  accept=".jpg,.jpeg,.png,.pdf"
                  onFileChange={(file) => handleFileChange("payslipFile", file)}
                  file={watch("payslipFile")}
                />
                {errors.payslipFile && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{errors.payslipFile.message}</p>}
              </div>
            </div>

            {/* Bank Statement */}
            <div className="border border-dashed border-blue-200 bg-[#f8fafe] rounded-xl p-4 text-center group hover:bg-[#f0f4ff] transition-colors relative flex flex-col justify-between">
              <div>
                <svg className="w-8 h-8 text-blue-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                <div className="text-sm font-bold text-[#1c2b4f]">Bank Statement (Last 6 Months) <span className="text-red-500">*</span></div>
                <div className="text-[10px] text-gray-500 mb-3">PDF Only<br />(Max 10MB)<br />Note: Please provide un-protected PDFs</div>
              </div>
              <div className="mt-auto">
                <FileUpload
                  accept=".pdf"
                  onFileChange={(file) => handleFileChange("bankStatementFile", file)}
                  file={watch("bankStatementFile")}
                />
                {errors.bankStatementFile && <p className="text-red-500 text-xs mt-1 absolute bottom-1 right-0 left-0">{errors.bankStatementFile.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Secure, transparent, and RBI-compliant personal loans — designed to help you when you need it most.
        </p>

        <div className="flex items-start space-x-3">
          <Input
            type="checkbox"
            id="consent"
            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            required
          />
          <label htmlFor="consent" className="text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="#" className="text-red-600 hover:underline">privacy policies</a>{" "}
            and{" "}
            <a href="#" className="text-red-600 hover:underline">T&C</a>.
            You also authorize us to{" "}
            <a href="#" className="text-red-600 hover:underline">retrieve your credit report</a>{" "}
            & communicate with you via phone, e-mails, WhatsApp, etc.
          </label>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isValid || !consentChecked}
        >
          Next
        </Button>
      </div>
    </form>
  )
}
