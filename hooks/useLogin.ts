import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useScrollToTop } from './useScrollToTop';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { LoginStep1Form, LoginOtpForm } from '@/lib/login-schemas';

interface UseLoginReturn {
  step: 1 | 2 | 3;
  phoneNumber: string;
  otpResendTimer: number;
  isVerifying: boolean;
  error: string | null;
  setStep: Dispatch<SetStateAction<1 | 2 | 3>>;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
  setOtpResendTimer: Dispatch<SetStateAction<number>>;
  setIsVerifying: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  loginStep1: (data: LoginStep1Form) => Promise<boolean>;
  verifyOtp: (data: LoginOtpForm) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  resetLogin: () => void;
}

export function useLogin(): UseLoginReturn {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every component using this hook scrolls to top automatically on step change
  useScrollToTop([step]);

  const loginStep1 = useCallback(async (data: LoginStep1Form): Promise<boolean> => {
    try {
      setError(null);
      setPhoneNumber(data.phoneNumber);

      // Call login API with phone
      await apiClient.loginUser(data.phoneNumber);

      setStep(2);
      setOtpResendTimer(30);
      return true;
    } catch (err: any) {
      const errorMsg = err.message || '';
      const lowerError = errorMsg.toLowerCase();
      
      if (lowerError.includes('not found') || lowerError.includes('404') || lowerError.includes('not present')) {
        toast.error('User does not exist. Please sign up first.');
      } else {
        toast.error(errorMsg || 'Login failed. Please check your credentials.');
      }
      return false;
    }
  }, []);

  const verifyOtp = useCallback(async (data: LoginOtpForm): Promise<boolean> => {
    try {
      setError(null);
      setIsVerifying(true);

      // Verify OTP using the same endpoint as signup
      const response = await apiClient.verifyLoginOtp(phoneNumber, data.otp);

      if (response.token) {
        setStep(3);
        return true;
      } else {
        setError('Invalid OTP. Please try again.');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || '';
      const lowerError = errorMsg.toLowerCase();
      
      if (lowerError.includes('wrong') || lowerError.includes('invalid') || lowerError.includes('400')) {
        toast.error('OTP is wrong, please re-enter OTP.');
      } else {
        toast.error(errorMsg || 'OTP verification failed. Please try again.');
      }
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [phoneNumber]);

  const resendOtp = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      // Resend OTP using the same login endpoint
      await apiClient.loginUser(phoneNumber);

      setOtpResendTimer(30);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP. Please try again.');
      return false;
    }
  }, [phoneNumber]);

  const resetLogin = useCallback(() => {
    setStep(1);
    setPhoneNumber("");
    setOtpResendTimer(0);
    setIsVerifying(false);
    setError(null);
  }, []);

  return {
    step,
    phoneNumber,
    otpResendTimer,
    isVerifying,
    error,
    setStep,
    setPhoneNumber,
    setOtpResendTimer,
    setIsVerifying,
    setError,
    loginStep1,
    verifyOtp,
    resendOtp,
    resetLogin,
  };
}
