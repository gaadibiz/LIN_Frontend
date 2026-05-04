import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { SignupFormData } from '@/lib/signup-schemas';

interface UseSignupReturn {
  currentStep: number;
  formData: SignupFormData;
  isLoading: boolean;
  error: string | null;
  applicationId: number | null;
  applicationCreatedAt: string | null;
  setCurrentStep: (step: number) => void;
  updateFormData: (step: keyof SignupFormData, data: any) => void;
  submitStep: (step: number, data: any) => Promise<boolean>;
  resetForm: () => void;
}

// Helper to create empty file placeholder
const createEmptyFile = (name: string, type: string): File => {
  const blob = new Blob([], { type });
  return new File([blob], name, { type });
};

const initialFormData: SignupFormData = {
  phoneVerification: { phoneNumber: "", otp: "" as string | undefined },
  personalDetails: {
    panNumber: "", firstName: "", lastName: "", dateOfBirth: "", gender: "Male" as "Male" | "Female",
    middleName: "", email: "", aadhaarNumber: "", panImage: undefined as unknown as File, aadhaarImage: undefined as unknown as File, salarySlipImage: undefined as unknown as File, bankStatementImage: undefined as unknown as File,
    consentOne: true, consentTwo: true
  },
  basicDetails: {
    loanAmount: 0, purposeOfLoan: "",
    companyName: "", professionName: "",
    companyAddress: "", monthlyIncome: 0,
    jobStability: "" as "Very unstable" | "Somewhat unstable" | "Neutral / moderate" | "Stable" | "Very stable",
    currentAddress: "", currentAddressType: "" as "Owner(Self or Family)" | "Rented",
    permanentAddress: "", addressProof: undefined, pinCode: ""
  },
  documentVerification: {
    payslipFile: createEmptyFile("payslip.pdf", "application/pdf"),
    bankStatementFile: createEmptyFile("bankstatement.pdf", "application/pdf"),
    panNumber: "",
    aadhaarImage: undefined
  },
  aadhaarOtp: { aadhaarOtp: "" },
  photoAndLocationSchema: {
    photoFile: createEmptyFile("photo.jpg", "image/jpeg"),
    autoDetectLocation: false,
    location: ""
  }
};

