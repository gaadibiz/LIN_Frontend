import { z } from "zod"

const MAX_5MB = 5 * 1024 * 1024;
const MAX_2MB = 2 * 1024 * 1024;

// Step 0: Eligibility Check
export const eligibilitySchema = z.object({
  loanAmount: z.number().min(5000, "Minimum loan amount is ₹5,000").max(150000, "Maximum loan amount is ₹1,50,000"),
  purposeOfLoan: z.string().min(1, "Please select purpose of loan"),
  occupation: z.enum(["Salaried", "Self Employed"]),
  monthlySalaryRange: z.string().min(1, "Please enter your monthly salary"),
  salaryReceivedIn: z.enum(["Cash", "Bank Transfer", "Cheque"]),
  city: z.string().min(1, "Please select your city"),
}).superRefine((data, ctx) => {
  if (data.occupation === "Self Employed" && data.salaryReceivedIn === "Bank Transfer") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Self Employed with Bank Transfer is not eligible",
      path: ["salaryReceivedIn"]
    });
  }
})

// Step 1: Phone verification
export const phoneVerificationSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"),
  otp: z.string().optional()
})

// Phone number only schema (for initial submission)
export const phoneNumberSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number")
})

// OTP verification schema
export const otpVerificationSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers")
})

// Step 2: Personal details
export const personalDetailsSchema = z.object({
  panNumber: z.string().length(10, "oops Invalid Pan number").regex(/^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/, "oops Invalid Pan number"),
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  middleName: z.string().default("").optional(),
  lastName: z.string()
    .max(50, "Surname must be less than 50 characters")
    .regex(/^[a-zA-Z\s]*$/, "Surname can only contain letters and spaces")
    .optional(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      // Allow format DD/MM/YYYY or similar parsing
      const parts = date.split('/');
      const parsedDate = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(date);
      const today = new Date();
      const age = today.getFullYear() - parsedDate.getFullYear();
      return age >= 18 && age <= 65;
    }, "Age must be between 18 and 65 years"),
  email: z.string().email("Please enter a valid email address"),
  aadhaarNumber: z.string().length(12, "oops invalid Aadhaar number").regex(/^\d{12}$/, "oops invalid Aadhaar number"),
  panImage: z.instanceof(File, { message: "PAN image is required" }),
  aadhaarImage: z.instanceof(File, { message: "Aadhaar image is required" }),
  salarySlipImage: z.instanceof(File).optional(),
  bankStatementImage: z.instanceof(File).optional(),
  consentOne: z.boolean().refine(val => val === true, "You must agree to the Terms and Conditions"),
  consentTwo: z.boolean().refine(val => val === true, "You must consent to electronic communications"),
})

// Step 3: Basic details
export const basicDetailsSchema = z.object({
  // Loan details
  loanAmount: z.number()
    .min(5000, "Minimum loan amount is ₹5,000")
    .max(5000000, "Maximum loan amount is ₹50,00,000"),
  purposeOfLoan: z.string()
    .min(5, "Please describe your loan purpose")
    .max(200, "Purpose description must be less than 200 characters"),

  // Employment details
  // employmentType is now in Step 2, but we validate specific fields here


  // Salaried specific
  companyName: z.string().optional(),

  // Eligibility Fields
  occupation: z.string().optional(),
  monthlySalaryRange: z.string().optional(),
  salaryReceivedIn: z.string().optional(),
  city: z.string().optional(),

  // Self-employed specific
  professionName: z.string().optional(),

  // Shared
  companyAddress: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  monthlyIncome: z.number()
    .min(1000, "Minimum monthly income is ₹1,000") // Lowered min for flexibility
    .max(1000000, "Maximum monthly income is ₹10,00,000"),
  jobStability: z.enum(["Very unstable", "Somewhat unstable", "Neutral / moderate", "Stable", "Very stable"]),

  // Address details
  currentAddress: z.string()
    .min(10, "Current address must be at least 10 characters")
    .max(200, "Current address must be less than 200 characters"),
  currentAddressType: z.enum(["Owner(Self or Family)", "Rented"]),
  permanentAddress: z.string()
    .min(10, "Permanent address must be at least 10 characters")
    .max(200, "Permanent address must be less than 200 characters"),
  pinCode: z.string()
    .min(6, "Pin code must be 6 digits")
    .max(6, "Pin code must be 6 digits"),
  addressProof: z
    .instanceof(File)
    .refine(file => file.size <= MAX_5MB, "File size must be ≤ 5MB")
    .nullable()
    .optional(),
}).superRefine((data, ctx) => {
  // Conditional validation
  if (data.companyName && data.companyName.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required",
      path: ["companyName"]
    });
  }

  if (data.professionName && data.professionName.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Profession name is required",
      path: ["professionName"]
    });
  }
})