export function useSignup(): UseSignupReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [applicationCreatedAt, setApplicationCreatedAt] = useState<string | null>(null);
  const router = useRouter();

  const updateFormData = useCallback((step: keyof SignupFormData, data: any) => {
    setFormData(prev => ({ ...prev, [step]: data }));
  }, []);

  const submitStep = useCallback(async (step: number, data: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      switch (step) {
        case 1:
          if (!data.otp) {
            // Request OTP
            await apiClient.requestPhoneOtp(data.phoneNumber);
            return true;
          } else {
            // Verify OTP
            const response = await apiClient.verifyPhoneOtp(data.phoneNumber, data.otp);
            if (response.token) {
              apiClient.setToken(response.token);
            }
            return true;
          }

        case 2:
          // === STAGE 1: Register User ===
          const name = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`.trim();
          const cleanerPhone = formData.phoneVerification.phoneNumber.replace(/\D/g, '');
          const uniqueEmail = data.email || `user${cleanerPhone}@loaninneed.com`;

          await apiClient.registerUser({
            name,
            dob: data.dateOfBirth,
            gender: data.gender,
            email: uniqueEmail,
            password: "Password@123",  // Dummy password
          });

          // === STAGE 2: Submit KYC for Application Creation (For 3-Step Flow) ===
          let currentAppId = null;
          try {
             const kycResponse = await apiClient.submitKYC({
                companyName: "Self",
                companyAddress: "N/A",
                monthlyIncome: 30000,
                stability: "Stable",
                currentAddress: "N/A",
                currentAddressType: "Rented",
                permanentAddress: "N/A",
                currentPostalCode: "000000",
                loanAmount: formData.basicDetails.loanAmount || 0,
                purpose: formData.basicDetails.purposeOfLoan || "Other",
             });
             
             if ((kycResponse as any)?.data?.application) {
                currentAppId = (kycResponse as any).data.application.id;
                setApplicationId(currentAppId);
                setApplicationCreatedAt((kycResponse as any).data.application.createdAt);
             }
          } catch (kycErr) {
             console.error("KYC Sync Error (Non-blocking): ", kycErr);
          }

          // === STAGE 2.5: Verify & Save Aadhaar Number ===
          if (data.aadhaarNumber) {
             const cleanAadhaar = data.aadhaarNumber.replace(/\D/g, '');
             if (cleanAadhaar.length === 12) {
               try {
                  // We send a generic OTP. The backend authController will hit Surepass Aadhaar Validation API 
                  // to verify the structure and log it to the database table AadhaarVerification.
                  await apiClient.verifyAadhaarOtp(cleanAadhaar, "000000");
               } catch (aadhaarErr) {
                  console.error("Aadhaar Sync Error: ", aadhaarErr);
                  // We catch it so failure doesn't block final document upload, or throw it to enforce validation.
               }
             }
          }

          // === STAGE 2.6: Background Persist PAN Status ===
          if (data.panNumber) {
             try {
                // If the user already pressed the button, this will act as an idempotent database overwrite update.
                // If they didn't press the button, this gracefully registers their text input in the backend natively. 
                await apiClient.verifyPan(data.panNumber);
             } catch (panErr: any) {
                console.error("PAN Background Sync Error: ", panErr);
                if (panErr.message?.toLowerCase().includes('already registered') || panErr.message?.toLowerCase().includes('another account')) {
                  throw new Error('This PAN number is already registered with another account.');
                }
             }
          }

          // === STAGE 3: Submit Documents (For 3-Step Flow) ===
          try {
             // Upload PAN separately
             if (data.panImage && data.panImage instanceof File) {
                 await apiClient.uploadDocument('PAN', data.panImage);
             }
             
             // Upload Aadhaar separately  
             if (data.aadhaarImage && data.aadhaarImage instanceof File) {
                 await apiClient.uploadDocument('AADHAAR', data.aadhaarImage);
             }

             // Upload Salary & Bank Statement via bulk endpoint
             const documentFormData = new FormData();
             let hasBulkDocs = false;

             if (data.salarySlipImage && data.salarySlipImage instanceof File) { documentFormData.append('salarySlips', data.salarySlipImage); hasBulkDocs = true; }
             if (data.bankStatementImage && data.bankStatementImage instanceof File) { documentFormData.append('bankStatements', data.bankStatementImage); hasBulkDocs = true; }

             if (hasBulkDocs) {
                await apiClient.submitDocuments(documentFormData);
             }
          } catch (docErr) {
             console.error("Document Upload Error: ", docErr);
          }

          return true;

        case 3:
          // Submit KYC details (Used by apply-now flow)
          const kycResponseSeparate = await apiClient.submitKYC({
            companyName: data.companyName,
            companyAddress: data.companyAddress,
            monthlyIncome: data.monthlyIncome,
            stability: data.jobStability,
            currentAddress: data.currentAddress,
            currentAddressType: data.currentAddressType,
            permanentAddress: data.permanentAddress,
            currentPostalCode: data.pinCode,
            loanAmount: data.loanAmount,
            purpose: data.purposeOfLoan,
          });
          if ((kycResponseSeparate as any)?.data?.application) {
            setApplicationId((kycResponseSeparate as any).data.application.id);
            setApplicationCreatedAt((kycResponseSeparate as any).data.application.createdAt);
          }
          return true;

        case 4:
          // Submit documents (salary slips and bank statements) (Used by apply-now flow)
          const documentFormDataSeparate = new FormData();

          if (!data.payslipFile || !(data.payslipFile instanceof File) || data.payslipFile.size === 0) {
            throw new Error('Please upload your salary slip');
          }
          documentFormDataSeparate.append('salarySlips', data.payslipFile);

          if (!data.bankStatementFile || !(data.bankStatementFile instanceof File) || data.bankStatementFile.size === 0) {
            throw new Error('Please upload your bank statement');
          }
          documentFormDataSeparate.append('bankStatements', data.bankStatementFile);

          await apiClient.submitDocuments(documentFormDataSeparate);
          return true;

        case 5:
          // Verify Aadhaar OTP
          // In the new flow this step is skipped, but if used, Aadhaar number might have to be collected differently.
          await apiClient.verifyAadhaarOtp("skipped-in-new-flow", data.aadhaarOtp);
          return true;

        case 6:
          // Submit selfie and location data
          // First, upload selfie if available
          if (!data.photoFile || !(data.photoFile instanceof File) || data.photoFile.size === 0) {
            throw new Error('Please upload your photo');
          }
          await apiClient.uploadSelfie(data.photoFile);

          // Then submit location data if auto-detected
          if (data.autoDetectLocation && data.location) {
            // Parse location from string format "latitude, longitude"
            const coords = data.location.split(',').map((coord: string) => parseFloat(coord.trim()));
            const [latitude, longitude] = coords;

            if (!isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
              await apiClient.submitLocation({
                latitude,
                longitude,
                placeName: data.location,
              });
            } else {
              throw new Error('Invalid location data. Please enable location permissions.');
            }
          } else {
            throw new Error('Please enable location detection');
          }
          return true;

        default:
          return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || '';
      const lowerError = errorMsg.toLowerCase();
      
      let finalErrorMsg = '';
      if (lowerError.includes('exist') || lowerError.includes('conflict') || (lowerError.includes('already registered with another account') === false && lowerError.includes('already'))) {
        finalErrorMsg = 'This mobile number is already registered. Please login.';
        toast.error('Number already registered. Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else if (lowerError.includes('pan') || lowerError.includes('another account')) {
        finalErrorMsg = 'This PAN number is already registered with another account.';
        toast.error(finalErrorMsg);
      } else {
        finalErrorMsg = errorMsg || 'An error occurred during registration.';
        toast.error(finalErrorMsg);
      }
      setError(finalErrorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    currentStep,
    formData,
    isLoading,
    error,
    applicationId,
    applicationCreatedAt,
    setCurrentStep,
    updateFormData,
    submitStep,
    resetForm,
  };
}