// Step 4: Document verification

export const documentVerificationSchema = z.object({
  payslipFile: z
    .instanceof(File)
    .refine(file => file.size > 0, "Please upload your salary slip")
    .refine(file => ["application/pdf"].includes(file.type), "Must be a PDF file")
    .refine(file => file.size <= MAX_5MB, "File size must be ≤ 5MB"),

  bankStatementFile: z
    .instanceof(File)
    .refine(file => file.size > 0, "Please upload your bank statement")
    .refine(file => ["application/pdf"].includes(file.type), "Must be a PDF file")
    .refine(file => file.size <= MAX_5MB, "File size must be ≤ 5MB"),

  panImage: z.instanceof(File).optional(),

  aadhaarImage: z.instanceof(File).optional(),
});

export const documentVerificationSchemaOptionalPayslip = z.object({
  payslipFile: z
    .instanceof(File)
    .refine(file => file.size === 0 || ["application/pdf"].includes(file.type), "Must be a PDF file")
    .refine(file => file.size === 0 || file.size <= MAX_5MB, "File size must be ≤ 5MB")
    .optional()
    .nullable(),

  bankStatementFile: z
    .instanceof(File)
    .refine(file => file.size > 0, "Please upload your bank statement")
    .refine(file => ["application/pdf"].includes(file.type), "Must be a PDF file")
    .refine(file => file.size <= MAX_5MB, "File size must be ≤ 5MB"),

  panImage: z.instanceof(File).optional(),

  aadhaarImage: z.instanceof(File).optional(),
});


// Step 5: Aadhaar OTP verification
export const aadhaarOtpSchema = z.object({
  aadhaarOtp: z.string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers")
})

// Step 6: Upload photo and auto detect location
export const photoAndLocationSchema = z.object({
  photoFile: z
    .instanceof(File)
    .refine(file => file.size <= MAX_2MB, "File size must be ≤ 2MB")
    .refine(file => ["image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "Only .png/.jpg/.jpeg images allowed"),

  autoDetectLocation: z.boolean(),
  location: z.string().optional(),
})

// Combined schema for all steps
export const signupFormSchema = z.object({
  phoneVerification: phoneVerificationSchema,
  personalDetails: personalDetailsSchema,
  basicDetails: basicDetailsSchema,
  documentVerification: documentVerificationSchema,
  aadhaarOtp: aadhaarOtpSchema,
  photoAndLocationSchema: photoAndLocationSchema,
  kylasLeadId: z.number().optional()
})

export type EligibilityForm = z.infer<typeof eligibilitySchema>
export type PhoneVerificationForm = z.infer<typeof phoneVerificationSchema>
export type PhoneNumberForm = z.infer<typeof phoneNumberSchema>
export type OtpVerificationForm = z.infer<typeof otpVerificationSchema>
export type PersonalDetailsForm = z.infer<typeof personalDetailsSchema>
export type BasicDetailsForm = z.infer<typeof basicDetailsSchema>
export type DocumentVerificationForm = z.infer<typeof documentVerificationSchema>
export type DocumentVerificationOptionalPayslipForm = z.infer<typeof documentVerificationSchemaOptionalPayslip>
export type AadhaarOtpForm = z.infer<typeof aadhaarOtpSchema>
export type PhotoLocationForm = z.infer<typeof photoAndLocationSchema>
export type SignupFormData = z.infer<typeof signupFormSchema>
